import { messaging, getToken, onMessage } from '../config/firebase';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || 'BNQTIYwpiZnwXFtWtOyovW01zm4q9k5Gu8OF2dKYSE9Ll0grTtZZTzweBEkExTsc8a0Yb6H-LvQaUekEyY6c65U';
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

/**
 * Register Service Worker for Firebase Cloud Messaging
 */
export async function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const firebaseEnv = {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
        appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
        measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || ''
      };

      const params = new URLSearchParams(firebaseEnv).toString();
      const swUrl = `/firebase-messaging-sw.js?${params}`;

      const registration = await navigator.serviceWorker.register(swUrl, {
        scope: '/'
      });
      console.log('✅ FCM Service Worker registered:', registration.scope);
      return registration;
    } catch (error) {
      console.warn('⚠️ FCM Service Worker registration notice:', error.message);
      return null;
    }
  }
  return null;
}

/**
 * Request notification permission from browser
 */
export async function requestNotificationPermission() {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('✅ Notification permission granted.');
      return true;
    } else {
      console.warn('⚠️ Notification permission state:', permission);
      return false;
    }
  }
  return false;
}

/**
 * Get FCM Token for browser device
 */
export async function getFCMToken() {
  if (!messaging) return null;

  try {
    const registration = await registerServiceWorker();
    if (!registration) return null;

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration
    });

    if (token) {
      console.log('✅ FCM Web Token obtained:', token);
      return token;
    } else {
      console.warn('⚠️ No FCM token available.');
      return null;
    }
  } catch (error) {
    console.warn('⚠️ Error retrieving FCM token:', error.message);
    return null;
  }
}

/**
 * Register FCM Token with backend user profile
 */
export async function registerFCMToken(forceUpdate = false) {
  try {
    const savedToken = localStorage.getItem('fcm_token_web');
    if (savedToken && !forceUpdate) {
      return savedToken;
    }

    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) return null;

    const token = await getFCMToken();
    if (!token) return null;

    const authToken = localStorage.getItem('token') || localStorage.getItem('authToken');
    if (!authToken) {
      console.log('No auth token present, skipping backend FCM token registration.');
      return token;
    }

    const response = await fetch(`${API_BASE_URL}/api/fcm-tokens/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ token, platform: 'web' })
    });

    if (response.ok) {
      localStorage.setItem('fcm_token_web', token);
      console.log('✅ FCM token registered with backend.');
      return token;
    }
  } catch (error) {
    console.warn('⚠️ FCM token registration warning:', error.message);
  }
  return null;
}

/**
 * Remove FCM token from backend (e.g. on Logout)
 */
export async function removeFCMToken() {
  try {
    const savedToken = localStorage.getItem('fcm_token_web');
    const authToken = localStorage.getItem('token') || localStorage.getItem('authToken');
    if (!savedToken || !authToken) return;

    await fetch(`${API_BASE_URL}/api/fcm-tokens/remove`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ token: savedToken, platform: 'web' })
    });

    localStorage.removeItem('fcm_token_web');
    console.log('✅ FCM token removed on logout.');
  } catch (error) {
    console.warn('⚠️ FCM token remove warning:', error.message);
  }
}

/**
 * Setup listener for foreground notifications when app is active
 */
export function setupForegroundNotificationHandler(handler) {
  if (!messaging) return;

  onMessage(messaging, (payload) => {
    console.log('📬 Foreground FCM message received:', payload);

    if ('Notification' in window && Notification.permission === 'granted') {
      const title = payload.notification?.title || 'The Shine Lounge';
      const options = {
        body: payload.notification?.body || '',
        icon: payload.notification?.icon || '/favicon.ico',
        data: payload.data
      };
      new Notification(title, options);
    }

    if (handler) {
      handler(payload);
    }
  });
}

/**
 * Initialize Push Notifications service worker on app startup
 */
export async function initializePushNotifications() {
  try {
    await registerServiceWorker();
  } catch (error) {
    console.warn('Push notification initialization notice:', error.message);
  }
}
