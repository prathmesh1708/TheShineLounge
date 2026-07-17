import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Heart, MapPin, User, FileText, ArrowRight } from 'lucide-react';
import { Toast } from './dogWashUI';

export default function DogWashBookingCard({ booking }) {
  const navigate = useNavigate();
  const [showToast, setShowToast] = useState(false);

  const handleTrack = () => {
    navigate(`/dog-wash/tracking?id=${booking.id}`);
  };

  const handleInvoice = () => {
    setShowToast(true);
  };

  const statusColors = {
    Upcoming: "bg-blue-500/10 text-blue-600 border-blue-500/25",
    Completed: "bg-grooming-primary/10 text-grooming-primary border-grooming-primary/25",
    Cancelled: "bg-red-500/10 text-red-500 border-red-500/25"
  };

  return (
    <div className="bg-white border border-zinc-200/85 rounded-24 p-6 relative flex flex-col justify-between gap-6 shadow-premium text-zinc-800">
      
      {/* Top: ID, Status, Package name */}
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

      {/* Details list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-b border-zinc-100 py-4 text-xs md:text-sm text-zinc-650">
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 font-semibold">
            <Calendar className="w-4 h-4 text-grooming-primary" />
            <span>{booking.date}</span>
          </div>
          <div className="flex items-center gap-2 font-semibold">
            <Clock className="w-4 h-4 text-grooming-primary" />
            <span>{booking.time}</span>
          </div>
          <div className="flex items-center gap-2 font-semibold">
            <Heart className="w-4 h-4 text-grooming-primary" />
            <span>Pet Name: <strong className="text-zinc-800">{booking.vehicle}</strong></span>
          </div>
        </div>

        <div className="space-y-2.5">
          <div className="flex items-start gap-2 font-semibold">
            <MapPin className="w-4 h-4 text-grooming-primary mt-0.5" />
            <span className="line-clamp-2">{booking.location}</span>
          </div>
          {booking.technician !== "None" && (
            <div className="flex items-center gap-2 font-semibold">
              <User className="w-4 h-4 text-grooming-primary" />
              <span>Groomer: <strong className="text-zinc-800">{booking.technician}</strong></span>
            </div>
          )}
          <div className="flex items-center gap-2 pt-0.5">
            <span className="text-xs text-zinc-450 uppercase font-bold">Total Paid:</span>
            <span className="text-base font-extrabold text-zinc-800">${booking.price}</span>
          </div>
        </div>
      </div>

      {/* Action controls */}
      <div className="flex justify-end gap-3.5 pt-1">
        {/* Invoice PDF download */}
        <button
          onClick={handleInvoice}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-zinc-200 hover:border-zinc-300 text-zinc-700 text-xs font-bold rounded-20 shadow-sm transition-all hover:bg-zinc-50"
        >
          <FileText className="w-4 h-4 text-grooming-primary" />
          <span>Receipt</span>
        </button>

        {/* Tracking page */}
        {booking.status === "Upcoming" && (
          <button
            onClick={handleTrack}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-grooming-primary hover:bg-grooming-hover text-white text-xs font-bold rounded-20 shadow-premium transition-all"
          >
            <span>Track Grooming Van</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      <Toast
        isOpen={showToast}
        onClose={() => setShowToast(false)}
        message={`Grooming receipt for ${booking.id} downloaded successfully!`}
        type="success"
      />

    </div>
  );
}
