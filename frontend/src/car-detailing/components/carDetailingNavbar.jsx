import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, Bell, MapPin, ChevronDown, X, Compass, List, Package, Tag, Star, Info, MessageSquare, User, Settings, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CarDetailingNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;

  const [isOpen, setIsOpen] = useState(false);
  const [showLocationSelect, setShowLocationSelect] = useState(false);
  const [selectedLoc, setSelectedLoc] = useState("Indore, MP");
  const [showNotifications, setShowNotifications] = useState(false);

  const locationsList = ["Vijay Nagar, Indore", "Palasia, Indore", "Saket, Indore", "Bhawarkua, Indore", "Ranjeet Hanuman, Indore"];

  const menuItems = [
    { label: "Home", path: "/car-detailing", icon: <Compass className="w-5 h-5" /> },
    { label: "Services", path: "/car-detailing/services", icon: <List className="w-5 h-5" /> },
    { label: "Packages", path: "/car-detailing/packages", icon: <Package className="w-5 h-5" /> },
    { label: "My Bookings", path: "/car-detailing/my-bookings", icon: <ShieldCheck className="w-5 h-5" /> },
    { label: "Offers & Coupons", path: "/car-detailing/offers", icon: <Tag className="w-5 h-5" /> },
    { label: "Reviews", path: "/car-detailing/reviews", icon: <Star className="w-5 h-5" /> },
    { label: "About Us", path: "/car-detailing/about", icon: <Info className="w-5 h-5" /> },
    { label: "Contact Us", path: "/car-detailing/contact", icon: <MessageSquare className="w-5 h-5" /> },
    { label: "Profile", path: "/car-detailing/profile", icon: <User className="w-5 h-5" /> },
    { label: "Settings", path: "/car-detailing/settings", icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <>
      <nav className="sticky top-0 z-40 bg-white border-b border-zinc-200/80 backdrop-blur-md px-6 py-3 text-zinc-800 shadow-sm -mx-6 -mt-10 mb-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          
          {/* Left: Hamburger & Location */}
          <div className="flex items-center gap-1.5 sm:gap-4">
            <button
              onClick={() => setIsOpen(true)}
              className="p-1.5 hover:bg-zinc-100 rounded-full transition-colors"
            >
              <Menu className="w-6 h-6 text-zinc-800" />
            </button>

            <div className="relative">
              <button
                onClick={() => setShowLocationSelect(!showLocationSelect)}
                className="flex items-center gap-1 text-xs sm:text-sm font-semibold hover:text-luxury-emerald transition-colors py-1.5 px-2.5 sm:px-3 rounded-full bg-zinc-105 border border-zinc-200 text-zinc-800 shadow-sm"
              >
                <MapPin className="w-4 h-4 text-luxury-emerald" />
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
                        className="w-full text-left px-4 py-3 text-xs text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors border-b border-zinc-100 last:border-b-0"
                      >
                        {loc}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Center: DetailPro Brand */}
          <div className="flex flex-col items-center cursor-pointer" onClick={() => navigate("/car-detailing")}>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg tracking-wider text-zinc-800">DETAIL</span>
              <span className="font-extrabold text-lg tracking-wider text-luxury-emerald bg-luxury-emerald/10 px-2 py-0.5 rounded-md">PRO</span>
            </div>
            <span className="text-[9px] tracking-[0.25em] font-semibold text-zinc-400 uppercase -mt-0.5">CAR DETAILING</span>
          </div>

          {/* Right: Notifications Button */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 hover:bg-zinc-100 rounded-full transition-colors text-zinc-800"
            >
              <Bell className="w-5.5 h-5.5" />
              <span className="absolute top-1 right-1 bg-luxury-emerald text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full ring-2 ring-white">
                2
              </span>
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-72 bg-white border border-zinc-200 rounded-20 shadow-premium overflow-hidden z-50 text-zinc-800"
                >
                  <div className="p-4 border-b border-zinc-150 flex justify-between items-center bg-zinc-50">
                    <span className="font-semibold text-sm">Notifications</span>
                    <span className="text-[10px] text-luxury-emerald font-semibold cursor-pointer hover:underline">Mark read</span>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    <div className="p-4 border-b border-zinc-100 hover:bg-zinc-50 cursor-pointer transition-colors">
                      <p className="text-xs font-semibold text-zinc-800 mb-0.5">Booking Confirmed</p>
                      <p className="text-[11px] text-zinc-500">Your Premium Detail for Verna on July 20 is confirmed.</p>
                      <span className="text-[9px] text-zinc-400 block mt-1">2 hours ago</span>
                    </div>
                    <div className="p-4 border-b border-zinc-100 hover:bg-zinc-50 cursor-pointer transition-colors">
                      <p className="text-xs font-semibold text-luxury-emerald mb-0.5">Get 20% OFF Deal</p>
                      <p className="text-[11px] text-zinc-500">Use coupon DETAIL20 at booking checkout before it expires!</p>
                      <span className="text-[9px] text-zinc-400 block mt-1">1 day ago</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </nav>

      {/* Slide-out Sidebar Drawer */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/85 backdrop-blur-sm"
            />

            {/* Sidebar panel */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="relative w-80 bg-white border-r border-zinc-200 h-full flex flex-col z-10 text-zinc-800"
            >
              {/* Header */}
              <div className="p-6 border-b border-zinc-200 flex items-center justify-between">
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-xl tracking-wider">DETAIL</span>
                    <span className="font-extrabold text-xl tracking-wider text-luxury-emerald bg-luxury-emerald/10 px-2 py-0.5 rounded-md">PRO</span>
                  </div>
                  <span className="text-[10px] tracking-[0.25em] font-semibold text-zinc-400 uppercase mt-0.5">CAR DETAILING</span>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-800 rounded-full transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Navigation Items */}
              <div className="flex-grow overflow-y-auto py-4 px-3 scrollbar-none space-y-1">
                {menuItems.map((item, idx) => {
                  const isActive = path === item.path || (item.path !== "/car-detailing" && path.startsWith(item.path));
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        navigate(item.path);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-20 text-sm font-semibold transition-all ${
                        isActive
                          ? 'bg-luxury-emerald text-white shadow-premium'
                          : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-800'
                      }`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-zinc-200 text-xs text-zinc-400 flex justify-between items-center">
                <span>© 2026 DetailPro Premium</span>
                <span className="text-luxury-emerald hover:underline cursor-pointer" onClick={() => { navigate("/car-detailing/settings"); setIsOpen(false); }}>v1.0.4</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
