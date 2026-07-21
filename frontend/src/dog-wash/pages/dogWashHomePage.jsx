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
      name: "Quick Bath",
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
      name: "Deluxe Bath",
      duration: "12 Minutes",
      price: 500,
      icon: "🛁",
      desc: "Aloe conditioner, warm-water jacuzzi bubble massage, ear flush, and full brush out."
    }
  ];

  const [selectedPlan, setSelectedPlan] = useState(pricingPlans[0]);

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

  const handleBook = () => {
    navigate('/dog-wash/confirm', {
      state: {
        bookingId: `BK-${Math.floor(1000 + Math.random() * 9000)}`,
        vehicle: `Max (Golden Retriever)`,
        item: selectedPlan.name,
        date: new Date().toISOString().split('T')[0],
        time: "Flexible Arrival",
        price: selectedPlan.price,
        address: "Palasia Main Rd, Scheme 54, Indore"
      }
    });
  };

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


        <div className="flex flex-col gap-3">
          {pricingPlans.map((plan) => (
            <div 
              key={plan.id}
              className={`flex items-center gap-4 bg-white border rounded-24 p-4.5 cursor-pointer transition-all shadow-sm hover:shadow-md ${
                selectedPlan.id === plan.id ? 'border-grooming-primary ring-2 ring-grooming-primary/20 bg-grooming-primary/5' : 'border-zinc-200/80 hover:border-grooming-primary/45'
              }`}
              onClick={() => setSelectedPlan(plan)}
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


      {/* 6. Sticky Booking CTA Button */}
      <div className="carwash-cta-wrapper pt-1">
        <button 
          className="carwash-book-btn"
          style={{ backgroundColor: '#FF6B00' }}
          onClick={handleBook}
        >
          Book {selectedPlan.name} · ₹{selectedPlan.price}
        </button>
      </div>

    </motion.div>
  );
}
