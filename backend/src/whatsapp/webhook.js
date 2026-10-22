const express = require('express');
const env = require('../common/config/env');
const WhatsAppCampaign = require('../models/WhatsAppCampaign');
const WhatsAppContactPref = require('../models/WhatsAppContactPref');
const provider = require('./provider');
const { normalizePhone } = require('./phone');
const { invalidateContacts } = require('./contacts');

// Meta calls this for delivery receipts and for messages people send to the
// business number. Mounted ahead of the global JSON parser (see server.js):
// the X-Hub-Signature-256 check is over the exact request bytes.

const router = express.Router();
router.use(express.json({
  limit: '5mb',
  verify: (req, _res, buf) => { req.rawBody = buf.toString('utf8'); }
}));

// Statuses only move forward; webhooks can arrive out of order.
const EARLIER = {
  delivered: ['sending', 'sent'],
  read: ['sending', 'sent', 'delivered']
};
const STOP_WORDS = /^\s*(stop|unsubscribe|stop all|opt ?out)\s*[.!]*\s*$/i;
const START_WORDS = /^\s*(start|subscribe|opt ?in|yes)\s*[.!]*\s*$/i;

const applyStatus = async (s) => {
  if (!s || !s.id || !s.status) return;
  const at = s.timestamp ? new Date(Number(s.timestamp) * 1000) : new Date();

  if (s.status === 'failed') {
    const e = (s.errors && s.errors[0]) || {};
    const message = (e.error_data && e.error_data.details) || e.message || e.title || 'Delivery failed';
    await WhatsAppCampaign.updateOne(
      { 'recipients.waMessageId': s.id },
      { $set: { 'recipients.$.status': 'failed', 'recipients.$.error': message } }
    );
    return;
  }
  const earlier = EARLIER[s.status];
  if (!earlier) return; // 'sent' is already recorded by the sender
  await WhatsAppCampaign.updateOne(
    { recipients: { $elemMatch: { waMessageId: s.id, status: { $in: earlier } } } },
    { $set: { 'recipients.$.status': s.status, [`recipients.$.${s.status === 'read' ? 'readAt' : 'deliveredAt'}`]: at } }
  );
};

const inboundText = (m) => {
  if (m.text && m.text.body) return m.text.body;
  if (m.button && m.button.text) return m.button.text;
  if (m.interactive) {
    const r = m.interactive.button_reply || m.interactive.list_reply;
    if (r && r.title) return r.title;
  }
  return `[${m.type || 'message'}]`;
};

const applyInbound = async (m, contacts) => {
  const phone = normalizePhone(m.from) || String(m.from || '');
  if (!phone) return;
  const text = inboundText(m);
  const profile = (contacts || []).find((c) => c.wa_id === m.from);
  const at = m.timestamp ? new Date(Number(m.timestamp) * 1000) : new Date();

  const $set = { lastInboundAt: at, lastInboundText: String(text).slice(0, 500) };
  if (profile && profile.profile && profile.profile.name) $set.profileName = profile.profile.name;
  if (STOP_WORDS.test(text)) {
    Object.assign($set, { optedOut: true, optedOutAt: at, optIn: false });
  } else if (START_WORDS.test(text)) {
    Object.assign($set, { optedOut: false, optedOutAt: null, optIn: true, optInAt: at, optInSource: 'whatsapp_reply' });
  }
  await WhatsAppContactPref.updateOne({ phone }, { $set }, { upsert: true });
};

// Meta's one-time handshake when the callback URL is saved.
router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  if (mode === 'subscribe' && env.WHATSAPP_WEBHOOK_VERIFY_TOKEN && token === env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    return res.status(200).send(String(req.query['hub.challenge'] || ''));
  }
  return res.sendStatus(403);
});

router.post('/', async (req, res) => {
  if (!provider.verifySignature(req.rawBody, req.get('x-hub-signature-256'))) {
    return res.sendStatus(env.WHATSAPP_APP_SECRET ? 401 : 403);
  }
  try {
    let inbound = 0;
    for (const entry of (req.body && req.body.entry) || []) {
      for (const change of entry.changes || []) {
        const value = change.value || {};
        for (const s of value.statuses || []) await applyStatus(s);
        for (const m of value.messages || []) {
          await applyInbound(m, value.contacts);
          inbound += 1;
        }
      }
    }
    if (inbound) invalidateContacts();
  } catch (err) {
    // Still 200: a non-2xx makes Meta retry the same batch for days.
    console.warn('WhatsApp webhook processing failed:', err.message);
  }
  return res.sendStatus(200);
});

module.exports = router;
module.exports.applyStatus = applyStatus;
module.exports.applyInbound = applyInbound;
