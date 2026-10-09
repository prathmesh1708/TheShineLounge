/* eslint-disable no-restricted-globals */
// Firebase Messaging Service Worker for background push notifications

importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Extract Firebase credentials from URL query parameters (passed from env on SW registration)
const locationUrl = new URL(self.location.href);
const params = locationUrl.searchParams;

const firebaseConfig = {
  apiKey: params.get('apiKey') || '',
  authDomain: params.get('authDomain') || '',
  projectId: params.get('projectId') || '',
  storageBucket: params.get('storageBucket') || '',
  messagingSenderId: params.get('messagingSenderId') || '',
  appId: params.get('appId') || '',
  measurementId: params.get('measurementId') || ''
};

// Initialize Firebase
if (firebase.apps.length === 0 && firebaseConfig.apiKey) {
  firebase.initializeApp(firebaseConfig);
}

if (firebase.apps.length > 0) {
  const messaging = firebase.messaging();

  // Handle background push messages
messaging.onBackgroundMessage((payload) => {
  // Messages with a `notification` block are displayed by the FCM SDK itself;
  // showing again here would duplicate them. Only handle data-only messages.
  if (payload.notification) return;

  const notificationTitle = payload.data?.title || 'The Shine Lounge';
  const notificationOptions = {
    body: payload.data?.body || 'You have a new update.',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: payload.data || {}
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
  });
}

// Handle notification click and tab focus / open window
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  // Our own notifications carry `link` (bookings) or `url` (staff breaks); ones
  // auto-displayed by the FCM SDK keep the original payload under FCM_MSG.
  const fcmData = (data.FCM_MSG && data.FCM_MSG.data) || {};
  const targetLink = data.link || data.url || fcmData.link || fcmData.url || '/bookings';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing tab if open
      for (const client of clientList) {
        if (client.url.includes(targetLink) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open new window
      if (clients.openWindow) {
        return clients.openWindow(targetLink);
      }
    })
  );
});
