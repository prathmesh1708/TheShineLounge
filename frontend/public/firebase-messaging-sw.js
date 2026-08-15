/* eslint-disable no-restricted-globals */
// Firebase Messaging Service Worker for background push notifications

importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Production Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA9-NBjzyPSsRS6jRrmGxWconrVi0nNN9s",
  authDomain: "the-shinelounge.firebaseapp.com",
  projectId: "the-shinelounge",
  storageBucket: "the-shinelounge.firebasestorage.app",
  messagingSenderId: "19011784644",
  appId: "1:19011784644:web:05184a7d8382995ac21e91",
  measurementId: "G-7EJJDLK3D4"
};

// Initialize Firebase
if (firebase.apps.length === 0) {
  firebase.initializeApp(firebaseConfig);
}

const messaging = firebase.messaging();

// Handle background push messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Background message received:', payload);

  const notificationTitle = payload.notification?.title || 'The Shine Lounge';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new update.',
    icon: payload.notification?.icon || '/favicon.ico',
    badge: '/favicon.ico',
    data: payload.data || {}
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click and tab focus / open window
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  const targetLink = data.link || '/bookings';

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
