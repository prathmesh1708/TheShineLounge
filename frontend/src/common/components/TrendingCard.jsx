import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bookmark, Star, MapPin } from 'lucide-react';

export default function TrendingCard({ item, onClick }) {
  const [isSaved, setIsSaved] = useState(false);

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick && onClick(item)}
      className="min-w-[240px] max-w-[240px] bg-[#15171D] border border-[#2A2E36] rounded-[24px] overflow-hidden flex flex-col justify-between cursor-pointer shadow-xl transition-all hover:border-[#FF8C1A]/40"
    >
      {/* Image Container */}
      <div className="relative w-full h-36 overflow-hidden">
        <img 
          src={item.image} 
          alt={item.title} 
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#15171D] via-transparent to-transparent opacity-90" />
        
        {/* Bookmark Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsSaved(!isSaved);
          }}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:text-[#FF8C1A] transition-all"
        >
          <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-[#FF8C1A] text-[#FF8C1A]' : ''}`} />
        </button>

        {/* Category Pill */}
        <span className="absolute bottom-2 left-3 text-[10px] font-extrabold uppercase tracking-wider text-[#FF8C1A] bg-[#1D2027]/90 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/5">
          {item.category}
        </span>
      </div>

      {/* Card Content */}
      <div className="p-3.5 flex flex-col gap-2">
        <h4 className="text-sm font-bold text-white line-clamp-1 tracking-wide">
          {item.title}
        </h4>

        {/* Rating & Distance */}
        <div className="flex items-center justify-between text-xs text-gray-400 font-medium">
          <div className="flex items-center gap-1 text-amber-400">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="font-bold text-gray-200">{item.rating || '4.9'}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-400">
            <MapPin className="w-3 h-3 text-gray-500" />
            <span>{item.distance || '1.2 km'}</span>
          </div>
        </div>

        {/* Price & Action */}
        <div className="flex items-center justify-between pt-2 border-t border-[#2A2E36]/60 mt-1">
          <div className="flex flex-col">
            <span className="text-xs text-gray-400 font-medium">Starting</span>
            <span className="text-sm font-black text-white">{item.price}</span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClick && onClick(item);
            }}
            className="px-3.5 py-1.5 rounded-full bg-[#FF8C1A] text-black font-extrabold text-xs shadow-md hover:bg-[#FF8C1A]/90 transition-all active:scale-95"
          >
            Book Now
          </button>
        </div>
      </div>
    </motion.div>
  );
}
