import React from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SearchBar({ value, onChange, onFilterClick, placeholder = "Search restaurants, salon..." }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05 }}
      className="w-full mb-4"
    >
      <div className="relative w-full h-[56px] flex items-center bg-[#15171D]/90 backdrop-blur-md border border-[#2A2E36] rounded-[20px] px-4 shadow-md transition-all focus-within:border-[#FF8C1A] focus-within:ring-1 focus-within:ring-[#FF8C1A]/40">
        <Search className="w-5 h-5 text-gray-400 flex-shrink-0 mr-3" />
        <input 
          type="text" 
          value={value}
          onChange={(e) => onChange && onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent text-white placeholder-gray-400 text-sm font-medium outline-none border-none"
        />
        <button 
          onClick={onFilterClick}
          className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors flex-shrink-0"
          aria-label="Filter"
        >
          <SlidersHorizontal className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
}
