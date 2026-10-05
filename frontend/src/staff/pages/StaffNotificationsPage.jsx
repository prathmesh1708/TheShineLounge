import React from 'react';
import { useStaff } from '../common/context/StaffContext';
import { Bell, AlertTriangle, Info, Clock, CheckCircle2 } from 'lucide-react';

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
        {(!notifications || notifications.length === 0) ? (
          <div className="text-center py-10 bg-white border border-dashed border-gray-200 rounded-2xl space-y-2">
            <Bell className="w-8 h-8 text-gray-300 mx-auto" />
            <p className="font-bold text-gray-700 text-xs">No Notifications Yet</p>
            <p className="text-[11px] text-gray-400">Shift updates and announcements from management will appear here.</p>
          </div>
        ) : (
          notifications.map(notif => {
            const isShiftEnd = notif.title?.toLowerCase().includes('shift') || notif.category === 'service_update';
            const formattedDate = notif.createdAt 
              ? new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })
              : (notif.sentAt || 'Just now');

            return (
              <div
                key={notif._id || notif.id}
                className={`p-4 rounded-2xl border shadow-xs space-y-1.5 ${
                  isShiftEnd
                    ? 'bg-amber-50/90 border-amber-200'
                    : notif.type === 'alert'
                    ? 'bg-orange-50/80 border-orange-200'
                    : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isShiftEnd ? (
                      <Clock className="w-4 h-4 text-amber-600" />
                    ) : notif.type === 'alert' ? (
                      <AlertTriangle className="w-4 h-4 text-orange-600" />
                    ) : (
                      <Info className="w-4 h-4 text-blue-900" />
                    )}
                    <h3 className="font-extrabold text-xs text-gray-900">{notif.title}</h3>
                  </div>
                  <span className="text-[10px] text-gray-400 font-semibold">{formattedDate}</span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{notif.message}</p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
