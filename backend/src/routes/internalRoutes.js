const express = require('express');
const crypto = require('crypto');
const { BREAK_CRON_SECRET } = require('../common/config/env');
const { runBreakSchedulerTick } = require('../services/breakScheduler');

const router = express.Router();

// Machine-to-machine endpoints. Not behind JWT auth: an external cron service
// authenticates with a shared secret header instead.

const secretMatches = (provided) => {
  const a = Buffer.from(String(provided || ''));
  const b = Buffer.from(BREAK_CRON_SECRET);
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

module.exports = router;
