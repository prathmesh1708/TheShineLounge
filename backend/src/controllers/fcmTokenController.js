const User = require('../models/User');

/**
 * Save FCM Token for the logged-in user
 * @route POST /api/fcm-tokens/save
 * @access Private
 */
const saveFcmToken = async (req, res) => {
  try {
    const { token, platform = 'web' } = req.body;
    const userId = req.user?._id || req.user?.id;

    if (!token) {
      return res.status(400).json({ success: false, message: 'FCM token is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (platform === 'web') {
      if (!user.fcmTokens) user.fcmTokens = [];
      if (!user.fcmTokens.includes(token)) {
        user.fcmTokens.push(token);
        // Limit to 10 tokens per user
        if (user.fcmTokens.length > 10) {
          user.fcmTokens = user.fcmTokens.slice(-10);
        }
      }
    } else if (platform === 'mobile') {
      if (!user.fcmTokenMobile) user.fcmTokenMobile = [];
      if (!user.fcmTokenMobile.includes(token)) {
        user.fcmTokenMobile.push(token);
        if (user.fcmTokenMobile.length > 10) {
          user.fcmTokenMobile = user.fcmTokenMobile.slice(-10);
        }
      }
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'FCM token registered successfully',
      platform
    });
  } catch (error) {
    console.error('Error saving FCM token:', error);
    res.status(500).json({ success: false, message: 'Failed to save FCM token' });
  }
};

/**
 * Remove FCM Token on logout
 * @route POST /api/fcm-tokens/remove
 * @access Private
 */
const removeFcmToken = async (req, res) => {
  try {
    const { token, platform = 'web' } = req.body;
    const userId = req.user?._id || req.user?.id;

    if (!token) {
      return res.status(400).json({ success: false, message: 'Token is required' });
    }

    const user = await User.findById(userId);
    if (user) {
      if (platform === 'web' && user.fcmTokens) {
        user.fcmTokens = user.fcmTokens.filter((t) => t !== token);
      } else if (platform === 'mobile' && user.fcmTokenMobile) {
        user.fcmTokenMobile = user.fcmTokenMobile.filter((t) => t !== token);
      }
      await user.save();
    }

    res.status(200).json({ success: true, message: 'FCM token removed successfully' });
  } catch (error) {
    console.error('Error removing FCM token:', error);
    res.status(500).json({ success: false, message: 'Failed to remove FCM token' });
  }
};

module.exports = {
  saveFcmToken,
  removeFcmToken
};
