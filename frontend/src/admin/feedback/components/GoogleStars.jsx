import React from 'react';
import { Star } from 'lucide-react';

export default function GoogleStars({ value = 0, size = 'w-3.5 h-3.5' }) {
  const rounded = Math.round(Number(value) || 0);
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`${size} ${n <= rounded ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'}`}
        />
      ))}
    </span>
  );
}
