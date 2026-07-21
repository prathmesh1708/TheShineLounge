import React from 'react';
import { motion } from 'framer-motion';

export default function HeroBanner({ promo, onExplore }) {
  const defaultPromo = {
    badge: 'BRUNCH SPECIAL',
    title: 'BREAKFAST GOOD DEALS',
    subtitle: 'Discount up to 30% on freshly baked croissants & morning double lattes.',
    link: '/cafe'
  };

  const activePromo = promo || defaultPromo;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="w-full mb-3 relative overflow-hidden rounded-[20px] p-4 sm:p-4.5 shadow-xl border border-[#2A2E36]/60 cursor-pointer"
      style={{
        background: 'linear-gradient(135deg, #122B4F 0%, #0F172A 60%, #15171D 100%)'
      }}
      onClick={onExplore}
    >
      {/* Background Glow Orbs */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#1F5AA8]/30 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-[#FF8C1A]/10 rounded-full blur-xl pointer-events-none" />

      <div className="relative z-10 flex items-start justify-between gap-3">
        {/* Left Text */}
        <div className="max-w-[70%] space-y-1">
          <span className="inline-block text-[10px] font-extrabold tracking-widest text-[#FF8C1A] uppercase">
            {activePromo.badge}
          </span>
          <h2 className="text-base sm:text-lg font-black text-white leading-tight tracking-wide">
            {activePromo.title}
          </h2>
          <p className="text-[11px] text-gray-300 font-medium leading-normal line-clamp-2">
            {activePromo.subtitle}
          </p>
        </div>

        {/* Right Floating Art */}
        <div className="relative flex-shrink-0 flex flex-col items-center pt-1">
          <div className="text-3xl filter drop-shadow-md animate-pulse">
            ☕🥐
          </div>
        </div>
      </div>

      {/* Bottom CTA Button */}
      <div className="mt-2.5 flex justify-end">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={(e) => {
            e.stopPropagation();
            onExplore && onExplore();
          }}
          className="px-4 py-1.5 rounded-full bg-[#1D2027] border border-[#2A2E36] text-white font-bold text-[11px] shadow-md hover:bg-[#FF8C1A] hover:border-[#FF8C1A] transition-all"
        >
          Explore
        </motion.button>
      </div>
    </motion.div>
  );
}
