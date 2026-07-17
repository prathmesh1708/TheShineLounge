import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Shield, Smartphone, Save } from 'lucide-react';
import { PrimaryButton, Toast } from '../components/dogWashUI';

export default function DogWashSettingsPage() {
  const [toastOpen, setToastOpen] = useState(false);

  const [notifyWhatsApp, setNotifyWhatsApp] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(true);
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
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-855">Settings</h1>
        <p className="text-xs md:text-sm text-zinc-500 font-semibold mt-1">Configure pet settings, notifications, and location permissions.</p>
      </div>

      <div className="bg-white border border-zinc-200/80 rounded-24 p-6 md:p-8 space-y-8 shadow-premium">
        
        {/* Section 1: Notifications */}
        <div className="space-y-5">
          <h3 className="text-base font-bold flex items-center gap-2 border-b border-zinc-100 pb-2 text-zinc-850">
            <Bell className="w-4.5 h-4.5 text-grooming-primary" />
            <span>Notification Preferences</span>
          </h3>

          <div className="space-y-4 font-semibold">
            <div className="flex justify-between items-center gap-4">
              <div>
                <strong className="text-sm font-bold text-zinc-800 block">WhatsApp Grooming Updates</strong>
                <span className="text-[11px] text-zinc-500 block mt-0.5">Receive van arrival timings and live GPS maps via WhatsApp.</span>
              </div>
              <button
                onClick={() => setNotifyWhatsApp(!notifyWhatsApp)}
                className={`w-12 h-6 rounded-full p-1 flex items-center transition-all ${
                  notifyWhatsApp ? 'bg-grooming-primary justify-end' : 'bg-zinc-205 justify-start'
                }`}
              >
                <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
              </button>
            </div>

            <div className="flex justify-between items-center gap-4">
              <div>
                <strong className="text-sm font-bold text-zinc-800 block">Email Invoices & Spa Offers</strong>
                <span className="text-[11px] text-zinc-500 block mt-0.5">Receive receipts and midweek bathing promotional newsletters.</span>
              </div>
              <button
                onClick={() => setNotifyEmail(!notifyEmail)}
                className={`w-12 h-6 rounded-full p-1 flex items-center transition-all ${
                  notifyEmail ? 'bg-grooming-primary justify-end' : 'bg-zinc-205 justify-start'
                }`}
              >
                <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
              </button>
            </div>
          </div>
        </div>

        {/* Section 2: Privacy */}
        <div className="space-y-5">
          <h3 className="text-base font-bold flex items-center gap-2 border-b border-zinc-100 pb-2 text-zinc-850">
            <Shield className="w-4.5 h-4.5 text-grooming-primary" />
            <span>Van GPS Access</span>
          </h3>

          <div className="space-y-4 font-semibold">
            <div className="flex justify-between items-center gap-4">
              <div>
                <strong className="text-sm font-bold text-zinc-800 block">Allow GPS Coordinates</strong>
                <span className="text-[11px] text-zinc-500 block mt-0.5">Permit the groomer van to fetch your street location coordinates for driving directions.</span>
              </div>
              <button
                onClick={() => setGpsTracking(!gpsTracking)}
                className={`w-12 h-6 rounded-full p-1 flex items-center transition-all ${
                  gpsTracking ? 'bg-grooming-primary justify-end' : 'bg-zinc-205 justify-start'
                }`}
              >
                <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
              </button>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-zinc-100">
          <PrimaryButton onClick={handleSave} icon={<Save className="w-4.5 h-4.5" />}>
            Save Settings
          </PrimaryButton>
        </div>

      </div>

      <Toast
        isOpen={toastOpen}
        onClose={() => setToastOpen(false)}
        message="Settings saved successfully!"
        type="success"
      />

    </motion.div>
  );
}
