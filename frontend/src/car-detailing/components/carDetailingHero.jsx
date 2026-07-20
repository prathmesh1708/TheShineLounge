import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight } from 'lucide-react';
import { PrimaryButton } from './carDetailingUI';

const SLIDES = [
  {
    id: 1,
    tag: "Premium Care",
    title: "Your Car Deserves The Best Care",
    desc: "Professional touchless washing & paint protection detailing services delivered at your doorstep in Indore.",
    btnText: "Book Now",
    image: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&q=80&w=1200",
    color: "emerald"
  },
  {
    id: 2,
    tag: "Showroom Shine",
    title: "9H Nano Ceramic Coating Armour",
    desc: "Ultimate liquid nanoshield protection repelling road grime, mud, UV damage, and micro-scratches. 3-Year Warranty.",
    btnText: "Explore Coating",
    image: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&q=80&w=1200",
    color: "white"
  },
  {
    id: 3,
    tag: "Sanitized Cabin",
    title: "Eco-Friendly Steam Cabin Cleanse",
    desc: "Deep interior hot steam extraction removing 99.9% of bacteria, allergens, and stubborn coffee/pet stains.",
    btnText: "View Packages",
    image: "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&q=80&w=1200",
    color: "emerald"
  }
];

export default function CarDetailingHero() {
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
    navigate("/car-detailing/booking");
  };

  return (
    <div className="relative w-full h-[180px] sm:h-[280px] md:h-[400px] bg-luxury-black rounded-24 overflow-hidden shadow-premium group border border-zinc-200/50">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0 w-full h-full"
        >
          {/* Background image with gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-luxury-black via-luxury-black/70 to-transparent z-10" />
          <img
            src={SLIDES[current].image}
            alt={SLIDES[current].title}
            className="w-full h-full object-cover object-center"
          />

          {/* Hero Content Panel */}
          <div className="absolute inset-0 z-20 flex flex-col justify-center px-6 md:px-16 max-w-2xl text-white">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="hidden sm:flex items-center gap-1.5 mb-1.5 sm:mb-3 text-[#FF6B00] text-xs sm:text-sm uppercase tracking-widest font-extrabold"
            >
              <Sparkles className="w-4.5 h-4.5 fill-current" />
              <span>{SLIDES[current].tag}</span>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-lg sm:text-3xl md:text-5xl font-extrabold tracking-tight leading-tight mb-2 sm:mb-4"
            >
              {SLIDES[current].title.split(" ").map((word, i) => (
                <span key={i} className={word === "Emerald" || word === "Best" || word === "9H" || word === "Ceramic" || word === "Steam" ? "text-[#FF6B00]" : ""}>
                  {word}{" "}
                </span>
              ))}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="hidden sm:block text-white/70 text-xs sm:text-sm md:text-base leading-relaxed mb-4 sm:mb-8 max-w-lg"
            >
              {SLIDES[current].desc}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="w-fit sm:w-48"
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
        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-2.5 bg-black/40 hover:bg-[#FF6B00]/90 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all border border-white/10"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={handleNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-2.5 bg-black/40 hover:bg-[#FF6B00]/90 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all border border-white/10"
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
              current === idx ? 'w-6 bg-[#FF6B00]' : 'w-2 bg-white/30'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
