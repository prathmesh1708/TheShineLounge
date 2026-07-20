import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { PrimaryButton, SecondaryButton } from './carDetailingUI';

export default function CarDetailingPackageCard({ pack }) {
  const navigate = useNavigate();

  const handleBook = () => {
    navigate(`/car-detailing/booking?package=${pack.id}`);
  };

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`relative flex flex-col justify-between p-4 sm:p-6 md:p-8 rounded-24 border transition-all ${
        pack.popular
          ? 'bg-gradient-to-b from-[#FF6B00]/5 to-white border-[#FF6B00] shadow-[0_12px_40px_-10px_rgba(255,107,0,0.25)] ring-1 ring-[#FF6B00]/20'
          : 'bg-white border-zinc-200/85 hover:border-zinc-300 hover:shadow-[0_12px_30px_-10px_rgba(255,107,0,0.15)] shadow-sm'
      } text-zinc-800 h-full`}
    >
      {/* Popular Badge */}
      {pack.popular && (
        <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#FF6B00] text-white text-[9px] sm:text-[10px] uppercase tracking-widest font-extrabold px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full shadow-premium border border-white/10 whitespace-nowrap">
          {pack.badge}
        </span>
      )}

      {/* Header info */}
      <div className="space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 sm:gap-2">
          <div>
            <h3 className="text-sm sm:text-lg md:text-xl font-extrabold text-zinc-855 leading-tight truncate">{pack.name}</h3>
            <div className="flex items-center gap-1 text-zinc-400 text-[10px] sm:text-xs mt-1 sm:mt-1.5 font-semibold">
              <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>{pack.duration}</span>
            </div>
          </div>
          <div className="flex flex-row sm:flex-col items-baseline sm:items-end gap-1.5 sm:gap-0.5 mt-1 sm:mt-0">
            <span className="text-base sm:text-xl md:text-2xl font-extrabold text-zinc-850">₹{pack.price * 10}</span>
            <span className="text-[8px] sm:text-[9px] text-zinc-400 font-semibold uppercase">starting at</span>
          </div>
        </div>

        {/* Feature List */}
        <div className="border-t border-zinc-100 pt-3 sm:pt-6">
          <ul className="space-y-2 sm:space-y-3">
            {pack.features.slice(0, 4).map((feature, idx) => (
              <li key={idx} className="flex gap-2 sm:gap-3 items-start text-[10px] sm:text-xs md:text-sm text-zinc-650 font-medium">
                <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#FF6B00] flex-shrink-0 mt-0.5" />
                <span className="truncate sm:whitespace-normal">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Footer Booking CTA */}
      <div className="mt-4 sm:mt-8 pt-3 sm:pt-6 border-t border-zinc-100">
        {pack.popular ? (
          <PrimaryButton onClick={handleBook}>Book Now</PrimaryButton>
        ) : (
          <SecondaryButton onClick={handleBook}>Select</SecondaryButton>
        )}
      </div>

    </motion.div>
  );
}
