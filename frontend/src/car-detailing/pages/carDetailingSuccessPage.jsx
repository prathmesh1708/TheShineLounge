import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Calendar, Clock, Car, MapPin, Download, Home, ArrowRight } from 'lucide-react';
import { Toast } from '../components/carDetailingUI';

export default function CarDetailingSuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [toastOpen, setToastOpen] = useState(false);

  // Fallback mock details if navigated directly without state
  const booking = location.state || {
    bookingId: "BK-8239",
    vehicle: "Hyundai Verna (White)",
    item: "Premium Detail",
    date: "2026-07-20",
    time: "08:30 AM - 12:30 PM (Morning)",
    price: 1690,
    address: "Scheme No. 54, Vijay Nagar, Indore"
  };

  const handleDownload = () => {
    setToastOpen(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="max-w-xl mx-auto text-center space-y-8 py-8 text-zinc-800"
    >
      
      {/* 1. Success checkmark banner */}
      <div className="flex flex-col items-center space-y-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.2 }}
          className="w-20 h-20 bg-luxury-emerald/10 border border-luxury-emerald/20 text-luxury-emerald rounded-full flex items-center justify-center shadow-premium"
        >
          <CheckCircle className="w-12 h-12 fill-current text-luxury-emerald bg-white rounded-full" />
        </motion.div>

        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-850">Booking Confirmed!</h1>
        <p className="text-sm text-zinc-500 font-semibold max-w-sm">
          Thank you for choosing DetailPro. Your vehicle detailing appointment is officially scheduled.
        </p>
      </div>

      {/* 2. Receipt Card */}
      <div className="bg-white border border-zinc-200/85 rounded-24 p-6 md:p-8 text-left space-y-6 shadow-premium relative overflow-hidden">
        
        {/* Top bar ID */}
        <div className="flex justify-between items-center border-b border-zinc-100 pb-4">
          <span className="text-xs text-zinc-400 uppercase tracking-widest font-bold">Booking Details</span>
          <span className="text-sm font-bold text-luxury-emerald font-mono">{booking.bookingId}</span>
        </div>

        {/* Info Grid */}
        <div className="space-y-4 text-xs md:text-sm text-zinc-600">
          <div className="flex items-center gap-3">
            <Car className="w-4.5 h-4.5 text-luxury-emerald flex-shrink-0" />
            <span>Vehicle: <strong className="text-zinc-800">{booking.vehicle}</strong></span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-luxury-emerald text-base font-bold">★</span>
            <span>Service: <strong className="text-zinc-800">{booking.item}</strong></span>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="w-4.5 h-4.5 text-luxury-emerald flex-shrink-0" />
            <span>Date: <strong className="text-zinc-800">{booking.date}</strong></span>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="w-4.5 h-4.5 text-luxury-emerald flex-shrink-0" />
            <span>Time Slot: <strong className="text-zinc-800">{booking.time}</strong></span>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="w-4.5 h-4.5 text-luxury-emerald flex-shrink-0 mt-0.5" />
            <span>Location: <span className="text-zinc-800 font-semibold">{booking.address}</span></span>
          </div>
        </div>

        {/* Pricing Total */}
        <div className="border-t border-zinc-100 pt-4 flex justify-between items-center text-zinc-800">
          <span className="text-xs text-zinc-400 uppercase font-bold">Total paid</span>
          <span className="text-2xl font-extrabold text-luxury-emerald">₹{booking.price}</span>
        </div>

      </div>

      {/* 3. Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
        <button
          onClick={handleDownload}
          className="flex items-center justify-center gap-2 py-4 px-6 bg-zinc-50 border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-100 text-zinc-700 font-bold rounded-24 transition-all shadow-sm"
        >
          <Download className="w-4.5 h-4.5" />
          <span>Download Invoice</span>
        </button>

        <button
          onClick={() => navigate('/car-detailing')}
          className="flex items-center justify-center gap-2 py-4 px-6 bg-luxury-emerald hover:bg-luxury-emeraldHover text-white font-medium rounded-24 transition-all shadow-premium"
        >
          <Home className="w-4.5 h-4.5" />
          <span>Return Home</span>
        </button>
      </div>

      <button
        onClick={() => navigate('/car-detailing/my-bookings')}
        className="text-xs md:text-sm font-bold text-luxury-emerald hover:text-luxury-emeraldHover transition-colors inline-flex items-center gap-1 mt-4"
      >
        <span>Track appointment in My Bookings</span>
        <ArrowRight className="w-4 h-4" />
      </button>

      {/* Download Invoice Feedback Toast */}
      <Toast
        isOpen={toastOpen}
        onClose={() => setToastOpen(false)}
        message="Invoice PDF generated and downloaded successfully!"
        type="success"
      />

    </motion.div>
  );
}
