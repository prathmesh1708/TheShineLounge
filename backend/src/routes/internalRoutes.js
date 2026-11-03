const express = require('express');
const crypto = require('crypto');
const { BREAK_CRON_SECRET, WHATSAPP_CRON_SECRET } = require('../common/config/env');
const { runBreakSchedulerTick } = require('../services/breakScheduler');
const { runWhatsAppSenderTick } = require('../whatsapp/sender');
const { runSalonReminderTick } = require('../whatsapp/salonReminder');

const router = express.Router();

// Machine-to-machine endpoints. Not behind JWT auth: an external cron service
// authenticates with a shared secret header instead.

const secretMatches = (provided, expected = BREAK_CRON_SECRET) => {
  const a = Buffer.from(String(provided || ''));
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

// One scheduler tick, for serverless deployments where setInterval does not
// survive between requests. Hit it every minute from cron-job.org, GitHub
// Actions or similar.
router.post('/break-scheduler/tick', async (req, res) => {
  // With no secret configured the endpoint does not exist.
  if (!BREAK_CRON_SECRET) return res.status(404).json({ success: false, message: 'Not found' });
  if (!secretMatches(req.headers['x-cron-secret'])) {
    return res.status(401).json({ success: false, message: 'Invalid cron secret' });
  }
  try {
    const summary = await runBreakSchedulerTick(new Date());
    return res.status(200).json({ success: true, ...summary });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Scheduler tick failed' });
  }
});

// One WhatsApp campaign batch, for serverless deployments. Same cron, same
// header; WHATSAPP_CRON_SECRET falls back to BREAK_CRON_SECRET.
router.post('/whatsapp/tick', async (req, res) => {
  if (!WHATSAPP_CRON_SECRET) return res.status(404).json({ success: false, message: 'Not found' });
  if (!secretMatches(req.headers['x-cron-secret'], WHATSAPP_CRON_SECRET)) {
    return res.status(401).json({ success: false, message: 'Invalid cron secret' });
  }
  try {
    const summary = await runWhatsAppSenderTick(new Date());
    return res.status(200).json({ success: true, ...summary });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'WhatsApp tick failed' });
  }
});

// Salon booking reminders, for serverless deployments. Needs a per-minute
// cron; uses the WhatsApp cron secret.
router.post('/salon-reminders/tick', async (req, res) => {
  if (!WHATSAPP_CRON_SECRET) return res.status(404).json({ success: false, message: 'Not found' });
  if (!secretMatches(req.headers['x-cron-secret'], WHATSAPP_CRON_SECRET)) {
    return res.status(401).json({ success: false, message: 'Invalid cron secret' });
  }
  try {
    const summary = await runSalonReminderTick(new Date());
    return res.status(200).json({ success: true, ...summary });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Salon reminder tick failed' });
  }
});

module.exports = router;
