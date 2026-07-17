import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Calendar, Heart, MapPin, CreditCard, Bell, Settings, HelpCircle, ChevronRight, Star } from 'lucide-react';

export default function SalonProfilePage() {
  const navigate = useNavigate();

  const profileItems = [
    { label: "My Appointments", desc: "View slot timings & receipt invoices", icon: <Calendar className="w-5 h-5 text-primary" />, onClick: () => navigate("/salon/my-bookings") },
    { label: "Saved Stylists", desc: "Quick-book Albert, Darlene, or Leslie", icon: <Heart className="w-5 h-5 text-rose-500 fill-rose-50" />, onClick: () => navigate("/salon") },
    { label: "Studio Addresses", desc: "Manage outlet stores or location defaults", icon: <MapPin className="w-5 h-5 text-blue-500" />, onClick: () => alert("Address Book settings (simulated)") },
    { label: "Payment Cards", desc: "Pre-auth credit cards or apple pay defaults", icon: <CreditCard className="w-5 h-5 text-indigo-500" />, onClick: () => alert("Payment cards list (simulated)") },
    { label: "Portal Config", desc: "Notification triggers & theme preferences", icon: <Settings className="w-5 h-5 text-zinc-550" />, onClick: () => navigate("/salon/settings") },
    { label: "Help & Support Desk", desc: "Live chat with support agents", icon: <HelpCircle className="w-5 h-5 text-emerald-500" />, onClick: () => alert("Live support chat (simulated)") }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-10 text-zinc-800 pb-24 max-w-2xl"
    >
      {/* Title */}
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-zinc-855">My Profile</h1>
        <p className="text-xs md:text-sm text-zinc-500 font-semibold mt-1.5 font-sans">
          Manage your credentials, address settings, credit cards, and system preferences.
        </p>
      </div>

      {/* User Info Card */}
      <div className="bg-white border border-zinc-200/80 rounded-24 p-6 md:p-8 flex items-center gap-6 shadow-sm">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20 flex-shrink-0">
          <User className="w-10 h-10 text-primary" />
        </div>
        
        <div className="space-y-1 flex-grow">
          <h2 className="text-xl font-extrabold text-zinc-850">Prashant Suryavanshi</h2>
          <p className="text-xs text-zinc-450 font-bold font-sans">prashant@theshinelounge.com</p>
          <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full inline-block mt-1">SHINE VIP MEMBER</span>
        </div>
      </div>

      {/* Sub List Option Links */}
      <div className="bg-white border border-zinc-200/80 rounded-24 overflow-hidden shadow-sm divide-y divide-zinc-100">
        {profileItems.map((item, idx) => (
          <button
            key={idx}
            onClick={item.onClick}
            className="w-full flex items-center justify-between p-5 text-left hover:bg-zinc-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="p-2 bg-zinc-50 rounded-15 border border-zinc-100">
                {item.icon}
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-zinc-800 leading-tight">{item.label}</h4>
                <p className="text-[11px] text-zinc-400 font-bold block mt-0.5">{item.desc}</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-zinc-450 opacity-60" />
          </button>
        ))}
      </div>

    </motion.div>
  );
}
