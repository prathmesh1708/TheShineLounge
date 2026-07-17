import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Sparkles, ArrowRight, ShieldCheck, Heart, Bath, Scissors, ScissorsLineDashed, ShieldAlert } from 'lucide-react';

import DogWashHero from '../components/dogWashHero';
import DogWashCard from '../components/dogWashCard';
import DogWashPackageCard from '../components/dogWashPackageCard';
import DogWashFAQAccordion from '../components/dogWashFAQAccordion';
import DogWashTestimonials from '../components/dogWashTestimonials';
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
      className="space-y-16 text-zinc-800"
    >
      {/* 1. Hero Slides Slider */}
      <DogWashHero />

      {/* 2. Search & Categories Panel */}
      <div className="bg-white border border-zinc-200/80 rounded-24 p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-premium">
        <div className="w-full md:w-1/2">
          <h2 className="text-xl md:text-2xl font-extrabold tracking-tight mb-2 text-zinc-850">Find Grooming Specials</h2>
          <p className="text-xs md:text-sm text-zinc-500 font-semibold">Search deshedding blowout cycles, bubble hydromassages, and claw grinds.</p>
        </div>

        <form onSubmit={handleSearchSubmit} className="w-full md:w-1/2 flex gap-3">
          <div className="relative flex-grow">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input
              type="text"
              placeholder="e.g. Scissor trim, Flea, Mud wrap..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="w-full py-3.5 pl-12 pr-4 bg-zinc-50 border border-zinc-200 focus:border-grooming-primary text-zinc-800 placeholder-zinc-400 rounded-20 outline-none text-sm transition-all shadow-sm font-semibold"
            />
          </div>
          <button
            type="submit"
            className="py-3.5 px-6 bg-grooming-primary hover:bg-grooming-hover text-white text-sm font-semibold rounded-20 shadow-premium transition-all"
          >
            Search
          </button>
        </form>
      </div>

      {/* 3. Category Grid */}
      <div className="space-y-6">
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
      <div className="space-y-6">
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {SERVICES.slice(0, 4).map((service) => (
            <DogWashCard key={service.id} service={service} />
          ))}
        </div>
      </div>

      {/* 5. Special Promotional Banner */}
      <div className="relative bg-gradient-to-r from-grooming-primary/10 via-zinc-50 to-white border border-grooming-primary/20 rounded-24 p-8 overflow-hidden shadow-premium flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-grooming-primary/5 blur-3xl rounded-full" />
        
        <div className="space-y-3.5 z-10 max-w-xl text-center md:text-left">
          <div className="inline-flex items-center gap-1 bg-grooming-primary/10 border border-grooming-primary/25 py-1 px-3 rounded-full text-xs font-bold text-grooming-primary">
            <Sparkles className="w-3.5 h-3.5" />
            <span>WELCOME SPECIAL</span>
          </div>
          <h3 className="text-2xl md:text-3xl font-extrabold text-zinc-850">Save 15% on First Grooming</h3>
          <p className="text-sm text-zinc-550 leading-relaxed font-semibold">
            Claim first spa discount for puppy haircuts or bubble jacuzzis. Safe, certified master groomers, pH-balanced washes, and low-stress drying tunnels.
          </p>
        </div>

        <div className="z-10 flex flex-col items-center gap-3">
          <div className="bg-white border border-zinc-200 rounded-20 px-6 py-4 flex flex-col items-center justify-center font-mono shadow-sm">
            <span className="text-[10px] text-zinc-400 uppercase font-bold">COUPON CODE</span>
            <span className="text-xl font-bold tracking-widest text-grooming-primary mt-0.5">FIRSTPAW15</span>
          </div>
          <button
            onClick={() => navigate("/dog-wash/booking?coupon=FIRSTPAW15")}
            className="w-full py-3 px-6 bg-grooming-primary hover:bg-grooming-hover text-white text-xs font-bold rounded-20 shadow-premium transition-all"
          >
            Claim Discount
          </button>
        </div>
      </div>

      {/* 6. How It Works */}
      <div className="space-y-8 text-center bg-zinc-50 border border-zinc-200 rounded-24 p-8 md:p-12">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-850">How It Works</h2>
          <p className="text-xs md:text-sm text-zinc-500 font-semibold mt-1.5">Elite mobile pet salon dispatched straight to your driveway.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {steps.map((step, idx) => (
            <div key={idx} className="relative flex flex-col items-center space-y-4 group">
              <div className="w-14 h-14 bg-white border border-zinc-200 rounded-full flex items-center justify-center text-lg font-extrabold text-grooming-primary shadow-sm relative group-hover:border-grooming-primary/60 transition-all">
                <span>{step.num}</span>
                {idx < steps.length - 1 && (
                  <div className="hidden lg:block absolute left-[105%] top-1/2 -translate-y-1/2 w-[70%] border-t-2 border-dashed border-zinc-200" />
                )}
              </div>
              <h3 className="font-extrabold text-base text-zinc-800">{step.title}</h3>
              <p className="text-xs text-zinc-500 px-4 leading-relaxed font-semibold">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 7. Spa Packages */}
      <div className="space-y-6">
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
            <div key={pack.id} className="w-[85vw] sm:w-[350px] md:w-auto flex-shrink-0 snap-start snap-always">
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

      {/* 8. Testimonials Section */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-850">Happy Pets, Satisfied Owners</h2>
          <p className="text-xs md:text-sm text-zinc-500 font-semibold mt-1.5">Hear from local dog owners who trust PawPro.</p>
        </div>
        <DogWashTestimonials reviews={REVIEWS} />
      </div>

      {/* 9. FAQs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="space-y-4">
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight leading-tight text-zinc-850">Got Questions?</h2>
          <p className="text-xs md:text-sm text-zinc-500 leading-relaxed font-semibold">
            Read our grooming FAQs to learn more about silent drying machinery, warm water specifications, skin-safe shampoos, and styling.
          </p>
          <PrimaryButton onClick={() => navigate("/dog-wash/contact")} className="w-fit py-3 px-6 text-sm">
            Contact Groomers
          </PrimaryButton>
        </div>
        <div className="lg:col-span-2">
          <DogWashFAQAccordion faqs={FAQS} />
        </div>
      </div>

    </motion.div>
  );
}
