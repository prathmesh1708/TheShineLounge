import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Award, Shield, Zap, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';

import CarDetailingHero from '../components/carDetailingHero';
import CarDetailingCard from '../components/carDetailingCard';
import CarDetailingPackageCard from '../components/carDetailingPackageCard';
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
      icon: <Award className="w-8 h-8 text-[#FF6B00]" />,
      title: "Master Certified Detailers",
      desc: "Our technicians undergo rigorous 120-hour certifications in paint correction and liquid 9H nanoshield coatings."
    },
    {
      icon: <Shield className="w-8 h-8 text-[#FF6B00]" />,
      title: "Eco-Safe Deionized Care",
      desc: "We wash exclusively using deionized water and organic, pH-balanced luxury snow foams to eliminate scratches."
    },
    {
      icon: <Zap className="w-8 h-8 text-[#FF6B00]" />,
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
      className="space-y-6 md:space-y-10 text-zinc-800"
    >

      {/* 1. Hero Carousel */}
      <CarDetailingHero />

      {/* 3. Featured Services Section */}
      <div className="space-y-3">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-855">Our Detailing Menu</h2>
            <p className="text-xs md:text-sm text-zinc-500 font-semibold mt-1.5">Meticulous restoration treatments for ultimate cosmetic preservation.</p>
          </div>
          <button
            onClick={() => navigate("/car-detailing/services")}
            className="text-xs md:text-sm font-bold text-[#FF6B00] hover:text-[#E66000] transition-colors flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {SERVICES.slice(0, 4).map((service) => (
            <CarDetailingCard key={service.id} service={service} />
          ))}
        </div>
      </div>


      {/* 6. Popular Packages Section */}
      <div className="space-y-3">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-850">Popular Detailing Packages</h2>
            <p className="text-xs md:text-sm text-zinc-500 font-semibold mt-1.5">Bundled detailing programs curated for premium vehicle preservation.</p>
          </div>
          <button
            onClick={() => navigate("/car-detailing/packages")}
            className="text-xs md:text-sm font-bold text-[#FF6B00] hover:text-[#E66000] transition-colors flex items-center gap-1"
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
            <div key={pack.id} className="w-[72vw] sm:w-[280px] md:w-auto flex-shrink-0 snap-start snap-always">
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
                activeSlide === idx ? 'w-6 bg-[#FF6B00]' : 'w-2 bg-zinc-200'
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
            <div className="p-3 bg-[#FF6B00]/10 rounded-20 w-fit">
              {item.icon}
            </div>
            <h3 className="text-lg font-bold text-zinc-800">{item.title}</h3>
            <p className="text-xs md:text-sm text-zinc-500 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>



    </motion.div>
  );
}
