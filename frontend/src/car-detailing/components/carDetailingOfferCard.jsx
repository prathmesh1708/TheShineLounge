import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, Check, Calendar, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CarDetailingOfferCard({ offer }) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(offer.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = () => {
    navigate(`/car-detailing/booking?coupon=${offer.code}`);
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="bg-white border border-zinc-200/85 rounded-24 p-6 relative overflow-hidden flex flex-col justify-between group shadow-premium"
    >
      {/* Decorative gradient corner glow */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-luxury-emerald/5 blur-xl rounded-full -mr-4 -mt-4 transition-all duration-500 group-hover:bg-luxury-emerald/10" />

      <div>
        {/* Top: Offer badge & Title */}
        <div className="flex justify-between items-start gap-4">
          <span className="bg-luxury-emerald/10 text-luxury-emerald border border-luxury-emerald/20 text-[10px] tracking-wider uppercase font-bold py-1 px-3 rounded-full">
            {offer.badge}
          </span>
          <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-bold uppercase">
            <Calendar className="w-3.5 h-3.5" />
            <span>Till {offer.validUntil}</span>
          </div>
        </div>

        <h3 className="text-lg font-bold text-zinc-800 mt-4 leading-snug group-hover:text-luxury-emerald transition-colors">
          {offer.title}
        </h3>
        <p className="text-zinc-500 text-xs md:text-sm mt-2 leading-relaxed">
          {offer.description}
        </p>
      </div>

      {/* Coupon Code section */}
      <div className="mt-8 flex gap-3 items-center">
        {/* Copy Coupon Box */}
        <div className="flex-grow flex items-center justify-between py-2.5 px-4 bg-zinc-50 border border-zinc-150 rounded-20 text-sm font-semibold select-all font-mono text-zinc-700">
          <span className="text-zinc-800 tracking-widest">{offer.code}</span>
          <button
            onClick={handleCopy}
            className="text-zinc-400 hover:text-zinc-700 transition-colors p-1 rounded hover:bg-zinc-100"
            title="Copy Coupon"
          >
            {copied ? (
              <Check className="w-4.5 h-4.5 text-luxury-emerald" />
            ) : (
              <Copy className="w-4.5 h-4.5" />
            )}
          </button>
        </div>

        {/* Action button */}
        <button
          onClick={handleApply}
          className="p-3 bg-luxury-emerald hover:bg-luxury-emeraldHover text-white rounded-20 shadow-premium transition-all flex items-center justify-center gap-1.5 text-xs font-bold"
        >
          <span>Use</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

    </motion.div>
  );
}
