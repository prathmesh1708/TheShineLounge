import React from 'react';
import { Star } from 'lucide-react';

export default function SalonReviewCard({ review }) {
  return (
    <div className="bg-white border border-zinc-200/80 rounded-24 p-5 md:p-6 space-y-4 shadow-sm hover:border-zinc-300 transition-colors flex flex-col justify-between h-full">
      
      {/* Reviewer details & Rating */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <img
            src={review.avatar}
            alt={review.name}
            className="w-10 h-10 rounded-full object-cover border border-zinc-100"
          />
          <div>
            <h4 className="font-extrabold text-sm text-zinc-800 leading-tight">{review.name}</h4>
            <span className="text-[10px] text-zinc-400 font-bold block mt-0.5">{review.date}</span>
          </div>
        </div>

        {/* Stars */}
        <div className="flex items-center gap-0.5">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-3.5 h-3.5 ${
                i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-zinc-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Review content */}
      <div className="space-y-2 flex-grow">
        <div className="flex flex-wrap items-center gap-1.5 text-[10px] uppercase font-bold text-zinc-450">
          <span>Service: {review.service}</span>
          {review.stylist && (
            <>
              <span className="text-zinc-300">•</span>
              <span>Stylist: {review.stylist}</span>
            </>
          )}
        </div>
        <p className="text-xs md:text-sm text-zinc-650 leading-relaxed font-semibold line-clamp-4">
          "{review.comment}"
        </p>
      </div>

    </div>
  );
}
