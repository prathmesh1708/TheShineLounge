import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Award, Shield, Zap, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';

import CarDetailingHero from '../components/carDetailingHero';
import CarDetailingCard from '../components/carDetailingCard';
import CarDetailingPackageCard from '../components/carDetailingPackageCard';
import CarDetailingFAQAccordion from '../components/carDetailingFAQAccordion';
import CarDetailingTestimonials from '../components/carDetailingTestimonials';
import { PrimaryButton } from '../components/carDetailingUI';

import { SERVICES, PACKAGES, FAQS, REVIEWS } from '../services/carDetailingApi';

export default function CarDetailingHomePage() {
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
      navigate(`/car-detailing/services?search=${encodeURIComponent(searchVal)}`);
    } else {
      navigate('/car-detailing/services');
    }
  };

  // Why choose us items
  const whyChooseUs = [
    {
      icon: <Award className="w-8 h-8 text-luxury-emerald" />,
      title: "Master Certified Detailers",
      desc: "Our technicians undergo rigorous 120-hour certifications in paint correction and liquid 9H nanoshield coatings."
    },
    {
      icon: <Shield className="w-8 h-8 text-luxury-emerald" />,
      title: "Eco-Safe Deionized Care",
      desc: "We wash exclusively using deionized water and organic, pH-balanced luxury snow foams to eliminate scratches."
    },
    {
      icon: <Zap className="w-8 h-8 text-luxury-emerald" />,
      title: "100% Fully Self-Contained",
      desc: "Our bespoke detailing vans carry their own purified water supply, silent power generators, and high-temp steamers."
    }
  ];

  // How it works items (based on the user's reference image!)
  const steps = [
    {
      num: "1",
      title: "Book Service",
      desc: "Select your premium service, date, and preferred time slot."
    },
    {
      num: "2",
      title: "We Clean",
      desc: "Our certified experts arrive and perform master detailing."
    },
    {
      num: "3",
      title: "Quality Check",
      desc: "Rigorous inspection ensures 100% paint & interior perfection."
    },
    {
      num: "4",
      title: "You Relax",
      desc: "Step inside your revitalized, showroom-fresh vehicle."
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-16 text-zinc-800"
    >
      {/* 1. Hero Carousel */}
      <CarDetailingHero />

      {/* 2. Interactive Search & Location Row */}
      <div className="bg-white border border-zinc-200/80 rounded-24 p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-premium">
        <div className="w-full md:w-1/2">
          <h2 className="text-xl md:text-2xl font-extrabold tracking-tight mb-2 text-zinc-850">Find Luxury Detailing</h2>
          <p className="text-xs md:text-sm text-zinc-500 font-semibold">Search exterior corrections, steam sanitization, and 9H ceramic armours.</p>
        </div>

        <form onSubmit={handleSearchSubmit} className="w-full md:w-1/2 flex gap-3">
          <div className="relative flex-grow">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input
              type="text"
              placeholder="e.g. Ceramic Coating, Steam, Headlight..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="w-full py-3.5 pl-12 pr-4 bg-zinc-50 border border-zinc-200 focus:border-luxury-emerald text-zinc-800 placeholder-zinc-400 rounded-20 outline-none text-sm transition-all shadow-sm"
            />
          </div>
          <button
            type="submit"
            className="py-3.5 px-6 bg-luxury-emerald hover:bg-luxury-emeraldHover text-white text-sm font-semibold rounded-20 shadow-premium transition-all"
          >
            Search
          </button>
        </form>
      </div>

      {/* 3. Featured Services Section */}
      <div className="space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-850">Our Detailing Menu</h2>
            <p className="text-xs md:text-sm text-zinc-500 font-semibold mt-1.5">Meticulous restoration treatments for ultimate cosmetic preservation.</p>
          </div>
          <button
            onClick={() => navigate("/car-detailing/services")}
            className="text-xs md:text-sm font-bold text-luxury-emerald hover:text-luxury-emeraldHover transition-colors flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {SERVICES.slice(0, 4).map((service) => (
            <CarDetailingCard key={service.id} service={service} />
          ))}
        </div>
      </div>

      {/* 4. Special Banner Promo */}
      <div className="relative bg-gradient-to-r from-luxury-emerald/10 via-zinc-50 to-white border border-luxury-emerald/20 rounded-24 p-8 overflow-hidden shadow-premium flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-luxury-emerald/5 blur-3xl rounded-full" />
        
        <div className="space-y-3.5 z-10 max-w-xl text-center md:text-left">
          <div className="inline-flex items-center gap-1 bg-luxury-emerald/15 border border-luxury-emerald/30 py-1 px-3 rounded-full text-xs font-bold text-luxury-emerald">
            <Sparkles className="w-3.5 h-3.5" />
            <span>SPECIAL OFFER</span>
          </div>
          <h3 className="text-2xl md:text-3xl font-extrabold text-zinc-850">Get 20% OFF on Full Detailing</h3>
          <p className="text-sm text-zinc-550 leading-relaxed">
            Experience our flagship bumper-to-bumper reset including deep steam sanitization, clay-bar decontamination, and 12-month synthetic sealant protection.
          </p>
        </div>

        <div className="z-10 flex flex-col items-center gap-3">
          <div className="bg-white border border-zinc-200 rounded-20 px-6 py-4 flex flex-col items-center justify-center font-mono shadow-sm">
            <span className="text-[10px] text-zinc-400 uppercase font-bold">COUPON CODE</span>
            <span className="text-xl font-bold tracking-widest text-luxury-emerald mt-0.5">DETAIL20</span>
          </div>
          <button
            onClick={() => navigate("/car-detailing/booking?coupon=DETAIL20")}
            className="w-full py-3 px-6 bg-luxury-emerald hover:bg-luxury-emeraldHover text-white text-xs font-bold rounded-20 shadow-premium transition-all"
          >
            Claim Offer
          </button>
        </div>
      </div>

      {/* 5. How It Works */}
      <div className="space-y-8 text-center bg-zinc-50 border border-zinc-200 rounded-24 p-8 md:p-12">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-850">How It Works</h2>
          <p className="text-xs md:text-sm text-zinc-500 font-semibold mt-1.5">Our simplified 4-step mobile booking and restoration workflow.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {steps.map((step, idx) => (
            <div key={idx} className="relative flex flex-col items-center space-y-4 group">
              {/* Step number badge */}
              <div className="w-14 h-14 bg-white border border-zinc-200 rounded-full flex items-center justify-center text-lg font-extrabold text-luxury-emerald shadow-sm relative group-hover:border-luxury-emerald/60 transition-all">
                <span>{step.num}</span>
                {/* Visual connectors between circles */}
                {idx < steps.length - 1 && (
                  <div className="hidden lg:block absolute left-[105%] top-1/2 -translate-y-1/2 w-[70%] border-t-2 border-dashed border-zinc-200" />
                )}
              </div>
              <h3 className="font-extrabold text-base text-zinc-800">{step.title}</h3>
              <p className="text-xs text-zinc-500 px-4 leading-relaxed font-medium">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Popular Packages Section */}
      <div className="space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-850">Popular Detailing Packages</h2>
            <p className="text-xs md:text-sm text-zinc-500 font-semibold mt-1.5">Bundled detailing programs curated for premium vehicle preservation.</p>
          </div>
          <button
            onClick={() => navigate("/car-detailing/packages")}
            className="text-xs md:text-sm font-bold text-luxury-emerald hover:text-luxury-emeraldHover transition-colors flex items-center gap-1"
          >
            <span>Compare Packages</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex md:grid md:grid-cols-2 lg:grid-cols-4 gap-6 overflow-x-auto md:overflow-x-visible pb-4 md:pb-0 snap-x snap-mandatory scrollbar-none -mx-4 px-4 md:mx-0 md:px-0"
        >
          {PACKAGES.map((pack) => (
            <div key={pack.id} className="w-[85vw] sm:w-[350px] md:w-auto flex-shrink-0 snap-start snap-always">
              <CarDetailingPackageCard pack={pack} />
            </div>
          ))}
        </div>

        {/* Custom Mobile Slider Progress Dots */}
        <div className="flex justify-center gap-2 mt-2 md:hidden">
          {PACKAGES.map((_, idx) => (
            <button
              key={idx}
              className={`h-2 rounded-full transition-all duration-300 ${
                activeSlide === idx ? 'w-6 bg-luxury-emerald' : 'w-2 bg-zinc-200'
              }`}
              onClick={() => handleDotClick(idx)}
              aria-label={`Go to package ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* 7. Why Choose Us Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {whyChooseUs.map((item, idx) => (
          <div key={idx} className="bg-white border border-zinc-200 rounded-24 p-8 space-y-4 hover:border-zinc-300 transition-colors shadow-sm">
            <div className="p-3 bg-luxury-emerald/10 rounded-20 w-fit">
              {item.icon}
            </div>
            <h3 className="text-lg font-bold text-zinc-800">{item.title}</h3>
            <p className="text-xs md:text-sm text-zinc-500 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* 8. Testimonials Section */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-850">Client Testimonials</h2>
          <p className="text-xs md:text-sm text-zinc-500 font-semibold mt-1.5">Hear from luxury and performance owners who trust DetailPro.</p>
        </div>
        <CarDetailingTestimonials reviews={REVIEWS} />
      </div>

      {/* 9. FAQ Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="space-y-4">
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight leading-tight text-zinc-850">Got Questions? We Have Answers.</h2>
          <p className="text-xs md:text-sm text-zinc-500 leading-relaxed font-medium">
            Read our detailing FAQs to learn more about water specifications, curing processes, chemical safety, and coating maintenance.
          </p>
          <PrimaryButton onClick={() => navigate("/car-detailing/contact")} className="w-fit py-3 px-6 text-sm">
            Contact Detailers
          </PrimaryButton>
        </div>
        <div className="lg:col-span-2">
          <CarDetailingFAQAccordion faqs={FAQS} />
        </div>
      </div>

    </motion.div>
  );
}
