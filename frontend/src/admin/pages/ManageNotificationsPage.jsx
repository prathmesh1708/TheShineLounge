import React, { useState } from 'react';
import { Send, Bell, Calendar, CheckCircle2, Clock, MessageSquare, PhoneCall } from 'lucide-react';
import { useAdmin } from '../common/context/AdminContext';
import DataTable from '../common/components/DataTable';

export default function ManageNotificationsPage() {
  const { notifications, composeNotification } = useAdmin();

  const [form, setForm] = useState({
    title: '',
    message: '',
    target: 'All Customers',
    channels: ['Push', 'WhatsApp'],
    scheduleLater: false,
    scheduledDate: ''
  });

  const toggleChannel = (ch) => {
    if (form.channels.includes(ch)) {
      setForm({ ...form, channels: form.channels.filter(c => c !== ch) });
    } else {
      setForm({ ...form, channels: [...form.channels, ch] });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title || !form.message) return;
    composeNotification({
      title: form.title,
      message: form.message,
      target: form.target,
      channel: form.channels.join(', '),
      scheduleLater: form.scheduleLater,
      scheduledDate: form.scheduledDate
    });
    setForm({
      title: '',
      message: '',
      target: 'All Customers',
      channels: ['Push', 'WhatsApp'],
      scheduleLater: false,
      scheduledDate: ''
    });
  };

  const columns = [
    {
      header: 'Notification Title',
      accessorKey: 'title',
      cell: (row) => (
        <div>
          <p className="font-bold text-gray-900">{row.title}</p>
          <p className="text-[11px] text-gray-500 line-clamp-1">{row.message}</p>
        </div>
      )
    },
    {
      header: 'Target Audience',
      accessorKey: 'target',
      cell: (row) => (
        <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
          {row.target}
        </span>
      )
    },
    {
      header: 'Delivery Channel',
      accessorKey: 'channel',
      cell: (row) => <span className="font-semibold text-gray-700">{row.channel}</span>
    },
    {
      header: 'Timestamp / Schedule',
      accessorKey: 'sentAt',
      cell: (row) => (
        <span className="text-gray-500 font-medium flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-gray-400" /> {row.sentAt}
        </span>
      )
    },
    {
      header: 'Open / Read Rate',
      accessorKey: 'readRate',
      cell: (row) => (
        <span className="font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
          {row.readRate}
        </span>
      )
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (row) => (
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
          row.status === 'Sent' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
        }`}>
          {row.status}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <h1 className="text-xl font-extrabold text-gray-900">Push & Marketing Broadcast Center</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Dispatch promotional announcements, offer alerts, and automated reminders via Push, WhatsApp, SMS & Email.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Compose Panel */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
            <Send className="w-5 h-5 text-amber-500" />
            <h2 className="text-sm font-bold text-gray-900">Compose Broadcast</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-gray-700 block mb-1">Headline / Title</label>
              <input
                type="text"
                placeholder="e.g. 30% Off Weekend Car Spa!"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 font-medium"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Message Body</label>
              <textarea
                rows="3"
                placeholder="Type push message details..."
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 font-medium"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Target Segment</label>
              <select
                value={form.target}
                onChange={(e) => setForm({ ...form, target: e.target.value })}
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 font-semibold"
              >
                <option value="All Customers">All Customers (4,850)</option>
                <option value="Active Members">Active Members (1,240)</option>
                <option value="Expiring Members">Expiring Members (48)</option>
                <option value="Car Wash Users">Car Wash Users</option>
                <option value="Dog Wash Users">Dog Wash Users</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1.5">Delivery Channels</label>
              <div className="grid grid-cols-2 gap-2">
                {['Push', 'WhatsApp', 'SMS', 'Email'].map((ch) => (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => toggleChannel(ch)}
                    className={`px-3 py-2 rounded-xl border text-xs font-bold transition-colors flex items-center justify-between ${
                      form.channels.includes(ch)
                        ? 'bg-amber-50 border-amber-300 text-amber-700'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span>{ch}</span>
                    {form.channels.includes(ch) && <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
              <label className="font-bold text-gray-700 flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.scheduleLater}
                  onChange={(e) => setForm({ ...form, scheduleLater: e.target.checked })}
                  className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                />
                <span>Schedule for later</span>
              </label>

              {form.scheduleLater && (
                <input
                  type="datetime-local"
                  value={form.scheduledDate}
                  onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })}
                  className="px-2.5 py-1 text-xs border border-gray-200 rounded-lg bg-gray-50"
                />
              )}
            </div>

            <button
              type="submit"
              className="w-full py-2.5 text-xs font-bold text-white rounded-xl shadow-sm hover:opacity-95 transition-opacity"
              style={{ backgroundColor: '#e07b2a' }}
            >
              {form.scheduleLater ? 'Schedule Broadcast' : 'Send Immediate Broadcast'}
            </button>
          </form>
        </div>

        {/* Right Notification Log Table */}
        <div className="lg:col-span-2 space-y-4">
          <DataTable
            columns={columns}
            data={notifications}
            searchPlaceholder="Search broadcasts history..."
            searchKeys={['title', 'message', 'target']}
          />
        </div>
      </div>
    </div>
  );
}
