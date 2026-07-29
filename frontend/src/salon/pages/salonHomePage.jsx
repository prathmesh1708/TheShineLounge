import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sparkles, ArrowRight, Star, Clock, Heart } from 'lucide-react';

import SalonServiceCard from '../components/salonServiceCard';
import { PrimaryButton } from '../components/salonUI';

import { SERVICES, CATEGORIES, OFFERS, REVIEWS } from '../services/salonApi';
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

  // Auto Slider Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === HERO_SLIDES.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(timer);
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

  // Combine dynamic database pricing with layout
  const activeServices = dbService?.pricing && dbService.pricing.length > 0
    ? dbService.pricing.map((p, idx) => ({
        id: p._id || idx,
        title: p.title,
        price: p.price,
        description: p.description || 'Executive grooming session',
        duration: '45 mins',
        rating: '4.9'
      }))
    : SERVICES;

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

      {/* Search Bar */}
      <section className="px-2 max-w-2xl mx-auto">
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="w-5 h-5 text-zinc-400 absolute left-4 top-3.5" />
          <input 
            type="text"
            placeholder="Search haircuts, facials, beard styling, hair coloring..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-zinc-200 rounded-2xl text-xs sm:text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <button 
            type="submit"
            className="absolute right-2 top-2 px-4 py-1.5 bg-zinc-900 text-white rounded-xl text-xs font-bold hover:bg-zinc-800"
          >
            Search
          </button>
        </form>
      </section>

      {/* Category Icons Grid */}
      <section className="px-2 space-y-4">
        <h2 className="text-xl font-black text-zinc-900">Explore Grooming Tiers</h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {CATEGORIES.map((cat) => (
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

      {/* Dynamic Services Showcase */}
      <section className="px-2 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-zinc-900">Featured Grooming Packages</h2>
            <p className="text-xs text-zinc-500">Popular treatments requested by our lounge guests</p>
          </div>
          <button 
            onClick={() => navigate('/salon/services')}
            className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
          >
            View All <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {activeServices.slice(0, 6).map((service, idx) => (
            <div key={service.id || idx} className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md uppercase">Executive Care</span>
                  <span className="text-xs font-bold text-zinc-500">⭐ {service.rating || '4.9'}</span>
                </div>
                <h3 className="text-base font-bold text-zinc-900">{service.title || service.name}</h3>
                <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{service.description}</p>
              </div>

              <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
                <span className="text-lg font-black text-zinc-900">₹{service.price}</span>
                <button
                  onClick={() => navigate('/salon/booking', { state: { service } })}
                  className="px-3.5 py-1.5 text-xs font-bold text-white rounded-xl shadow-sm transition-transform active:scale-95"
                  style={{ backgroundColor: dbService?.theme?.buttonColor || '#00b8b0' }}
                >
                  Book Session
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
