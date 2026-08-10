const express = require('express');

const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { staffOnly, adminOnly } = require('../middleware/roleMiddleware');
const controller = require('./integrations.controller');
const {
  authenticateDevice,
  validateEventBatch
} = require('./integrations.middleware');

// The HMAC is computed over the exact bytes the device sent, so the raw body has
// to be captured before express.json() reformats it. A parser mounted here
// rather than globally keeps that cost on this router alone.
const deviceBodyParser = express.json({
  limit: '2mb',
  verify: (req, res, buf) => {
    req.rawBody = buf.toString('utf8');
  }
});

// ── device-facing (API key + HMAC, no user session) ────────────────────────
router.post(
  '/events',
  deviceBodyParser,
  authenticateDevice,
  validateEventBatch,
  controller.ingestEvents
);
router.get('/health', authenticateDevice, controller.health);

// ── operator-facing (normal JWT session) ───────────────────────────────────
// Parses its own body rather than depending on a parser mounted globally in
// server.js — the router has to work wherever it is mounted.
const jsonBody = express.json({ limit: '256kb' });

router.get('/sessions', authMiddleware, staffOnly, controller.listSessions);
router.get('/unmatched', authMiddleware, staffOnly, controller.listUnmatched);
router.post('/sessions/:id/attach', jsonBody, authMiddleware, staffOnly, controller.attachCustomer);
router.get('/customers/:id/usage', authMiddleware, staffOnly, controller.customerUsage);
router.get('/events', authMiddleware, adminOnly, controller.listEvents);

module.exports = router;
