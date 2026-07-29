import React from 'react';

export default function SectionHeader({ title, onViewAll }) {
  return (
    <div className="flex items-center justify-between w-full mb-3.5 px-1">
      <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
        {title}
      </h3>
      {onViewAll && (
        <button
          onClick={onViewAll}
          className="text-xs font-bold text-[#FF8C1A] hover:underline transition-all active:scale-95"
        >
          View All
        </button>
      )}
    </div>
  );
}
