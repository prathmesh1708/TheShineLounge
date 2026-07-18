import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Sparkles, ArrowRight, ShieldCheck, Heart, Bath, Scissors, ScissorsLineDashed, ShieldAlert } from 'lucide-react';

import DogWashHero from '../components/dogWashHero';
import DogWashCard from '../components/dogWashCard';
import DogWashPackageCard from '../components/dogWashPackageCard';
import { PrimaryButton } from '../components/dogWashUI';

import { SERVICES, PACKAGES, FAQS, REVIEWS } from '../services/dogWashApi';

export default function DogWashHomePage() {
  const navigate = useNavigate();
  const [searchVal, setSearchVal] = useState("");
  const [activeSlide, setActiveSlide] = useState(0);
  const scrollRef = useRef(null);

  const pricingPlans = [
    {
      id: "basic-wash",
      name: "Quick Rinse",
      duration: "2 Minutes",
      price: 100,
      icon: "🛁",
      desc: "Quick warm-water spray and towel pat dry, ideal for a fast refresh."
    },
    {
      id: "premium-wash",
      name: "Classic Bath",
      duration: "5 Minutes",
      price: 200,
      icon: "🧴",
      desc: "Deep coat warm-water shampoo scrub, towel dry + blow dry, and basic brush out.",
      isPopular: true
    },
    {
      id: "full-grooming",
      name: "The Deluxe Groom",
      duration: "12 Minutes",
      price: 500,
      icon: "✂",
      desc: "Aloe conditioner, warm-water jacuzzi bubble massage, ear flush, and full brush out."
    }
  ];

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft } = scrollRef.current;
    const cardWidth = scrollRef.current.scrollWidth / PACKAGES.length;
    const computedIndex = Math.round(scrollLeft / cardWidth);
    const finalIndex = Math.max(0, Math.min(PACKAGES.length - 1, computedIndex));
    setActiveSlide(finalIndex);
  };

  const handleDotClick = (idx) => {
    if (!scrollRef.current) return;
    const cardWidth = scrollRef.current.scrollWidth / PACKAGES.length;
    scrollRef.current.scrollTo({
      left: idx * cardWidth,
      behavior: 'smooth'
    });
    setActiveSlide(idx);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchVal.trim()) {
      navigate(`/dog-wash/services?search=${encodeURIComponent(searchVal)}`);
    } else {
      navigate('/dog-wash/services');
    }
  };

  const handleCategoryClick = (catName) => {
    navigate(`/dog-wash/services?category=${encodeURIComponent(catName)}`);
  };

  const categories = [
    { name: "Basic Wash", label: "Basic Wash", icon: "🛁", cat: "Washing" },
    { name: "Premium Wash", label: "Premium Wash", icon: "🧴", cat: "Washing" },
    { name: "Full Grooming", label: "Full Grooming", icon: "✂", cat: "Grooming" },
    { name: "Nail Trimming", label: "Nail Trimming", icon: "💅", cat: "Wellness" },
    { name: "Ear Cleaning", label: "Ear Cleaning", icon: "👂", cat: "Wellness" },
    { name: "Flea Treatment", label: "Flea Treatment", icon: "🐜", cat: "Therapy" },
    { name: "Teeth Cleaning", label: "Teeth Cleaning", icon: "🪥", cat: "Wellness" }
  ];

  const steps = [
    { num: "1", title: "Select Pet & Service", desc: "Choose your pet profile and select standard baths or breed haircuts." },
    { num: "2", title: "Schedule Slot", desc: "Pick your preferred date and mobile van arrival time window." },
    { num: "3", title: "Groomer Arrives", desc: "Our certified specialist sets up the silent, warm-water wash bay." },
    { num: "4", title: "Fresh & Fluffy", desc: "Your dog is returned showroom-clean, blow-dried, and brushed out." }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 md:space-y-10 text-zinc-800"
    >

      {/* 1. Hero Slides Slider */}
      <DogWashHero />


      {/* Dog Bath Pricing Section */}
      <div className="space-y-4 pt-2">
        <div className="text-center md:text-left">
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-850">Dog Wash Pricing</h2>
          <p className="text-xs md:text-sm text-zinc-500 font-semibold mt-1.5">Choose the perfect quick refresh or deep clean package.</p>
        </div>

        <div className="flex flex-col gap-3">
          {pricingPlans.map((plan) => (
            <div 
              key={plan.id}
              className="flex items-center gap-4 bg-white border border-zinc-200/80 hover:border-grooming-primary/45 rounded-24 p-4.5 cursor-pointer transition-all shadow-sm hover:shadow-md"
              onClick={() => navigate(`/dog-wash/booking?service=${plan.id}`)}
            >
              {/* Left icon badge */}
              <div className="w-14 h-14 rounded-20 bg-[#E8F5E9] border border-[#C8E6C9] flex items-center justify-center text-3xl flex-shrink-0">
                {plan.icon}
              </div>
              
              {/* Details middle */}
              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-zinc-800 text-sm sm:text-base leading-snug">{plan.name}</h3>
                  {plan.isPopular && (
                    <span className="text-[9px] font-bold text-grooming-primary bg-grooming-primary/10 px-2 py-0.5 rounded-full">
                      Popular
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400 font-semibold leading-relaxed mt-0.5 sm:mt-1 hidden sm:block">
                  {plan.desc}
                </p>
                <div className="flex items-center gap-1 mt-1 text-zinc-400">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-zinc-400">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span className="text-[10px] sm:text-xs font-bold text-zinc-400">{plan.duration}</span>
                </div>
              </div>

              {/* Right price */}
              <div className="text-right flex-shrink-0 px-2">
                <span className="text-base sm:text-xl font-black text-zinc-800">₹{plan.price}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 7. Spa Packages */}
      <div className="space-y-3">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-855">Spa Packages</h2>
            <p className="text-xs md:text-sm text-zinc-500 font-semibold mt-1.5">Specialized deshedding blowout bundles and styling cuts.</p>
          </div>
          <button
            onClick={() => navigate("/dog-wash/packages")}
            className="text-xs md:text-sm font-bold text-grooming-primary hover:text-grooming-hover transition-colors flex items-center gap-1"
          >
            <span>Compare Spa Matrix</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex md:grid md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-x-auto md:overflow-x-visible pb-4 md:pb-0 snap-x snap-mandatory scrollbar-none -mx-4 px-4 md:mx-0 md:px-0"
        >
          {PACKAGES.map((pack) => (
            <div key={pack.id} className="w-[72vw] sm:w-[280px] md:w-auto flex-shrink-0 snap-start snap-always">
              <DogWashPackageCard pack={pack} />
            </div>
          ))}
        </div>

        {/* Custom Mobile Slider Progress Dots */}
        <div className="flex justify-center gap-2 mt-2 md:hidden">
          {PACKAGES.map((_, idx) => (
            <button
              key={idx}
              className={`h-2 rounded-full transition-all duration-300 ${
                activeSlide === idx ? 'w-6 bg-grooming-primary' : 'w-2 bg-zinc-200'
              }`}
              onClick={() => handleDotClick(idx)}
              aria-label={`Go to package ${idx + 1}`}
            />
          ))}
        </div>
      </div>



    </motion.div>
  );
}
