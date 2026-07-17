import React, { useState } from 'react';
import { Tag, Copy, Check } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SalonOfferCard({ offer }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(offer.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative bg-gradient-to-b from-[#FDFCF7] to-white border border-zinc-200/80 rounded-24 p-6 shadow-sm hover:border-zinc-300 hover:shadow-md transition-all flex flex-col justify-between h-full group overflow-hidden">
      
      {/* Small dot cutouts on sides for coupon look */}
      <div className="absolute top-1/2 -left-2.5 w-5 h-5 bg-[#FAF9F6] border-r border-zinc-200 rounded-full -translate-y-1/2 z-10" />
      <div className="absolute top-1/2 -right-2.5 w-5 h-5 bg-[#FAF9F6] border-l border-zinc-200 rounded-full -translate-y-1/2 z-10" />

      {/* Offer content */}
      <div className="space-y-3.5 z-10">
        <span className="inline-flex items-center gap-1 bg-primary/10 border border-primary/20 py-1 px-3 rounded-full text-[10px] font-bold text-primary tracking-wider uppercase">
          <Tag className="w-3 h-3" />
          <span>{offer.badge}</span>
        </span>
        
        <h3 className="text-base md:text-lg font-extrabold text-zinc-800 leading-tight">{offer.title}</h3>
        <p className="text-xs md:text-sm text-zinc-500 leading-relaxed font-semibold">{offer.description}</p>
      </div>

      {/* Code copying section */}
      <div className="mt-6 pt-5 border-t border-dashed border-zinc-200 flex items-center justify-between gap-4 z-10">
        <div>
          <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider block">Use Code</span>
          <span className="text-sm font-extrabold text-zinc-800 select-all tracking-wider">{offer.code}</span>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleCopy}
          className={`p-2.5 rounded-15 border transition-all flex items-center gap-1.5 text-xs font-bold ${
            copied
              ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
              : 'bg-zinc-50 border-zinc-200 hover:border-zinc-300 text-zinc-650'
          }`}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              <span className="hidden sm:inline">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 text-zinc-500" />
              <span className="hidden sm:inline">Copy Code</span>
            </>
          )}
        </motion.button>
      </div>

    </div>
  );
}
