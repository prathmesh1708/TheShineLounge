const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/authMiddleware');
const { staffOnly, adminOnly } = require('../../middleware/roleMiddleware');
const controller = require('./controller');

// The listing is an audit view (it includes every declined card), so it stays
// with the admins; the counter only needs the three payment calls.
router.get('/status', authMiddleware, staffOnly, controller.getStatus);
router.get('/', authMiddleware, adminOnly, controller.list);
router.post('/initiate', authMiddleware, staffOnly, controller.initiate);
router.get('/:txnRef', authMiddleware, staffOnly, controller.getTransaction);
router.post('/:txnRef/cancel', authMiddleware, staffOnly, controller.cancel);

module.exports = router;
