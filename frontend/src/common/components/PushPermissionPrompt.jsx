import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import NotificationPermissionBanner from './NotificationPermissionBanner';

/**
 * Slim strip asking a signed-in user to turn on push notifications. Browsers
 * (iOS especially) only allow the permission prompt from a tap, so this has to
 * be a button rather than something we fire on load. Hidden once the user has
 * answered either way.
 */
export default function PushPermissionPrompt({ className = '' }) {
  const { user } = useAuth();
  const [state, setState] = useState('granted');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setState(Notification.permission);
    }
  }, [user]);

  if (!user || state !== 'default') return null;

  return (
    <div className={`flex items-center justify-between gap-3 px-3 py-2 ${className}`}>
      <span className="text-xs font-semibold opacity-80">Get alerts on your phone</span>
      <NotificationPermissionBanner />
    </div>
  );
}
