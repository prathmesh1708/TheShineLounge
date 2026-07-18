import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sparkles, ArrowRight, Star, Clock, Heart } from 'lucide-react';

import SalonServiceCard from '../components/salonServiceCard';
import { PrimaryButton } from '../components/salonUI';

import { SERVICES, CATEGORIES, OFFERS, REVIEWS } from '../services/salonApi';

const HERO_SLIDES = [
  {
    id: 1,
    tag: "Exclusive Glow Up",
    title: "Pamper Yourself With Master Stylists",
    desc: "Precision haircuts, customized coloring, and luxurious head-to-toe beauty spas at Indore's premium lounge.",
    btnText: "Book Now",
    image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=1200",
  },
  {
    id: 2,
    tag: "Therapeutic Relaxation",
    title: "Rejuvenating Volcanic Hot Stone Spa",
    desc: "Melt stress away with heated mineral stones and deep muscle tissue sweeps by skin care specialists.",
    btnText: "Explore Spa Menu",
    image: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=1200",
  },
  {
    id: 3,
    tag: "Bridal Heritage Specials",
    title: "Flawless HD Airbrush Wedding Styling",
    desc: "Step-by-step bridal makeovers, customized dupattas draping, and professional jewelry pinning.",
    btnText: "Book Bridal Suite",
    image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=1200",
  }
];

export default function SalonHomePage() {
  const navigate = useNavigate();
  const [searchVal, setSearchVal] = useState("");
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto Slider Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === HERO_SLIDES.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchVal.trim()) {
      navigate(`/salon/services?search=${encodeURIComponent(searchVal)}`);
    } else {
      navigate('/salon/services');
    }
  };

  const handleCategoryClick = (catName) => {
    navigate(`/salon/services?category=${encodeURIComponent(catName)}`);
  };

  // Scroll Tracking for horizontal sliders (Premium swipe indicators)
  const [serviceIndex, setServiceIndex] = useState(0);
  const [offerIndex, setOfferIndex] = useState(0);

  const serviceRef = useRef(null);
  const offerRef = useRef(null);

  const handleScrollTracker = (ref, setter, length) => {
    if (!ref.current) return;
    const { scrollLeft } = ref.current;
    const cardWidth = ref.current.scrollWidth / length;
    const computedIndex = Math.round(scrollLeft / cardWidth);
    setter(Math.max(0, Math.min(length - 1, computedIndex)));
  };

  const handleDotScroll = (ref, idx, length) => {
    if (!ref.current) return;
    const cardWidth = ref.current.scrollWidth / length;
    ref.current.scrollTo({
      left: idx * cardWidth,
      behavior: 'smooth'
    });
  };

  const popularServices = SERVICES.filter(s => s.rating >= 4.9).slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 md:space-y-10 text-zinc-800"
    >
      

      {/* 1. Auto-Sliding Hero Banner */}
      <div className="relative w-full h-[180px] sm:h-[280px] md:h-[400px] bg-zinc-900 rounded-24 overflow-hidden shadow-premium group border border-zinc-200/50">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 w-full h-full"
          >
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-transparent z-10" />
            <img
              src={HERO_SLIDES[currentSlide].image}
              alt={HERO_SLIDES[currentSlide].title}
              className="w-full h-full object-cover object-center"
            />

            {/* Slide details */}
            <div className="absolute inset-0 z-20 flex flex-col justify-center px-6 md:px-16 max-w-2xl text-white">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="hidden sm:flex items-center gap-1.5 mb-1.5 sm:mb-3 text-primary text-[10px] sm:text-xs md:text-sm uppercase tracking-widest font-extrabold"
              >
                <Sparkles className="w-4 h-4 fill-current" />
                <span>{HERO_SLIDES[currentSlide].tag}</span>
              </motion.div>
              
              <motion.h1
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-lg sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight mb-2 sm:mb-4"
              >
                {HERO_SLIDES[currentSlide].title}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="hidden sm:block text-white/70 text-xs sm:text-sm md:text-base leading-relaxed mb-4 sm:mb-8 max-w-lg font-semibold"
              >
                {HERO_SLIDES[currentSlide].desc}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                className="w-fit sm:w-48"
              >
                <PrimaryButton
                  onClick={() => navigate('/salon/booking')}
                  className="py-3 px-6 text-xs tracking-wide font-extrabold"
                >
                  Book Now
                </PrimaryButton>
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Slide Indicator Marks */}
        <div className="absolute bottom-5 right-6 z-30 flex gap-2">
          {HERO_SLIDES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                currentSlide === idx ? 'w-6 bg-primary' : 'w-2 bg-white/40'
              }`}
              aria-label={`Go to hero slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* 3. Categories Grid */}
      <div className="space-y-3">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-850">Browse Categories</h2>
          <p className="text-xs md:text-sm text-zinc-500 font-semibold mt-1.5">Precision styling, spa treatments, and professional cosmetics.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {CATEGORIES.map((cat) => (
            <motion.button
              key={cat.id}
              whileHover={{ y: -4, border: "1px solid rgba(0, 184, 176, 0.4)" }}
              whileTap={{ scale: 0.96 }}
              onClick={() => handleCategoryClick(cat.name)}
              className="bg-white border border-zinc-200 rounded-24 p-5 text-center flex flex-col items-center justify-center space-y-3 shadow-sm hover:shadow transition-all duration-300"
            >
              <span className="text-3xl filter drop-shadow">{cat.icon}</span>
              <div>
                <h4 className="font-extrabold text-xs text-zinc-850 leading-tight">{cat.name}</h4>
                <p className="text-[9px] text-zinc-400 font-semibold mt-0.5">{cat.desc}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>


      {/* 5. Popular Services */}
      <div className="space-y-3">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-850">Popular Services</h2>
            <p className="text-xs md:text-sm text-zinc-500 font-semibold mt-1.5">Our most requested premium beauty reset treatments.</p>
          </div>
          <button
            onClick={() => navigate("/salon/services")}
            className="text-xs md:text-sm font-extrabold text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
          >
            <span>See All Services</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div
          ref={serviceRef}
          onScroll={() => handleScrollTracker(serviceRef, setServiceIndex, popularServices.length)}
          className="flex md:grid md:grid-cols-3 gap-6 overflow-x-auto md:overflow-x-visible pb-4 md:pb-0 snap-x snap-mandatory scrollbar-none -mx-4 px-4 md:mx-0 md:px-0"
        >
          {popularServices.map((service) => (
            <div key={service.id} className="w-[46vw] sm:w-[240px] md:w-auto flex-shrink-0 snap-start snap-always">
              <SalonServiceCard service={service} />
            </div>
          ))}
        </div>

        {/* Swipe Dots Indicator */}
        <div className="flex justify-center gap-2 mt-2 md:hidden">
          {popularServices.map((_, idx) => (
            <button
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                serviceIndex === idx ? 'w-6 bg-primary' : 'w-2 bg-zinc-200'
              }`}
              onClick={() => handleDotScroll(serviceRef, idx, popularServices.length)}
              aria-label={`Go to service slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>


    </motion.div>
  );
}
