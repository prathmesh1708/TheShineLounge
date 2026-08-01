import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, MapPin, User, FileText, ArrowRight, XCircle, CreditCard, ShieldAlert } from 'lucide-react';
import { Toast } from './carDetailingUI';
import CarDetailingInvoiceModal from './carDetailingInvoiceModal';
import { cancelBooking, payRemainingBalance } from '../services/carDetailingApi';

export default function CarDetailingBookingCard({ booking = {} }) {
  const navigate = useNavigate();

  // Modals state
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);

  // Form states for modal inputs
  const [cancelReason, setCancelReason] = useState("Change of plans");

  // Feedback Toast
  const [toastMsg, setToastMsg] = useState("");
  const [toastOpen, setToastOpen] = useState(false);
  const [toastType, setToastType] = useState("success");

  const handleTrack = () => {
    navigate(`/car-detailing/tracking?id=${booking?.id || 'BK-0000'}`);
  };

  const handleConfirmCancel = async () => {
    await cancelBooking(booking.id, cancelReason);
    setShowCancelModal(false);
    setToastMsg(`Booking ${booking.id} cancelled as per policy.`);
    setToastType("warning");
    setToastOpen(true);
  };

  const handleConfirmPayRemaining = async () => {
    await payRemainingBalance(booking.id, "Online UPI/Card");
    setShowPayModal(false);
    setToastMsg(`Remaining balance of ₹${booking.remainingAmount || (booking.price - (booking.depositAmount || 0))} paid successfully!`);
    setToastType("success");
    setToastOpen(true);
  };

  const statusColors = {
    Upcoming: "bg-blue-500/10 text-blue-600 border-blue-500/25",
    Completed: "bg-emerald-500/10 text-emerald-600 border-emerald-500/25",
    Cancelled: "bg-red-500/10 text-red-500 border-red-500/25"
  };

  const currentStatus = booking?.status || "Upcoming";
  const statusBadgeClass = statusColors[currentStatus] || statusColors.Upcoming;

  const totalPrice = Number(booking?.price || 1490);
  const isDepositPaid = booking?.paymentType === "Deposit Paid" || booking?.paymentStatus === "Deposit Paid";
  const remainingBal = Number(booking?.remainingAmount || (isDepositPaid ? totalPrice - Number(booking?.depositAmount || Math.round(totalPrice * 0.25)) : 0));

  return (
    <div className="bg-white border border-zinc-200/85 rounded-24 p-6 relative flex flex-col justify-between gap-6 shadow-premium text-zinc-800">
      
      {/* Top row: ID, Status & Package */}
      <div className="flex justify-between items-start gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider font-mono">
              {booking?.id || 'BK-1001'}
            </span>
            {isDepositPaid && remainingBal > 0 && (
              <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold border border-amber-300">
                Deposit Paid (Bal: ₹{remainingBal})
              </span>
            )}
            {booking?.paymentStatus === "Fully Paid" && (
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold border border-emerald-300">
                Fully Paid
              </span>
            )}
          </div>

          <h3 className="text-lg font-bold text-zinc-800 leading-tight">
            {booking?.package || booking?.item || 'Premium Detail'}
          </h3>
        </div>

        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusBadgeClass}`}>
          {currentStatus}
        </span>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-b border-zinc-100 py-4 text-xs md:text-sm text-zinc-600">
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <Car className="w-4 h-4 text-luxury-emerald" />
            <span className="font-semibold text-zinc-800">
              {booking?.vehicle || 'Tesla Model 3'} ({booking?.vehicleNo || 'MP-09-AB-1234'})
            </span>
          </div>
          {booking?.technician && booking?.technician !== "None" && (
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-luxury-emerald" />
              <span>Detailer: <strong className="text-zinc-800">{booking.technician}</strong></span>
            </div>
          )}
        </div>

        <div className="space-y-2.5">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-luxury-emerald mt-0.5" />
            <span className="line-clamp-2">{booking?.location || booking?.address || 'Palasia Main Rd, Indore'}</span>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-zinc-100">
            <span className="text-xs text-zinc-400 uppercase font-semibold">Price Breakdown:</span>
            <span className="text-sm font-extrabold text-zinc-900">
              Total: ₹{totalPrice.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* Actions Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        
        {/* Left Actions: Pay Remaining Balance */}
        <div>
          {currentStatus === "Upcoming" && remainingBal > 0 && (
            <button
              onClick={() => setShowPayModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-16 shadow-sm transition-all"
            >
              <CreditCard className="w-4 h-4" />
              <span>Pay Remaining Balance (₹{remainingBal})</span>
            </button>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex flex-wrap items-center gap-2.5 ml-auto">
          {/* Invoice */}
          <button
            onClick={() => setShowInvoiceModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-zinc-200 hover:border-zinc-300 text-zinc-700 text-xs font-bold rounded-16 shadow-sm transition-all hover:bg-zinc-50"
          >
            <FileText className="w-4 h-4 text-luxury-emerald" />
            <span>GST Invoice</span>
          </button>

          {/* Cancel for Upcoming */}
          {currentStatus === "Upcoming" && (
            <>
              <button
                onClick={() => setShowCancelModal(true)}
                className="flex items-center gap-1 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-16 transition-all border border-red-200/60"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>

              <button
                onClick={handleTrack}
                className="flex items-center gap-1.5 px-4 py-2 bg-luxury-emerald hover:bg-luxury-emeraldHover text-white text-xs font-bold rounded-16 shadow-premium transition-all"
              >
                <span>Track Progress</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Invoice Modal */}
      <CarDetailingInvoiceModal
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        booking={booking}
      />

      {/* Cancel Modal with Policy */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl border border-zinc-200">
            <h3 className="text-lg font-bold text-red-600 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5" />
              <span>Cancel Appointment & Refund Policy</span>
            </h3>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-20 space-y-2 text-xs text-amber-900">
              <strong className="block font-bold">Company Cancellation & Refund Policy:</strong>
              <ul className="list-disc pl-4 space-y-1 font-medium">
                <li>Cancellation &gt; 24 hrs prior: <strong>100% Full Deposit Refund</strong>.</li>
                <li>Cancellation &lt; 24 hrs prior: <strong>50% Deposit Refund</strong> to cover technician prep.</li>
              </ul>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-600 block">Reason for Cancellation</label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-20 text-xs font-semibold text-zinc-800 outline-none"
              >
                <option value="Change of plans">Change of plans</option>
                <option value="Vehicle sold / unavailable">Vehicle sold / unavailable</option>
                <option value="Booked another service">Booked another service</option>
                <option value="Other">Other reason</option>
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowCancelModal(false)}
                className="w-1/2 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold rounded-20"
              >
                Don't Cancel
              </button>
              <button
                onClick={handleConfirmCancel}
                className="w-1/2 py-3 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-20 shadow-md"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pay Remaining Modal */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl border border-zinc-200">
            <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-luxury-emerald" />
              <span>Pay Remaining Balance</span>
            </h3>

            <div className="p-4 bg-luxury-emerald/5 border border-luxury-emerald/20 rounded-20 flex justify-between items-center text-sm">
              <span className="font-semibold text-zinc-600">Balance Due:</span>
              <span className="text-xl font-extrabold text-luxury-emerald font-mono">₹{remainingBal}</span>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-600 block">Select Instant Payment Method</label>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" className="p-3 bg-zinc-50 border border-luxury-emerald/50 rounded-20 text-xs font-bold text-luxury-emerald text-center">
                  UPI / GPay / PhonePe
                </button>
                <button type="button" className="p-3 bg-zinc-50 border border-zinc-200 rounded-20 text-xs font-bold text-zinc-700 text-center">
                  Credit / Debit Card
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowPayModal(false)}
                className="w-1/2 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold rounded-20"
              >
                Pay Later On-Site
              </button>
              <button
                onClick={handleConfirmPayRemaining}
                className="w-1/2 py-3 bg-luxury-emerald hover:bg-luxury-emeraldHover text-white text-xs font-bold rounded-20 shadow-premium"
              >
                Pay ₹{remainingBal} Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Toast */}
      <Toast
        isOpen={toastOpen}
        onClose={() => setToastOpen(false)}
        message={toastMsg}
        type={toastType}
      />

    </div>
  );
}
