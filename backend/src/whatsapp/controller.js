const mongoose = require('mongoose');
const env = require('../common/config/env');
const WhatsAppTemplate = require('../models/WhatsAppTemplate');
const WhatsAppCampaign = require('../models/WhatsAppCampaign');
const WhatsAppContactPref = require('../models/WhatsAppContactPref');
const provider = require('./provider');
const { normalizePhone, formatPhone } = require('./phone');
const { getContacts, invalidateContacts } = require('./contacts');
const { VARIABLES, SAMPLE_VARS, extractVariables, toPositional } = require('./render');
const { runWhatsAppSenderTick } = require('./sender');

const MAX_RECIPIENTS = 10000;
// WhatsApp's own per-type size limits.
const MEDIA_LIMITS = {
  image: 5 * 1024 * 1024,
  video: 16 * 1024 * 1024,
  audio: 16 * 1024 * 1024,
  document: 100 * 1024 * 1024
};
const PLACEHOLDER = /\{\{\s*[^}]+\s*\}\}/;

const fail = (res, status, message) => res.status(status).json({ success: false, message });
const actor = (req) => (req.user && (req.user.email || req.user.fullName)) || '';
const isId = (id) => mongoose.Types.ObjectId.isValid(id);

// Run one batch for a campaign. Serverless functions freeze once the response
// is sent, so there the batch is awaited; a long-lived server lets it run in
// the background (the interval would pick it up within 15s anyway).
const kick = async (campaignId) => {
  const run = () => runWhatsAppSenderTick(new Date(), { campaignId })
    .catch((err) => console.warn('WhatsApp send batch failed:', err.message));
  if (process.env.VERCEL) await run();
  else setImmediate(run);
};

// ── Status ───────────────────────────────────────────────────────────────────
exports.getStatus = async (req, res) => {
  const status = {
    configured: provider.isConfigured(),
    dryRun: provider.isDryRun(),
    canManageTemplates: provider.canManageTemplates(),
    canUploadHeaderSamples: provider.canUploadHeaderSamples(),
    webhook: {
      path: '/api/whatsapp/webhook',
      verifyTokenSet: Boolean(env.WHATSAPP_WEBHOOK_VERIFY_TOKEN),
      appSecretSet: Boolean(env.WHATSAPP_APP_SECRET)
    },
    requireOptIn: env.WHATSAPP_REQUIRE_OPT_IN,
    batchSize: env.WHATSAPP_SEND_BATCH,
    apiVersion: env.WHATSAPP_API_VERSION,
    mediaLimits: MEDIA_LIMITS,
    variables: VARIABLES,
    phone: null,
    phoneError: '',
    provider: provider.providerName(),
    bhashsms: null
  };
  if (provider.isBhashSms()) {
    status.bhashsms = {
      user: env.BHASHSMS_USER,
      sender: env.BHASHSMS_SENDER,
      baseUrl: env.BHASHSMS_BASE_URL,
      credentialsSet: provider.bhashsms.isConfigured(),
      balance: '',
      balanceError: ''
    };
    if (status.bhashsms.credentialsSet) {
      try {
        status.bhashsms.balance = await provider.bhashsms.getBalance();
      } catch (err) {
        status.bhashsms.balanceError = err.message;
      }
    }
    status.invoiceTemplate = await WhatsAppTemplate.findOne({ purpose: 'invoice' }).select('name displayName').lean();
  } else if (status.configured) {
    try {
      status.phone = await provider.getPhoneNumberInfo();
    } catch (err) {
      status.phoneError = err.message;
    }
  }
  if (!status.invoiceTemplate) {
    status.invoiceTemplate = await WhatsAppTemplate.findOne({ purpose: 'invoice' }).select('name displayName').lean();
  }
  res.json({ success: true, status });
};

// ── Contacts ─────────────────────────────────────────────────────────────────
exports.getContacts = async (req, res) => {
  try {
    const contacts = await getContacts({ force: req.query.refresh === '1' });
    res.json({ success: true, count: contacts.length, contacts });
  } catch (err) {
    fail(res, 500, err.message || 'Could not load contacts');
  }
};

const applyPref = async (phone, { optIn, optedOut, tags }) => {
  const $set = {};
  const now = new Date();
  if (typeof optIn === 'boolean') {
    $set.optIn = optIn;
    if (optIn) Object.assign($set, { optInAt: now, optInSource: 'admin', optedOut: false, optedOutAt: null });
  }
  if (typeof optedOut === 'boolean') {
    $set.optedOut = optedOut;
    $set.optedOutAt = optedOut ? now : null;
    if (optedOut) $set.optIn = false;
  }
  if (Array.isArray(tags)) $set.tags = tags.map((t) => String(t).trim()).filter(Boolean).slice(0, 20);
  return WhatsAppContactPref.findOneAndUpdate({ phone }, { $set }, { upsert: true, returnDocument: 'after' });
};

exports.updateContact = async (req, res) => {
  const phone = normalizePhone(req.params.phone);
  if (!phone) return fail(res, 400, 'Invalid phone number');
  try {
    const pref = await applyPref(phone, req.body || {});
    invalidateContacts();
    res.json({ success: true, pref });
  } catch (err) {
    fail(res, 500, err.message);
  }
};

exports.bulkUpdateContacts = async (req, res) => {
  const phones = [...new Set((req.body.phones || []).map(normalizePhone).filter(Boolean))];
  if (!phones.length) return fail(res, 400, 'No valid phone numbers given');
  try {
    for (const phone of phones) await applyPref(phone, req.body || {});
    invalidateContacts();
    res.json({ success: true, updated: phones.length });
  } catch (err) {
    fail(res, 500, err.message);
  }
};

// ── Templates ────────────────────────────────────────────────────────────────
const slugify = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 500);

const validateTemplate = (t) => {
  if (!t.name) return 'Give the template a name';
  if (!/^[a-z0-9_]+$/.test(t.name)) return 'Template name may only contain lowercase letters, digits and underscores';
  if (!t.body || !t.body.trim()) return 'Template body is required';
  if (t.body.length > 1024) return 'Template body must be 1024 characters or fewer';
  const trimmed = t.body.trim();
  if (/^\{\{[^}]+\}\}/.test(trimmed) || /\{\{[^}]+\}\}[.!?]*$/.test(trimmed)) {
    return 'WhatsApp rejects templates that start or end with a variable — add some text before/after it';
  }
  const unknown = (trimmed.match(/\{\{\s*([a-zA-Z][a-zA-Z0-9_]*)\s*\}\}/g) || [])
    .map((m) => m.replace(/[{}\s]/g, ''))
    .filter((k) => !VARIABLES.includes(k));
  if (unknown.length) return `Unknown variable(s): ${[...new Set(unknown)].join(', ')}`;
  if (t.headerType === 'text') {
    if (!t.headerText || !t.headerText.trim()) return 'Header text is empty';
    if (t.headerText.length > 60) return 'Header text must be 60 characters or fewer';
    if (PLACEHOLDER.test(t.headerText)) return 'Variables are not supported in the header';
  }
  if (t.footer && t.footer.length > 60) return 'Footer must be 60 characters or fewer';
  if (t.footer && PLACEHOLDER.test(t.footer)) return 'Variables are not supported in the footer';
  const buttons = t.buttons || [];
  if (buttons.length > 10) return 'At most 10 buttons';
  if (buttons.filter((b) => b.type === 'URL').length > 2) return 'At most 2 website buttons';
  if (buttons.filter((b) => b.type === 'PHONE_NUMBER').length > 1) return 'At most 1 call button';
  for (const b of buttons) {
    if (!b.text || b.text.length > 25) return 'Each button needs a label of up to 25 characters';
    if (b.type === 'URL' && !/^https?:\/\//i.test(b.url || '')) return `Button "${b.text}" needs a full https:// link`;
    if (b.type === 'PHONE_NUMBER' && !normalizePhone(b.phoneNumber)) return `Button "${b.text}" needs a valid phone number`;
  }
  return '';
};

const pickTemplateFields = (body) => {
  const out = {};
  for (const k of ['displayName', 'language', 'category', 'headerType', 'headerText', 'headerMediaUrl', 'body', 'footer']) {
    if (body[k] !== undefined) out[k] = typeof body[k] === 'string' ? body[k].trim() : body[k];
  }
  if (Array.isArray(body.buttons)) {
    out.buttons = body.buttons.map((b) => ({
      type: b.type,
      text: String(b.text || '').trim(),
      url: String(b.url || '').trim(),
      phoneNumber: String(b.phoneNumber || '').trim()
    }));
  }
  return out;
};

// A template registered from the BhashSMS panel keeps its approved text, so
// it may use Meta's positional {{1}}, {{2}}; `requested` says which contact
// field fills each position. Named placeholders map themselves.
const variableMapFor = (body, requested = []) => {
  const positions = (String(body || '').match(/\{\{\s*(\d+)\s*\}\}/g) || []).map((m) => Number(m.replace(/\D/g, '')));
  if (positions.length) {
    const max = Math.max(...positions);
    return Array.from({ length: max }, (_v, i) => (VARIABLES.includes(requested[i]) ? requested[i] : ''));
  }
  return extractVariables(body);
};

const validateRegisteredTemplate = (t) => {
  if (!t.name) return 'Enter the template name exactly as it appears on the BhashSMS panel';
  if (!/^[A-Za-z0-9_.-]+$/.test(t.name)) return 'Template name may only contain letters, digits, _ . and - (no spaces)';
  if (!t.body || !t.body.trim()) return 'Paste the approved template text';
  if (t.body.length > 1024) return 'Template text must be 1024 characters or fewer';
  if (t.headerType === 'text') return 'BhashSMS headers can be a photo, video or PDF — not text';
  return '';
};

// Only one template sends invoice receipts.
const claimInvoicePurpose = async (template) => {
  if (template.purpose !== 'invoice') return;
  await WhatsAppTemplate.updateMany({ _id: { $ne: template._id }, purpose: 'invoice' }, { $set: { purpose: 'campaign' } });
};

// ── BhashSMS template sync ───────────────────────────────────────────────────
// The BhashSMS panel is the source of truth: every template there is mirrored
// here with its real status (APPROVED / PENDING / REJECTED). A template that
// exists only in the hub is marked DISABLED, because BhashSMS accepts sends
// for unknown names and WhatsApp then silently drops them.
const BHASH_SYNC_TTL_MS = 2 * 60 * 1000;
const PANEL_PLACEHOLDER = /^AFTER ADDING TEMPLATE HERE/i;
let lastBhashSync = { at: 0, pending: null };

// Imported positional templates: guess the obvious fields so they work at once.
const defaultMapFor = (remote) => {
  if (remote.headerType === 'document' && /invoice|receipt|bill/i.test(remote.name)) {
    return ['name', 'invoiceNo', 'invoiceAmount'];
  }
  return ['name'];
};

const syncBhashTemplates = async () => {
  const remote = await provider.bhashsms.listTemplates();
  const seen = new Set();
  let imported = 0;
  let updated = 0;

  for (const r of remote) {
    if (r.category === 'AUTHENTICATION') continue; // OTP templates are not for the hub
    seen.add(r.name);
    const fields = {
      provider: 'bhashsms',
      metaStatus: r.status,
      rejectedReason: r.rejectedReason || '',
      headerType: r.headerType,
      lastSyncedAt: new Date()
    };
    if (r.category) fields.category = r.category;

    const local = await WhatsAppTemplate.findOne({ name: r.name });
    if (local) {
      // The panel shows a placeholder instead of the text for templates set up
      // by BhashSMS support — keep whatever wording the admin typed here.
      if (r.body && !PANEL_PLACEHOLDER.test(r.body)) local.body = r.body;
      Object.assign(local, fields);
      local.variableMap = variableMapFor(local.body, local.variableMap);
      await local.save();
      updated += 1;
    } else {
      const body = r.body || r.name;
      const created = await WhatsAppTemplate.create({
        ...fields,
        name: r.name,
        displayName: r.name,
        category: fields.category || 'MARKETING',
        body,
        variableMap: variableMapFor(body, defaultMapFor(r)),
        purpose: 'campaign',
        createdBy: 'bhashsms-sync'
      });
      // First approved PDF invoice template becomes the receipt template.
      if (created.headerType === 'document' && /invoice|receipt|bill/i.test(created.name)
        && !(await WhatsAppTemplate.exists({ purpose: 'invoice' }))) {
        created.purpose = 'invoice';
        await created.save();
      }
      imported += 1;
    }
  }

  const missing = await WhatsAppTemplate.updateMany(
    { provider: 'bhashsms', name: { $nin: [...seen] } },
    { $set: { metaStatus: 'DISABLED', rejectedReason: 'Not on the BhashSMS panel — create it there (Templates WA → Add WA Templates) and get it approved', lastSyncedAt: new Date() } }
  );
  lastBhashSync = { at: Date.now(), pending: null };
  return { imported, updated, missing: missing.modifiedCount || 0, total: remote.length };
};

// Collapses concurrent requests into one panel read.
const ensureBhashSync = (force = false) => {
  if (!force && Date.now() - lastBhashSync.at < BHASH_SYNC_TTL_MS) return Promise.resolve(null);
  if (lastBhashSync.pending) return lastBhashSync.pending;
  lastBhashSync.pending = syncBhashTemplates().catch((err) => {
    lastBhashSync.pending = null;
    throw err;
  });
  return lastBhashSync.pending;
};

exports.listTemplates = async (req, res) => {
  let syncError = '';
  if (provider.isBhashSms() && provider.bhashsms.isConfigured()) {
    try {
      await ensureBhashSync(req.query.refresh === '1');
    } catch (err) {
      syncError = err.message;
    }
  }
  const templates = await WhatsAppTemplate.find({}).sort({ metaStatus: 1, updatedAt: -1 }).lean();
  res.json({ success: true, templates, syncError, lastSyncedAt: lastBhashSync.at ? new Date(lastBhashSync.at) : null });
};

exports.createTemplate = async (req, res) => {
  try {
    const fields = pickTemplateFields(req.body || {});
    fields.purpose = req.body.purpose === 'invoice' ? 'invoice' : 'campaign';
    if (provider.isBhashSms()) {
      // Already approved on the BhashSMS panel: keep the exact name and text.
      fields.name = String(req.body.name || '').trim();
      if (!fields.displayName) fields.displayName = fields.name;
      const error = validateRegisteredTemplate(fields);
      if (error) return fail(res, 400, error);
      Object.assign(fields, {
        provider: 'bhashsms',
        // Real status comes from the BhashSMS panel (synced below).
        metaStatus: 'PENDING',
        footer: '',
        buttons: [],
        variableMap: variableMapFor(fields.body, req.body.variableMap)
      });
    } else {
      fields.name = slugify(req.body.name || fields.displayName);
      if (!fields.displayName) fields.displayName = req.body.name || fields.name;
      const error = validateTemplate(fields);
      if (error) return fail(res, 400, error);
      fields.variableMap = extractVariables(fields.body);
    }
    if (await WhatsAppTemplate.exists({ name: fields.name })) {
      return fail(res, 409, `A template named "${fields.name}" already exists`);
    }
    let template = await WhatsAppTemplate.create({ ...fields, createdBy: actor(req) });
    await claimInvoicePurpose(template);
    if (template.provider === 'bhashsms') {
      try {
        await ensureBhashSync(true);
        template = await WhatsAppTemplate.findById(template._id);
      } catch (err) { /* stays PENDING until the next sync */ }
    }
    res.status(201).json({ success: true, template });
  } catch (err) {
    fail(res, 400, err.message);
  }
};

exports.updateTemplate = async (req, res) => {
  if (!isId(req.params.id)) return fail(res, 400, 'Invalid template id');
  const template = await WhatsAppTemplate.findById(req.params.id);
  if (!template) return fail(res, 404, 'Template not found');

  if (req.body.purpose !== undefined) template.purpose = req.body.purpose === 'invoice' ? 'invoice' : 'campaign';

  // Only the "Use for" switch changed (Settings → invoice template picker).
  if (Object.keys(req.body).every((k) => k === 'purpose')) {
    if (template.purpose === 'invoice' && template.metaStatus !== 'APPROVED') {
      return fail(res, 400, 'Only an approved template can be used for invoices');
    }
    await template.save();
    await claimInvoicePurpose(template);
    return res.json({ success: true, template });
  }

  if (template.provider === 'bhashsms') {
    // A registration mirrors the BhashSMS panel; fix it freely if it was typed wrong.
    if (req.body.name !== undefined) template.name = String(req.body.name).trim();
    Object.assign(template, pickTemplateFields(req.body));
    const error = validateRegisteredTemplate(template);
    if (error) return fail(res, 400, error);
    template.variableMap = variableMapFor(template.body, Array.isArray(req.body.variableMap) ? req.body.variableMap : template.variableMap);
    if (await WhatsAppTemplate.exists({ _id: { $ne: template._id }, name: template.name })) {
      return fail(res, 409, `A template named "${template.name}" already exists`);
    }
    await template.save();
    await claimInvoicePurpose(template);
    return res.json({ success: true, template });
  }

  // Mapping positional variables of a template imported from Meta only
  // changes what we fill in, never the approved text, so it is always allowed.
  if (Array.isArray(req.body.variableMap)) {
    template.variableMap = req.body.variableMap.map((k) => (VARIABLES.includes(k) ? k : ''));
  }
  const contentChange = ['body', 'headerType', 'headerText', 'footer', 'buttons', 'category', 'language']
    .some((k) => req.body[k] !== undefined);
  if (contentChange) {
    if (['PENDING', 'APPROVED'].includes(template.metaStatus) && !provider.isDryRun()) {
      return fail(res, 400, 'This template is already with Meta — create a new one instead of editing it');
    }
    Object.assign(template, pickTemplateFields(req.body));
    const error = validateTemplate(template);
    if (error) return fail(res, 400, error);
    template.variableMap = extractVariables(template.body);
  } else if (req.body.headerMediaUrl !== undefined || req.body.displayName !== undefined) {
    Object.assign(template, pickTemplateFields(req.body));
  }
  await template.save();
  await claimInvoicePurpose(template);
  res.json({ success: true, template });
};

const buildMetaComponents = async (t) => {
  const components = [];
  if (t.headerType === 'text') {
    components.push({ type: 'HEADER', format: 'TEXT', text: t.headerText });
  } else if (['image', 'video', 'document'].includes(t.headerType)) {
    if (!t.headerMediaUrl) throw new Error('Upload a sample header file before submitting');
    if (!provider.canUploadHeaderSamples()) throw new Error('Set WHATSAPP_APP_ID in the backend .env to submit templates with a media header');
    const handle = await provider.uploadHeaderSample(provider.toWhatsAppMediaUrl(t.headerMediaUrl, t.headerType));
    components.push({ type: 'HEADER', format: t.headerType.toUpperCase(), example: { header_handle: [handle] } });
  }
  const body = { type: 'BODY', text: toPositional(t.body, t.variableMap) };
  if (t.variableMap.length) body.example = { body_text: [t.variableMap.map((k) => SAMPLE_VARS[k] || 'Sample')] };
  components.push(body);
  if (t.footer) components.push({ type: 'FOOTER', text: t.footer });
  if (t.buttons && t.buttons.length) {
    components.push({
      type: 'BUTTONS',
      buttons: t.buttons.map((b) => {
        if (b.type === 'URL') return { type: 'URL', text: b.text, url: b.url };
        if (b.type === 'PHONE_NUMBER') return { type: 'PHONE_NUMBER', text: b.text, phone_number: `+${normalizePhone(b.phoneNumber)}` };
        return { type: 'QUICK_REPLY', text: b.text };
      })
    });
  }
  return components;
};

exports.submitTemplate = async (req, res) => {
  if (provider.isBhashSms()) {
    return fail(res, 400, 'With BhashSMS, templates are created and approved on the BhashSMS panel — register the approved template here instead');
  }
  if (!provider.canManageTemplates()) {
    return fail(res, 400, 'Set WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_BUSINESS_ACCOUNT_ID in the backend .env first');
  }
  if (!isId(req.params.id)) return fail(res, 400, 'Invalid template id');
  const template = await WhatsAppTemplate.findById(req.params.id);
  if (!template) return fail(res, 404, 'Template not found');
  if (['PENDING', 'APPROVED'].includes(template.metaStatus) && !provider.isDryRun()) {
    return fail(res, 400, `Template is already ${template.metaStatus.toLowerCase()}`);
  }
  try {
    const components = await buildMetaComponents(template);
    if (template.metaTemplateId && template.metaStatus === 'REJECTED') {
      await provider.editTemplate(template.metaTemplateId, { category: template.category, components });
      template.metaStatus = 'PENDING';
    } else {
      const result = await provider.createTemplate({
        name: template.name,
        language: template.language,
        category: template.category,
        components
      });
      template.metaTemplateId = result.id || '';
      template.metaStatus = result.status || 'PENDING';
      if (result.category) template.category = result.category;
    }
    template.rejectedReason = '';
    template.lastSyncedAt = new Date();
    await template.save();
    res.json({ success: true, template });
  } catch (err) {
    fail(res, 400, err.message || 'Meta rejected the template');
  }
};

// Pull approval status from Meta, and import templates made directly in
// Meta's WhatsApp Manager so they can be used here too.
exports.syncTemplates = async (req, res) => {
  if (provider.isBhashSms()) {
    try {
      const result = await ensureBhashSync(true);
      return res.json({ success: true, ...result });
    } catch (err) {
      return fail(res, 502, err.message);
    }
  }
  if (!provider.canManageTemplates()) {
    return fail(res, 400, 'Set WHATSAPP_BUSINESS_ACCOUNT_ID (and the access token) in the backend .env first');
  }
  try {
    const remote = await provider.listTemplates();
    let updated = 0;
    let imported = 0;
    for (const r of remote) {
      const local = await WhatsAppTemplate.findOne({ $or: [{ metaTemplateId: r.id }, { name: r.name, language: r.language }] });
      if (local) {
        local.metaTemplateId = r.id;
        local.metaStatus = r.status || local.metaStatus;
        local.rejectedReason = r.rejected_reason && r.rejected_reason !== 'NONE' ? r.rejected_reason : '';
        if (r.category && ['MARKETING', 'UTILITY'].includes(r.category)) local.category = r.category;
        local.lastSyncedAt = new Date();
        await local.save();
        updated += 1;
        continue;
      }
      if (!['MARKETING', 'UTILITY'].includes(r.category)) continue; // authentication templates are not for broadcasts
      const comps = r.components || [];
      const header = comps.find((c) => c.type === 'HEADER');
      const body = comps.find((c) => c.type === 'BODY');
      const footer = comps.find((c) => c.type === 'FOOTER');
      const buttons = (comps.find((c) => c.type === 'BUTTONS') || {}).buttons || [];
      const positions = new Set((((body && body.text) || '').match(/\{\{(\d+)\}\}/g) || []));
      const headerFormat = header ? String(header.format || 'TEXT').toLowerCase() : 'none';
      if (!['none', 'text', 'image', 'video', 'document'].includes(headerFormat)) continue; // e.g. location headers
      await WhatsAppTemplate.create({
        name: r.name,
        displayName: r.name.replace(/_/g, ' '),
        language: r.language,
        category: r.category,
        headerType: headerFormat,
        headerText: header && header.text ? header.text : '',
        body: (body && body.text) || '',
        footer: (footer && footer.text) || '',
        buttons: buttons
          .filter((b) => ['QUICK_REPLY', 'URL', 'PHONE_NUMBER'].includes(b.type))
          .map((b) => ({ type: b.type, text: b.text, url: b.url || '', phoneNumber: b.phone_number || '' })),
        // Meta only knows {{1}}, {{2}}: map {{1}} to the name by default and
        // let the admin map the rest in the Templates tab.
        variableMap: Array.from({ length: positions.size }, (_v, i) => (i === 0 ? 'name' : '')),
        metaTemplateId: r.id,
        metaStatus: r.status || 'PENDING',
        lastSyncedAt: new Date(),
        createdBy: 'meta-import'
      });
      imported += 1;
    }
    res.json({ success: true, updated, imported, total: remote.length });
  } catch (err) {
    fail(res, 400, err.message || 'Could not sync templates from Meta');
  }
};

exports.deleteTemplate = async (req, res) => {
  if (!isId(req.params.id)) return fail(res, 400, 'Invalid template id');
  const template = await WhatsAppTemplate.findById(req.params.id);
  if (!template) return fail(res, 404, 'Template not found');
  try {
    if (template.metaTemplateId && provider.canManageTemplates() && req.query.local !== '1') {
      await provider.deleteTemplate(template.name);
    }
  } catch (err) {
    return fail(res, 400, `Meta refused the delete: ${err.message}. Retry, or delete locally only.`);
  }
  await template.deleteOne();
  res.json({ success: true });
};

// ── Campaigns ────────────────────────────────────────────────────────────────
const resolveRecipients = async (raw) => {
  const contacts = await getContacts();
  const byPhone = new Map(contacts.map((c) => [c.phone, c]));
  const seen = new Set();
  const out = [];
  for (const item of raw || []) {
    const phone = normalizePhone(typeof item === 'string' ? item : item && item.phone);
    if (!phone || seen.has(phone)) continue;
    seen.add(phone);
    const c = byPhone.get(phone);
    const typedName = typeof item === 'object' && item ? String(item.name || '').trim() : '';
    const name = (c && c.name) || typedName;
    out.push({
      phone,
      name,
      kind: c ? c.kind : 'manual',
      vars: c ? c.vars : { name, firstName: name.split(/\s+/)[0] || '', phone: formatPhone(phone), businessName: 'The Shine Lounge' }
    });
  }
  return out;
};

const buildCampaign = async (body, req) => {
  if (!provider.isConfigured()) {
    throw Object.assign(new Error('WhatsApp API is not configured yet — use "Send manually" or add the keys to the backend .env'), { status: 400 });
  }
  const mode = body.mode === 'freeform' ? 'freeform' : 'template';
  const media = body.media && body.media.type && body.media.type !== 'none'
    ? { type: body.media.type, url: String(body.media.url || '').trim(), filename: String(body.media.filename || '').trim() }
    : { type: 'none', url: '', filename: '' };
  if (media.type !== 'none') {
    if (!MEDIA_LIMITS[media.type]) throw Object.assign(new Error('Unsupported media type'), { status: 400 });
    if (!/^https:\/\//i.test(media.url)) {
      throw Object.assign(new Error('Media must be a public https:// link (upload it so it is stored on Cloudinary)'), { status: 400 });
    }
    if (body.media.bytes && Number(body.media.bytes) > MEDIA_LIMITS[media.type]) {
      throw Object.assign(new Error(`WhatsApp allows ${media.type} files up to ${MEDIA_LIMITS[media.type] / 1024 / 1024} MB`), { status: 400 });
    }
  }

  const doc = {
    title: String(body.title || '').trim() || `Campaign ${new Date().toLocaleString('en-IN')}`,
    mode,
    media,
    provider: provider.providerName(),
    dryRun: provider.isDryRun(),
    createdBy: actor(req)
  };

  if (mode === 'template') {
    if (!isId(body.templateId)) throw Object.assign(new Error('Choose a template'), { status: 400 });
    const t = await WhatsAppTemplate.findById(body.templateId).lean();
    if (!t) throw Object.assign(new Error('Template not found'), { status: 404 });
    if (t.metaStatus !== 'APPROVED' && !provider.isDryRun()) {
      throw Object.assign(new Error(`Template "${t.displayName || t.name}" is ${t.metaStatus.toLowerCase()} — only Meta-approved templates can be sent`), { status: 400 });
    }
    if (['image', 'video', 'document'].includes(t.headerType)) {
      const url = media.url || t.headerMediaUrl;
      if (!url) throw Object.assign(new Error(`This template needs a header ${t.headerType}`), { status: 400 });
      doc.media = { type: t.headerType, url, filename: media.filename };
    } else {
      doc.media = { type: 'none', url: '', filename: '' };
    }
    Object.assign(doc, {
      templateId: t._id,
      templateName: t.name,
      templateCategory: t.category,
      templateLanguage: t.language,
      variableMap: t.variableMap || [],
      body: t.body
    });
  } else {
    doc.body = String(body.body || '');
    if (provider.isBhashSms() && media.type !== 'none') {
      throw Object.assign(new Error('BhashSMS free-form replies are text only — send photos, videos and PDFs with a template that has a media header'), { status: 400 });
    }
    if (!doc.body.trim() && media.type === 'none') throw Object.assign(new Error('Write a message or attach media'), { status: 400 });
    if (doc.body.length > 4096) throw Object.assign(new Error('Message must be 4096 characters or fewer'), { status: 400 });
  }

  if (doc.media && doc.media.type === 'document' && doc.media.url) {
    const unreachable = await provider.checkPublicDocument(doc.media.url);
    if (unreachable) throw Object.assign(new Error(unreachable), { status: 424 });
  }

  const recipients = await resolveRecipients(body.recipients);
  if (!recipients.length) throw Object.assign(new Error('Select at least one valid phone number'), { status: 400 });
  if (recipients.length > MAX_RECIPIENTS) throw Object.assign(new Error(`At most ${MAX_RECIPIENTS} recipients per campaign`), { status: 400 });
  doc.recipients = recipients;

  if (body.scheduledAt) {
    const at = new Date(body.scheduledAt);
    if (isNaN(at.getTime())) throw Object.assign(new Error('Invalid schedule time'), { status: 400 });
    doc.scheduledAt = at;
  } else {
    doc.scheduledAt = new Date();
  }
  return doc;
};

exports.createCampaign = async (req, res) => {
  try {
    const doc = await buildCampaign(req.body || {}, req);
    const campaign = await WhatsAppCampaign.create(doc);
    if (campaign.scheduledAt <= new Date()) await kick(campaign._id);
    res.status(201).json({ success: true, campaign: { _id: campaign._id, title: campaign.title, total: campaign.recipients.length } });
  } catch (err) {
    fail(res, err.status || 500, err.message);
  }
};

exports.sendTest = async (req, res) => {
  const phone = normalizePhone(req.body && req.body.phone);
  if (!phone) return fail(res, 400, 'Enter a valid test number');
  req.body.recipients = [{ phone, name: req.body.name || 'Test' }];
  req.body.title = `Test — ${formatPhone(phone)}`;
  req.body.scheduledAt = null;
  return exports.createCampaign(req, res);
};

const STATUS_KEYS = ['queued', 'sending', 'sent', 'delivered', 'read', 'failed', 'skipped'];

exports.listCampaigns = async (req, res) => {
  const countFields = {};
  for (const s of STATUS_KEYS) {
    countFields[s] = { $size: { $filter: { input: '$recipients', cond: { $eq: ['$$this.status', s] } } } };
  }
  const campaigns = await WhatsAppCampaign.aggregate([
    { $sort: { createdAt: -1 } },
    { $limit: Math.min(Number(req.query.limit) || 100, 500) },
    {
      $project: {
        title: 1, source: 1, invoiceNo: 1, provider: 1, mode: 1, status: 1, templateName: 1, body: 1, media: 1, scheduledAt: 1,
        startedAt: 1, completedAt: 1, createdAt: 1, createdBy: 1, dryRun: 1,
        total: { $size: '$recipients' },
        counts: countFields
      }
    }
  ]);
  res.json({ success: true, campaigns });
};

exports.getCampaign = async (req, res) => {
  if (!isId(req.params.id)) return fail(res, 400, 'Invalid campaign id');
  let campaign = await WhatsAppCampaign.findById(req.params.id).lean();
  if (!campaign) return fail(res, 404, 'Campaign not found');
  // Watching a campaign keeps it moving on serverless hosts with no interval.
  if (['queued', 'sending'].includes(campaign.status) && new Date(campaign.scheduledAt) <= new Date() && process.env.VERCEL) {
    await kick(campaign._id);
    campaign = await WhatsAppCampaign.findById(req.params.id).lean();
  }
  const counts = Object.fromEntries(STATUS_KEYS.map((s) => [s, 0]));
  for (const r of campaign.recipients) counts[r.status] = (counts[r.status] || 0) + 1;
  res.json({ success: true, campaign: { ...campaign, total: campaign.recipients.length, counts } });
};

exports.cancelCampaign = async (req, res) => {
  if (!isId(req.params.id)) return fail(res, 400, 'Invalid campaign id');
  const campaign = await WhatsAppCampaign.findOneAndUpdate(
    { _id: req.params.id, status: { $in: ['queued', 'sending'] } },
    { $set: { status: 'cancelled', completedAt: new Date() } },
    { returnDocument: 'after' }
  );
  if (!campaign) return fail(res, 400, 'Only a queued or sending campaign can be cancelled');
  await WhatsAppCampaign.updateOne(
    { _id: campaign._id },
    { $set: { 'recipients.$[r].status': 'skipped', 'recipients.$[r].error': 'Campaign cancelled' } },
    { arrayFilters: [{ 'r.status': 'queued' }] }
  );
  res.json({ success: true });
};

exports.retryCampaign = async (req, res) => {
  if (!isId(req.params.id)) return fail(res, 400, 'Invalid campaign id');
  if (!provider.isConfigured()) return fail(res, 400, 'WhatsApp API is not configured');
  const campaign = await WhatsAppCampaign.findById(req.params.id).select('status recipients.status').lean();
  if (!campaign) return fail(res, 404, 'Campaign not found');
  if (['queued', 'sending'].includes(campaign.status)) return fail(res, 400, 'Campaign is still sending');
  const failed = campaign.recipients.filter((r) => r.status === 'failed').length;
  if (!failed) return fail(res, 400, 'No failed recipients to retry');
  await WhatsAppCampaign.updateOne(
    { _id: campaign._id },
    {
      $set: {
        status: 'queued', completedAt: null, lockedUntil: null, scheduledAt: new Date(),
        'recipients.$[r].status': 'queued', 'recipients.$[r].error': ''
      }
    },
    { arrayFilters: [{ 'r.status': 'failed' }] }
  );
  await kick(campaign._id);
  res.json({ success: true, retried: failed });
};

exports.deleteCampaign = async (req, res) => {
  if (!isId(req.params.id)) return fail(res, 400, 'Invalid campaign id');
  const result = await WhatsAppCampaign.deleteOne({ _id: req.params.id, status: { $nin: ['sending'] } });
  if (!result.deletedCount) return fail(res, 400, 'Campaign not found, or still sending (cancel it first)');
  res.json({ success: true });
};
