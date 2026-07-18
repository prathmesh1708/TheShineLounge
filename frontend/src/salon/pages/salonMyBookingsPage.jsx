import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, User, MapPin, ChevronRight, MessageSquare, Receipt } from 'lucide-react';

import { MOCK_BOOKINGS } from '../services/salonApi';
import { SecondaryButton, Modal, EmptyState } from '../components/salonUI';

export default function SalonMyBookingsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Upcoming");
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Load from static mock data + localStorage
  useEffect(() => {
    const local = JSON.parse(localStorage.getItem("salon_bookings") || "[]");
    setBookings([...local, ...MOCK_BOOKINGS]);
  }, []);

  const filteredBookings = bookings.filter(b => b.status === activeTab);

  const tabs = ["Upcoming", "Completed", "Cancelled"];

  const handleOpenDetails = (booking) => {
    setSelectedBooking(booking);
    setShowDetailsModal(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4 pb-12 md:space-y-6 md:pb-16 text-zinc-800"
    >
      
      {/* Title */}
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-zinc-855">My Appointments</h1>
        <p className="text-xs md:text-sm text-zinc-500 font-semibold mt-1.5">
          Review upcoming slots, complete service history, and access receipt invoices.
        </p>
      </div>

      {/* Tab Selectors */}
      <div className="flex border-b border-zinc-200 gap-6">
        {tabs.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative pb-3 text-xs md:text-sm font-extrabold transition-colors ${
                isActive ? 'text-primary' : 'text-zinc-400 hover:text-zinc-650'
              }`}
            >
              <span>{tab}</span>
              {isActive && (
                <motion.div
                  layoutId="bookingTabBorder"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* List container */}
      <div className="space-y-6 max-w-3xl">
        <AnimatePresence mode="wait">
          {filteredBookings.length > 0 ? (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-5"
            >
              {filteredBookings.map((b) => (
                <div
                  key={b.id}
                  onClick={() => handleOpenDetails(b)}
                  className="bg-white border border-zinc-200/80 hover:border-zinc-300 rounded-24 p-5 md:p-6 shadow-sm hover:shadow transition-all duration-300 flex flex-col md:flex-row items-stretch justify-between gap-6 cursor-pointer"
                >
                  {/* Left Column: Details */}
                  <div className="space-y-3.5 flex-grow">
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] uppercase tracking-widest font-extrabold px-2.5 py-1 rounded-full border ${
                        b.status === "Upcoming" ? 'bg-primary/5 text-primary border-primary/20' :
                        b.status === "Completed" ? 'bg-emerald-500/5 text-emerald-500 border-emerald-500/20' :
                        'bg-red-500/5 text-red-500 border-red-500/20'
                      }`}>
                        {b.status}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-bold tracking-wide">ID: {b.id}</span>
                    </div>

                    <h3 className="font-extrabold text-base md:text-lg text-zinc-850 leading-tight">{b.package}</h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-zinc-500 font-semibold">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-zinc-400" />
                        <span>{b.date}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-zinc-400" />
                        <span>{b.time}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <User className="w-4 h-4 text-zinc-400" />
                        <span>Stylist: {b.stylist}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-zinc-400" />
                        <span className="truncate max-w-[180px]">{b.location}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex md:flex-col justify-end items-end gap-3 border-t md:border-t-0 md:border-l border-zinc-100 pt-4 md:pt-0 md:pl-6 flex-shrink-0">
                    <div className="text-right hidden md:block">
                      <span className="text-[9px] text-zinc-400 uppercase font-bold block">Grand Total</span>
                      <span className="text-lg font-extrabold text-zinc-800">${b.price}</span>
                    </div>
                    <button className="flex items-center gap-1 text-xs font-bold text-primary hover:text-primary/80 transition-colors uppercase tracking-wider">
                      <span>Manage Details</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <EmptyState
                title={`No ${activeTab} Bookings`}
                desc={`You don't have any appointments in the ${activeTab.toLowerCase()} category. Tap below to find styling services.`}
                actionText="Book Salon Service"
                onAction={() => navigate("/salon/services")}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Booking Details Modal */}
      <Modal isOpen={showDetailsModal} onClose={() => setShowDetailsModal(false)} title="Appointment Details">
        {selectedBooking && (
          <div className="space-y-6 text-zinc-800 p-2 text-left">
            <div className="flex justify-between items-center pb-2 border-b border-zinc-100">
              <div>
                <span className="text-[10px] text-zinc-400 font-bold block uppercase tracking-wide">Reference ID</span>
                <span className="font-extrabold text-zinc-850 select-all tracking-wider text-sm">{selectedBooking.id}</span>
              </div>
              <span className={`text-[10px] uppercase tracking-widest font-extrabold px-3 py-1.5 rounded-full border ${
                selectedBooking.status === "Upcoming" ? 'bg-primary/5 text-primary border-primary/20 shadow-sm' :
                selectedBooking.status === "Completed" ? 'bg-emerald-500/5 text-emerald-500 border-emerald-500/20 shadow-sm' :
                'bg-red-500/5 text-red-500 border-red-500/20 shadow-sm'
              }`}>
                {selectedBooking.status}
              </span>
            </div>

            <div className="space-y-3.5">
              <h4 className="font-extrabold text-base">{selectedBooking.package}</h4>
              <div className="space-y-2 text-xs text-zinc-550 font-semibold leading-relaxed">
                <p><span className="text-zinc-400">Date:</span> {selectedBooking.date}</p>
                <p><span className="text-zinc-400">Time Window:</span> {selectedBooking.time}</p>
                <p><span className="text-zinc-400">Stylist Assigned:</span> {selectedBooking.stylist}</p>
                <p><span className="text-zinc-400">Salon Location:</span> {selectedBooking.location}</p>
                <p><span className="text-zinc-400">Price Paid:</span> ${selectedBooking.price}</p>
              </div>
            </div>

            {/* Tracking timeline (Only if upcoming) */}
            {selectedBooking.status === "Upcoming" && selectedBooking.timeline && selectedBooking.timeline.length > 0 && (
              <div className="space-y-4 border-t border-zinc-100 pt-5">
                <h4 className="font-extrabold text-sm uppercase tracking-wider text-zinc-400">Stylist Slot Progress</h4>
                <div className="space-y-4 pl-4 relative before:absolute before:left-1 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-150">
                  {selectedBooking.timeline.map((step, idx) => (
                    <div key={idx} className="flex gap-4 relative items-start">
                      <div className={`w-2.5 h-2.5 rounded-full -ml-3 mt-1.5 relative z-10 ring-4 ${
                        step.active ? 'bg-primary ring-primary/20' : 'bg-zinc-200 ring-white'
                      }`} />
                      <div>
                        <p className={`text-xs font-bold ${step.active ? 'text-zinc-800' : 'text-zinc-400'}`}>
                          {step.status}
                        </p>
                        <span className="text-[10px] text-zinc-450 block font-semibold mt-0.5">{step.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CTA Footers */}
            <div className="pt-4 border-t border-zinc-100 flex gap-3">
              {selectedBooking.status === "Upcoming" ? (
                <SecondaryButton
                  onClick={() => {
                    const confirmCancel = window.confirm("Are you sure you want to cancel this booking?");
                    if (confirmCancel) {
                      // Update in localStorage
                      const local = JSON.parse(localStorage.getItem("salon_bookings") || "[]");
                      const updated = local.map(b => b.id === selectedBooking.id ? { ...b, status: "Cancelled" } : b);
                      localStorage.setItem("salon_bookings", JSON.stringify(updated));
                      alert("Booking Cancelled.");
                      setShowDetailsModal(false);
                      window.location.reload();
                    }
                  }}
                  className="w-full text-red-500 border-red-200 hover:border-red-300 hover:bg-red-50/50 text-xs py-3 rounded-18 font-extrabold"
                >
                  Cancel Slot
                </SecondaryButton>
              ) : selectedBooking.status === "Completed" ? (
                <SecondaryButton
                  onClick={() => navigate(`/salon/reviews`)}
                  className="w-full text-xs py-3 rounded-18 font-extrabold flex items-center justify-center gap-1.5"
                >
                  <MessageSquare className="w-4 h-4 text-zinc-400" />
                  <span>Write Styling Review</span>
                </SecondaryButton>
              ) : null}
            </div>

          </div>
        )}
      </Modal>

    </motion.div>
  );
}
