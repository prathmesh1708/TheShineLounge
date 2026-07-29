import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Sparkles, ArrowRight, ShieldCheck, Heart, Bath, Scissors, ScissorsLineDashed, ShieldAlert } from 'lucide-react';

import DogWashHero from '../components/dogWashHero';
import DogWashCard from '../components/dogWashCard';
import DogWashPackageCard from '../components/dogWashPackageCard';
import { PrimaryButton } from '../components/dogWashUI';

import { SERVICES, PACKAGES, FAQS, REVIEWS } from '../services/dogWashApi';
import serviceApi from '../../common/services/serviceApi';

export default function DogWashHomePage() {
  const navigate = useNavigate();
  const [searchVal, setSearchVal] = useState("");
  const [activeSlide, setActiveSlide] = useState(0);
  const scrollRef = useRef(null);
  const [dbService, setDbService] = useState(null);

  const defaultPlans = [
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

  const [selectedPlan, setSelectedPlan] = useState(defaultPlans[0]);

  // Fetch dynamic dog wash service data from API
  useEffect(() => {
    const fetchDogWashData = async () => {
      try {
        const res = await serviceApi.getServiceBySlug('dog-wash');
        if (res.success && res.service) {
          setDbService(res.service);
          if (res.service.plans && res.service.plans.length > 0) {
            const mapped = res.service.plans.map(p => ({
              id: p._id,
              name: p.name,
              duration: p.duration || '5 Minutes',
              price: p.price,
              icon: '🛁',
              desc: p.description || p.features?.join(', ') || 'Professional dog wash spa session',
              isPopular: p.recommended
            }));
            setSelectedPlan(mapped[0]);
          }
        }
      } catch (err) {
        console.warn('Using default dog-wash layout data');
      }
    };
    fetchDogWashData();
  }, []);

  const activePlans = dbService?.plans && dbService.plans.length > 0
    ? dbService.plans.map(p => ({
        id: p._id,
        name: p.name,
        duration: p.duration || '5 Mins',
        price: p.price,
        icon: '🛁',
        desc: p.description || (p.features && p.features.join(', ')) || 'Complete warm hydrobath wash',
        isPopular: p.recommended
      }))
    : defaultPlans;

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

  return (
    <div className="space-y-6 md:space-y-10 pb-16">
      {/* Hero Section */}
      <DogWashHero />

      {/* Dynamic Duration Pricing Selector */}
      <section className="px-4 max-w-7xl mx-auto">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200/80 shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
              <Sparkles className="w-3.5 h-3.5" /> Self-Serve Hydrobath Options
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-zinc-900">Choose Wash Duration & Tier</h2>
            <p className="text-xs sm:text-sm text-zinc-600 max-w-xl mx-auto font-medium">
              Select warm hydrobath duration suited for your dog’s coat size and bath requirements.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {activePlans.map((plan) => {
              const isSelected = selectedPlan.id === plan.id;
              return (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan)}
                  className={`relative p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-amber-500 bg-amber-50/50 shadow-md scale-[1.02]'
                      : 'border-zinc-200 bg-white hover:border-amber-300 hover:bg-amber-50/20'
                  }`}
                >
                  {plan.isPopular && (
                    <span className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500 text-white shadow-xs">
                      Best Choice
                    </span>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">{plan.icon}</span>
                      <span className="text-xs font-black uppercase text-amber-700 bg-amber-100 px-2.5 py-1 rounded-lg">
                        {plan.duration}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-zinc-900">{plan.name}</h3>
                      <p className="text-xs text-zinc-600 mt-1 leading-relaxed">{plan.desc}</p>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-zinc-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-zinc-400 uppercase block">Total</span>
                      <span className="text-xl font-black text-zinc-900">₹{plan.price}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPlan(plan);
                        navigate('/dog-wash/booking', { state: { plan } });
                      }}
                      className="px-4 py-2 text-xs font-bold text-white rounded-xl shadow-sm transition-transform active:scale-95"
                      style={{ backgroundColor: dbService?.theme?.buttonColor || '#e07b2a' }}
                    >
                      Select Plan
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="px-4 max-w-7xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-zinc-900">Professional Grooming Services</h2>
            <p className="text-xs text-zinc-500">Expert care tailored for every dog breed</p>
          </div>
          <button 
            onClick={() => navigate('/dog-wash/services')}
            className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
          >
            View All <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {SERVICES.slice(0, 4).map((service) => (
            <DogWashCard key={service.id} service={service} />
          ))}
        </div>
      </section>

      {/* Packages Carousel */}
      <section className="px-4 max-w-7xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-zinc-900">Popular Care Packages</h2>
            <p className="text-xs text-zinc-500">Bundle & save on recurring treatments</p>
          </div>
          <button 
            onClick={() => navigate('/dog-wash/packages')}
            className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
          >
            All Packages <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-2"
        >
          {PACKAGES.map((pkg) => (
            <div key={pkg.id} className="min-w-[280px] sm:min-w-[320px] snap-center">
              <DogWashPackageCard pkg={pkg} />
            </div>
          ))}
        </div>

        <div className="flex justify-center items-center gap-2 pt-2">
          {PACKAGES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => handleDotClick(idx)}
              className={`h-2 rounded-full transition-all ${
                activeSlide === idx ? 'w-6 bg-amber-500' : 'w-2 bg-zinc-300'
              }`}
            />
          ))}
        </div>
      </section>

      {/* CTA Footer */}
      <section className="px-4 max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 rounded-3xl p-6 sm:p-10 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-2xl sm:text-3xl font-black">Give Your Dog the Royal Treatment Today</h3>
            <p className="text-xs sm:text-sm text-amber-100 max-w-lg">
              Book a slot online or drop by our Thane lounge for express self-serve baths and grooming.
            </p>
          </div>
          <PrimaryButton onClick={() => navigate('/dog-wash/booking')} className="bg-white text-amber-900 hover:bg-amber-50 font-black shadow-lg">
            Book Appointment Now
          </PrimaryButton>
        </div>
      </section>
    </div>
  );
}
