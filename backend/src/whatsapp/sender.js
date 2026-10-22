// Works queued WhatsApp campaigns a batch at a time. A campaign is never sent
// inside the HTTP request that created it: on Vercel that request would be
// killed part-way through a large list. Instead:
//   * a 15s setInterval drives it under PM2 / `npm start`,
//   * POST /api/internal/whatsapp/tick drives it from an external cron, and
//   * creating or watching a campaign runs one batch inline, so a small send
//     finishes immediately and a watched one keeps moving even when serverless.
// Every recipient is claimed with a conditional update (queued -> sending)
// and every campaign with an expiring lock, so overlapping ticks never send
// the same message twice.

const env = require('../common/config/env');
const WhatsAppCampaign = require('../models/WhatsAppCampaign');
const WhatsAppContactPref = require('../models/WhatsAppContactPref');
const provider = require('./provider');
const { renderText, valueFor, extractVariables } = require('./render');

const TICK_MS = 15 * 1000;
const LOCK_MS = 5 * 60 * 1000;
// Stop taking new recipients after this long so one tick stays well inside a
// serverless function's time limit; the rest go out on the next tick.
const BATCH_TIME_BUDGET_MS = 45 * 1000;
const SERVICE_WINDOW_MS = 24 * 60 * 60 * 1000;
const CAPTION_MAX = 1024;
// Meta throughput / pair-rate limit errors: retry later rather than fail.
const RATE_LIMIT_CODES = new Set([130429, 131056, 80007]);

const mediaObject = (media) => {
  const link = provider.toWhatsAppMediaUrl(media.url, media.type);
  const obj = { link };
  if (media.type === 'document' && media.filename) obj.filename = media.filename;
  return obj;
};

const buildTemplateMessage = (campaign, recipient) => {
  const components = [];
  const media = campaign.media || {};
  if (['image', 'video', 'document'].includes(media.type) && media.url) {
    components.push({ type: 'header', parameters: [{ type: media.type, [media.type]: mediaObject(media) }] });
  }
  if (campaign.variableMap && campaign.variableMap.length) {
    components.push({
      type: 'body',
      parameters: campaign.variableMap.map((key) => ({ type: 'text', text: valueFor(recipient.vars, key) }))
    });
  }
  return {
    type: 'template',
    template: {
      name: campaign.templateName,
      language: { code: campaign.templateLanguage || 'en' },
      ...(components.length ? { components } : {})
    }
  };
};

// A free-form send can be several WhatsApp messages: audio carries no caption,
// and a caption longer than WhatsApp allows goes as its own text message.
const buildFreeformMessages = (campaign, recipient) => {
  const text = renderText(campaign.body, recipient.vars).trim();
  const media = campaign.media || {};
  const messages = [];

  if (media.type && media.type !== 'none' && media.url) {
    const obj = mediaObject(media);
    const captionFits = media.type !== 'audio' && text && text.length <= CAPTION_MAX;
    if (captionFits) obj.caption = text;
    messages.push({ type: media.type, [media.type]: obj });
    if (text && !captionFits) messages.push({ type: 'text', text: { body: text, preview_url: true } });
  } else if (text) {
    messages.push({ type: 'text', text: { body: text, preview_url: true } });
  }
  return messages;
};

// ── BhashSMS ─────────────────────────────────────────────────────────────────
// One GET carries one Params list for every number in it, so a personalised
// message is one call per person while an identical one goes out in groups.
const bhashMedia = (campaign) => {
  const media = campaign.media || {};
  return ['image', 'video', 'document'].includes(media.type) && media.url
    ? { type: media.type, url: provider.toWhatsAppMediaUrl(media.url, media.type) }
    : null;
};

const isPersonalised = (campaign) => (campaign.mode === 'template'
  ? (campaign.variableMap || []).some(Boolean)
  : extractVariables(campaign.body).length > 0);

const bhashSend = (campaign, phones, vars = {}) => (campaign.mode === 'template'
  ? provider.bhashsms.sendTemplate({
    phones,
    templateName: campaign.templateName,
    category: campaign.templateCategory,
    params: (campaign.variableMap || []).map((key) => valueFor(vars, key)),
    media: bhashMedia(campaign)
  })
  : provider.bhashsms.sendText({ phones, text: renderText(campaign.body, vars).trim() }));

// Returns a reason to skip this recipient, or '' when they may be messaged.
const skipReason = (campaign, pref, now, phone = '') => {
  if (pref && pref.optedOut) return 'Opted out of WhatsApp messages';
  if (env.WHATSAPP_REQUIRE_OPT_IN && !(pref && pref.optIn)) return 'Not opted in';
  if (provider.isBhashSms()) {
    if (phone && !provider.bhashsms.localNumber(phone)) return 'BhashSMS only sends to Indian (+91) mobile numbers';
    // BhashSMS does not tell us who replied, so the 24h rule is left to WhatsApp.
    return '';
  }
  if (campaign.mode === 'freeform') {
    const last = pref && pref.lastInboundAt ? new Date(pref.lastInboundAt).getTime() : 0;
    if (!last || now.getTime() - last > SERVICE_WINDOW_MS) {
      return 'Outside the 24-hour window (no message from them in the last 24h) — use an approved template';
    }
  }
  return '';
};

const setRecipient = (campaignId, recipientId, fields) => {
  const $set = {};
  for (const [k, v] of Object.entries(fields)) $set[`recipients.$.${k}`] = v;
  return WhatsAppCampaign.updateOne({ _id: campaignId, 'recipients._id': recipientId }, { $set });
};

const claimCampaign = (now, campaignId) => {
  const filter = {
    status: { $in: ['queued', 'sending'] },
    scheduledAt: { $lte: now },
    $or: [{ lockedUntil: null }, { lockedUntil: { $lte: now } }]
  };
  if (campaignId) filter._id = campaignId;
  return WhatsAppCampaign.findOneAndUpdate(
    filter,
    { $set: { status: 'sending', lockedUntil: new Date(now.getTime() + LOCK_MS) } },
    { returnDocument: 'after', sort: { scheduledAt: 1 } }
  );
};

const processCampaign = async (campaign, now) => {
  const summary = { campaignId: String(campaign._id), sent: 0, failed: 0, skipped: 0 };
  const started = Date.now();

  if (!campaign.startedAt) {
    await WhatsAppCampaign.updateOne({ _id: campaign._id }, { $set: { startedAt: now } });
  }

  // We hold the lock, so anything still "sending" is from a run that died
  // mid-send. Whether Meta got it is unknown; let the admin decide to retry.
  const interrupted = campaign.recipients.filter((r) => r.status === 'sending');
  for (const r of interrupted) {
    await setRecipient(campaign._id, r._id, { status: 'failed', error: 'Interrupted while sending — use "Retry failed"' });
  }

  const batch = campaign.recipients.filter((r) => r.status === 'queued').slice(0, env.WHATSAPP_SEND_BATCH);
  const prefs = await WhatsAppContactPref.find({ phone: { $in: batch.map((r) => r.phone) } }).lean();
  const prefByPhone = new Map(prefs.map((p) => [p.phone, p]));
  let rateLimited = false;
  const bhash = provider.isBhashSms();
  const grouped = bhash && !isPersonalised(campaign);
  const group = [];

  const flushGroup = async () => {
    if (!group.length) return;
    const members = group.splice(0, group.length);
    try {
      const { messageId, raw } = await bhashSend(campaign, members.map((r) => r.phone));
      for (const r of members) {
        await setRecipient(campaign._id, r._id, { status: 'sent', waMessageId: messageId || '', providerResponse: raw || '', error: '', sentAt: new Date() });
      }
      summary.sent += members.length;
    } catch (err) {
      for (const r of members) {
        await setRecipient(campaign._id, r._id, { status: 'failed', error: err.message || 'Send failed', providerResponse: err.raw || '' });
      }
      summary.failed += members.length;
    }
  };

  for (const recipient of batch) {
    if (Date.now() - started > BATCH_TIME_BUDGET_MS) break;

    const claimed = await WhatsAppCampaign.updateOne(
      { _id: campaign._id, recipients: { $elemMatch: { _id: recipient._id, status: 'queued' } } },
      { $set: { 'recipients.$.status': 'sending' } }
    );
    if (!claimed.modifiedCount) continue;

    const reason = skipReason(campaign, prefByPhone.get(recipient.phone), now, recipient.phone);
    if (reason) {
      await setRecipient(campaign._id, recipient._id, { status: 'skipped', error: reason });
      summary.skipped += 1;
      continue;
    }

    if (grouped) {
      group.push(recipient);
      if (group.length >= env.BHASHSMS_MAX_NUMBERS_PER_CALL) await flushGroup();
      continue;
    }

    if (bhash) {
      try {
        const { messageId, raw } = await bhashSend(campaign, [recipient.phone], recipient.vars);
        await setRecipient(campaign._id, recipient._id, { status: 'sent', waMessageId: messageId || '', providerResponse: raw || '', error: '', sentAt: new Date() });
        summary.sent += 1;
      } catch (err) {
        await setRecipient(campaign._id, recipient._id, { status: 'failed', error: err.message || 'Send failed', providerResponse: err.raw || '' });
        summary.failed += 1;
      }
      continue;
    }

    try {
      const messages = campaign.mode === 'template'
        ? [buildTemplateMessage(campaign, recipient)]
        : buildFreeformMessages(campaign, recipient);
      if (!messages.length) throw new Error('Nothing to send — the message is empty');

      let firstId = '';
      for (const message of messages) {
        const { messageId } = await provider.sendMessage(recipient.phone, message);
        if (!firstId) firstId = messageId || '';
      }
      await setRecipient(campaign._id, recipient._id, { status: 'sent', waMessageId: firstId, error: '', sentAt: new Date() });
      summary.sent += 1;
    } catch (err) {
      if (RATE_LIMIT_CODES.has(err.code)) {
        await setRecipient(campaign._id, recipient._id, { status: 'queued' });
        rateLimited = true;
        break;
      }
      await setRecipient(campaign._id, recipient._id, { status: 'failed', error: err.message || 'Send failed' });
      summary.failed += 1;
    }
  }
  await flushGroup();

  const fresh = await WhatsAppCampaign.findById(campaign._id).select('recipients.status status').lean();
  const pending = (fresh.recipients || []).some((r) => r.status === 'queued' || r.status === 'sending');
  const update = { lockedUntil: null };
  if (fresh.status === 'cancelled') {
    // Cancelled while this batch ran — leave it cancelled.
  } else if (!pending) {
    const anySent = (fresh.recipients || []).some((r) => ['sent', 'delivered', 'read'].includes(r.status));
    update.status = anySent || !(fresh.recipients || []).length ? 'done' : 'failed';
    update.completedAt = new Date();
  } else if (rateLimited) {
    // Back off a minute before the next attempt.
    update.lockedUntil = new Date(Date.now() + 60 * 1000);
  }
  await WhatsAppCampaign.updateOne({ _id: campaign._id }, { $set: update });
  summary.remaining = pending;
  return summary;
};

const runWhatsAppSenderTick = async (now = new Date(), { campaignId } = {}) => {
  if (!provider.isConfigured()) return { processed: 0, reason: 'WhatsApp API not configured' };
  const campaign = await claimCampaign(now, campaignId);
  if (!campaign) return { processed: 0 };
  const summary = await processCampaign(campaign, now);
  return { processed: 1, ...summary };
};

let timer = null;
let running = false;

const startWhatsAppSender = () => {
  if (timer) return;
  timer = setInterval(async () => {
    if (running) return;
    running = true;
    try {
      await runWhatsAppSenderTick(new Date());
    } catch (err) {
      console.warn('WhatsApp sender tick failed:', err.message);
    } finally {
      running = false;
    }
  }, TICK_MS);
  if (timer.unref) timer.unref();
  console.log('WhatsApp campaign sender started');
};

const stopWhatsAppSender = () => {
  if (timer) clearInterval(timer);
  timer = null;
};

module.exports = {
  runWhatsAppSenderTick,
  startWhatsAppSender,
  stopWhatsAppSender,
  buildTemplateMessage,
  buildFreeformMessages,
  skipReason
};
