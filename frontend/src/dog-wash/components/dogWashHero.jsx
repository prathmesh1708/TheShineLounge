import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight } from 'lucide-react';
import { PrimaryButton } from './dogWashUI';

const SLIDES = [
  {
    id: 1,
    tag: "Tearless Care",
    title: "Pamper Your Pup With Warm Baths",
    desc: "Eco-safe shampoo choices, deep mud conditioning, and soft-air drying right at your doorstep.",
    btnText: "Book Appointment",
    image: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=1200",
  },
  {
    id: 2,
    tag: "Master Grooming",
    title: "Certified Styling Scissor Cuts",
    desc: "Treat your dog to a breed-standard haircut or sanitary styling by our highly trained groomers.",
    btnText: "Explore Styling",
    image: "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&q=80&w=1200",
  },
  {
    id: 3,
    tag: "Spa Aromatherapy",
    title: "Aromatherapy Hydromassage Jacuzzi",
    desc: "Bubble jet spa baths, mineral skin mud wraps, and organic lavender oil massages to soothe joints.",
    btnText: "View Spa Packages",
    image: "https://images.unsplash.com/photo-1507146426996-ef05306b995a?auto=format&fit=crop&q=80&w=1200",
  }
];

export default function DogWashHero() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev === SLIDES.length - 1 ? 0 : prev + 1));
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const handleNext = () => {
    setCurrent((prev) => (prev === SLIDES.length - 1 ? 0 : prev + 1));
  };

  const handlePrev = () => {
    setCurrent((prev) => (prev === 0 ? SLIDES.length - 1 : prev - 1));
  };

  const handleAction = () => {
    navigate("/dog-wash/booking");
  };

  return (
    <div className="relative w-full h-[440px] md:h-[480px] bg-zinc-900 rounded-24 overflow-hidden shadow-premium group border border-zinc-200/50">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0 w-full h-full"
        >
          {/* Dark gradient overlay to ensure text contrast */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-transparent z-10" />
          <img
            src={SLIDES[current].image}
            alt={SLIDES[current].title}
            className="w-full h-full object-cover object-center"
          />

          {/* Slide details */}
          <div className="absolute inset-0 z-20 flex flex-col justify-center px-6 md:px-16 max-w-2xl text-white">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-1.5 mb-3 text-grooming-primary text-xs md:text-sm uppercase tracking-widest font-extrabold"
            >
              <Sparkles className="w-4.5 h-4.5 fill-current" />
              <span>{SLIDES[current].tag}</span>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight mb-4"
            >
              {SLIDES[current].title}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-white/80 text-xs md:text-sm leading-relaxed mb-8 max-w-lg font-medium"
            >
              {SLIDES[current].desc}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="w-48"
            >
              <PrimaryButton onClick={handleAction} icon={<ArrowRight className="w-4 h-4" />}>
                {SLIDES[current].btnText}
              </PrimaryButton>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows */}
      <button
        onClick={handlePrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-2.5 bg-black/40 hover:bg-grooming-primary/95 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all border border-white/10"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={handleNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-2.5 bg-black/40 hover:bg-grooming-primary/95 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all border border-white/10"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Indicator dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-2">
        {SLIDES.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrent(idx)}
            className={`h-2 rounded-full transition-all duration-300 ${
              current === idx ? 'w-6 bg-grooming-primary' : 'w-2 bg-white/40'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
