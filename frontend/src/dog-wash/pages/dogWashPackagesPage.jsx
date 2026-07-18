import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Info } from 'lucide-react';

import { Pricing } from '@/components/ui/pricing';

export default function DogWashPackagesPage() {
  const groomingPlans = [
    {
      name: "PUPPY'S FIRST SPA",
      price: "25",
      yearlyPrice: "20",
      period: "per month",
      features: [
        "Gentle tearless baby-shampoo",
        "Towel wrap & low-temp dry",
        "Nail clip & ear wipe",
        "Teeth wipe & breath spray",
        "Scented powder finish"
      ],
      description: "Gentle baby-level skin care for young puppies and toy breeds",
      buttonText: "Book Puppy Spa",
      href: "/dog-wash/booking?package=pack-puppy",
      isPopular: false
    },
    {
      name: "ROYAL CANINE GROOM",
      price: "65",
      yearlyPrice: "52",
      period: "per month",
      features: [
        "Full Scissor-style haircut",
        "Organic shampoo & conditioner",
        "Paws pad shave & nail filing",
        "Teeth brushing & minty spray",
        "Lavender skin massage pack",
        "Luxury bandana & treats"
      ],
      description: "Our complete signature breed haircut and spa restoration program",
      buttonText: "Book Royal Spa",
      href: "/dog-wash/booking?package=pack-royal",
      isPopular: true
    },
    {
      name: "UNDERCOAT DESHED RESET",
      price: "45",
      yearlyPrice: "36",
      period: "per month",
      features: [
        "Furminator blowout wash",
        "High-velocity undercoat blast",
        "Carding brush & rake grooming",
        "Nail clipping & paw balm",
        "Shed-stop finishing spray"
      ],
      description: "Deep deshedding blowout cycle to reset shedding undercoats",
      buttonText: "Book Deshed Slot",
      href: "/dog-wash/booking?package=pack-shed",
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
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-855">Spa Packages</h1>
        <p className="text-xs text-zinc-500 font-semibold mt-1.5">
          Select standard puppy care, breed scissor cuts, or deep de-shedding resets.
        </p>
      </div>

      {/* Pricing Component */}
      <div className="bg-white border border-zinc-200/80 rounded-24 px-3 py-2.5 shadow-premium">
        <Pricing
          plans={groomingPlans}
          title="Simple, Transparent Spa Pricing"
          description="Choose the grooming package that works best for your pet. Annual subscription washes save 20% on monthly schedules."
        />
      </div>

      {/* Comparison Table */}
      <div className="space-y-6 pt-6 border-t border-zinc-150">
        <div className="flex items-center gap-2 text-zinc-850">
          <Info className="w-5 h-5 text-grooming-primary" />
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">Spa Comparison Matrix</h2>
        </div>

        <div className="overflow-x-auto rounded-24 border border-zinc-200 bg-white shadow-premium">
          <table className="w-full text-left text-xs md:text-sm text-zinc-700 border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-800 font-bold">
                <th className="p-4 md:p-5">Feature Treatment</th>
                <th className="p-4 md:p-5 text-center">Puppy First</th>
                <th className="p-4 md:p-5 text-center">Royal Canine</th>
                <th className="p-4 md:p-5 text-center">Deshed Reset</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-zinc-150 hover:bg-zinc-50 transition-colors">
                <td className="p-4 md:p-5 font-semibold">Tearless Organic Bath & Towel Dry</td>
                <td className="p-4 md:p-5 text-center text-grooming-primary font-extrabold">✔</td>
                <td className="p-4 md:p-5 text-center text-grooming-primary font-extrabold">✔</td>
                <td className="p-4 md:p-5 text-center text-grooming-primary font-extrabold">✔</td>
              </tr>
              <tr className="border-b border-zinc-150 hover:bg-zinc-50 transition-colors">
                <td className="p-4 md:p-5 font-semibold">Nail Clipping & Ear Cleaning</td>
                <td className="p-4 md:p-5 text-center text-grooming-primary font-extrabold">✔</td>
                <td className="p-4 md:p-5 text-center text-grooming-primary font-extrabold">✔</td>
                <td className="p-4 md:p-5 text-center text-grooming-primary font-extrabold">✔</td>
              </tr>
              <tr className="border-b border-zinc-150 hover:bg-zinc-50 transition-colors">
                <td className="p-4 md:p-5 font-semibold">Breed Scissor-Style Haircut & Sanitary Shave</td>
                <td className="p-4 md:p-5 text-center text-zinc-300">✘</td>
                <td className="p-4 md:p-5 text-center text-grooming-primary font-extrabold">✔</td>
                <td className="p-4 md:p-5 text-center text-zinc-300">✘</td>
              </tr>
              <tr className="border-b border-zinc-150 hover:bg-zinc-50 transition-colors">
                <td className="p-4 md:p-5 font-semibold">Deshedding Blowout & Carding Brush</td>
                <td className="p-4 md:p-5 text-center text-zinc-300">✘</td>
                <td className="p-4 md:p-5 text-center text-zinc-300">✘</td>
                <td className="p-4 md:p-5 text-center text-grooming-primary font-extrabold">✔</td>
              </tr>
              <tr className="border-b border-zinc-150 hover:bg-zinc-50 transition-colors">
                <td className="p-4 md:p-5 font-semibold">Lavender Spa Massage Pack</td>
                <td className="p-4 md:p-5 text-center text-zinc-300">✘</td>
                <td className="p-4 md:p-5 text-center text-grooming-primary font-extrabold">✔</td>
                <td className="p-4 md:p-5 text-center text-zinc-300">✘</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Guarantee Box */}
      <div className="bg-grooming-primary/5 border border-grooming-primary/20 rounded-24 p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 text-zinc-800 max-w-4xl mx-auto shadow-sm">
        <ShieldCheck className="w-12 h-12 text-grooming-primary flex-shrink-0" />
        <div className="space-y-1.5 text-center md:text-left">
          <h4 className="font-extrabold text-lg text-zinc-850">Our Gentle Handling Guarantee</h4>
          <p className="text-xs md:text-sm text-zinc-550 leading-relaxed font-semibold">
            We use certified low-stress handling methods for all grooming sessions. If your pet becomes overly anxious or agitated, we take calming breaks and apply natural pheromones to ensure safety and comfort.
          </p>
        </div>
      </div>

    </motion.div>
  );
}
