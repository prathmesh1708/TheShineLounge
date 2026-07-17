import React from 'react';
import { motion } from 'framer-motion';

export default function CarDetailingFilterChips({ categories = [], selectedCategory = "", onSelect }) {
  return (
    <div className="flex gap-2.5 overflow-x-auto pb-3 pt-1 scrollbar-thin scrollbar-thumb-zinc-200 scrollbar-track-transparent">
      {categories.map((category, idx) => {
        const isSelected = selectedCategory === category;
        return (
          <motion.button
            key={idx}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => onSelect(category)}
            className={`flex-shrink-0 px-5 py-2.5 rounded-full text-xs font-semibold border transition-all ${
              isSelected
                ? 'bg-luxury-emerald border-luxury-emerald text-white shadow-premium'
                : 'bg-white border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 text-zinc-600 hover:text-zinc-855 shadow-sm'
            }`}
          >
            {category}
          </motion.button>
        );
      })}
    </div>
  );
}
