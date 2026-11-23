const {
  GOOGLE_OAUTH_CLIENT_ID,
  GOOGLE_OAUTH_CLIENT_SECRET
} = require('../common/config/env');

// Thin fetch wrappers for Google OAuth 2.0 and the Business Profile APIs.
// No SDK: the surface is a handful of calls and node's fetch covers it.

const OAUTH_AUTHORIZE = 'https://accounts.google.com/o/oauth2/v2/auth';
const OAUTH_TOKEN = 'https://oauth2.googleapis.com/token';
const OAUTH_REVOKE = 'https://oauth2.googleapis.com/revoke';
const ACCOUNTS_API = 'https://mybusinessaccountmanagement.googleapis.com/v1';
const BUSINESS_INFO_API = 'https://mybusinessbusinessinformation.googleapis.com/v1';
const REVIEWS_API = 'https://mybusiness.googleapis.com/v4';

const SCOPES = ['https://www.googleapis.com/auth/business.manage', 'openid', 'email'];

class GoogleApiError extends Error {
  constructor(message, { status = 0, code = '' } = {}) {
    super(message);
    this.name = 'GoogleApiError';
    this.status = status;
    this.code = code;
  }
}

// Turn Google's error bodies into something an admin can act on.
const explain = (status, body) => {
  const err = body?.error;
  const code = typeof err === 'string' ? err : (err?.status || '');
  const raw = (typeof err === 'object' && err?.message) || body?.error_description || (typeof err === 'string' ? err : '') || `HTTP ${status}`;

  if (code === 'invalid_grant') {
    return { message: 'Google access was revoked or expired. Reconnect the Google Business account.', code };
  }
  if (status === 429 && /quota/i.test(raw)) {
    return {
      message: 'Google Business Profile API quota is 0 or exhausted. If you have not yet been approved for Business Profile API access, submit the access request form in Google Cloud and wait for approval.',
      code: 'QUOTA'
    };
  }
  if (status === 403 && /has not been used|is disabled|SERVICE_DISABLED/i.test(raw)) {
    return {
      message: 'A required Google Business Profile API is not enabled in the Google Cloud project. Enable "My Business Account Management API", "My Business Business Information API" and "Google My Business API".',
      code: 'SERVICE_DISABLED'
    };
  }
  return { message: `Google API error: ${raw}`, code };
};

const call = async (url, { method = 'GET', token, body, form } = {}) => {
  const headers = {};
  let payload;
  if (token) headers.authorization = `Bearer ${token}`;
  if (form) {
    headers['content-type'] = 'application/x-www-form-urlencoded';
    payload = new URLSearchParams(form).toString();
  } else if (body !== undefined) {
    headers['content-type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(url, { method, headers, body: payload, signal: AbortSignal.timeout(20000) });
  } catch (e) {
    throw new GoogleApiError(`Could not reach Google: ${e.message}`, { code: 'NETWORK' });
  }
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : {}; } catch (_) { json = { error: text.slice(0, 300) }; }
  if (!res.ok) {
    const { message, code } = explain(res.status, json);
    throw new GoogleApiError(message, { status: res.status, code });
  }
  return json;
};

const isOAuthConfigured = () => Boolean(GOOGLE_OAUTH_CLIENT_ID && GOOGLE_OAUTH_CLIENT_SECRET);

const buildAuthUrl = ({ redirectUri, state }) => {
  const params = new URLSearchParams({
    client_id: GOOGLE_OAUTH_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SCOPES.join(' '),
    // offline + consent: Google only returns a refresh token on a fresh consent.
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    state
  });
  return `${OAUTH_AUTHORIZE}?${params.toString()}`;
};

const exchangeCode = (code, redirectUri) => call(OAUTH_TOKEN, {
  method: 'POST',
  form: {
    code,
    client_id: GOOGLE_OAUTH_CLIENT_ID,
    client_secret: GOOGLE_OAUTH_CLIENT_SECRET,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code'
  }
});

// Access tokens live ~1h; keep one per refresh token in memory.
const tokenCache = new Map();

const getAccessToken = async (refreshToken) => {
  const cached = tokenCache.get(refreshToken);
  if (cached && cached.expiresAt > Date.now() + 60000) return cached.token;
  const json = await call(OAUTH_TOKEN, {
    method: 'POST',
    form: {
      refresh_token: refreshToken,
      client_id: GOOGLE_OAUTH_CLIENT_ID,
      client_secret: GOOGLE_OAUTH_CLIENT_SECRET,
      grant_type: 'refresh_token'
    }
  });
  tokenCache.set(refreshToken, { token: json.access_token, expiresAt: Date.now() + (Number(json.expires_in) || 3600) * 1000 });
  return json.access_token;
};

const revokeToken = async (token) => {
  tokenCache.clear();
  if (!token) return;
  try {
    await call(OAUTH_REVOKE, { method: 'POST', form: { token } });
  } catch (_) { /* already revoked is fine */ }
};

// Email from the OpenID id_token. It came straight from Google's token
// endpoint over TLS, so the payload is trusted without verifying the signature.
const emailFromIdToken = (idToken) => {
  try {
    const payload = JSON.parse(Buffer.from(String(idToken).split('.')[1], 'base64url').toString('utf8'));
    return payload.email || '';
  } catch (_) {
    return '';
  }
};

const listAccounts = async (token) => {
  const accounts = [];
  let pageToken = '';
  do {
    const q = new URLSearchParams({ pageSize: '20' });
    if (pageToken) q.set('pageToken', pageToken);
    const json = await call(`${ACCOUNTS_API}/accounts?${q}`, { token });
    accounts.push(...(json.accounts || []));
    pageToken = json.nextPageToken || '';
  } while (pageToken);
  return accounts;
};

const listLocations = async (token, accountName) => {
  const locations = [];
  let pageToken = '';
  do {
    const q = new URLSearchParams({ readMask: 'name,title,metadata,storefrontAddress', pageSize: '100' });
    if (pageToken) q.set('pageToken', pageToken);
    const json = await call(`${BUSINESS_INFO_API}/${accountName}/locations?${q}`, { token });
    locations.push(...(json.locations || []));
    pageToken = json.nextPageToken || '';
  } while (pageToken);
  return locations;
};

// accountName 'accounts/1', locationName 'locations/2' → one page of reviews,
// newest update first. Also carries averageRating and totalReviewCount.
const listReviews = (token, accountName, locationName, pageToken = '') => {
  const q = new URLSearchParams({ pageSize: '50', orderBy: 'updateTime desc' });
  if (pageToken) q.set('pageToken', pageToken);
  return call(`${REVIEWS_API}/${accountName}/${locationName}/reviews?${q}`, { token });
};

// reviewName is the full 'accounts/1/locations/2/reviews/3'.
const putReply = (token, reviewName, comment) => call(`${REVIEWS_API}/${reviewName}/reply`, {
  method: 'PUT',
  token,
  body: { comment }
});

const deleteReply = (token, reviewName) => call(`${REVIEWS_API}/${reviewName}/reply`, {
  method: 'DELETE',
  token
});

module.exports = {
  GoogleApiError,
  SCOPES,
  isOAuthConfigured,
  buildAuthUrl,
  exchangeCode,
  getAccessToken,
  revokeToken,
  emailFromIdToken,
  listAccounts,
  listLocations,
  listReviews,
  putReply,
  deleteReply
};
