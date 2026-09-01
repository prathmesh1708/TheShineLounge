const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');
const { FIREBASE_SERVICE_ACCOUNT_PATH } = require('../config/env');

let isFirebaseInitialized = false;

try {
  let credential;

  const certFn = admin.cert || (admin.credential && admin.credential.cert);

  if (process.env.FIREBASE_CONFIG) {
    // Option A: Full JSON string in environment variable
    const serviceAccountJson = JSON.parse(process.env.FIREBASE_CONFIG);
    if (typeof certFn === 'function') {
      credential = certFn(serviceAccountJson);
    }
  } else {
    // Option B: File Path
    const resolvedPath = path.resolve(__dirname, '../../../', FIREBASE_SERVICE_ACCOUNT_PATH);
    if (fs.existsSync(resolvedPath)) {
      const serviceAccount = require(resolvedPath);
      if (typeof certFn === 'function') {
        credential = certFn(serviceAccount);
      }
    }
  }

  if (credential) {
    admin.initializeApp({ credential });
    isFirebaseInitialized = true;
    console.log('✅ Firebase Admin SDK initialized successfully.');
  } else {
    console.warn('⚠️ Firebase service account file not found. Push notifications will operate in mock mode.');
  }
} catch (error) {
  console.warn(`⚠️ Firebase Admin initialization notice: ${error.message}. Running push notifications in safe fallback mode.`);
}

/**
 * Send Multicast Push Notification to Array of FCM Tokens
 * @param {string[]} tokens - Array of FCM target tokens
 * @param {Object} payload - Notification payload { title, body, data, icon }
 * @returns {Promise<Object>} Firebase response object
 */
async function sendPushNotification(tokens, payload) {
  if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
    return { successCount: 0, failureCount: 0, message: 'No tokens provided' };
  }

  // Remove empty or duplicate tokens
  const uniqueTokens = [...new Set(tokens.filter(Boolean))];
  if (uniqueTokens.length === 0) {
    return { successCount: 0, failureCount: 0, message: 'No valid tokens provided' };
  }

  const message = {
    notification: {
      title: payload.title || 'The Shine Lounge',
      body: payload.body || ''
    },
    data: payload.data || {},
    tokens: uniqueTokens
  };

  if (!isFirebaseInitialized) {
    console.log(`[FCM Mock Push Notification] To ${uniqueTokens.length} token(s):`, message);
    return {
      successCount: uniqueTokens.length,
      failureCount: 0,
      mock: true
    };
  }

  try {
    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(`[FCM Push] Sent: ${response.successCount}, Failed: ${response.failureCount}`);
    return response;
  } catch (error) {
    console.error('❌ Error sending FCM push notification:', error);
    // Return mock response on credential error so application flow never crashes
    return { successCount: 0, failureCount: uniqueTokens.length, error: error.message };
  }
}

module.exports = {
  admin,
  sendPushNotification,
  isFirebaseInitialized: () => isFirebaseInitialized
};
