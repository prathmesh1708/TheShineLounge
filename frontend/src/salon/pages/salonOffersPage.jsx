import React from 'react';
import { motion } from 'framer-motion';
import { Gift, Sparkles, Award } from 'lucide-react';

import { OFFERS } from '../services/salonApi';
import SalonOfferCard from '../components/salonOfferCard';

export default function SalonOffersPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 pb-12 md:space-y-10 md:pb-16 text-zinc-800"
    >
      
      {/* Title */}
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-zinc-855">Special Deals & Offers</h1>
        <p className="text-xs md:text-sm text-zinc-500 font-semibold mt-1.5 font-sans">
          Copy exclusive beauty coupon codes, collect refer credits, and view flat cashbacks.
        </p>
      </div>

      {/* Promotional Rewards Banner */}
      <div className="relative bg-gradient-to-r from-primary/10 via-zinc-50 to-white border border-primary/20 rounded-24 p-8 overflow-hidden shadow-premium flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-3xl rounded-full" />
        
        <div className="space-y-3 z-10 max-w-xl text-center md:text-left">
          <span className="inline-flex items-center gap-1 bg-primary/15 border border-primary/25 py-1 px-3 rounded-full text-xs font-bold text-primary">
            <Sparkles className="w-3.5 h-3.5" />
            <span>SHINE CLUB REWARDS</span>
          </span>
          <h3 className="text-2xl font-extrabold text-zinc-850">Earn Points On Every Visit</h3>
          <p className="text-xs md:text-sm text-zinc-550 leading-relaxed font-semibold">
            Collect 10 loyalty points for every $1 spent at the Shine Lounge Salon. Redeem points at checkout for free haircuts, facial updates, or deep-tissue hot stone massage extensions.
          </p>
        </div>

        <div className="z-10 flex flex-col items-center gap-1 flex-shrink-0">
          <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider block">Join Free Today</span>
          <span className="text-3xl font-extrabold text-primary">Shine VIP</span>
        </div>
      </div>

      {/* Coupons grid */}
      <div className="space-y-6">
        <h3 className="font-extrabold text-xl text-zinc-800">Active Coupon Codes</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {OFFERS.map((off) => (
            <SalonOfferCard key={off.id} offer={off} />
          ))}
        </div>
      </div>

      {/* Seasonal & Referral information details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-zinc-150">
        
        {/* Referral Card */}
        <div className="bg-white border border-zinc-200 rounded-24 p-6.5 space-y-4 shadow-sm flex items-start gap-4 hover:border-zinc-300 transition-colors">
          <div className="p-3 bg-primary/10 rounded-20 text-primary">
            <Gift className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-extrabold text-base text-zinc-850">Give $10, Get $10</h3>
            <p className="text-xs md:text-sm text-zinc-500 leading-relaxed font-semibold">
              Invite your friends to book hair styling sessions or relaxing spas. They receive a flat $10 coupon on their first visit, and you get $10 in rewards credits directly added to your Shine account.
            </p>
          </div>
        </div>

        {/* Member Discount Card */}
        <div className="bg-white border border-zinc-200 rounded-24 p-6.5 space-y-4 shadow-sm flex items-start gap-4 hover:border-zinc-300 transition-colors">
          <div className="p-3 bg-primary/10 rounded-20 text-primary">
            <Award className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-extrabold text-base text-zinc-850">Senior & Corporate Savings</h3>
            <p className="text-xs md:text-sm text-zinc-500 leading-relaxed font-semibold">
              Are you a corporate member of partner companies, or a senior citizen? Provide your corporate ID card at the reception counter to enjoy flat 10% discount markdowns on any grooming bills.
            </p>
          </div>
        </div>

      </div>

    </motion.div>
  );
}
