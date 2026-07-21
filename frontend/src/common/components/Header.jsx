import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, User } from 'lucide-react';
import { motion } from 'framer-motion';
import TSLLogo from './TSLLogo';

export default function Header() {
  const navigate = useNavigate();

  return (
    <motion.header 
      initial={{ opacity: 0, y: -15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full flex items-center justify-between py-2 px-1 mb-3"
    >
      {/* Left Branding */}
      <Link to="/" className="flex items-center gap-2.5 group">
        <div className="w-11 h-11 flex items-center justify-center transition-transform group-hover:scale-105">
          <TSLLogo className="w-11 h-11 object-contain" />
        </div>
        <span className="font-extrabold text-sm sm:text-base tracking-wider text-white uppercase font-display leading-none">
          THE SHINE LOUNGE
        </span>
      </Link>

      {/* Right Actions */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={() => alert('No new notifications')}
          className="w-10 h-10 rounded-full bg-[#15171D] border border-[#2A2E36] flex items-center justify-center text-gray-300 hover:text-white hover:border-[#FF8C1A]/50 transition-all active:scale-95 shadow-sm"
          aria-label="Notifications"
        >
          <Bell className="w-4.5 h-4.5" />
        </button>

        <button
          onClick={() => navigate('/profile')}
          className="w-10 h-10 rounded-full bg-[#15171D] border border-[#2A2E36] flex items-center justify-center text-gray-300 hover:text-white hover:border-[#FF8C1A]/50 transition-all active:scale-95 shadow-sm"
          aria-label="Profile Settings"
        >
          <User className="w-4.5 h-4.5" />
        </button>
      </div>
    </motion.header>
  );
}
