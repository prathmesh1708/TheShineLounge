import React, { useState } from 'react';
import {
  Bell,
  Send,
  Edit2,
  Trash2,
  Filter,
  Plus,
  Sparkles,
  Car,
  Tag,
  ShieldCheck,
  Coffee,
  Scissors,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  X
} from 'lucide-react';
import { useNotifications } from '../../common/context/NotificationContext';

export default function AdminNotificationsPage() {
  const {
    adminNotifications,
    loading,
    createNotification,
    updateNotification,
    deleteNotification,
    fetchAdminNotifications
  } = useNotifications();

  const [activeTab, setActiveTab] = useState('all'); // 'all', 'users', 'staff'
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    recipientType: 'all_users',
    targetSegment: 'all',
    serviceKey: 'system',
    category: 'system_announcement',
    priority: 'normal',
    actionUrl: ''
  });

  const [formMsg, setFormMsg] = useState({ type: '', text: '' });

  // Quick Preset Templates for all 6 Services + Staff
  const presetTemplates = [
    {
      label: '🚗 Car Wash Expiry Warning',
      title: 'Monthly Pass Expiring Soon ⏰',
      message: 'Your Monthly Tunnel Wash Pass expires in 3 days. Renew now to enjoy uninterrupted daily washes & complimentary mat cleaning!',
      serviceKey: 'car-wash',
      category: 'membership_expiry',
      recipientType: 'segment',
      targetSegment: 'expiring_soon',
      priority: 'high'
    },
    {
      label: '✨ Detailing Job Ready',
      title: 'Car Detailing Completed 🚗✨',
      message: 'Your vehicle ceramic coating & interior deep clean is complete! Ready for pickup at Mumbai Main Branch.',
      serviceKey: 'car-detailing',
      category: 'service_update',
      recipientType: 'all_users',
      targetSegment: 'car_detailing',
      priority: 'high'
    },
    {
      label: '☕ Drive-Thru Order Ready',
      title: 'Drive-Thru Coffee Ready ☕',
      message: 'Your Nitro Sweet Cream Cold Brew & Croissant are ready at Window #1. Please pull forward!',
      serviceKey: 'drive-through-cafe',
      category: 'order_status',
      recipientType: 'all_users',
      targetSegment: 'cafe',
      priority: 'urgent'
    },
    {
      label: '💈 Salon Appointment Reminder',
      title: 'Upcoming Salon Appointment 💈',
      message: 'Reminder: Your hair styling & beard grooming session with Marcus Sterling is scheduled today at 4:00 PM.',
      serviceKey: 'salon',
      category: 'renewal_reminder',
      recipientType: 'all_users',
      targetSegment: 'salon',
      priority: 'normal'
    },
    {
      label: '🐕 Dog Wash Promo',
      title: 'Weekend Dog Spa Special 🐾',
      message: 'Get 2 Extra Minutes FREE on all ₹500 (12 Min) Semi-Automatic Hydrobath Dog Wash sessions this weekend!',
      serviceKey: 'dog-wash',
      category: 'promotional',
      recipientType: 'all_users',
      targetSegment: 'dog_wash',
      priority: 'normal'
    },
    {
      label: '📦 Low Stock Alert (Staff)',
      title: 'LOW STOCK ALERT: Ceramic Polish & Coffee Beans 📦',
      message: 'Inventory level for Detailing Ceramic Compound (Bottle) and Espresso Roast is below minimum threshold.',
      serviceKey: 'system',
      category: 'inventory_alert',
      recipientType: 'all_staff',
      targetSegment: 'all',
      priority: 'high'
    }
  ];

  const handleOpenCreateModal = () => {
    setEditingId(null);
    setFormData({
      title: '',
      message: '',
      recipientType: 'all_users',
      targetSegment: 'all',
      serviceKey: 'system',
      category: 'system_announcement',
      priority: 'normal',
      actionUrl: ''
    });
    setFormMsg({ type: '', text: '' });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (notif) => {
    setEditingId(notif._id);
    setFormData({
      title: notif.title || '',
      message: notif.message || '',
      recipientType: notif.recipientType || 'all_users',
      targetSegment: notif.targetSegment || 'all',
      serviceKey: notif.serviceKey || 'system',
      category: notif.category || 'system_announcement',
      priority: notif.priority || 'normal',
      actionUrl: notif.actionUrl || ''
    });
    setFormMsg({ type: '', text: '' });
    setIsModalOpen(true);
  };

  const applyPreset = (preset) => {
    setFormData({
      title: preset.title,
      message: preset.message,
      recipientType: preset.recipientType,
      targetSegment: preset.targetSegment,
      serviceKey: preset.serviceKey,
      category: preset.category,
      priority: preset.priority,
      actionUrl: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormMsg({ type: '', text: '' });

    if (editingId) {
      const res = await updateNotification(editingId, formData);
      if (res.success) {
        setFormMsg({ type: 'success', text: 'Notification updated successfully!' });
        setTimeout(() => setIsModalOpen(false), 1200);
      } else {
        setFormMsg({ type: 'error', text: res.message });
      }
    } else {
      const res = await createNotification(formData);
      if (res.success) {
        setFormMsg({ type: 'success', text: 'Notification broadcasted successfully!' });
        setTimeout(() => setIsModalOpen(false), 1200);
      } else {
        setFormMsg({ type: 'error', text: res.message });
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this notification? It will be removed system-wide.')) {
      await deleteNotification(id);
    }
  };

  const filteredNotifications = adminNotifications.filter(n => {
    if (activeTab === 'users' && n.recipientType === 'all_staff') return false;
    if (activeTab === 'staff' && n.recipientType !== 'all_staff' && n.recipientType !== 'staff') return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        (n.title && n.title.toLowerCase().includes(q)) ||
        (n.message && n.message.toLowerCase().includes(q)) ||
        (n.serviceKey && n.serviceKey.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 text-left pb-12">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs font-black uppercase tracking-widest text-amber-400 flex items-center gap-1.5 mb-1">
            <Sparkles className="w-4 h-4 text-amber-400" /> Multi-Service Communication Hub
          </span>
          <h1 className="text-2xl font-black tracking-tight">Notification Center</h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Broadcast dynamic alerts, membership expiry warnings, detailing status updates, and staff announcements across all 6 business verticals.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-2 active:scale-95 transition-all whitespace-nowrap"
        >
          <Plus className="w-4 h-4" /> Send Notification
        </button>
      </div>

      {/* Preset Action Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <ZapIcon className="w-4 h-4 text-amber-500" /> Quick-Send Presets (1-Click Broadcast)
          </span>
          <span className="text-[11px] text-slate-400 font-semibold">Pre-configured templates for instant push</span>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          {presetTemplates.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                applyPreset(p);
                setIsModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-orange-50 hover:border-orange-200 text-slate-700 hover:text-orange-700 text-xs font-bold transition-all flex items-center gap-1.5"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        {/* Recipient Filter Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-extrabold">
          {[
            { id: 'all', label: 'All Notifications' },
            { id: 'users', label: 'Customer Alerts' },
            { id: 'staff', label: 'Staff Alerts' }
          ].map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeTab === t.id
                  ? 'bg-white text-slate-900 shadow-xs font-black'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Search & Refresh */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search title, content, service..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
            />
          </div>
          <button
            type="button"
            onClick={fetchAdminNotifications}
            className="p-2 border border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors"
            title="Refresh list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notifications Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-wider">
              <tr>
                <th className="px-4 py-3">Notification</th>
                <th className="px-4 py-3">Recipient Group</th>
                <th className="px-4 py-3">Service / Category</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Sent Time</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
              {filteredNotifications.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-bold text-slate-600">No notifications found</p>
                    <p className="text-[11px]">Click "Send Notification" or use a quick preset above.</p>
                  </td>
                </tr>
              ) : (
                filteredNotifications.map(n => (
                  <tr key={n._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 max-w-xs">
                      <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                        {n.title}
                        {n.isEdited && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 bg-amber-50 text-amber-600 rounded-md border border-amber-200">
                            Edited
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 font-normal line-clamp-1 mt-0.5">{n.message}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-slate-100 text-slate-700 border border-slate-200">
                        {n.recipientType === 'all_users'
                          ? '👥 All Customers'
                          : n.recipientType === 'all_staff'
                          ? '👷 All Staff'
                          : n.targetSegment}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        <span className="font-extrabold text-slate-800 uppercase text-[10px] block">
                          {n.serviceKey || 'system'}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-normal capitalize">
                          {n.category ? n.category.replace('_', ' ') : 'announcement'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                          n.priority === 'urgent'
                            ? 'bg-rose-100 text-rose-700 border border-rose-300'
                            : n.priority === 'high'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {n.priority || 'normal'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-[11px]">
                      {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(n)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Edit notification"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(n._id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete notification"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-left animate-in zoom-in-95 duration-150">
            <div className="p-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-orange-400" />
                <h3 className="font-extrabold text-sm tracking-wider uppercase">
                  {editingId ? 'Edit Sent Notification' : 'Compose & Send Notification'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {formMsg.text && (
                <div
                  className={`p-3 rounded-xl text-xs font-extrabold ${
                    formMsg.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {formMsg.text}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Notification Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Pass Expiry Warning / Complete Detailing Ready"
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Message Content *
                </label>
                <textarea
                  value={formData.message}
                  onChange={e => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Enter detailed alert message to broadcast..."
                  rows={3}
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Recipient Group
                  </label>
                  <select
                    value={formData.recipientType}
                    onChange={e => setFormData({ ...formData, recipientType: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="all_users">👥 All Customers</option>
                    <option value="all_staff">👷 All Staff Members</option>
                    <option value="segment">🎯 Targeted Customer Segment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Service Vertical
                  </label>
                  <select
                    value={formData.serviceKey}
                    onChange={e => setFormData({ ...formData, serviceKey: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="system">⚙️ Global System</option>
                    <option value="car-wash">🚗 Tunnel Car Wash</option>
                    <option value="car-detailing">✨ Car Detailing Studio</option>
                    <option value="dog-wash">🐕 Dog Wash</option>
                    <option value="cafe">☕ Café</option>
                    <option value="drive-through-cafe">🚗☕ Drive-Through Café</option>
                    <option value="salon">💈 Men's Salon</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="membership_expiry">🛡️ Membership Expiry Warning</option>
                    <option value="renewal_reminder">🔄 Renewal Reminder</option>
                    <option value="order_status">🚗 Order / Service Status Update</option>
                    <option value="service_update">✨ Job Card Update</option>
                    <option value="promotional">🏷️ Promotional Offer & Coupon</option>
                    <option value="inventory_alert">📦 Low Stock Alert</option>
                    <option value="system_announcement">📢 System Announcement</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Priority Level
                  </label>
                  <select
                    value={formData.priority}
                    onChange={e => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">🚨 Urgent (Immediate Popup)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-black rounded-xl shadow-md active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  {editingId ? 'Save Changes' : 'Broadcast Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ZapIcon(props) {
  return (
    <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}
