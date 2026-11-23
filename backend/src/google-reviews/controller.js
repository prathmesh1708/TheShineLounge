const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const GoogleIntegration = require('../models/GoogleIntegration');
const GoogleReview = require('../models/GoogleReview');
const {
  JWT_SECRET,
  ADMIN_APP_URL,
  GOOGLE_OAUTH_REDIRECT_URIS,
  GOOGLE_REVIEWS_SYNC_MIN
} = require('../common/config/env');
const { encrypt, decrypt } = require('./crypto');
const api = require('./googleApi');
const { isPlacesConfigured, fetchPlaceReviews } = require('./places');
const { getIntegration, accessTokenFor, syncReviews } = require('./sync');

const STATE_PURPOSE = 'google-reviews-oauth';
const MAX_REPLY_LENGTH = 4096;

const actor = (req) => (req.user && (req.user.email || req.user.fullName)) || 'Admin';
const isProduction = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;

// Errors from Google are the admin's to fix (quota, revoked access), so they
// come back as 502 with Google's explanation rather than a bare 500.
const sendGoogleError = (res, err) => {
  if (err instanceof api.GoogleApiError) {
    const status = err.code === 'NOT_CONNECTED' ? 409 : 502;
    return res.status(status).json({ success: false, message: err.message, code: err.code || undefined });
  }
  throw err;
};

const isLocal = (uri) => /\/\/(localhost|127\.0\.0\.1)(:|\/)/.test(uri);

// GOOGLE_OAUTH_REDIRECT_URI can list localhost and production. Use the one on
// the host this request reached, else the one that fits the environment.
const pickRedirectUri = (req) => {
  const uris = GOOGLE_OAUTH_REDIRECT_URIS;
  if (!uris.length) return '';
  const host = String(req.get('x-forwarded-host') || req.get('host') || '').toLowerCase();
  const sameHost = uris.find((u) => {
    try { return new URL(u).host.toLowerCase() === host; } catch (_) { return false; }
  });
  if (sameHost) return sameHost;
  return uris.find((u) => (isProduction ? !isLocal(u) : isLocal(u))) || uris[0];
};

const publicIntegration = (doc) => (doc ? {
  status: doc.status,
  connectedEmail: doc.connectedEmail,
  connectedBy: doc.connectedBy,
  connectedAt: doc.connectedAt,
  accountName: doc.accountName,
  locationName: doc.locationName,
  locationTitle: doc.locationTitle,
  mapsUri: doc.mapsUri,
  averageRating: doc.averageRating,
  totalReviewCount: doc.totalReviewCount,
  lastSyncAt: doc.lastSyncAt,
  lastFullSyncAt: doc.lastFullSyncAt,
  lastSyncError: doc.lastSyncError,
  syncing: Boolean(doc.syncLeaseUntil && doc.syncLeaseUntil > new Date())
} : null);

const getStatus = async (req, res) => {
  const integration = await getIntegration();
  res.json({
    success: true,
    oauthConfigured: api.isOAuthConfigured() && GOOGLE_OAUTH_REDIRECT_URIS.length > 0,
    placesConfigured: isPlacesConfigured(),
    syncIntervalMin: GOOGLE_REVIEWS_SYNC_MIN,
    redirectUri: pickRedirectUri(req),
    integration: publicIntegration(integration)
  });
};

const getAuthUrl = async (req, res) => {
  if (!api.isOAuthConfigured()) {
    return res.status(400).json({ success: false, message: 'Set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET in the backend .env first.' });
  }
  const redirectUri = pickRedirectUri(req);
  if (!redirectUri) {
    return res.status(400).json({ success: false, message: 'Set GOOGLE_OAUTH_REDIRECT_URI in the backend .env first.' });
  }
  const state = jwt.sign(
    { purpose: STATE_PURPOSE, by: actor(req), redirectUri, nonce: crypto.randomBytes(8).toString('hex') },
    JWT_SECRET,
    { expiresIn: '10m' }
  );
  return res.json({ success: true, url: api.buildAuthUrl({ redirectUri, state }) });
};

// Every location the connected account can manage, across its accounts.
const discoverLocations = async (token) => {
  const accounts = await api.listAccounts(token);
  const out = [];
  for (const account of accounts) {
    const locations = await api.listLocations(token, account.name);
    for (const loc of locations) {
      out.push({
        accountName: account.name,
        accountTitle: account.accountName || '',
        locationName: loc.name,
        title: loc.title || '',
        address: [loc.storefrontAddress?.addressLines?.join(', '), loc.storefrontAddress?.locality]
          .filter(Boolean).join(', '),
        mapsUri: loc.metadata?.mapsUri || ''
      });
    }
  }
  return out;
};

const backToAdmin = (params) => `${ADMIN_APP_URL}/admin/feedback?${new URLSearchParams({ tab: 'google', ...params })}`;

// Google redirects the admin's browser here. Public: the signed state is
// what ties it to an admin who asked for it in the last ten minutes.
const oauthCallback = async (req, res) => {
  const { code, state, error } = req.query;
  if (error) return res.redirect(backToAdmin({ google_error: String(error) }));

  let claims;
  try {
    claims = jwt.verify(String(state || ''), JWT_SECRET);
    if (claims.purpose !== STATE_PURPOSE) throw new Error('wrong purpose');
  } catch (_) {
    return res.status(400).send('This Google sign-in link is invalid or has expired. Go back to the admin panel and click Connect again.');
  }
  if (!code) return res.redirect(backToAdmin({ google_error: 'missing_code' }));

  try {
    const tokens = await api.exchangeCode(String(code), claims.redirectUri);
    if (!tokens.refresh_token) {
      return res.redirect(backToAdmin({ google_error: 'no_refresh_token' }));
    }
    const integration = await getIntegration();
    const previous = await GoogleIntegration.findById(integration._id).select('+refreshTokenEnc').lean();
    if (previous?.refreshTokenEnc) {
      // Replacing a connection: drop the old grant at Google.
      try { await api.revokeToken(decrypt(previous.refreshTokenEnc)); } catch (_) { /* ignore */ }
    }

    const update = {
      status: 'connected',
      refreshTokenEnc: encrypt(tokens.refresh_token),
      connectedEmail: api.emailFromIdToken(tokens.id_token),
      connectedBy: claims.by || '',
      connectedAt: new Date(),
      lastSyncError: '',
      syncLeaseUntil: null
    };

    // Pick the location automatically when there is only one. Business
    // Profile API access may not be approved yet; that is recorded, not fatal.
    try {
      const locations = await discoverLocations(tokens.access_token);
      if (locations.length === 1) {
        const [loc] = locations;
        if (loc.locationName !== integration.locationName) {
          update.lastSyncAt = null;
          update.lastFullSyncAt = null;
        }
        Object.assign(update, {
          accountName: loc.accountName,
          locationName: loc.locationName,
          locationTitle: loc.title,
          mapsUri: loc.mapsUri
        });
      } else if (locations.length === 0) {
        update.lastSyncError = 'This Google account does not manage any Business Profile. Connect with the account that owns The Shine Lounge listing.';
      }
    } catch (err) {
      update.lastSyncError = err.message;
    }

    await GoogleIntegration.updateOne({ _id: integration._id }, update);

    if (update.locationName) {
      try { await syncReviews({ full: true }); } catch (_) { /* recorded in lastSyncError */ }
    }
    return res.redirect(backToAdmin({ connected: '1' }));
  } catch (err) {
    return res.redirect(backToAdmin({ google_error: err.message.slice(0, 200) }));
  }
};

const getLocations = async (req, res) => {
  const integration = await getIntegration();
  try {
    const token = await accessTokenFor(integration._id);
    const locations = await discoverLocations(token);
    return res.json({ success: true, locations, selected: integration.locationName });
  } catch (err) {
    return sendGoogleError(res, err);
  }
};

const selectLocation = async (req, res) => {
  const { accountName, locationName } = req.body || {};
  if (!/^accounts\/[^/]+$/.test(String(accountName || '')) || !/^locations\/[^/]+$/.test(String(locationName || ''))) {
    return res.status(400).json({ success: false, message: 'accountName and locationName are required' });
  }
  const integration = await getIntegration();
  if (integration.status !== 'connected') {
    return res.status(409).json({ success: false, message: 'Google Business is not connected.' });
  }
  let match;
  try {
    const token = await accessTokenFor(integration._id);
    const locations = await discoverLocations(token);
    match = locations.find((l) => l.accountName === accountName && l.locationName === locationName);
  } catch (err) {
    return sendGoogleError(res, err);
  }
  if (!match) return res.status(404).json({ success: false, message: 'That location is not managed by the connected Google account.' });

  await GoogleIntegration.updateOne({ _id: integration._id }, {
    accountName,
    locationName,
    locationTitle: match.title,
    mapsUri: match.mapsUri,
    averageRating: null,
    totalReviewCount: null,
    lastSyncAt: null,
    lastFullSyncAt: null,
    lastSyncError: ''
  });
  let sync = null;
  try { sync = await syncReviews({ full: true }); } catch (err) { sync = { error: err.message }; }
  return res.json({ success: true, sync });
};

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const SORTS = {
  newest: { createTime: -1 },
  oldest: { createTime: 1 },
  lowest: { starRating: 1, createTime: -1 },
  highest: { starRating: -1, createTime: -1 }
};

const placesResponse = async (req, res, integration) => {
  try {
    const data = await fetchPlaceReviews({ force: req.query.refresh === '1' });
    const rating = Number(req.query.rating);
    let reviews = data.reviews;
    if (rating >= 1 && rating <= 5) reviews = reviews.filter((r) => r.starRating === rating);
    return res.json({
      success: true,
      source: 'places',
      integration: publicIntegration(integration),
      summary: {
        title: data.title,
        averageRating: data.averageRating,
        totalReviewCount: data.totalReviewCount,
        mapsUri: data.mapsUri,
        distribution: null,
        unreplied: null
      },
      reviews,
      pagination: { page: 1, limit: reviews.length, total: reviews.length, pages: 1 }
    });
  } catch (err) {
    return res.status(502).json({ success: false, message: err.message });
  }
};

const listReviews = async (req, res) => {
  const integration = await getIntegration();
  const connected = integration.status !== 'disconnected' && integration.locationName;

  if (!connected) {
    if (isPlacesConfigured()) return placesResponse(req, res, integration);
    return res.json({ success: true, source: 'none', integration: publicIntegration(integration), summary: null, reviews: [], pagination: { page: 1, limit: 0, total: 0, pages: 0 } });
  }

  const base = { locationName: integration.locationName, removedAt: null };
  const filter = { ...base };
  const rating = Number(req.query.rating);
  if (rating >= 1 && rating <= 5) filter.starRating = rating;
  if (req.query.replied === 'yes') filter['reply.comment'] = { $nin: ['', null] };
  if (req.query.replied === 'no') filter['reply.comment'] = { $in: ['', null] };
  const search = String(req.query.search || '').trim().slice(0, 100);
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ comment: rx }, { reviewerName: rx }, { 'reply.comment': rx }];
  }

  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 20, 1), 50);
  const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
  const sort = SORTS[req.query.sort] || SORTS.newest;

  const [reviews, total, dist, unreplied] = await Promise.all([
    GoogleReview.find(filter).sort(sort).skip((page - 1) * limit).limit(limit).lean(),
    GoogleReview.countDocuments(filter),
    GoogleReview.aggregate([
      { $match: base },
      { $group: { _id: '$starRating', count: { $sum: 1 } } }
    ]),
    GoogleReview.countDocuments({ ...base, 'reply.comment': { $in: ['', null] } })
  ]);

  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let stored = 0;
  let sum = 0;
  for (const d of dist) {
    if (distribution[d._id] !== undefined) distribution[d._id] = d.count;
    stored += d.count;
    sum += d._id * d.count;
  }

  return res.json({
    success: true,
    source: 'gbp',
    integration: publicIntegration(integration),
    summary: {
      title: integration.locationTitle,
      // Google's own figures; computed locally until the first sync lands.
      averageRating: integration.averageRating ?? (stored ? Math.round((sum / stored) * 10) / 10 : null),
      totalReviewCount: integration.totalReviewCount ?? stored,
      mapsUri: integration.mapsUri,
      distribution,
      unreplied
    },
    reviews,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
  });
};

const syncNow = async (req, res) => {
  try {
    const result = await syncReviews({ full: Boolean(req.body?.full) });
    if (result.skipped === 'already_running') {
      return res.status(409).json({ success: false, message: 'A sync is already running. Try again in a minute.' });
    }
    if (result.skipped === 'not_connected') {
      return res.status(409).json({ success: false, message: 'Google Business is not connected.' });
    }
    if (result.skipped === 'no_location') {
      return res.status(409).json({ success: false, message: 'Choose which Business Profile location to show first.' });
    }
    return res.json({ success: true, ...result });
  } catch (err) {
    return sendGoogleError(res, err);
  }
};

const findReview = async (req, res) => {
  const review = await GoogleReview.findOne({ reviewId: String(req.params.reviewId) });
  if (!review || review.removedAt) {
    res.status(404).json({ success: false, message: 'Review not found' });
    return null;
  }
  if (!review.name) {
    res.status(409).json({ success: false, message: 'This review cannot be replied to from here.' });
    return null;
  }
  return review;
};

const putReply = async (req, res) => {
  const comment = String(req.body?.comment || '').trim();
  if (!comment) return res.status(400).json({ success: false, message: 'Reply text is required' });
  if (comment.length > MAX_REPLY_LENGTH) {
    return res.status(400).json({ success: false, message: `Reply must be at most ${MAX_REPLY_LENGTH} characters` });
  }
  const review = await findReview(req, res);
  if (!review) return undefined;

  const integration = await getIntegration();
  try {
    const token = await accessTokenFor(integration._id);
    const result = await api.putReply(token, review.name, comment);
    review.reply = {
      comment: result.comment || comment,
      updateTime: result.updateTime ? new Date(result.updateTime) : new Date(),
      repliedBy: actor(req)
    };
    await review.save();
    return res.json({ success: true, review });
  } catch (err) {
    return sendGoogleError(res, err);
  }
};

const deleteReply = async (req, res) => {
  const review = await findReview(req, res);
  if (!review) return undefined;
  const integration = await getIntegration();
  try {
    const token = await accessTokenFor(integration._id);
    await api.deleteReply(token, review.name);
    review.reply = { comment: '', updateTime: null, repliedBy: '' };
    await review.save();
    return res.json({ success: true, review });
  } catch (err) {
    return sendGoogleError(res, err);
  }
};

const disconnect = async (req, res) => {
  const integration = await getIntegration();
  const doc = await GoogleIntegration.findById(integration._id).select('+refreshTokenEnc').lean();
  if (doc?.refreshTokenEnc) {
    try { await api.revokeToken(decrypt(doc.refreshTokenEnc)); } catch (_) { /* ignore */ }
  }
  await GoogleIntegration.deleteOne({ _id: integration._id });
  // Reconnecting resyncs everything; stale copies would only mislead.
  await GoogleReview.deleteMany({});
  res.json({ success: true });
};

module.exports = {
  pickRedirectUri,
  getStatus,
  getAuthUrl,
  oauthCallback,
  getLocations,
  selectLocation,
  listReviews,
  syncNow,
  putReply,
  deleteReply,
  disconnect
};
