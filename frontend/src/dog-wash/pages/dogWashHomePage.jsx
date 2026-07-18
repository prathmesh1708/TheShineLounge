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
    { name: "Teeth Cleaning", label: "Teeth Cleaning", icon: "🪥", cat: "Wellness" },
    { name: "Spa Therapy", label: "Spa Therapy", icon: "🫧", cat: "Therapy" }
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

      {/* 3. Category Grid */}
      <div className="space-y-3">
        <div className="text-center md:text-left">
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-850">Spa Categories</h2>
          <p className="text-xs md:text-sm text-zinc-500 font-semibold mt-1.5">Treatments engineered for skin hygiene and coat softness.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {categories.map((cat, idx) => (
            <motion.button
              key={idx}
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleCategoryClick(cat.cat)}
              className="bg-white border border-zinc-200/80 hover:border-grooming-primary/45 rounded-24 p-5 text-center flex flex-col items-center gap-3 transition-all shadow-sm hover:shadow-md cursor-pointer"
            >
              <span className="text-3xl filter drop-shadow-sm select-none">{cat.icon}</span>
              <span className="text-xs font-bold text-zinc-700 tracking-wide">{cat.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* 4. Popular Services */}
      <div className="space-y-3">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-850">Popular Services</h2>
            <p className="text-xs md:text-sm text-zinc-500 font-semibold mt-1.5">Highly requested washes and custom haircuts.</p>
          </div>
          <button
            onClick={() => navigate("/dog-wash/services")}
            className="text-xs md:text-sm font-bold text-grooming-primary hover:text-grooming-hover transition-colors flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {SERVICES.slice(0, 4).map((service) => (
            <DogWashCard key={service.id} service={service} />
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
