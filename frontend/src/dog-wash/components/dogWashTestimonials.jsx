import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Star, Quote } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DogWashTestimonials({ reviews = [] }) {
  const [active, setActive] = useState(0);

  const handleNext = () => {
    setActive((prev) => (prev === reviews.length - 1 ? 0 : prev + 1));
  };

  const handlePrev = () => {
    setActive((prev) => (prev === 0 ? reviews.length - 1 : prev - 1));
  };

  if (!reviews || reviews.length === 0) return null;

  const currentReview = reviews[active];

  return (
    <div className="relative bg-white border border-zinc-200/85 rounded-24 p-8 md:p-12 text-zinc-800 shadow-premium overflow-hidden">
      
      {/* Decorative quote mark */}
      <Quote className="absolute top-6 right-8 w-24 h-24 text-zinc-100 pointer-events-none fill-current" />

      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col gap-6"
        >
          <p className="text-lg md:text-xl italic font-semibold leading-relaxed max-w-3xl text-zinc-800">
            "{currentReview.comment}"
          </p>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-t border-zinc-100 pt-6 mt-2">
            
            {/* User profile details */}
            <div className="flex items-center gap-4">
              <img
                src={currentReview.avatar}
                alt={currentReview.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-grooming-primary"
              />
              <div>
                <h4 className="font-extrabold text-base text-zinc-850">{currentReview.name}</h4>
                <p className="text-xs text-zinc-450 font-bold mt-0.5">{currentReview.vehicle}</p>
              </div>
            </div>

            {/* Stars */}
            <div className="flex items-center gap-1.5 font-bold">
              <div className="flex gap-0.5 text-yellow-600 bg-yellow-400/5 px-2.5 py-1 rounded-full border border-yellow-400/15">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < currentReview.rating ? 'fill-current' : 'text-zinc-200'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-zinc-500 ml-2">({currentReview.rating}.0)</span>
            </div>

          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation buttons */}
      <div className="absolute right-8 bottom-8 flex gap-2">
        <button
          onClick={handlePrev}
          className="p-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-full transition-all border border-zinc-250 shadow-sm"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={handleNext}
          className="p-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-full transition-all border border-zinc-250 shadow-sm"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
}
