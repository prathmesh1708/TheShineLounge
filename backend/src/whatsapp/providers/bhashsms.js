const crypto = require('crypto');
const env = require('../../common/config/env');

// BhashSMS (bhashsms.com) WhatsApp reseller API. Everything is one GET to
// sendmsg.php; templates are created and approved on the BhashSMS panel, not
// through the API. Replies are plain text with HTTP 200 even on failure
// ("API Not Activated", "Username/Password Incorrect ..."), so the body text
// decides success. The password travels in the query string: never log a URL
// without redact().

class BhashSmsError extends Error {
  constructor(message, raw = '') {
    super(message);
    this.name = 'BhashSmsError';
    this.raw = raw;
  }
}

const ERROR_PATTERN = /(incorrect|deactivated|not activated|invalid|error|fail|insufficient|low balance|not approved|not found|not registered|blocked|denied|missing|unauthori[sz]ed)/i;

// The raw replies are terse; say what the admin has to do about each.
const FRIENDLY = [
  [/not activated/i, 'BhashSMS has not activated WhatsApp API access on this account yet — ask your BhashSMS account manager to activate it'],
  [/incorrect|deactivated/i, 'BhashSMS login failed — check BHASHSMS_USER / BHASHSMS_PASS in backend/.env'],
  [/balance|insufficient/i, 'BhashSMS balance is too low — recharge the WhatsApp credits'],
  [/template/i, 'BhashSMS rejected the template — check the name is exactly as approved on the panel']
];
const explain = (raw) => {
  const hit = FRIENDLY.find(([re]) => re.test(raw));
  return hit ? `${hit[1]} (BhashSMS: "${raw.slice(0, 80)}")` : `BhashSMS: ${raw.slice(0, 200)}`;
};

const isConfigured = () => Boolean(env.BHASHSMS_USER && env.BHASHSMS_PASS && env.BHASHSMS_SENDER);

const redact = (text) => {
  let out = String(text || '');
  if (env.BHASHSMS_PASS) out = out.split(env.BHASHSMS_PASS).join('***');
  return out.replace(/pass=[^&\s]*/gi, 'pass=***');
};

// The API wants Indian mobiles without the 91: "9876543210".
const localNumber = (phone) => {
  const d = String(phone || '').replace(/\D/g, '');
  if (d.length === 12 && d.startsWith('91')) return d.slice(2);
  if (d.length === 10) return d;
  return '';
};

// Params are comma-separated with no escaping, and WhatsApp template
// parameters may not contain newlines, so neither can survive inside a value.
const cleanParam = (value) => {
  const v = String(value === undefined || value === null ? '' : value)
    .replace(/,/g, ' ')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
  return v || '-';
};

const request = async (script, query) => {
  const qs = new URLSearchParams({ user: env.BHASHSMS_USER, pass: env.BHASHSMS_PASS, ...query }).toString();
  let res;
  try {
    res = await fetch(`${env.BHASHSMS_BASE_URL}/${script}?${qs}`, { signal: AbortSignal.timeout(20000) });
  } catch (err) {
    throw new BhashSmsError(`Could not reach BhashSMS: ${redact(err.message)}`);
  }
  // Responses carry stray <br> tags and whitespace around the message.
  const raw = redact((await res.text()).replace(/<br\s*\/?>/gi, ' ').trim());
  if (!res.ok) throw new BhashSmsError(`BhashSMS HTTP ${res.status}: ${raw.slice(0, 200)}`, raw);
  return raw;
};

const fakeId = () => `DRYRUN.${crypto.randomBytes(6).toString('hex')}`;

const send = async (phones, query, script = env.BHASHSMS_TEXT_SCRIPT) => {
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
  if (ERROR_PATTERN.test(raw)) throw new BhashSmsError(explain(raw), raw);
  return { messageId: raw.slice(0, 120), raw: raw.slice(0, 500) };
};

/**
 * Approved template, optionally with variables and an image/video/document header.
 * phones: normalized numbers ("919876543210"); params: values in {{1}}, {{2}} order.
 */
const scriptFor = (category) => (String(category || '').toUpperCase() === 'MARKETING'
  ? env.BHASHSMS_MARKETING_SCRIPT
  : env.BHASHSMS_UTILITY_SCRIPT);

const sendTemplate = ({ phones, templateName, params = [], media = null, category = 'UTILITY' }) => {
  if (!templateName) throw new BhashSmsError('Template name is missing');
  const query = { text: templateName };
  if (params.length) query.Params = params.map(cleanParam).join(',');
  if (media && media.url && ['image', 'video', 'document'].includes(media.type)) {
    query.htype = media.type;
    query.url = media.url;
  }
  return send(phones, query, scriptFor(category));
};

// Plain text, only delivered to people who wrote to the business number in the last 24h.
const sendText = ({ phones, text }) => {
  if (!String(text || '').trim()) throw new BhashSmsError('Message text is empty');
  return send(phones, { text, htype: 'normal' });
};

const getBalance = async () => {
  if (env.WHATSAPP_DRY_RUN && !isConfigured()) return 'DRY RUN';
  const raw = await request('checkbalance.php', {});
  if (ERROR_PATTERN.test(raw)) throw new BhashSmsError(`BhashSMS: ${raw.slice(0, 200)}`, raw);
  return raw;
};

// ── Templates (read from the web panel) ──────────────────────────────────────
// BhashSMS has no template API. The panel page "Manage WA Templates" lists
// every template with its Meta status, so we sign in as the account user
// and read that table. Read-only: nothing on the panel is changed.
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

const HEADER_TYPES = [['document', 'document'], ['video', 'video'], ['image', 'image']];

// Rows: name | category or Meta reply (JSON) | type | message | 9 button cells | status | delete.
const parseTemplateTable = (html) => {
  const templates = [];
  for (const row of String(html).split(/<tr[^>]*>/i).slice(1)) {
    const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((m) => decodeHtml(m[1]).trim());
    if (cells.length < 5 || !cells[0]) continue;
    const [name, info, type, message] = cells;
    const statusCell = cells.length >= 15 ? cells[13] : cells[cells.length - 2] || '';

    let category = '';
    let metaError = '';
    if (info.startsWith('{')) {
      try {
        const meta = JSON.parse(info);
        category = String(meta.category || '').toUpperCase();
        metaError = meta.error_user_msg || (meta.message && !meta.status ? meta.message : '');
      } catch (e) { /* not JSON after all */ }
    } else {
      category = info.toUpperCase();
    }

    let status = 'PENDING';
    if (/approved/i.test(statusCell)) status = 'APPROVED';
    else if (/reject/i.test(statusCell) || metaError) status = 'REJECTED';

    const hit = HEADER_TYPES.find(([needle]) => type.toLowerCase().includes(needle));
    templates.push({
      name,
      category: ['MARKETING', 'UTILITY', 'AUTHENTICATION'].includes(category) ? category : '',
      headerType: hit ? hit[1] : 'none',
      body: message.split('\n').map((l) => l.trim()).join('\n').trim(),
      status,
      rejectedReason: metaError
    });
  }
  return templates;
};

const listTemplates = async () => {
  if (!isConfigured()) throw new BhashSmsError('BhashSMS login is not set in backend/.env');
  const base = panelUrl();
  let login;
  try {
    login = await fetch(`${base}/loginlanding.php`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ username2: env.BHASHSMS_USER, password2: env.BHASHSMS_PASS, rememberMe: '1', submituser: 'Login' }).toString(),
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
  BhashSmsError, isConfigured, redact, localNumber, cleanParam, sendTemplate, sendText, getBalance,
  listTemplates, parseTemplateTable
};
