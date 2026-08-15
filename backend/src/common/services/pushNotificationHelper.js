const { sendPushNotification } = require('./firebaseAdmin');
const User = require('../../models/User');

/**
 * Send push notification to a specific user by User ID
 * @param {string} userId - User Mongo ID
 * @param {Object} payload - { title, body, data }
 * @param {boolean} includeMobile - Whether to include mobile tokens
 */
async function sendNotificationToUser(userId, payload, includeMobile = true) {
  try {
    const user = await User.findById(userId);
    if (!user) {
      console.warn(`User ${userId} not found for push notification.`);
      return;
    }

    let tokens = [];
    if (user.fcmTokens && Array.isArray(user.fcmTokens)) {
      tokens = [...tokens, ...user.fcmTokens];
    }
    if (includeMobile && user.fcmTokenMobile && Array.isArray(user.fcmTokenMobile)) {
      tokens = [...tokens, ...user.fcmTokenMobile];
    }

    const uniqueTokens = [...new Set(tokens.filter(Boolean))];
    if (uniqueTokens.length === 0) {
      return;
    }

    await sendPushNotification(uniqueTokens, payload);
  } catch (error) {
    console.error('Error sending user push notification:', error.message);
  }
}

/**
 * Send push notification to all registered users (Broadcast)
 * @param {Object} payload - { title, body, data }
 */
async function sendNotificationToAll(payload) {
  try {
    const users = await User.find({
      $or: [
        { 'fcmTokens.0': { $exists: true } },
        { 'fcmTokenMobile.0': { $exists: true } }
      ]
    }).select('fcmTokens fcmTokenMobile');

    let allTokens = [];
    for (const user of users) {
      if (user.fcmTokens) allTokens.push(...user.fcmTokens);
      if (user.fcmTokenMobile) allTokens.push(...user.fcmTokenMobile);
    }

    const uniqueTokens = [...new Set(allTokens.filter(Boolean))];
    if (uniqueTokens.length === 0) {
      return;
    }

    await sendPushNotification(uniqueTokens, payload);
  } catch (error) {
    console.error('Error broadcasting push notification:', error.message);
  }
}

/**
 * Send push notification to users with a specific role (e.g. 'staff', 'admin')
 * @param {string} role - 'admin' | 'staff' | 'user'
 * @param {Object} payload - { title, body, data }
 */
async function sendNotificationToRole(role, payload) {
  try {
    const users = await User.find({
      role,
      $or: [
        { 'fcmTokens.0': { $exists: true } },
        { 'fcmTokenMobile.0': { $exists: true } }
      ]
    }).select('fcmTokens fcmTokenMobile');

    let tokens = [];
    for (const user of users) {
      if (user.fcmTokens) tokens.push(...user.fcmTokens);
      if (user.fcmTokenMobile) tokens.push(...user.fcmTokenMobile);
    }

    const uniqueTokens = [...new Set(tokens.filter(Boolean))];
    if (uniqueTokens.length === 0) return;

    await sendPushNotification(uniqueTokens, payload);
  } catch (error) {
    console.error(`Error sending push notification to role ${role}:`, error.message);
  }
}

module.exports = {
  sendNotificationToUser,
  sendNotificationToAll,
  sendNotificationToRole
};
