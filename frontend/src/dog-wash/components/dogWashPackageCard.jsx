import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { PrimaryButton, SecondaryButton } from './dogWashUI';

export default function DogWashPackageCard({ pack }) {
  const navigate = useNavigate();

  const handleBook = () => {
    navigate(`/dog-wash/booking?package=${pack.id}`);
  };

  return (
    <motion.div
      whileHover={{ y: -8 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`relative flex flex-col justify-between p-6 md:p-8 rounded-24 border ${
        pack.popular
          ? 'bg-gradient-to-b from-grooming-primary/5 to-white border-grooming-primary shadow-premium ring-1 ring-grooming-primary/20'
          : 'bg-white border-zinc-200/85 hover:border-zinc-300 shadow-sm'
      } text-zinc-800 h-full`}
    >
      {/* Popular badge */}
      {pack.popular && (
        <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-grooming-primary text-white text-[10px] uppercase tracking-widest font-extrabold px-3.5 py-1.5 rounded-full shadow-premium border border-white/10">
          {pack.badge}
        </span>
      )}

      {/* Details */}
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg md:text-xl font-extrabold text-zinc-850 leading-tight">{pack.name}</h3>
            <div className="flex items-center gap-1.5 text-zinc-400 text-xs mt-1.5 font-semibold">
              <Clock className="w-3.5 h-3.5" />
              <span>{pack.duration}</span>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-xl md:text-2xl font-extrabold text-zinc-850">${pack.price}</span>
            <span className="text-[9px] text-zinc-400 font-semibold uppercase mt-0.5">starting at</span>
          </div>
        </div>

        {/* Feature list checklist */}
        <div className="border-t border-zinc-100 pt-6">
          <ul className="space-y-3">
            {pack.features.map((feature, idx) => (
              <li key={idx} className="flex gap-3 items-start text-xs md:text-sm text-zinc-600 font-medium">
                <Check className="w-4 h-4 text-grooming-primary flex-shrink-0 mt-0.5" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-zinc-100">
        {pack.popular ? (
          <PrimaryButton onClick={handleBook}>Book Package</PrimaryButton>
        ) : (
          <SecondaryButton onClick={handleBook}>Select Package</SecondaryButton>
        )}
      </div>

    </motion.div>
  );
}
