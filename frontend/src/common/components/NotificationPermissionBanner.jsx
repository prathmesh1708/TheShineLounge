import React, { useState, useEffect } from 'react';
import { registerFCMToken, requestNotificationPermission } from '../services/pushNotificationService';
import { Bell, BellOff, Check } from 'lucide-react';

/**
 * Reusable Push Notification Permission Banner / Button Component
 */
export default function NotificationPermissionBanner({ className = '' }) {
  const [permissionState, setPermissionState] = useState('default'); // 'granted' | 'denied' | 'default'
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionState(Notification.permission);
    }
  }, []);

  const handleEnablePush = async () => {
    setIsRegistering(true);
    try {
      const granted = await requestNotificationPermission();
      if (granted) {
        setPermissionState('granted');
        await registerFCMToken(true);
      } else {
        setPermissionState(Notification.permission);
      }
    } catch (err) {
      console.warn('Push permission error:', err);
    } finally {
      setIsRegistering(false);
    }
  };

  if (permissionState === 'granted') {
    return (
      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold ${className}`}>
        <Check className="w-3.5 h-3.5 text-emerald-600" />
        <span>Push Notifications Active</span>
      </div>
    );
  }

  if (permissionState === 'denied') {
    return (
      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 text-gray-500 text-xs font-semibold ${className}`} title="Notifications are blocked in browser settings">
        <BellOff className="w-3.5 h-3.5 text-gray-400" />
        <span>Notifications Blocked</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleEnablePush}
      disabled={isRegistering}
      className={`inline-flex items-center gap-2 px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-full text-xs font-bold shadow-sm transition-all hover:scale-105 cursor-pointer ${className}`}
    >
      <Bell className="w-3.5 h-3.5 animate-pulse" />
      <span>{isRegistering ? 'Enabling Notifications...' : 'Enable Push Notifications'}</span>
    </button>
  );
}
