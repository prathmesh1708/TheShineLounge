const crypto = require('crypto');
const env = require('../common/config/env');

// Thin client for the Meta WhatsApp Cloud API (graph.facebook.com). Everything
// that talks to Meta lives here so the rest of the module can be tested with
// this file stubbed, and so WHATSAPP_DRY_RUN has one place to short-circuit.

const GRAPH = 'https://graph.facebook.com';

class WhatsAppApiError extends Error {
  constructor(message, { status, code, details } = {}) {
    super(message);
    this.name = 'WhatsAppApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// WHATSAPP_PROVIDER picks who actually delivers: 'bhashsms' (reseller HTTP
// API, providers/bhashsms.js) or 'meta' (this file's Cloud API client).
// BhashSMS templates are approved on its own panel, so the Meta template
// management below is switched off for it.
const bhashsms = require('./providers/bhashsms');

const providerName = () => (env.WHATSAPP_PROVIDER === 'bhashsms' ? 'bhashsms' : 'meta');
const isBhashSms = () => providerName() === 'bhashsms';

const isDryRun = () => env.WHATSAPP_DRY_RUN;
const isConfigured = () => isDryRun() || (isBhashSms()
  ? bhashsms.isConfigured()
  : Boolean(env.WHATSAPP_PHONE_NUMBER_ID && env.WHATSAPP_ACCESS_TOKEN));
const canManageTemplates = () => !isBhashSms() && (isDryRun() || Boolean(isConfigured() && env.WHATSAPP_BUSINESS_ACCOUNT_ID));
const canUploadHeaderSamples = () => !isBhashSms() && (isDryRun() || Boolean(canManageTemplates() && env.WHATSAPP_APP_ID));

const graph = async (method, path, { body, query, headers, raw } = {}) => {
  const qs = query ? `?${new URLSearchParams(query).toString()}` : '';
  const url = `${GRAPH}/${env.WHATSAPP_API_VERSION}/${path}${qs}`;
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
      ...(body !== undefined && !raw ? { 'Content-Type': 'application/json' } : {}),
      ...headers
    },
    body: body === undefined ? undefined : (raw ? body : JSON.stringify(body)),
    signal: AbortSignal.timeout(20000)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) {
    const err = data.error || {};
    const details = err.error_data && err.error_data.details;
    throw new WhatsAppApiError(details || err.error_user_msg || err.message || `WhatsApp API error (${res.status})`, {
      status: res.status,
      code: err.code,
      details
    });
  }
  return data;
};

const fakeId = (prefix) => `${prefix}.DRYRUN.${crypto.randomBytes(8).toString('hex')}`;

// ── Media ────────────────────────────────────────────────────────────────────
// WhatsApp only accepts a narrow set of formats (JPEG/PNG images, H.264+AAC MP4
// video, MP3/AAC/OGG-Opus audio). Cloudinary converts on delivery when the
// extension changes, so a WEBP photo, a MOV clip or a browser-recorded WEBM
// voice note still arrive in a format WhatsApp will play.
const swapExtension = (url, ext) => {
  const [base, query] = url.split('?');
  const path = base.replace(/\.[a-z0-9]{2,5}$/i, '');
  return `${path}.${ext}${query ? `?${query}` : ''}`;
};

const toWhatsAppMediaUrl = (url, type) => {
  const u = String(url || '');
  if (!/res\.cloudinary\.com/.test(u)) return u;
  if (type === 'audio' && u.includes('/video/upload/')) {
    return /\.(mp3|aac|m4a|ogg|amr)$/i.test(u) ? u : swapExtension(u, 'mp3');
  }
  if (type === 'video' && u.includes('/video/upload/')) {
    if (/\/upload\/vc_h264/.test(u)) return u;
    return swapExtension(u.replace('/video/upload/', '/video/upload/vc_h264,ac_aac/'), 'mp4');
  }
  if (type === 'image' && u.includes('/image/upload/')) {
    return /\.(jpe?g|png)$/i.test(u) ? u : swapExtension(u, 'jpg');
  }
  return u;
};

// WhatsApp downloads a document from its link itself, so the link has to open
// for anyone. New Cloudinary accounts refuse PDF delivery by default (401,
// x-cld-error "deny or ACL failure") — catch that before sending, with the fix.
// Returns '' when the file is reachable, else the reason.
const checkPublicDocument = async (url) => {
  if (isDryRun()) return '';
  let res;
  try {
    res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(10000) });
  } catch (err) {
    return `The PDF link could not be opened (${err.message})`;
  }
  if (res.ok) return '';
  const cldError = res.headers.get('x-cld-error') || '';
  if (/res\.cloudinary\.com/.test(url) && (res.status === 401 || /deny|acl/i.test(cldError))) {
    return 'Cloudinary is blocking PDF downloads, so WhatsApp cannot fetch the receipt. In the Cloudinary console open Settings → Security, turn on "Allow delivery of PDF and ZIP files", save, and send again';
  }
  return `The PDF link is not publicly downloadable (HTTP ${res.status})`;
};

// ── Messages ─────────────────────────────────────────────────────────────────
const sendMessage = async (to, message) => {
  if (isDryRun()) return { messageId: fakeId('wamid') };
  const data = await graph('POST', `${env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    body: { messaging_product: 'whatsapp', recipient_type: 'individual', to, ...message }
  });
  return { messageId: data.messages && data.messages[0] && data.messages[0].id };
};

const getPhoneNumberInfo = async () => {
  if (isDryRun()) {
    return { display_phone_number: 'DRY RUN', verified_name: 'The Shine Lounge (dry run)', quality_rating: 'GREEN' };
  }
  return graph('GET', env.WHATSAPP_PHONE_NUMBER_ID, {
    query: { fields: 'display_phone_number,verified_name,quality_rating,messaging_limit_tier,name_status' }
  });
};

// ── Templates ────────────────────────────────────────────────────────────────
const listTemplates = async () => {
  if (isDryRun()) return [];
  const all = [];
  let after;
  do {
    const data = await graph('GET', `${env.WHATSAPP_BUSINESS_ACCOUNT_ID}/message_templates`, {
      query: { fields: 'id,name,status,language,category,components,rejected_reason', limit: '100', ...(after ? { after } : {}) }
    });
    all.push(...(data.data || []));
    after = data.paging && data.paging.next ? data.paging.cursors && data.paging.cursors.after : null;
  } while (after);
  return all;
};

const createTemplate = async ({ name, language, category, components }) => {
  if (isDryRun()) return { id: fakeId('tpl'), status: 'APPROVED', category };
  return graph('POST', `${env.WHATSAPP_BUSINESS_ACCOUNT_ID}/message_templates`, {
    body: { name, language, category, components }
  });
};

const editTemplate = async (templateId, { category, components }) => {
  if (isDryRun()) return { success: true };
  return graph('POST', templateId, { body: { category, components } });
};

const deleteTemplate = async (name) => {
  if (isDryRun()) return { success: true };
  return graph('DELETE', `${env.WHATSAPP_BUSINESS_ACCOUNT_ID}/message_templates`, { query: { name } });
};

// A template with a media header must be submitted with a sample file, passed
// as a "handle" from Meta's resumable upload API (not a URL).
const uploadHeaderSample = async (mediaUrl) => {
  if (isDryRun()) return 'DRYRUN_HANDLE';
  const fileRes = await fetch(mediaUrl);
  if (!fileRes.ok) throw new WhatsAppApiError(`Could not download the header sample (${fileRes.status})`);
  const buffer = Buffer.from(await fileRes.arrayBuffer());
  const fileType = (fileRes.headers.get('content-type') || 'application/octet-stream').split(';')[0];

  const session = await graph('POST', `${env.WHATSAPP_APP_ID}/uploads`, {
    query: { file_length: String(buffer.length), file_type: fileType }
  });
  const res = await fetch(`${GRAPH}/${env.WHATSAPP_API_VERSION}/${session.id}`, {
    method: 'POST',
    headers: { Authorization: `OAuth ${env.WHATSAPP_ACCESS_TOKEN}`, file_offset: '0' },
    body: buffer
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.h) {
    throw new WhatsAppApiError((data.error && data.error.message) || 'Header sample upload failed');
  }
  return data.h;
};

// ── Webhook signature ────────────────────────────────────────────────────────
const verifySignature = (rawBody, signatureHeader) => {
  if (!env.WHATSAPP_APP_SECRET) return false;
  const expected = `sha256=${crypto.createHmac('sha256', env.WHATSAPP_APP_SECRET).update(rawBody || '').digest('hex')}`;
  const a = Buffer.from(String(signatureHeader || ''));
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

module.exports = {
  WhatsAppApiError,
  bhashsms,
  providerName,
  isBhashSms,
  isDryRun,
  isConfigured,
  canManageTemplates,
  canUploadHeaderSamples,
  toWhatsAppMediaUrl,
  checkPublicDocument,
  sendMessage,
  getPhoneNumberInfo,
  listTemplates,
  createTemplate,
  editTemplate,
  deleteTemplate,
  uploadHeaderSample,
  verifySignature
};
