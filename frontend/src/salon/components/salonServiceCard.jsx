import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Clock, Star } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SalonServiceCard({ service }) {
  const navigate = useNavigate();

  const handleBook = (e) => {
    e.stopPropagation();
    navigate(`/salon/booking?service=${service.id}`);
  };

  return (
    <motion.div
      whileHover={{ y: -6 }}
      onClick={() => navigate(`/salon/service/${service.id}`)}
      className="bg-white border border-zinc-200/80 rounded-24 overflow-hidden shadow-sm hover:border-zinc-300 hover:shadow-md transition-all flex flex-col justify-between h-full text-zinc-800 cursor-pointer"
    >
      
      {/* Top Image & price details */}
      <div className="relative h-44 w-full bg-zinc-100 overflow-hidden">
        <img
          src={service.image}
          alt={service.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Cost Badge */}
        <span className="absolute top-4 right-4 bg-white/95 backdrop-blur-xs py-1.5 px-3 rounded-full text-sm font-extrabold text-zinc-800 shadow-sm border border-white/20">
          ${service.price}
        </span>
      </div>

      {/* Main Info */}
      <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
        
        {/* Name & Meta data */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-primary uppercase font-bold tracking-wider">{service.category}</span>
            
            {/* Rating */}
            <div className="flex items-center gap-1 text-xs font-bold text-zinc-650">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>{service.rating} ({service.reviewsCount})</span>
            </div>
          </div>

          <h3 className="font-extrabold text-base md:text-lg text-zinc-850 leading-tight line-clamp-1">{service.name}</h3>
          
          <div className="flex items-center gap-1.5 text-zinc-400 text-xs mt-1 font-semibold">
            <Clock className="w-3.5 h-3.5 text-zinc-400" />
            <span>{service.duration}</span>
          </div>

          <p className="text-xs text-zinc-450 leading-relaxed font-semibold line-clamp-2 pt-1">{service.tagline}</p>
        </div>

        {/* Feature List */}
        <div className="border-t border-zinc-50 pt-3">
          <ul className="space-y-1.5">
            {service.features.slice(0, 2).map((feat, idx) => (
              <li key={idx} className="flex gap-2 items-start text-xs text-zinc-600 font-medium leading-relaxed">
                <Check className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                <span className="truncate">{feat}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-zinc-100 flex gap-2">
          <button
            onClick={handleBook}
            className="w-full py-3 bg-primary hover:bg-primary/95 text-white text-xs font-extrabold rounded-18 shadow-sm transition-all"
          >
            Book Appointment
          </button>
        </div>

      </div>

    </motion.div>
  );
}
