import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, BadgePercent } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import CarDetailingOfferCard from '../components/carDetailingOfferCard';
import { OFFERS } from '../services/carDetailingApi';

export default function CarDetailingOffersPage() {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-12 max-w-4xl mx-auto text-zinc-800"
    >
      
      {/* Title Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-zinc-850">Detailing Offers</h1>
        <p className="text-xs md:text-sm text-zinc-555 font-semibold mt-1">
          Claim verified coupons, cashback, and seasonal detailing promotions.
        </p>
      </div>

      {/* Promotional Banner */}
      <div className="relative bg-gradient-to-r from-luxury-emerald/10 via-zinc-50 to-white border border-luxury-emerald/25 rounded-24 p-8 overflow-hidden shadow-premium flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-3 z-10 max-w-xl text-center md:text-left">
          <span className="inline-flex items-center gap-1 bg-luxury-emerald/15 border border-luxury-emerald/30 py-1 px-3 rounded-full text-xs font-bold text-luxury-emerald">
            <BadgePercent className="w-4 h-4" />
            <span>SEASONAL DEAL</span>
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-zinc-800">Monsoon Shield Detailing Festival</h2>
          <p className="text-xs md:text-sm text-zinc-500 font-semibold leading-relaxed">
            Get up to 20% discount on rain repellent windshield installations, 9H nano ceramic body coatings, and paint protection films (PPF). Prevent water logging marks and paint corrosion.
          </p>
        </div>

        <button
          onClick={() => navigate('/car-detailing/booking?coupon=RAIN15')}
          className="z-10 py-4 px-6 bg-luxury-emerald hover:bg-luxury-emeraldHover text-white text-xs font-extrabold rounded-20 shadow-premium transition-all whitespace-nowrap"
        >
          Book Monsoon Slot
        </button>
      </div>

      {/* Offers Cards Grid */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold tracking-tight text-zinc-800">Active Coupon Codes</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {OFFERS.map((offer) => (
            <CarDetailingOfferCard key={offer.id} offer={offer} />
          ))}
        </div>
      </div>

      {/* Detailing Cashback terms block */}
      <div className="bg-white border border-zinc-200/85 rounded-24 p-6 md:p-8 space-y-4 shadow-premium">
        <h3 className="text-lg font-bold text-zinc-800 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-luxury-emerald" />
          <span>How to Apply Coupons & Cashbacks</span>
        </h3>
        <ul className="space-y-3 text-xs md:text-sm text-zinc-500 font-semibold list-disc list-inside leading-relaxed">
          <li>Copy coupon code block above and paste it on Step 6 (Review & Checkout) of the booking form.</li>
          <li>Each coupon requires a minimum subtotal value before tax (e.g. DETAIL20 requires ₹1,500 minimum).</li>
          <li>Only one coupon can be applied per detailing appointment.</li>
          <li>Cashback amounts are instantly adjusted as price discounts during scheduling.</li>
        </ul>
      </div>

    </motion.div>
  );
}
