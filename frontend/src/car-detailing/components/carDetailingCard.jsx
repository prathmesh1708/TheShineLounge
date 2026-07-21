import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Star, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CarDetailingCard({ service }) {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/car-detailing/service/${service.id}`);
  };

  const handleBook = (e) => {
    e.stopPropagation();
    navigate(`/car-detailing/booking?service=${service.id}`);
  };

  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      onClick={handleCardClick}
      className="bg-white border border-zinc-200/85 hover:border-zinc-300 rounded-20 sm:rounded-24 overflow-hidden shadow-premium hover:shadow-premium-hover transition-all cursor-pointer flex flex-col justify-between group h-full"
    >
      {/* Service Image & Category Badge */}
      <div className="relative h-28 sm:h-36 md:h-48 w-full overflow-hidden">
        <img
          src={service.image}
          alt={service.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-2 left-2 sm:top-4 sm:left-4 py-1 px-2 sm:py-1.5 sm:px-3 bg-zinc-900/90 backdrop-blur-md text-[9px] sm:text-xs font-bold text-[#FF6B00] border border-white/10 rounded-full shadow-sm">
          {service.category}
        </div>
      </div>

      {/* Content */}
      <div className="p-3 sm:p-5 flex-grow flex flex-col justify-between">
        <div className="space-y-1.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <h3 className="text-xs sm:text-sm md:text-lg font-bold text-zinc-855 group-hover:text-[#FF6B00] transition-colors leading-snug truncate">
              {service.name}
            </h3>
            <div className="flex items-center gap-1 text-[9px] sm:text-xs font-bold text-yellow-600 bg-yellow-400/10 px-1.5 py-0.5 rounded-md border border-yellow-400/20 w-fit">
              <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current" />
              <span>{service.rating.toFixed(1)}</span>
            </div>
          </div>

          <p className="text-zinc-555 text-[10px] sm:text-xs md:text-sm line-clamp-1 sm:line-clamp-2 leading-relaxed">
            {service.tagline}
          </p>
        </div>

        {/* Specs and Footer Action */}
        <div className="mt-3 pt-2.5 sm:mt-6 sm:pt-4 border-t border-zinc-100 flex items-center justify-between gap-2">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-zinc-400 text-[10px] sm:text-xs">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>{service.duration}</span>
            </div>
            <div className="font-extrabold text-zinc-800 text-xs sm:text-base">
              ₹{service.price * 10}
            </div>
          </div>

          <button
            onClick={handleBook}
            className="py-1.5 px-2.5 sm:py-2.5 sm:px-3 bg-[#FF6B00] hover:bg-[#E66000] text-white rounded-15 sm:rounded-20 shadow-premium transition-all flex items-center justify-center gap-1 text-[9px] sm:text-xs font-bold"
          >
            <span>Book</span>
            <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>
        </div>
      </div>

    </motion.div>
  );
}
