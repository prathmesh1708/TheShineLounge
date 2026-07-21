import React, { useState } from 'react';
import { Settings, Save, ShieldCheck, Database, Receipt, MapPin, Phone, Mail, Clock, RefreshCw } from 'lucide-react';
import { useAdmin } from '../common/context/AdminContext';

export default function AdminSettingsPage() {
  const { settings, updateSettings, showToast } = useAdmin();
  const [form, setForm] = useState(settings);

  const handleSubmit = (e) => {
    e.preventDefault();
    updateSettings(form);
  };

  const handleBackupNow = () => {
    showToast('Database snapshot backup completed successfully!');
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">Business & System Settings</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Configure lounge information, GST 18% parameters, invoice presets, and security access matrix.
          </p>
        </div>

        <button
          onClick={handleSubmit}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white rounded-xl shadow-sm hover:opacity-95 transition-opacity"
          style={{ backgroundColor: '#e07b2a' }}
        >
          <Save className="w-4 h-4" /> Save Business Configuration
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Form: Business & Tax Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Info */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-gray-900 pb-2 border-b border-gray-100 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-500" /> General Lounge Profile
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Business Name</label>
                <input
                  type="text"
                  value={form.businessName}
                  onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Tagline</label>
                <input
                  type="text"
                  value={form.tagline}
                  onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="font-bold text-gray-700 block mb-1">Headquarter Address</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={form.contactPhone}
                  onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Support Email</label>
                <input
                  type="email"
                  value={form.contactEmail}
                  onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Tax & Invoicing */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-gray-900 pb-2 border-b border-gray-100 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-amber-500" /> GST Tax & Billing Presets
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">GST Tax Rate (%)</label>
                <input
                  type="number"
                  value={form.gstRate}
                  onChange={(e) => setForm({ ...form, gstRate: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl font-black text-amber-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Billing Currency</label>
                <input
                  type="text"
                  value={form.currency}
                  readOnly
                  className="w-full px-3.5 py-2 bg-gray-100 border border-gray-200 rounded-xl font-bold text-gray-700 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Invoice Prefix</label>
                <input
                  type="text"
                  value={form.invoicePrefix}
                  onChange={(e) => setForm({ ...form, invoicePrefix: e.target.value })}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl font-mono text-gray-900 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Roles & Permission Matrix Table */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-gray-900 pb-2 border-b border-gray-100 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-500" /> Staff Access & Permission Matrix
            </h2>

            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 uppercase font-bold border-b border-gray-200">
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3">Bookings</th>
                    <th className="py-2.5 px-3">Services/Price</th>
                    <th className="py-2.5 px-3">Inventory</th>
                    <th className="py-2.5 px-3">Financial Reports</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-gray-900">Super Admin</td>
                    <td className="py-2.5 px-3 text-emerald-600 font-bold">Full Control</td>
                    <td className="py-2.5 px-3 text-emerald-600 font-bold">Full Control</td>
                    <td className="py-2.5 px-3 text-emerald-600 font-bold">Full Control</td>
                    <td className="py-2.5 px-3 text-emerald-600 font-bold">Full Access</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-gray-900">Branch Manager</td>
                    <td className="py-2.5 px-3 text-emerald-600 font-bold">Full Control</td>
                    <td className="py-2.5 px-3 text-amber-600 font-bold">View Only</td>
                    <td className="py-2.5 px-3 text-emerald-600 font-bold">Stock In/Out</td>
                    <td className="py-2.5 px-3 text-amber-600 font-bold">View Only</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-gray-900">Department Lead</td>
                    <td className="py-2.5 px-3 text-emerald-600 font-bold">Assigned Only</td>
                    <td className="py-2.5 px-3 text-gray-400 font-medium">No Access</td>
                    <td className="py-2.5 px-3 text-amber-600 font-bold">View Stock</td>
                    <td className="py-2.5 px-3 text-gray-400 font-medium">No Access</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Backup & Status */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-gray-900 pb-2 border-b border-gray-100 flex items-center gap-2">
              <Database className="w-4 h-4 text-amber-500" /> Database Backup & Safety
            </h2>

            <div className="p-3 bg-gray-50 rounded-xl text-xs space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Backup Schedule:</span>
                <span className="font-bold text-gray-900">{form.backupFrequency}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Last Snapshot:</span>
                <span className="font-bold text-emerald-600">Today 02:00 AM IST</span>
              </div>
            </div>

            <button
              onClick={handleBackupNow}
              className="w-full py-2.5 text-xs font-bold text-gray-700 bg-gray-100 border border-gray-200 rounded-xl hover:bg-gray-200 flex items-center justify-center gap-2 transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-amber-500" /> Backup Database Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
