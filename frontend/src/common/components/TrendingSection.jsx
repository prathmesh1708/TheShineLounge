import React from 'react';
import { motion } from 'framer-motion';
import SectionHeader from './SectionHeader';
import TrendingCard from './TrendingCard';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: 20 },
  show: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 260, damping: 22 } }
};

export default function TrendingSection({ items = [], onItemClick, onViewAll }) {
  return (
    <div className="w-full mb-6">
      <SectionHeader title="Trending Near You" onViewAll={onViewAll} />
      
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="flex gap-4 overflow-x-auto pb-3 pt-1 scrollbar-none snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {items.map((item) => (
          <motion.div key={item.id} variants={itemVariants} className="snap-start">
            <TrendingCard item={item} onClick={onItemClick} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
