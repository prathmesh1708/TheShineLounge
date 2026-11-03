const crypto = require('crypto');
const env = require('../../common/config/env');

// BhashSMS WhatsApp provider.
// V2 REST API (https://apiv2.bhashsms.com): Authenticates via JWT Bearer token
// from POST /auth/v1/appAuthenticate using the API Key, queries templates via
// GET /customer/api/v1/template/getAllApiTemplates, and dispatches messages via
// POST /customer/api/v1/campaign/sendMessage and POST /messages/sendReply.
//
// V1 Legacy HTTP API (fallback): GET to sendmsg.php / sendmsgutil.php.

class BhashSmsError extends Error {
  constructor(message, raw = '') {
    super(message);
    this.name = 'BhashSmsError';
    this.raw = raw;
  }
}

// An accepted message's id, e.g. "S.918396" or V2 requestCode "BSLB...".
const MESSAGE_ID = /S\.[A-Za-z0-9]+/g;

const ERROR_PATTERN = /(incorrect|deactivated|not activated|invalid|error|fail|insufficient|low balance|not approved|not found|not registered|blocked|denied|missing|unauthori[sz]ed)/i;

// The raw replies are terse; say what the admin has to do about each.
const FRIENDLY = [
  [/not activated/i, 'BhashSMS has not activated WhatsApp API access on this account yet — ask your BhashSMS account manager to activate it'],
  [/incorrect|deactivated/i, 'BhashSMS login failed — check BHASHSMS_USER / BHASHSMS_PASS / BHASHSMS_API_KEY in backend/.env'],
  [/balance|insufficient/i, 'BhashSMS balance is too low — recharge the WhatsApp credits'],
  [/template/i, 'BhashSMS rejected the template — check the name is exactly as approved on the panel']
];
const explain = (raw) => {
  const hit = FRIENDLY.find(([re]) => re.test(raw));
  return hit ? `${hit[1]} (BhashSMS: "${raw.slice(0, 80)}")` : `BhashSMS: ${raw.slice(0, 200)}`;
};

const isV2 = () => env.BHASHSMS_VERSION === 'v2' || Boolean(env.BHASHSMS_API_KEY && (env.BHASHSMS_BASE_URL.includes('apiv2') || env.BHASHSMS_BASE_URL.includes('app.bhashsms.com')));

const isConfigured = () => (isV2()
  ? Boolean(env.BHASHSMS_API_KEY || (env.BHASHSMS_USER && env.BHASHSMS_PASS))
  : Boolean(env.BHASHSMS_USER && (env.BHASHSMS_PASS || env.BHASHSMS_API_KEY) && env.BHASHSMS_SENDER));

const redact = (text) => {
  let out = String(text || '');
  if (env.BHASHSMS_PASS && env.BHASHSMS_PASS.length >= 8) out = out.split(env.BHASHSMS_PASS).join('***');
  if (env.BHASHSMS_API_KEY && env.BHASHSMS_API_KEY.length >= 8) out = out.split(env.BHASHSMS_API_KEY).join('***');
  if (env.BHASHSMS_PANEL_PASS && env.BHASHSMS_PANEL_PASS.length >= 8) out = out.split(env.BHASHSMS_PANEL_PASS).join('***');
  out = out.replace(/pass=[^&\s]*/gi, 'pass=***');
  out = out.replace(/apikey=[^&\s]*/gi, 'apikey=***');
  out = out.replace(/api_key=[^&\s]*/gi, 'api_key=***');
  return out;
};

// The API wants Indian mobiles without the 91: "9876543210".
const localNumber = (phone) => {
  const d = String(phone || '').replace(/\D/g, '');
  if (d.length === 12 && d.startsWith('91')) return d.slice(2);
  if (d.length === 10) return d;
  return '';
};

// Full Indian phone with country code (919876543210) for V2
const fullNumber = (phone) => {
  const local = localNumber(phone);
  return local ? `91${local}` : '';
};

// Params are cleaned of newlines and excessive whitespace
const cleanParam = (value) => {
  const v = String(value === undefined || value === null ? '' : value)
    .replace(/,/g, ' ')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
  return v || '-';
};

const fakeId = () => `DRYRUN.${crypto.randomBytes(6).toString('hex')}`;

// ── V2 REST Client ────────────────────────────────────────────────────────────
let tokenCache = {
  accessToken: '',
  refreshToken: '',
  expiresAt: 0,
  pending: null
};

const getAccessToken = async (forceRefresh = false) => {
  if (!forceRefresh && tokenCache.accessToken && Date.now() < tokenCache.expiresAt - 60000) {
    return tokenCache.accessToken;
  }
  if (tokenCache.pending) return tokenCache.pending;

  tokenCache.pending = (async () => {
    try {
      const authUrl = `${env.BHASHSMS_BASE_URL}/auth/v1/appAuthenticate`;
      const apiKey = env.BHASHSMS_API_KEY || env.BHASHSMS_PASS;
      if (!apiKey) throw new BhashSmsError('BHASHSMS_API_KEY is not set in backend/.env');

      const res = await fetch(authUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey }),
        signal: AbortSignal.timeout(20000)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success || !data.content || !data.content.accessToken) {
        const msg = data.detail || data.message || `BhashSMS V2 authentication failed (HTTP ${res.status})`;
        throw new BhashSmsError(msg);
      }
      const token = data.content.accessToken;
      let expMs = Date.now() + 9 * 60 * 1000;
      try {
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        if (payload.exp) expMs = payload.exp * 1000;
      } catch (e) { /* ignore parse */ }

      tokenCache = {
        accessToken: token,
        refreshToken: data.content.refreshToken || '',
        expiresAt: expMs,
        pending: null
      };
      return token;
    } catch (err) {
      tokenCache.pending = null;
      throw err;
    }
  })();
  return tokenCache.pending;
};

const requestV2 = async (path, { method = 'GET', body, query, isRetry = false } = {}) => {
  const token = await getAccessToken(isRetry);
  const qs = query ? `?${new URLSearchParams(query).toString()}` : '';
  const url = `${env.BHASHSMS_BASE_URL}${path}${qs}`;
  let res;
  try {
    res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {})
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(30000)
    });
  } catch (err) {
    throw new BhashSmsError(`Could not reach BhashSMS V2: ${redact(err.message)}`);
  }

  if (res.status === 401 && !isRetry) {
    return requestV2(path, { method, body, query, isRetry: true });
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok || (data.success === false && !data.content)) {
    const detailMsg = Array.isArray(data.detail) ? data.detail.map((d) => d.msg || JSON.stringify(d)).join(', ') : data.detail;
    const msg = data.message || detailMsg || `BhashSMS HTTP ${res.status}`;
    throw new BhashSmsError(`BhashSMS: ${msg}`);
  }
  return data;
};

// In-memory cache of templateCode mappings: name -> templateCode
const templateCodeCache = new Map();

const resolveTemplateCode = async (templateName, businessCode) => {
  if (templateCodeCache.has(templateName)) return templateCodeCache.get(templateName);
  try {
    const WhatsAppTemplate = require('../../models/WhatsAppTemplate');
    const local = await WhatsAppTemplate.findOne({ name: templateName }).lean();
    if (local && local.metaTemplateId) {
      templateCodeCache.set(templateName, local.metaTemplateId);
      return local.metaTemplateId;
    }
  } catch (e) { /* ignore DB lookup */ }

  // Fall back to querying V2 template list
  try {
    const data = await requestV2('/customer/api/v1/template/getAllApiTemplates', {
      query: { businessCode: businessCode || env.BHASHSMS_BUSINESS_CODE, pageSize: '100' }
    });
    for (const item of (data && data.content) || []) {
      if (item.name && item.templateCode) {
        templateCodeCache.set(item.name, item.templateCode);
      }
    }
    if (templateCodeCache.has(templateName)) return templateCodeCache.get(templateName);
  } catch (e) { /* ignore */ }

  return templateName;
};

// ── V1 Legacy Request Helper ──────────────────────────────────────────────────
const request = async (script, query) => {
  const qs = new URLSearchParams({ user: env.BHASHSMS_USER, pass: env.BHASHSMS_PASS, ...query }).toString();
  let res;
  try {
    res = await fetch(`${env.BHASHSMS_BASE_URL}/${script}?${qs}`, { signal: AbortSignal.timeout(20000) });
  } catch (err) {
    throw new BhashSmsError(`Could not reach BhashSMS: ${redact(err.message)}`);
  }
  const raw = redact((await res.text()).replace(/<br\s*\/?>/gi, ' ').trim());
  if (!res.ok) throw new BhashSmsError(`BhashSMS HTTP ${res.status}: ${raw.slice(0, 200)}`, raw);
  return raw;
};

const sendV1 = async (phones, query, script = env.BHASHSMS_TEXT_SCRIPT) => {
  const numbers = phones.map(localNumber).filter(Boolean);
  if (!numbers.length) throw new BhashSmsError('No valid Indian mobile number to send to');
  if (env.WHATSAPP_DRY_RUN) return { messageId: fakeId(), raw: 'DRY RUN' };

  const raw = await request(script, {
    sender: env.BHASHSMS_SENDER,
    phone: numbers.join(','),
    priority: 'wa',
    stype: 'normal',
    ...query
  });
  if (!raw) throw new BhashSmsError('BhashSMS returned an empty response');

  const messageIds = raw.match(MESSAGE_ID) || [];
  if (!messageIds.length) {
    if (ERROR_PATTERN.test(raw)) throw new BhashSmsError(explain(raw), raw);
    const fallback = raw.slice(0, 120);
    return { messageId: fallback, messageIds: numbers.map(() => fallback), raw: raw.slice(0, 500) };
  }
  return { messageId: messageIds[0], messageIds, raw: raw.slice(0, 500) };
};

const scriptFor = (category) => (String(category || '').toUpperCase() === 'MARKETING'
  ? env.BHASHSMS_MARKETING_SCRIPT
  : env.BHASHSMS_UTILITY_SCRIPT);

// ── Public Send Methods ───────────────────────────────────────────────────────
const sendTemplate = async ({ phones, templateName, templateCode, params = [], media = null, category = 'UTILITY' }) => {
  if (!templateName && !templateCode) throw new BhashSmsError('Template name is missing');

  if (isV2()) {
    const numbers = phones.map(fullNumber).filter(Boolean);
    if (!numbers.length) throw new BhashSmsError('No valid Indian mobile number to send to');
    if (env.WHATSAPP_DRY_RUN) return { messageId: fakeId(), messageIds: numbers.map(() => fakeId()), raw: 'DRY RUN' };

    const businessCode = env.BHASHSMS_BUSINESS_CODE || 'BSLB00494';
    const tCode = templateCode || (await resolveTemplateCode(templateName, businessCode));

    const values = params.map((val, idx) => ({
      variable: String(idx + 1),
      value: cleanParam(val)
    }));

    let header = undefined;
    if (media && media.url && ['image', 'video', 'document'].includes(media.type)) {
      header = {
        type: media.type.toUpperCase(),
        value: media.url
      };
    }

    const messageIds = [];
    let lastRaw = '';

    for (const num of numbers) {
      const payload = {
        businessCode,
        templateCode: tCode,
        mobileNumbers: num,
        ...(header ? { header } : {}),
        values
      };

      const res = await requestV2('/customer/api/v1/campaign/sendMessage', {
        method: 'POST',
        body: payload
      });

      const reqCode = (res.content && res.content.requestCode) || (res.message && res.message.slice(0, 40)) || fakeId();
      messageIds.push(reqCode);
      lastRaw = JSON.stringify(res);
    }

    return {
      messageId: messageIds[0],
      messageIds,
      raw: lastRaw.slice(0, 500)
    };
  }

  // V1 fallback
  const query = { text: templateName };
  if (params.length) query.Params = params.map(cleanParam).join(',');
  if (media && media.url && ['image', 'video', 'document'].includes(media.type)) {
    query.htype = media.type;
    query.url = media.url;
  }
  return sendV1(phones, query, scriptFor(category));
};

const sendText = async ({ phones, text }) => {
  if (!String(text || '').trim()) throw new BhashSmsError('Message text is empty');

  if (isV2()) {
    const numbers = phones.map(fullNumber).filter(Boolean);
    if (!numbers.length) throw new BhashSmsError('No valid Indian mobile number to send to');
    if (env.WHATSAPP_DRY_RUN) return { messageId: fakeId(), messageIds: numbers.map(() => fakeId()), raw: 'DRY RUN' };

    const businessCode = env.BHASHSMS_BUSINESS_CODE || 'BSLB00494';
    const messageIds = [];
    let lastRaw = '';

    for (const num of numbers) {
      const payload = {
        businessCode,
        to: num,
        text: text.trim()
      };
      const res = await requestV2('/messages/sendReply', {
        method: 'POST',
        body: payload
      });
      const id = (res.content && res.content.requestCode) || res.message || 'SENT';
      messageIds.push(id);
      lastRaw = JSON.stringify(res);
    }

    return {
      messageId: messageIds[0],
      messageIds,
      raw: lastRaw.slice(0, 500)
    };
  }

  // V1 fallback
  return sendV1(phones, { text, htype: 'normal' });
};

const getBalance = async () => {
  if (env.WHATSAPP_DRY_RUN && !isConfigured()) return 'DRY RUN';

  if (isV2()) {
    const businessCode = env.BHASHSMS_BUSINESS_CODE || 'BSLB00494';
    const data = await requestV2('/customer/api/v1/wallet/apiWalletBalance', {
      query: { businessCode }
    });
    const wallets = (data && data.content && data.content.wallets) || [];
    if (!wallets.length) return `Total: ${(data && data.content && data.content.totalCredits) || 0} credits`;
    return wallets.map((w) => `${w.label || w.type}: ${w.walletBalance} credits`).join(' | ');
  }

  const raw = await request('checkbalance.php', {});
  if (ERROR_PATTERN.test(raw)) throw new BhashSmsError(`BhashSMS: ${raw.slice(0, 200)}`, raw);
  return raw;
};

// ── Templates ─────────────────────────────────────────────────────────────────
const HEADER_TYPES = [['document', 'document'], ['video', 'video'], ['image', 'image']];

const panelUrl = () => env.BHASHSMS_BASE_URL.replace(/\/api$/, '');

const decodeHtml = (s) => String(s || '')
  .replace(/<br\s*\/?>/gi, '\n')
  .replace(/<[^>]*>/g, '')
  .replace(/&nbsp;/g, ' ')
  .replace(/&quot;/g, '"')
  .replace(/&#0?39;/g, "'")
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&amp;/g, '&');

const parseTemplateTable = (html) => {
  const templates = [];
  for (const row of String(html).split(/<tr[^>]*>/i).slice(1)) {
    const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((m) => decodeHtml(m[1]).trim());
    if (cells.length < 5 || !cells[0]) continue;
    const [name, info, type, message] = cells;
    const statusCell = cells.length >= 15 ? cells[13] : cells[cells.length - 2] || '';

    let category = '';
    let metaError = '';
    let metaTemplateId = '';
    let metaStatusText = '';
    if (info.startsWith('{')) {
      try {
        const meta = JSON.parse(info);
        category = String(meta.category || '').toUpperCase();
        metaError = meta.error_user_msg || (meta.message && !meta.status ? meta.message : '');
        metaTemplateId = String(meta.id || '');
        metaStatusText = String(meta.status || '');
      } catch (e) { /* not JSON */ }
    } else {
      category = info.toUpperCase();
    }

    let status = 'PENDING';
    if (/approved/i.test(statusCell)) status = 'APPROVED';
    else if (/reject/i.test(statusCell) || metaError) status = 'REJECTED';
    if (metaStatusText && !/approved/i.test(metaStatusText) && status === 'APPROVED') status = 'PENDING';

    const hit = HEADER_TYPES.find(([needle]) => type.toLowerCase().includes(needle));
    templates.push({
      name,
      category: ['MARKETING', 'UTILITY', 'AUTHENTICATION'].includes(category) ? category : '',
      headerType: hit ? hit[1] : 'none',
      body: message.split('\n').map((l) => l.trim()).join('\n').trim(),
      status,
      rejectedReason: metaError,
      metaTemplateId,
      panelInfo: info.slice(0, 200)
    });
  }
  return templates;
};

const listTemplates = async () => {
  if (!isConfigured()) throw new BhashSmsError('BhashSMS credentials not set in backend/.env');

  if (isV2()) {
    const businessCode = env.BHASHSMS_BUSINESS_CODE || 'BSLB00494';
    const data = await requestV2('/customer/api/v1/template/getAllApiTemplates', {
      query: { businessCode, pageSize: '100' }
    });
    const items = (data && data.content) || [];
    return items.map((r) => {
      const headerType = r.header && r.header.type
        ? r.header.type.toLowerCase()
        : (r.type ? r.type.toLowerCase() : 'none');
      const normalizedHeader = ['document', 'video', 'image'].includes(headerType) ? headerType : 'none';

      if (r.name && r.templateCode) {
        templateCodeCache.set(r.name, r.templateCode);
      }

      return {
        name: r.name,
        category: ['MARKETING', 'UTILITY', 'AUTHENTICATION'].includes(r.category) ? r.category : '',
        headerType: normalizedHeader,
        body: (r.content || '').split('\n').map((l) => l.trim()).join('\n').trim(),
        status: r.status === 'APPROVED' ? 'APPROVED' : (r.status === 'REJECTED' ? 'REJECTED' : 'PENDING'),
        rejectedReason: r.reason || '',
        metaTemplateId: r.templateCode || '',
        templateCode: r.templateCode || '',
        panelInfo: r.templateCode || ''
      };
    });
  }

  // V1 Scraping fallback
  const base = panelUrl();
  const panelPass = env.BHASHSMS_PANEL_PASS || env.BHASHSMS_PASS;
  let login;
  try {
    login = await fetch(`${base}/loginlanding.php`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ username2: env.BHASHSMS_USER, password2: panelPass, rememberMe: '1', submituser: 'Login' }).toString(),
      redirect: 'manual',
      signal: AbortSignal.timeout(20000)
    });
  } catch (err) {
    throw new BhashSmsError(`Could not reach the BhashSMS panel: ${redact(err.message)}`);
  }
  const cookies = (typeof login.headers.getSetCookie === 'function' ? login.headers.getSetCookie() : [login.headers.get('set-cookie') || ''])
    .map((c) => c.split(';')[0]).filter(Boolean).join('; ');
  if (!cookies) throw new BhashSmsError('BhashSMS panel login failed (no session) — check BHASHSMS_USER / BHASHSMS_PASS');

  const page = await fetch(`${base}/pushwa/iframe/vieweditdeletetemplates.php`, {
    headers: { cookie: cookies },
    signal: AbortSignal.timeout(20000)
  });
  const html = await page.text();
  if (!/Template Name/i.test(html)) {
    throw new BhashSmsError('Could not read the BhashSMS template list — the panel login was refused or the page changed');
  }
  return parseTemplateTable(html);
};

module.exports = {
  BhashSmsError,
  isV2,
  isConfigured,
  redact,
  localNumber,
  fullNumber,
  cleanParam,
  getAccessToken,
  sendTemplate,
  sendText,
  getBalance,
  listTemplates,
  parseTemplateTable
};
