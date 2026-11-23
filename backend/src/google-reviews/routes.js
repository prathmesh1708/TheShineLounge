const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { adminOnly, staffOnly } = require('../middleware/roleMiddleware');
const c = require('./controller');

// Express 4 does not catch a rejected async handler; route it to the error handler.
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// ── /api/google-reviews ─────────────────────────────────────────────────────
// Reading mirrors the feedback inbox (staff and admins). Anything that changes
// what the public sees on Google, or the connection itself, is admin-only.
const router = express.Router();
router.use(express.json({ limit: '64kb' }), authMiddleware);

router.get('/status', staffOnly, wrap(c.getStatus));
router.get('/', staffOnly, wrap(c.listReviews));
router.get('/auth-url', adminOnly, wrap(c.getAuthUrl));
router.get('/locations', adminOnly, wrap(c.getLocations));
router.put('/location', adminOnly, wrap(c.selectLocation));
router.post('/sync', adminOnly, wrap(c.syncNow));
router.put('/:reviewId/reply', adminOnly, wrap(c.putReply));
router.delete('/:reviewId/reply', adminOnly, wrap(c.deleteReply));
router.delete('/connection', adminOnly, wrap(c.disconnect));

// ── /api/integrations/google ───────────────────────────────────────────────
// The OAuth redirect target registered in Google Cloud. No JWT: Google sends
// the browser here, and the signed `state` authenticates it.
const oauthRouter = express.Router();
oauthRouter.get('/callback', wrap(c.oauthCallback));

module.exports = { router, oauthRouter };
