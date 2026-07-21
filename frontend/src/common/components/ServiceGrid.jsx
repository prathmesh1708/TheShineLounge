import React from 'react';
import { motion } from 'framer-motion';
import ServiceCard from './ServiceCard';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 22 } }
};

export default function ServiceGrid({ services = [], onServiceClick }) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-3 gap-3.5 w-full mb-6"
    >
      {services.map((service) => (
        <motion.div key={service.id} variants={itemVariants}>
          <ServiceCard service={service} onClick={onServiceClick} />
        </motion.div>
      ))}
    </motion.div>
  );
}
