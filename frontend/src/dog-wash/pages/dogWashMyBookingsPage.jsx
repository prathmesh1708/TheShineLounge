import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Compass } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import DogWashBookingCard from '../components/dogWashBookingCard';
import { getBookings } from '../services/dogWashApi';

export default function DogWashMyBookingsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Upcoming");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBookings().then(res => {
      setBookings(res);
      setLoading(false);
    });
  }, []);

  const filteredBookings = bookings.filter(b => b.status === activeTab);
  const tabs = ["Upcoming", "Completed", "Cancelled"];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-8 max-w-3xl mx-auto text-zinc-800"
    >
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-855">Grooming Bookings</h1>
        <p className="text-xs md:text-sm text-zinc-500 font-semibold mt-1">Manage, cancel, and track your active mobile grooming slots.</p>
      </div>

      <div className="flex bg-zinc-100 border border-zinc-200 rounded-20 p-1.5 justify-between shadow-sm">
        {tabs.map((tab, idx) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={idx}
              onClick={() => setActiveTab(tab)}
              className={`flex-grow py-3 px-4 text-xs md:text-sm font-bold rounded-16 transition-all ${
                isActive
                  ? 'bg-white text-grooming-primary border border-zinc-200/50 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      <div className="pt-2">
        {loading ? (
          <div className="space-y-6">
            <div className="h-44 bg-white border border-zinc-200 rounded-24 animate-pulse shadow-sm" />
            <div className="h-44 bg-white border border-zinc-200 rounded-24 animate-pulse shadow-sm" />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {filteredBookings.length > 0 ? (
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {filteredBookings.map((booking) => (
                  <DogWashBookingCard key={booking.id} booking={booking} />
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="empty-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white border border-zinc-200 rounded-24 p-12 text-center flex flex-col items-center justify-center space-y-4 shadow-premium"
              >
                <ShieldAlert className="w-12 h-12 text-zinc-300" />
                <h3 className="text-lg font-bold text-zinc-850">No {activeTab} Bookings</h3>
                <p className="text-xs text-zinc-500 max-w-xs leading-relaxed font-semibold">
                  You don't have any bookings scheduled in the "{activeTab}" category right now.
                </p>
                {activeTab === "Upcoming" && (
                  <button
                    onClick={() => navigate('/dog-wash/services')}
                    className="py-2.5 px-5 bg-grooming-primary hover:bg-grooming-hover text-white text-xs font-semibold rounded-20 shadow-premium transition-all flex items-center gap-1.5 mx-auto"
                  >
                    <Compass className="w-4 h-4" />
                    <span>Explore Grooming Menu</span>
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

    </motion.div>
  );
}
