import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Award } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SalonStylistCard({ stylist }) {
  const navigate = useNavigate();

  return (
    <motion.div
      whileHover={{ y: -8 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="bg-white border border-zinc-200/80 rounded-24 p-5 md:p-6 shadow-sm hover:border-zinc-300 transition-colors flex flex-col items-center text-center space-y-4"
    >
      {/* Profile Image & Rating Badge */}
      <div className="relative">
        <img
          src={stylist.avatar}
          alt={stylist.name}
          className="w-24 h-24 rounded-full object-cover border-2 border-primary/20 shadow-sm"
        />
        <span className="absolute bottom-0 right-0 bg-white border border-zinc-200 rounded-full py-0.5 px-2 flex items-center gap-0.5 shadow-sm text-[10px] font-extrabold text-zinc-800">
          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          <span>{stylist.rating}</span>
        </span>
      </div>

      {/* Info details */}
      <div className="space-y-1">
        <h4 className="font-extrabold text-base text-zinc-800 leading-tight">{stylist.name}</h4>
        <p className="text-xs text-primary font-extrabold uppercase tracking-wider">{stylist.specialization}</p>
        
        <div className="flex items-center justify-center gap-1.5 text-zinc-400 text-xs mt-1.5 font-semibold">
          <Award className="w-3.5 h-3.5 text-zinc-400" />
          <span>{stylist.experience} Exp</span>
        </div>
      </div>

      {/* Action button */}
      <button
        onClick={() => navigate(`/salon/stylist/${stylist.id}`)}
        className="w-full py-2.5 px-4 bg-zinc-50 border border-zinc-200 hover:border-primary hover:bg-primary/5 hover:text-primary transition-all text-xs font-bold rounded-15 text-zinc-700"
      >
        View Profile
      </button>

    </motion.div>
  );
}
