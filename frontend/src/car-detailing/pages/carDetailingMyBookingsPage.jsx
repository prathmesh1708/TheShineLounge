import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Compass, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import CarDetailingBookingCard from '../components/carDetailingBookingCard';
import { getBookings } from '../services/carDetailingApi';
import { getMyWarranties, formatWarrantyDate } from '../services/warrantyApi';

export default function CarDetailingMyBookingsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Upcoming");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [warranties, setWarranties] = useState([]);

  useEffect(() => {
    getMyWarranties()
      .then((list) => setWarranties(Array.isArray(list) ? list : []))
      .catch(() => setWarranties([]));
  }, []);

  const fetchLatestBookings = () => {
    getBookings()
      .then(res => {
        setBookings(Array.isArray(res) ? res : []);
        setLoading(false);
      })
      .catch(() => {
        setBookings([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchLatestBookings();

    const handleDataChanged = () => {
      fetchLatestBookings();
    };

    window.addEventListener('carDetailingDataChanged', handleDataChanged);
    window.addEventListener('storage', handleDataChanged);

    let bc;
    try {
      bc = new BroadcastChannel('tsl_live_sync');
      bc.onmessage = handleDataChanged;
    } catch (e) {}

    const intervalId = setInterval(fetchLatestBookings, 3000);

    return () => {
      window.removeEventListener('carDetailingDataChanged', handleDataChanged);
      window.removeEventListener('storage', handleDataChanged);
      if (bc) bc.close();
      clearInterval(intervalId);
    };
  }, []);

  const filteredBookings = (bookings || []).filter(b => b && b.status === activeTab);
  const tabs = ["Upcoming", "Completed", "Cancelled", "Warranty"];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-8 max-w-3xl mx-auto text-zinc-800"
    >
      
      {/* Title Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-850">My Bookings</h1>
        <p className="text-xs md:text-sm text-zinc-500 font-semibold mt-1">Manage and track your premium car detailing appointments.</p>
      </div>

      {/* Tabs Selector row */}
      <div className="flex bg-zinc-100 border border-zinc-200 rounded-20 p-1.5 justify-between shadow-sm">
        {tabs.map((tab, idx) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={idx}
              onClick={() => setActiveTab(tab)}
              className={`flex-grow py-3 px-4 text-xs md:text-sm font-bold rounded-16 transition-all ${
                isActive
                  ? 'bg-white text-luxury-emerald border border-zinc-200/50 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-850'
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Warranty tab — certificates issued against detailing work */}
      {activeTab === 'Warranty' && (
        <div className="pt-2 space-y-5">
          {warranties.length === 0 ? (
            <div className="bg-white border border-zinc-200 rounded-24 py-16 text-center shadow-sm">
              <ShieldCheck className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
              <p className="text-sm font-extrabold text-zinc-850">No warranties yet</p>
              <p className="text-xs text-zinc-500 font-semibold mt-1">
                Warranties appear here once a detailing package covered by one is completed.
              </p>
            </div>
          ) : (
            warranties.map((w) => {
              const isActive = w.status === 'Active';
              const isSoon = w.status === 'Expiring Soon';
              const tone = isActive
                ? 'border-emerald-200 bg-emerald-50/50'
                : isSoon
                  ? 'border-amber-200 bg-amber-50/50'
                  : 'border-zinc-200 bg-zinc-50';
              const badge = isActive
                ? 'bg-emerald-100 text-emerald-700'
                : isSoon
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-zinc-200 text-zinc-600';
              return (
                <div key={w._id} className={`rounded-24 border-2 border-dashed p-5 shadow-sm ${tone}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span className="text-[11px] font-black uppercase tracking-wide text-zinc-500">Warranty Certificate</span>
                      </div>
                      <p className="text-lg font-extrabold text-zinc-850 mt-1">{w.warrantyNo}</p>
                      <p className="text-xs font-semibold text-zinc-500">{w.packageName}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[11px] font-black ${badge}`}>{w.status}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-zinc-200/70">
                    {[
                      ['Vehicle', w.vehicleNo || '—'],
                      ['Cover', `${w.years} year${w.years === 1 ? '' : 's'}`],
                      ['Started', formatWarrantyDate(w.startDate)],
                      ['Valid Until', formatWarrantyDate(w.expiryDate)]
                    ].map(([k, v]) => (
                      <div key={k}>
                        <p className="text-[10px] font-black uppercase tracking-wide text-zinc-400">{k}</p>
                        <p className="text-sm font-extrabold text-zinc-850">{v}</p>
                      </div>
                    ))}
                  </div>

                  {isActive && (
                    <p className="text-[11px] font-bold text-emerald-700 mt-3">
                      {w.daysRemaining} days of cover remaining
                    </p>
                  )}
                  {w.notes && (
                    <p className="text-[11px] font-semibold text-zinc-500 mt-2 pt-2 border-t border-zinc-200/70">{w.notes}</p>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Bookings Grid list */}
      <div className="pt-2" style={{ display: activeTab === 'Warranty' ? 'none' : undefined }}>
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
                  <CarDetailingBookingCard key={booking.id} booking={booking} />
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
                  You don't have any bookings listed in the "{activeTab}" category right now.
                </p>
                {activeTab === "Upcoming" && (
                  <button
                    onClick={() => navigate('/car-detailing/services')}
                    className="py-2.5 px-5 bg-luxury-emerald hover:bg-luxury-emeraldHover text-white text-xs font-semibold rounded-20 shadow-premium transition-all flex items-center gap-1.5 mx-auto"
                  >
                    <Compass className="w-4 h-4" />
                    <span>Explore Detailing Menu</span>
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
