const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { saveFcmToken, removeFcmToken } = require('../controllers/fcmTokenController');

// Save FCM token for web or mobile
router.post('/save', authMiddleware, saveFcmToken);
router.post('/mobile/save', authMiddleware, saveFcmToken);

// Remove FCM token on logout
router.post('/remove', authMiddleware, removeFcmToken);
router.delete('/remove', authMiddleware, removeFcmToken);

module.exports = router;
