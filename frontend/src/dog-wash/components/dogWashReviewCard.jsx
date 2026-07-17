import React from 'react';
import { Star } from 'lucide-react';

export default function DogWashReviewCard({ review }) {
  return (
    <div className="bg-white border border-zinc-200/85 rounded-24 p-6 flex flex-col justify-between gap-4 text-zinc-800 shadow-premium">
      
      <div className="flex justify-between items-start gap-4">
        {/* User profile */}
        <div className="flex items-center gap-3">
          <img
            src={review.avatar}
            alt={review.name}
            className="w-10 h-10 rounded-full object-cover border border-zinc-150 flex-shrink-0"
          />
          <div>
            <h4 className="font-bold text-sm text-zinc-850">{review.name}</h4>
            <span className="text-[10px] text-zinc-400 block font-semibold">{review.date}</span>
          </div>
        </div>

        {/* Stars */}
        <div className="flex gap-0.5 text-yellow-600 bg-yellow-400/10 py-1 px-2.5 rounded-full border border-yellow-400/20">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`w-3.5 h-3.5 ${
                i < review.rating ? 'fill-current' : 'text-zinc-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Comment */}
      <p className="text-zinc-600 text-xs md:text-sm leading-relaxed flex-grow italic font-medium">
        "{review.comment}"
      </p>

      {/* Footer Tags */}
      <div className="border-t border-zinc-100 pt-3.5 flex flex-wrap justify-between items-center gap-2 text-[10px] uppercase font-bold tracking-wider">
        <span className="text-grooming-primary">{review.service}</span>
        <span className="text-zinc-400">{review.vehicle}</span>
      </div>

    </div>
  );
}
