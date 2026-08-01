import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Star, Clock, Heart } from 'lucide-react';

import { PrimaryButton } from '../components/salonUI';

import { getServicesSync, getCategoriesSync } from '../services/salonApi';
import serviceApi from '../../common/services/serviceApi';

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
  const [dbService, setDbService] = useState(null);
  const [servicesList, setServicesList] = useState(getServicesSync());
  const [categoriesList, setCategoriesList] = useState(getCategoriesSync());

  // Auto Slider Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === HERO_SLIDES.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Listen to live admin data updates
  useEffect(() => {
    const handleDataChange = () => {
      setServicesList(getServicesSync());
      setCategoriesList(getCategoriesSync());
    };
    window.addEventListener('salonDataChanged', handleDataChange);
    return () => {
      window.removeEventListener('salonDataChanged', handleDataChange);
    };
  }, []);

  // Fetch dynamic Salon service details from API
  useEffect(() => {
    const fetchSalonData = async () => {
      try {
        const res = await serviceApi.getServiceBySlug('salon');
        if (res.success && res.service) {
          setDbService(res.service);
        }
      } catch (err) {
        console.warn('Using default salon layout data');
      }
    };
    fetchSalonData();
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

  const activeServices = servicesList.filter(s => s.status !== 'inactive');

  return (
    <div className="space-y-6 md:space-y-10 pb-16">
      
      {/* Dynamic Hero Slider */}
      <section className="relative w-full h-[380px] sm:h-[450px] rounded-3xl overflow-hidden shadow-2xl bg-zinc-900 border border-zinc-200">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 w-full h-full"
          >
            <img 
              src={dbService?.bannerImage || HERO_SLIDES[currentSlide].image} 
              alt="Salon Banner"
              className="w-full h-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-900/60 to-transparent" />
          </motion.div>
        </AnimatePresence>

        <div className="absolute inset-0 p-6 sm:p-10 flex flex-col justify-end text-white max-w-2xl space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest bg-amber-500 text-zinc-950 w-fit">
            <Sparkles className="w-3.5 h-3.5" /> {HERO_SLIDES[currentSlide].tag}
          </span>
          <h1 className="text-2xl sm:text-4xl font-black leading-tight">
            {dbService?.serviceName || HERO_SLIDES[currentSlide].title}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-300 line-clamp-2">
            {dbService?.shortDescription || HERO_SLIDES[currentSlide].desc}
          </p>

          <div className="pt-2">
            <PrimaryButton 
              onClick={() => navigate('/salon/booking')}
              className="shadow-lg active:scale-95 transition-transform"
              style={dbService?.theme?.buttonColor ? { backgroundColor: dbService.theme.buttonColor } : {}}
            >
              {HERO_SLIDES[currentSlide].btnText} <ArrowRight className="w-4 h-4 ml-1 inline" />
            </PrimaryButton>
          </div>
        </div>

        {/* Carousel Indicators */}
        <div className="absolute bottom-4 right-6 flex items-center gap-2">
          {HERO_SLIDES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-2 rounded-full transition-all ${
                currentSlide === idx ? 'w-6 bg-amber-500' : 'w-2 bg-white/50'
              }`}
            />
          ))}
        </div>
      </section>

      {/* Category Icons Grid */}
      <section className="px-2 space-y-4">
        <h2 className="text-xl font-black text-zinc-900">Explore Grooming Tiers</h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {categoriesList.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.name)}
              className="p-4 bg-white border border-zinc-200/80 rounded-2xl flex flex-col items-center gap-2 shadow-xs hover:border-amber-500 hover:shadow-md transition-all text-center"
            >
              <span className="text-2xl">{cat.icon}</span>
              <span className="text-xs font-bold text-zinc-800">{cat.name}</span>
            </button>
          ))}
        </div>
      </section>

    </div>
  );
}
