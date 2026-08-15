import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// Production Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyA9-NBjzyPSsRS6jRrmGxWconrVi0nNN9s",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "the-shinelounge.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "the-shinelounge",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "the-shinelounge.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "19011784644",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:19011784644:web:05184a7d8382995ac21e91",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-7EJJDLK3D4"
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
