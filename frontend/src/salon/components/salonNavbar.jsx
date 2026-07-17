import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, Bell, MapPin, ChevronDown, X, Compass, List, ShieldCheck, Tag, Star, User, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SalonNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;

  const [isOpen, setIsOpen] = useState(false);
  const [showLocationSelect, setShowLocationSelect] = useState(false);
  const [selectedLoc, setSelectedLoc] = useState("Vijay Nagar, Indore");
  const [showNotifications, setShowNotifications] = useState(false);

  const locationsList = [
    "Vijay Nagar, Indore",
    "Palasia, Indore",
    "Saket, Indore",
    "Bhawarkua, Indore",
    "Ranjeet Hanuman, Indore"
  ];

  const menuItems = [
    { label: "Salon Dashboard", path: "/salon", icon: <Compass className="w-5 h-5" /> },
    { label: "Services Menu", path: "/salon/services", icon: <List className="w-5 h-5" /> },
    { label: "My Appointments", path: "/salon/my-bookings", icon: <ShieldCheck className="w-5 h-5" /> },
    { label: "Exclusive Offers", path: "/salon/offers", icon: <Tag className="w-5 h-5" /> },
    { label: "Customer Reviews", path: "/salon/reviews", icon: <Star className="w-5 h-5" /> },
    { label: "Profile Settings", path: "/salon/profile", icon: <User className="w-5 h-5" /> },
    { label: "System Config", path: "/salon/settings", icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <>
      <nav className="sticky top-0 z-40 bg-white border-b border-zinc-200/80 backdrop-blur-md px-6 py-3 text-zinc-800 shadow-sm -mx-6 -mt-10 mb-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          
          {/* Left: Hamburger Menu & Location Selection */}
          <div className="flex items-center gap-1.5 sm:gap-4">
            <button
              onClick={() => setIsOpen(true)}
              className="p-1.5 hover:bg-zinc-100 rounded-full transition-colors"
              aria-label="Open sidebar menu"
            >
              <Menu className="w-6 h-6 text-zinc-800" />
            </button>

            <div className="relative">
              <button
                onClick={() => setShowLocationSelect(!showLocationSelect)}
                className="flex items-center gap-1 text-xs sm:text-sm font-semibold hover:text-primary transition-colors py-1.5 px-2.5 sm:px-3 rounded-full bg-zinc-50 border border-zinc-200 text-zinc-800 shadow-sm"
              >
                <MapPin className="w-4 h-4 text-primary" />
                <span className="max-w-[65px] sm:max-w-[100px] md:max-w-none truncate">{selectedLoc}</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-60" />
              </button>

              <AnimatePresence>
                {showLocationSelect && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute left-0 mt-2 w-48 bg-white border border-zinc-200 rounded-20 shadow-premium overflow-hidden z-50 text-zinc-800"
                  >
                    {locationsList.map((loc, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setSelectedLoc(loc);
                          setShowLocationSelect(false);
                        }}
                        className="w-full text-left px-4 py-3 text-xs text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors border-b border-zinc-100 last:border-b-0 font-semibold"
                      >
                        {loc}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Center: Brand Logo */}
          <div className="flex flex-col items-center cursor-pointer" onClick={() => navigate("/salon")}>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg tracking-wider text-zinc-800">SHINE</span>
              <span className="font-extrabold text-lg tracking-wider text-white bg-primary px-2 py-0.5 rounded-md">SALON</span>
            </div>
            <span className="text-[9px] tracking-[0.25em] font-semibold text-zinc-400 uppercase -mt-0.5">BEAUTY & GROOMING</span>
          </div>

          {/* Right: Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 hover:bg-zinc-100 rounded-full transition-colors text-zinc-850"
              aria-label="View notifications"
            >
              <Bell className="w-5.5 h-5.5" />
              <span className="absolute top-1 right-1 bg-primary text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full ring-2 ring-white">
                1
              </span>
            </button>

            <AnimatePresence>
              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-72 bg-white border border-zinc-200 rounded-20 shadow-premium p-4 z-50 text-zinc-800"
                  >
                    <h4 className="font-extrabold text-sm mb-3 border-b border-zinc-100 pb-2">Notifications</h4>
                    <div className="space-y-3">
                      <div className="text-xs font-semibold leading-relaxed hover:bg-zinc-50 p-1.5 rounded-md transition-colors">
                        <p className="text-zinc-800">Appointment confirmed with Albert Flores!</p>
                        <span className="text-[10px] text-zinc-400 block mt-1">July 21 at 11:30 AM</span>
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

        </div>
      </nav>

      {/* Sidebar Draw Menu */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex">
            {/* Dark overlay backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/30 backdrop-blur-xs"
            />

            {/* Sidebar drawer body */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="relative w-72 max-w-[80vw] bg-white h-full flex flex-col justify-between p-6 shadow-premium z-10 text-zinc-800"
            >
              <div className="space-y-8">
                {/* Brand & close button */}
                <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-base tracking-wider text-zinc-800">SHINE</span>
                    <span className="font-extrabold text-base tracking-wider text-white bg-primary px-1.5 py-0.5 rounded">SALON</span>
                  </div>
                  <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-zinc-50 rounded-full">
                    <X className="w-5 h-5 text-zinc-500" />
                  </button>
                </div>

                {/* Nav Links */}
                <div className="space-y-1.5">
                  {menuItems.map((item, idx) => {
                    const isActive = path === item.path;
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          navigate(item.path);
                          setIsOpen(false);
                        }}
                        className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-20 text-sm font-extrabold transition-all ${
                          isActive
                            ? 'bg-primary text-white shadow-premium'
                            : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                        }`}
                      >
                        {item.icon}
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Drawer Footer info */}
              <div className="border-t border-zinc-100 pt-4 text-center">
                <p className="text-[10px] text-zinc-400 font-bold tracking-wide uppercase">&copy; The Shine Lounge Salon</p>
                <span className="text-[9px] text-zinc-300 font-semibold block mt-0.5">V1.0.0 Stable</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
