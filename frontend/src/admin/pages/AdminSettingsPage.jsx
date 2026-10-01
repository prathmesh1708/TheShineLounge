import React, { useState } from 'react';
import { Save, Receipt, MapPin } from 'lucide-react';
import { useAdmin } from '../common/context/AdminContext';

export default function AdminSettingsPage() {
  const { settings, updateSettings } = useAdmin();
  const [form, setForm] = useState(settings);

  const handleSubmit = (e) => {
    e.preventDefault();
    updateSettings(form);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">Business & System Settings</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Configure lounge information, GST 18% parameters, and invoice presets.
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

      <div className="space-y-6">
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
      </div>
    </div>
  );
}
