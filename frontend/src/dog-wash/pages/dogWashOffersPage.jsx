import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, BadgePercent } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import DogWashOfferCard from '../components/dogWashOfferCard';
import { OFFERS } from '../services/dogWashApi';

export default function DogWashOffersPage() {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-12 max-w-4xl mx-auto text-zinc-800"
    >
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-zinc-855">Coupons & Offers</h1>
        <p className="text-xs md:text-sm text-zinc-500 font-semibold mt-1">
          Apply active promo codes at checkout to claim grooming savings.
        </p>
      </div>

      {/* Monsoon/Seasonal Promo Banner */}
      <div className="relative bg-gradient-to-r from-grooming-primary/10 via-zinc-50 to-white border border-grooming-primary/25 rounded-24 p-8 overflow-hidden shadow-premium flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-3 z-10 max-w-xl text-center md:text-left">
          <span className="inline-flex items-center gap-1 bg-grooming-primary/10 border border-grooming-primary/20 py-1 px-3 rounded-full text-xs font-bold text-grooming-primary">
            <BadgePercent className="w-4 h-4" />
            <span>MIDWEEK SPECIAL</span>
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-zinc-805">Wednesday Bathing Discounts</h2>
          <p className="text-xs md:text-sm text-zinc-500 font-semibold leading-relaxed">
            Avoid weekend rushes! Schedule a warm shampoo wash, undercoat blowout, or ear clean on Wednesdays to claim a flat $5 discount using coupon **TEALWED**.
          </p>
        </div>

        <button
          onClick={() => navigate('/dog-wash/booking?coupon=TEALWED')}
          className="z-10 py-4 px-6 bg-grooming-primary hover:bg-grooming-hover text-white text-xs font-extrabold rounded-20 shadow-premium transition-all whitespace-nowrap"
        >
          Book Midweek Slot
        </button>
      </div>

      <div className="space-y-6">
        <h3 className="text-xl font-bold tracking-tight text-zinc-800">Active Coupons</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {OFFERS.map((offer) => (
            <DogWashOfferCard key={offer.id} offer={offer} />
          ))}
        </div>
      </div>

      <div className="bg-white border border-zinc-200/85 rounded-24 p-6 md:p-8 space-y-4 shadow-premium">
        <h3 className="text-lg font-bold text-zinc-800 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-grooming-primary" />
          <span>Rules & Guidelines</span>
        </h3>
        <ul className="space-y-3 text-xs md:text-sm text-zinc-500 font-semibold list-disc list-inside leading-relaxed">
          <li>Copy code block above and paste it on Step 6 (Review & Checkout) of the booking form.</li>
          <li>Each coupon requires a minimum subtotal value (e.g. FIRSTPAW15 requires $20 minimum).</li>
          <li>Only one coupon can be applied per dog wash slot.</li>
          <li>All cashback/flat reductions are instantly calculated and adjusted before final tax receipt.</li>
        </ul>
      </div>

    </motion.div>
  );
}
