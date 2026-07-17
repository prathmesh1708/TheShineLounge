import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Car, MapPin, User, FileText, ArrowRight } from 'lucide-react';
import { Toast } from './carDetailingUI';

export default function CarDetailingBookingCard({ booking }) {
  const navigate = useNavigate();
  const [showToast, setShowToast] = useState(false);

  const handleTrack = () => {
    navigate(`/car-detailing/tracking?id=${booking.id}`);
  };

  const handleInvoice = () => {
    setShowToast(true);
  };

  const statusColors = {
    Upcoming: "bg-blue-500/10 text-blue-600 border-blue-500/25",
    Completed: "bg-luxury-emerald/10 text-luxury-emerald border-luxury-emerald/25",
    Cancelled: "bg-red-500/10 text-red-500 border-red-500/25"
  };

  return (
    <div className="bg-white border border-zinc-200/85 rounded-24 p-6 relative flex flex-col justify-between gap-6 shadow-premium text-zinc-800">
      
      {/* Top row: ID, Status & Package */}
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider font-mono">
            {booking.id}
          </span>
          <h3 className="text-lg font-bold text-zinc-800 leading-tight">
            {booking.package}
          </h3>
        </div>

        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusColors[booking.status]}`}>
          {booking.status}
        </span>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-b border-zinc-100 py-4 text-xs md:text-sm text-zinc-600">
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-luxury-emerald" />
            <span>{booking.date}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-luxury-emerald" />
            <span>{booking.time}</span>
          </div>
          <div className="flex items-center gap-2">
            <Car className="w-4 h-4 text-luxury-emerald" />
            <span className="font-semibold text-zinc-800">{booking.vehicle}</span>
          </div>
        </div>

        <div className="space-y-2.5">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-luxury-emerald mt-0.5" />
            <span className="line-clamp-2">{booking.location}</span>
          </div>
          {booking.technician !== "None" && (
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-luxury-emerald" />
              <span>Detailer: <strong className="text-zinc-800">{booking.technician}</strong></span>
            </div>
          )}
          <div className="flex items-center gap-2 pt-0.5">
            <span className="text-xs text-zinc-400 uppercase font-semibold">Total Paid:</span>
            <span className="text-base font-extrabold text-zinc-800">₹{booking.price * 10}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3.5 pt-1">
        {/* Invoice */}
        <button
          onClick={handleInvoice}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-zinc-200 hover:border-zinc-300 text-zinc-700 text-xs font-bold rounded-20 shadow-sm transition-all hover:bg-zinc-50"
        >
          <FileText className="w-4 h-4 text-luxury-emerald" />
          <span>Invoice</span>
        </button>

        {/* Tracking */}
        {booking.status === "Upcoming" && (
          <button
            onClick={handleTrack}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-luxury-emerald hover:bg-luxury-emeraldHover text-white text-xs font-bold rounded-20 shadow-premium transition-all"
          >
            <span>Track Detailing</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Invoice feedback Toast */}
      <Toast
        isOpen={showToast}
        onClose={() => setShowToast(false)}
        message={`Invoice for ${booking.id} downloaded successfully!`}
        type="success"
      />

    </div>
  );
}
