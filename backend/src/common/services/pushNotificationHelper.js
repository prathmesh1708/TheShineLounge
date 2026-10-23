const { sendPushNotification } = require('./firebaseAdmin');
const User = require('../../models/User');
const Admin = require('../../models/Admin');
const Staff = require('../../models/Staff');
const { findAccountById } = require('../../utils/findAccount');

const TOKEN_FILTER = {
  $or: [
    { 'fcmTokens.0': { $exists: true } },
    { 'fcmTokenMobile.0': { $exists: true } }
  ]
};

// Role -> collection(s) holding that role's accounts.
const modelsForRole = (role) => {
  if (role === 'staff') return [Staff];
  if (role === 'admin') return [Admin];
  return [User];
};

/**
 * Send push notification to a specific user by User ID
 * @param {string} userId - User Mongo ID
 * @param {Object} payload - { title, body, data }
 * @param {boolean} includeMobile - Whether to include mobile tokens
 */
async function sendNotificationToUser(userId, payload, includeMobile = true) {
  try {
    const user = await findAccountById(userId);
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
    const users = (await Promise.all(
      [User, Staff, Admin].map((M) => M.find(TOKEN_FILTER).select('fcmTokens fcmTokenMobile'))
    )).flat();

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
    const users = (await Promise.all(
      modelsForRole(role).map((M) => M.find({ ...TOKEN_FILTER, role }).select('fcmTokens fcmTokenMobile'))
    )).flat();

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
