import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Bell, Globe, Moon, Sun, Info, HelpCircle } from 'lucide-react';

export default function SalonSettingsPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState("English (US)");
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [pushAlerts, setPushAlerts] = useState(true);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-5 pb-12 md:space-y-8 md:pb-16 text-zinc-800 max-w-2xl"
    >
      
      {/* Title */}
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-zinc-855">System Settings</h1>
        <p className="text-xs md:text-sm text-zinc-500 font-semibold mt-1.5 font-sans">
          Toggle theme defaults, push alert controls, language preferences, and privacy rules.
        </p>
      </div>

      {/* Main Settings Card */}
      <div className="bg-white border border-zinc-200/80 rounded-24 shadow-sm overflow-hidden divide-y divide-zinc-100">
        
        {/* Dark Mode Toggle */}
        <div className="p-5.5 flex items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-zinc-50 rounded-18 border border-zinc-100">
              {darkMode ? <Moon className="w-5 h-5 text-indigo-500" /> : <Sun className="w-5 h-5 text-amber-500" />}
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-zinc-800 leading-tight">Dark Mode Preferences</h3>
              <p className="text-[10px] text-zinc-400 font-bold block mt-0.5">Toggle interface lighting layouts</p>
            </div>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`w-12 h-6.5 rounded-full p-1 transition-all duration-300 ${
              darkMode ? 'bg-primary flex justify-end' : 'bg-zinc-250 bg-zinc-200 flex justify-start'
            }`}
          >
            <motion.div
              layout
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="w-4.5 h-4.5 bg-white rounded-full shadow-sm"
            />
          </button>
        </div>

        {/* Language Selection */}
        <div className="p-5.5 flex items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-zinc-50 rounded-18 border border-zinc-100">
              <Globe className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-zinc-800 leading-tight">System Language</h3>
              <p className="text-[10px] text-zinc-400 font-bold block mt-0.5">Configure text display translations</p>
            </div>
          </div>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="py-1.5 px-3 bg-zinc-50 border border-zinc-200 focus:border-primary text-xs font-bold rounded-10 outline-none text-zinc-800 shadow-sm"
          >
            <option>English (US)</option>
            <option>Hindi (IN)</option>
            <option>Spanish (ES)</option>
          </select>
        </div>

        {/* Push alerts */}
        <div className="p-5.5 flex items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-zinc-50 rounded-18 border border-zinc-100">
              <Bell className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-zinc-800 leading-tight">Push Notification Alerts</h3>
              <p className="text-[10px] text-zinc-400 font-bold block mt-0.5">Alerts when slots are confirmed or stylists arrive</p>
            </div>
          </div>
          <button
            onClick={() => setPushAlerts(!pushAlerts)}
            className={`w-12 h-6.5 rounded-full p-1 transition-all duration-300 ${
              pushAlerts ? 'bg-primary flex justify-end' : 'bg-zinc-200 flex justify-start'
            }`}
          >
            <motion.div
              layout
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="w-4.5 h-4.5 bg-white rounded-full shadow-sm"
            />
          </button>
        </div>

        {/* Email alerts */}
        <div className="p-5.5 flex items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-zinc-50 rounded-18 border border-zinc-100">
              <Bell className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-zinc-800 leading-tight">Email Receipt Invoices</h3>
              <p className="text-[10px] text-zinc-400 font-bold block mt-0.5">Receive copy invoices directly on email</p>
            </div>
          </div>
          <button
            onClick={() => setEmailAlerts(!emailAlerts)}
            className={`w-12 h-6.5 rounded-full p-1 transition-all duration-300 ${
              emailAlerts ? 'bg-primary flex justify-end' : 'bg-zinc-200 flex justify-start'
            }`}
          >
            <motion.div
              layout
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="w-4.5 h-4.5 bg-white rounded-full shadow-sm"
            />
          </button>
        </div>

      </div>

      {/* Info links */}
      <div className="bg-white border border-zinc-200/80 rounded-24 shadow-sm overflow-hidden divide-y divide-zinc-100">
        
        {/* Privacy Policy */}
        <button
          onClick={() => alert("Privacy policy file (simulated)...")}
          className="w-full p-5 flex items-center gap-4 hover:bg-zinc-50 transition-colors text-left"
        >
          <Shield className="w-5 h-5 text-zinc-450 opacity-80" />
          <div>
            <h4 className="font-extrabold text-xs text-zinc-800 leading-tight">Privacy Policy Agreement</h4>
            <span className="text-[9px] text-zinc-400 font-semibold block mt-0.5">Updated July 2026</span>
          </div>
        </button>

        {/* About App */}
        <button
          onClick={() => alert("Shine Lounge App Version 1.0.0 Stable build 2026.")}
          className="w-full p-5 flex items-center gap-4 hover:bg-zinc-50 transition-colors text-left"
        >
          <Info className="w-5 h-5 text-zinc-450 opacity-80" />
          <div>
            <h4 className="font-extrabold text-xs text-zinc-800 leading-tight">About Shine Lounge Portal</h4>
            <span className="text-[9px] text-zinc-400 font-semibold block mt-0.5">Shine Multi-Service App</span>
          </div>
        </button>

      </div>

    </motion.div>
  );
}
