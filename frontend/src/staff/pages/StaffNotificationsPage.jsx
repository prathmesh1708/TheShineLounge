import React from 'react';
import { useStaff } from '../common/context/StaffContext';
import { Bell, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';

export default function StaffNotificationsPage() {
  const { notifications } = useStaff();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
          <Bell className="w-4 h-4" />
        </div>
        <div>
          <h2 className="font-extrabold text-base text-gray-900">Notifications & Alerts</h2>
          <p className="text-xs text-gray-500">Management & Shift Announcements</p>
        </div>
      </div>

      <div className="space-y-3">
        {notifications.map(notif => (
          <div
            key={notif.id}
            className={`p-4 rounded-2xl border shadow-xs space-y-1.5 ${
              notif.type === 'alert'
                ? 'bg-amber-50/80 border-amber-200'
                : 'bg-white border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {notif.type === 'alert' ? (
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                ) : (
                  <Info className="w-4 h-4 text-blue-900" />
                )}
                <h3 className="font-extrabold text-xs text-gray-900">{notif.title}</h3>
              </div>
              <span className="text-[10px] text-gray-400 font-semibold">{notif.sentAt}</span>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">{notif.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
