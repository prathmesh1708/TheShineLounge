import React from 'react';
import { motion } from 'framer-motion';

export default function CarouselIndicator({ total = 2, activeIndex = 0, onSelect }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {Array.from({ length: total }).map((_, idx) => {
        const isActive = activeIndex === idx;
        return (
          <button
            key={idx}
            onClick={() => onSelect && onSelect(idx)}
            className="focus:outline-none"
            aria-label={`Slide ${idx + 1}`}
          >
            <motion.div 
              animate={{ 
                width: isActive ? 24 : 6,
                backgroundColor: isActive ? '#FF8C1A' : '#3F4452'
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="h-1.5 rounded-full"
            />
          </button>
        );
      })}
    </div>
  );
}
