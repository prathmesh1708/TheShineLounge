import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Calendar, Receipt, Home, ShieldCheck, Download } from 'lucide-react';

import { PrimaryButton, SecondaryButton, Modal } from '../components/salonUI';

export default function SalonSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  const bookingId = searchParams.get("id") || "BK-8023";
  const finalPrice = searchParams.get("price") || "38";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-md mx-auto py-12 px-6 text-center space-y-8 text-zinc-800 bg-white border border-zinc-200/80 rounded-24 shadow-premium mt-8"
    >
      
      {/* 1. Success Circle Animation */}
      <div className="flex justify-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 15, stiffness: 200, delay: 0.1 }}
          className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center relative"
        >
          <Check className="w-10 h-10 text-primary" />
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="absolute inset-0 rounded-full border border-primary/20"
          />
        </motion.div>
      </div>

      {/* 2. Success Text */}
      <div className="space-y-2">
        <h1 className="text-2xl font-extrabold text-zinc-850 tracking-tight">Booking Confirmed!</h1>
        <p className="text-xs md:text-sm text-zinc-500 font-semibold leading-relaxed px-4">
          Your styling slot has been secured. Your stylist is preparing for your visit.
        </p>
      </div>

      {/* 3. Slot Summary */}
      <div className="bg-[#FAF9F6] border border-zinc-200 rounded-24 p-5 text-left space-y-4">
        <div className="flex justify-between items-center text-xs">
          <span className="text-zinc-450 font-bold uppercase tracking-wider">Reference ID</span>
          <span className="font-extrabold text-zinc-800 select-all tracking-wider">{bookingId}</span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-zinc-450 font-bold uppercase tracking-wider">Amount Paid</span>
          <span className="font-extrabold text-primary text-sm">${finalPrice}</span>
        </div>
        <div className="flex justify-between items-center text-xs border-t border-zinc-150 pt-3">
          <span className="text-zinc-450 font-bold uppercase tracking-wider">Location</span>
          <span className="font-extrabold text-zinc-700 max-w-[150px] truncate text-right">Palasia Square, Indore</span>
        </div>
      </div>

      {/* 4. Action Buttons */}
      <div className="space-y-3.5 pt-4">
        <PrimaryButton onClick={() => navigate("/salon/my-bookings")} className="flex items-center justify-center gap-2 font-extrabold">
          <Calendar className="w-4.5 h-4.5" />
          <span>Go to Appointments</span>
        </PrimaryButton>

        <SecondaryButton onClick={() => setShowInvoiceModal(true)} className="flex items-center justify-center gap-2 font-extrabold">
          <Receipt className="w-4.5 h-4.5 text-zinc-500" />
          <span>View Invoice Receipt</span>
        </SecondaryButton>

        <button
          onClick={() => navigate("/salon")}
          className="text-xs font-bold text-zinc-450 hover:text-zinc-700 transition-colors uppercase tracking-wider flex items-center justify-center gap-1.5 mx-auto pt-2"
        >
          <Home className="w-4 h-4 text-zinc-400" />
          <span>Back to Salon Home</span>
        </button>
      </div>

      {/* Invoice Modal */}
      <Modal isOpen={showInvoiceModal} onClose={() => setShowInvoiceModal(false)} title="Invoice Receipt">
        <div className="space-y-6 text-zinc-800 p-2 text-left">
          
          {/* Header */}
          <div className="text-center space-y-1">
            <h4 className="font-extrabold text-lg">Shine Lounge Studio Receipt</h4>
            <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-widest">Vijay Nagar, Indore, MP</p>
          </div>

          {/* Details */}
          <div className="border-t border-b border-dashed border-zinc-200 py-4 space-y-3 text-xs font-semibold text-zinc-550">
            <div className="flex justify-between">
              <span>Receipt Ref</span>
              <span className="text-zinc-800 font-extrabold">{bookingId}</span>
            </div>
            <div className="flex justify-between">
              <span>Date Issued</span>
              <span className="text-zinc-800 font-extrabold">{new Date().toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Payment Type</span>
              <span className="text-zinc-800 font-extrabold text-primary">Prepaid (Card)</span>
            </div>
          </div>

          {/* Pricing Lines */}
          <div className="space-y-3 text-xs font-semibold text-zinc-650">
            <div className="flex justify-between">
              <span>Treatment Booking</span>
              <span className="text-zinc-800 font-bold">${Number(finalPrice) - 3}</span>
            </div>
            <div className="flex justify-between">
              <span>Convenience Slot Fee</span>
              <span className="text-zinc-800 font-bold">$3</span>
            </div>
            <hr className="border-zinc-100" />
            <div className="flex justify-between text-sm font-extrabold text-zinc-850">
              <span>Total Paid</span>
              <span className="text-primary">${finalPrice}</span>
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-20 p-4.5 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-zinc-500 leading-relaxed font-semibold">
              This receipt acts as confirmation of payment. Please present your booking reference ID at the salon reception desk.
            </p>
          </div>

          <button
            onClick={() => {
              alert("Downloading PDF invoice receipt (simulated)...");
              setShowInvoiceModal(false);
            }}
            className="w-full py-3.5 bg-zinc-900 hover:bg-zinc-950 text-white text-xs font-bold rounded-18 shadow-premium transition-all flex items-center justify-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Download Invoice PDF</span>
          </button>

        </div>
      </Modal>

    </motion.div>
  );
}
