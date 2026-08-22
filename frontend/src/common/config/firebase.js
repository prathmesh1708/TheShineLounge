import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// Production Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyD_Z0657YemedimKix0bj-0ld7pvuA9iDo",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "the-shine-lounge-64b46.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "the-shine-lounge-64b46",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "the-shine-lounge-64b46.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "823359895270",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:823359895270:web:b0a8c4e1e1dd9c215b6d27",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-YE7W6ZMD3T"
};

const app = initializeApp(firebaseConfig);

let messaging = null;
try {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'Notification' in window) {
    messaging = getMessaging(app);
  }
} catch (e) {
  console.warn('Firebase Messaging init notice:', e.message);
}

export { app, messaging, getToken, onMessage };
