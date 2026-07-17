import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Shield, Eye, Smartphone, Save } from 'lucide-react';
import { PrimaryButton, Toast } from '../components/carDetailingUI';

export default function CarDetailingSettingsPage() {
  const [toastOpen, setToastOpen] = useState(false);

  // Switch states
  const [notifyWhatsApp, setNotifyWhatsApp] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [shareMetrics, setShareMetrics] = useState(false);
  const [gpsTracking, setGpsTracking] = useState(true);

  const handleSave = () => {
    setToastOpen(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-8 max-w-2xl mx-auto text-zinc-800"
    >
      
      {/* Title Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-850">Settings</h1>
        <p className="text-xs md:text-sm text-zinc-500 font-semibold mt-1">Configure your preference, notifications, and location permissions.</p>
      </div>

      {/* Settings Options container */}
      <div className="bg-white border border-zinc-200/80 rounded-24 p-6 md:p-8 space-y-8 shadow-premium">
        
        {/* Section 1: Notifications */}
        <div className="space-y-5">
          <h3 className="text-base font-bold flex items-center gap-2 border-b border-zinc-100 pb-2 text-zinc-800">
            <Bell className="w-4.5 h-4.5 text-luxury-emerald" />
            <span>Notification Preferences</span>
          </h3>

          <div className="space-y-4">
            <div className="flex justify-between items-center gap-4">
              <div>
                <strong className="text-sm font-bold text-zinc-800 block">WhatsApp Detailing Alerts</strong>
                <span className="text-[11px] text-zinc-500 font-semibold block mt-0.5">Receive booking confirmations and live GPS links via WhatsApp.</span>
              </div>
              <button
                onClick={() => setNotifyWhatsApp(!notifyWhatsApp)}
                className={`w-12 h-6 rounded-full p-1 flex items-center transition-all ${
                  notifyWhatsApp ? 'bg-luxury-emerald justify-end' : 'bg-zinc-200 justify-start'
                }`}
              >
                <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
              </button>
            </div>

            <div className="flex justify-between items-center gap-4">
              <div>
                <strong className="text-sm font-bold text-zinc-800 block">Email Invoices & Offers</strong>
                <span className="text-[11px] text-zinc-500 font-semibold block mt-0.5">Receive service summaries, tax receipts, and promotional offers.</span>
              </div>
              <button
                onClick={() => setNotifyEmail(!notifyEmail)}
                className={`w-12 h-6 rounded-full p-1 flex items-center transition-all ${
                  notifyEmail ? 'bg-luxury-emerald justify-end' : 'bg-zinc-200 justify-start'
                }`}
              >
                <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
              </button>
            </div>
          </div>
        </div>

        {/* Section 2: Privacy & Tracking */}
        <div className="space-y-5">
          <h3 className="text-base font-bold flex items-center gap-2 border-b border-zinc-100 pb-2 text-zinc-800">
            <Shield className="w-4.5 h-4.5 text-luxury-emerald" />
            <span>Privacy & Live Coordinates</span>
          </h3>

          <div className="space-y-4">
            <div className="flex justify-between items-center gap-4">
              <div>
                <strong className="text-sm font-bold text-zinc-800 block">Allow GPS Location</strong>
                <span className="text-[11px] text-zinc-500 font-semibold block mt-0.5">Permit the detailing van to see your address coordinates for navigation.</span>
              </div>
              <button
                onClick={() => setGpsTracking(!gpsTracking)}
                className={`w-12 h-6 rounded-full p-1 flex items-center transition-all ${
                  gpsTracking ? 'bg-luxury-emerald justify-end' : 'bg-zinc-200 justify-start'
                }`}
              >
                <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
              </button>
            </div>

            <div className="flex justify-between items-center gap-4">
              <div>
                <strong className="text-sm font-bold text-zinc-800 block">Share Inspection Metrics</strong>
                <span className="text-[11px] text-zinc-500 font-semibold block mt-0.5">Help us improve by sending anonymous clear coat paint thickness feedback.</span>
              </div>
              <button
                onClick={() => setShareMetrics(!shareMetrics)}
                className={`w-12 h-6 rounded-full p-1 flex items-center transition-all ${
                  shareMetrics ? 'bg-luxury-emerald justify-end' : 'bg-zinc-200 justify-start'
                }`}
              >
                <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
              </button>
            </div>
          </div>
        </div>

        {/* Save button CTA */}
        <div className="pt-2 border-t border-zinc-100">
          <PrimaryButton onClick={handleSave} icon={<Save className="w-4.5 h-4.5" />}>
            Save Preferences
          </PrimaryButton>
        </div>

      </div>

      {/* Toast Feedback */}
      <Toast
        isOpen={toastOpen}
        onClose={() => setToastOpen(false)}
        message="Preferences saved successfully!"
        type="success"
      />

    </motion.div>
  );
}
