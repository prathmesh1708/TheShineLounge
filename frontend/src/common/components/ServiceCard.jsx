import React from 'react';
import { motion } from 'framer-motion';
import ServiceIcon from './ServiceIcon';

export default function ServiceCard({ service, onClick }) {
  return (
    <motion.div
      whileHover={{ scale: 1.04, translateY: -2 }}
      whileTap={{ scale: 0.96 }}
      onClick={() => onClick && onClick(service)}
      className="w-full bg-[#15171D] hover:bg-[#1D2027] border border-[#2A2E36] hover:border-[#FF8C1A]/40 rounded-[24px] p-4 flex flex-col items-center justify-center gap-3 cursor-pointer shadow-md transition-colors"
    >
      {/* Icon Badge */}
      <div className="w-14 h-14 rounded-full bg-[#1D2027] border border-[#2A2E36] flex items-center justify-center shadow-inner">
        <ServiceIcon name={service.id} size={42} />
      </div>

      {/* Title */}
      <span className="text-xs font-bold text-gray-200 text-center tracking-tight line-clamp-1">
        {service.label}
      </span>
    </motion.div>
  );
}
