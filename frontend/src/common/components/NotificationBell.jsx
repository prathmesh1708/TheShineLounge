import React, { useState } from 'react';
import { Bell, CheckCheck, X, Sparkles, Tag, Car, AlertTriangle, ShieldCheck, Info } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

export default function NotificationBell({ isStaff = false }) {
  const {
    userNotifications,
    staffNotifications,
    unreadUserCount,
    unreadStaffCount,
    markAsRead,
    markAllAsRead
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'membership', 'service', 'promo'

  const notifications = isStaff ? staffNotifications : userNotifications;
  const unreadCount = isStaff ? unreadStaffCount : unreadUserCount;

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'membership') {
      return n.category === 'membership_expiry' || n.category === 'renewal_reminder';
    }
    if (activeTab === 'service') {
      return n.category === 'service_update' || n.category === 'order_status' || n.category === 'inventory_alert';
    }
    if (activeTab === 'promo') {
      return n.category === 'promotional';
    }
    return true;
  });

  const getCategoryIcon = (category, priority) => {
    if (priority === 'urgent' || priority === 'high') {
      return <AlertTriangle className="w-4 h-4 text-rose-500" />;
    }
    switch (category) {
      case 'membership_expiry':
      case 'renewal_reminder':
        return <ShieldCheck className="w-4 h-4 text-amber-500" />;
      case 'order_status':
      case 'service_update':
        return <Car className="w-4 h-4 text-blue-500" />;
      case 'promotional':
        return <Tag className="w-4 h-4 text-emerald-500" />;
      default:
        return <Sparkles className="w-4 h-4 text-orange-500" />;
    }
  };

  return (
    <div className="relative inline-block">
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all focus:outline-none"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black text-[10px] rounded-full flex items-center justify-center border-2 border-white shadow-xs animate-bounce">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Drawer Modal */}
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer Dropdown Panel */}
          <div className="fixed sm:absolute left-3 right-3 sm:left-auto sm:right-0 top-16 sm:top-12 sm:w-96 max-h-[82vh] sm:max-h-[500px] bg-white rounded-2xl shadow-2xl border border-slate-200/90 z-50 overflow-hidden text-left animate-in fade-in slide-in-from-top-2 duration-200 flex flex-col">
            {/* Header */}
            <div className="px-4 py-3 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-xs tracking-wider uppercase text-slate-100">Notifications</h3>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 bg-orange-500/20 border border-orange-400/30 text-orange-300 text-[10px] font-bold rounded-full">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all"
                  >
                    <CheckCheck className="w-3 h-3" /> Mark Read
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex border-b border-slate-100 bg-slate-50/80 p-1.5 text-[11px] font-bold gap-1 overflow-x-auto no-scrollbar shrink-0">
              {[
                { id: 'all', label: 'All' },
                { id: 'membership', label: 'Pass / Reminders' },
                { id: 'service', label: 'Service Updates' },
                { id: 'promo', label: 'Offers' }
              ].map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id)}
                  className={`px-2.5 py-1.5 rounded-lg transition-all text-center whitespace-nowrap flex-shrink-0 sm:flex-1 ${
                    activeTab === t.id
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 font-black'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Notification List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 min-h-0">
              {filteredNotifications.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                    <Info className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-slate-700">No notifications yet</p>
                  <p className="text-[11px] text-slate-400">You are all caught up with your updates and announcements.</p>
                </div>
              ) : (
                filteredNotifications.map(n => (
                  <div
                    key={n._id}
                    onClick={() => !n.isRead && markAsRead(n._id)}
                    className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer ${
                      n.isRead ? 'bg-white hover:bg-slate-50/60' : 'bg-orange-50/30 hover:bg-orange-50/60 border-l-4 border-orange-500'
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-slate-100 shrink-0 mt-0.5">
                      {getCategoryIcon(n.category, n.priority)}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className={`text-xs ${n.isRead ? 'font-bold text-slate-800' : 'font-black text-slate-900'}`}>
                          {n.title}
                        </h4>
                        <span className="text-[9px] font-semibold text-slate-400 whitespace-nowrap">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 font-medium leading-snug line-clamp-2">
                        {n.message}
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                          {n.serviceKey || 'System'}
                        </span>
                        {n.priority === 'high' || n.priority === 'urgent' ? (
                          <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-600 border border-rose-200">
                            {n.priority}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
