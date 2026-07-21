import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Info, Sparkles, Check } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Pricing } from '@/components/ui/pricing';
import { buttonVariants } from '@/components/ui/button';

export default function CarDetailingPackagesPage() {
  const detailingPlans = [
    {
      name: "EXPRESS DETAIL",
      price: "790",
      yearlyPrice: "590",
      period: "per month",
      features: [
        "Clay Bar Paint Decontamination",
        "Hand Wax & Synthetic Sealant",
        "Tyre Dressing & Wheel Polish",
        "Interior Dusting & Vacuuming",
        "Microfiber Hand Buffing"
      ],
      description: "Perfect for quick gloss enhancement & surface decontamination",
      buttonText: "Book Express Slot",
      href: "/car-detailing/booking?package=express-detail",
      isPopular: false
    },
    {
      name: "PREMIUM DETAIL",
      price: "1490",
      yearlyPrice: "1190",
      period: "per month",
      features: [
        "Full Exterior Paint Decontamination",
        "Interior Deep Steam Clean & Sanitize",
        "Dashboard & Trim UV Dressing",
        "Air Vent & Crevice Detailing",
        "Premium Leather Clean & Conditioning",
        "Carpet Hot Water Extraction",
        "Signature Premium Wax Shield"
      ],
      description: "Ideal for thorough interior & exterior conditioning",
      buttonText: "Book Premium Slot",
      href: "/car-detailing/booking?package=premium-detail",
      isPopular: true
    },
    {
      name: "ULTIMATE DETAIL",
      price: "2490",
      yearlyPrice: "1990",
      period: "per month",
      features: [
        "Everything in Premium Detail",
        "Single Stage Paint Machine Polish",
        "Engine Bay Degreasing & Polish",
        "Exhaust Tip Polish & Restorer",
        "Wheel Face Ceramic Armor Sealant",
        "Rain-Repellent Windshield Treatment",
        "Ozone Odor Treatment (Cabin)"
      ],
      description: "Premium gloss polishing and protective shields",
      buttonText: "Book Ultimate Slot",
      href: "/car-detailing/booking?package=ultimate-detail",
      isPopular: false
    }
  ];
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6 text-zinc-800"
    >
      {/* Title Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-855">Detailing Packages</h1>
        <p className="text-xs text-zinc-500 font-semibold mt-1.5">
          Choose from basic express wash cycles to multi-stage correction & glass ceramic coatings.
        </p>
      </div>

      {/* Pricing Component */}
      <div className="bg-white border border-zinc-200/80 rounded-24 px-3 py-2.5 shadow-premium">
        <Pricing
          plans={detailingPlans}
          currency="INR"
          title="Simple, Transparent Detailing Pricing"
          description="Choose the detailing package that works best for your vehicle. Annual billing saves 20% on weekly/monthly subscription washes."
        />
      </div>

      {/* Standalone 4th Plan (Luxury Protection) */}
      <div className="relative bg-gradient-to-r from-luxury-emerald/5 via-zinc-50 to-white border border-luxury-emerald/20 rounded-24 p-8 overflow-hidden shadow-premium flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-luxury-emerald/5 blur-3xl rounded-full" />
        <div className="space-y-3 z-10 max-w-xl text-center md:text-left">
          <span className="inline-flex items-center gap-1 bg-luxury-emerald/10 border border-luxury-emerald/20 py-1 px-3 rounded-full text-xs font-bold text-luxury-emerald">
            <Sparkles className="w-3.5 h-3.5" />
            <span>MAXIMUM ARMOR</span>
          </span>
          <h3 className="text-2xl font-extrabold text-zinc-800">Luxury Protection Plan</h3>
          <p className="text-xs md:text-sm text-zinc-500 leading-relaxed font-semibold">
            Ultimate multi-stage paint correction, 9H Ceramic Body Coating (3-Yr Warranty), wheel barrel protection, headlamp sealant, and VIP Priority Booking slots.
          </p>
        </div>
        <div className="z-10 flex flex-col items-center gap-2">
          <div className="text-center md:text-right">
            <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider block">One-time flat</span>
            <span className="text-3xl font-extrabold text-zinc-850">₹4990</span>
          </div>
          <Link
            to="/car-detailing/booking?package=luxury-protection"
            className={`${buttonVariants({ variant: 'default' })} bg-luxury-emerald hover:bg-luxury-emeraldHover text-white py-3.5 px-6 text-xs font-bold rounded-20 shadow-premium transition-all`}
          >
            Book Luxury Armor
          </Link>
        </div>
      </div>

      {/* Detail Inclusions Comparison Table */}
      <div className="space-y-6 pt-6 border-t border-zinc-150">
        <div className="flex items-center gap-2 text-zinc-800">
          <Info className="w-5 h-5 text-luxury-emerald" />
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">Detailing Matrix Comparison</h2>
        </div>
        
        <div className="overflow-x-auto rounded-24 border border-zinc-200 bg-white shadow-premium">
          <table className="w-full text-left text-xs md:text-sm text-zinc-750 border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-800 font-bold">
                <th className="p-4 md:p-5">Treatments</th>
                <th className="p-4 md:p-5 text-center">Basic</th>
                <th className="p-4 md:p-5 text-center">Premium</th>
                <th className="p-4 md:p-5 text-center">Ultimate</th>
                <th className="p-4 md:p-5 text-center">Luxury</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-zinc-150 hover:bg-zinc-50 transition-colors">
                <td className="p-4 md:p-5 font-semibold">Exterior Foam Wash & Rim Dressing</td>
                <td className="p-4 md:p-5 text-center text-luxury-emerald font-extrabold">✔</td>
                <td className="p-4 md:p-5 text-center text-luxury-emerald font-extrabold">✔</td>
                <td className="p-4 md:p-5 text-center text-luxury-emerald font-extrabold">✔</td>
                <td className="p-4 md:p-5 text-center text-luxury-emerald font-extrabold">✔</td>
              </tr>
              <tr className="border-b border-zinc-150 hover:bg-zinc-50 transition-colors">
                <td className="p-4 md:p-5 font-semibold">Interior Vacuum & Console Sanitize</td>
                <td className="p-4 md:p-5 text-center text-luxury-emerald font-extrabold">✔</td>
                <td className="p-4 md:p-5 text-center text-luxury-emerald font-extrabold">✔</td>
                <td className="p-4 md:p-5 text-center text-luxury-emerald font-extrabold">✔</td>
                <td className="p-4 md:p-5 text-center text-luxury-emerald font-extrabold">✔</td>
              </tr>
              <tr className="border-b border-zinc-150 hover:bg-zinc-50 transition-colors">
                <td className="p-4 md:p-5 font-semibold">Deep Steam Extraction (Hot moisture)</td>
                <td className="p-4 md:p-5 text-center text-zinc-300">✘</td>
                <td className="p-4 md:p-5 text-center text-luxury-emerald font-extrabold">✔</td>
                <td className="p-4 md:p-5 text-center text-luxury-emerald font-extrabold">✔</td>
                <td className="p-4 md:p-5 text-center text-luxury-emerald font-extrabold">✔</td>
              </tr>
              <tr className="border-b border-zinc-150 hover:bg-zinc-50 transition-colors">
                <td className="p-4 md:p-5 font-semibold">Leather Treatment & UV Shielding</td>
                <td className="p-4 md:p-5 text-center text-zinc-300">✘</td>
                <td className="p-4 md:p-5 text-center text-luxury-emerald font-extrabold">✔</td>
                <td className="p-4 md:p-5 text-center text-luxury-emerald font-extrabold">✔</td>
                <td className="p-4 md:p-5 text-center text-luxury-emerald font-extrabold">✔</td>
              </tr>
              <tr className="border-b border-zinc-150 hover:bg-zinc-50 transition-colors">
                <td className="p-4 md:p-5 font-semibold">Clay Bar Paint Decontamination</td>
                <td className="p-4 md:p-5 text-center text-zinc-300">✘</td>
                <td className="p-4 md:p-5 text-center text-luxury-emerald font-extrabold">✔</td>
                <td className="p-4 md:p-5 text-center text-luxury-emerald font-extrabold">✔</td>
                <td className="p-4 md:p-5 text-center text-luxury-emerald font-extrabold">✔</td>
              </tr>
              <tr className="border-b border-zinc-150 hover:bg-zinc-50 transition-colors">
                <td className="p-4 md:p-5 font-semibold">Single-Stage Gloss Machine Polish</td>
                <td className="p-4 md:p-5 text-center text-zinc-300">✘</td>
                <td className="p-4 md:p-5 text-center text-zinc-300">✘</td>
                <td className="p-4 md:p-5 text-center text-luxury-emerald font-extrabold">✔</td>
                <td className="p-4 md:p-5 text-center text-luxury-emerald font-extrabold">✔</td>
              </tr>
              <tr className="border-b border-zinc-150 hover:bg-zinc-50 transition-colors">
                <td className="p-4 md:p-5 font-semibold">Engine Bay Degreasing & Dressing</td>
                <td className="p-4 md:p-5 text-center text-zinc-300">✘</td>
                <td className="p-4 md:p-5 text-center text-zinc-300">✘</td>
                <td className="p-4 md:p-5 text-center text-luxury-emerald font-extrabold">✔</td>
                <td className="p-4 md:p-5 text-center text-luxury-emerald font-extrabold">✔</td>
              </tr>
              <tr className="border-b border-zinc-150 hover:bg-zinc-55 hover:bg-zinc-50 transition-colors">
                <td className="p-4 md:p-5 font-semibold">9H Nano Ceramic Coating Armor</td>
                <td className="p-4 md:p-5 text-center text-zinc-300">✘</td>
                <td className="p-4 md:p-5 text-center text-zinc-300">✘</td>
                <td className="p-4 md:p-5 text-center text-zinc-300">✘</td>
                <td className="p-4 md:p-5 text-center text-luxury-emerald font-extrabold">✔</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Priority Shield Seal */}
      <div className="bg-luxury-emerald/5 border border-luxury-emerald/20 rounded-24 p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 text-zinc-800 max-w-4xl mx-auto shadow-sm">
        <ShieldCheck className="w-12 h-12 text-luxury-emerald flex-shrink-0" />
        <div className="space-y-1.5 text-center md:text-left">
          <h4 className="font-extrabold text-lg text-zinc-850">Our Premium Guarantee</h4>
          <p className="text-xs md:text-sm text-zinc-500 leading-relaxed font-semibold">
            All details are handled using soft-touch microfiber equipment, pH-neutral luxury materials, and dry steam extraction machines. We promise a factory-fresh reset or we'll re-detail for free immediately.
          </p>
        </div>
      </div>

    </motion.div>
  );
}
