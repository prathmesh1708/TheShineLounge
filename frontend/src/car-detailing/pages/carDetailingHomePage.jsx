import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Search } from 'lucide-react';

import CarDetailingHero from '../components/carDetailingHero';
import CarDetailingCard from '../components/carDetailingCard';
import { getServicesSync } from '../services/carDetailingApi';

export default function CarDetailingHomePage() {
  const navigate = useNavigate();
  const [searchVal, setSearchVal] = useState("");
  const [servicesList, setServicesList] = useState(getServicesSync());

  useEffect(() => {
    const handleDataChange = () => {
      setServicesList(getServicesSync());
    };
    window.addEventListener('carDetailingDataChanged', handleDataChange);
    return () => {
      window.removeEventListener('carDetailingDataChanged', handleDataChange);
    };
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchVal.trim()) {
      navigate(`/car-detailing/services?search=${encodeURIComponent(searchVal)}`);
    } else {
      navigate('/car-detailing/services');
    }
  };

  const activeServices = servicesList.filter(s => s.status !== 'inactive');

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 md:space-y-8 text-zinc-800"
    >
      {/* 1. Header Search Bar (matching provided screenshot) */}
      <form onSubmit={handleSearchSubmit} className="relative flex items-center gap-2">
        <div className="relative flex-grow">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <input
            type="text"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            placeholder="Search detailing treatments, steam..."
            className="w-full py-3.5 pl-12 pr-4 bg-white border border-zinc-200 focus:border-[#FF6B00] rounded-full outline-none text-xs sm:text-sm text-zinc-800 placeholder-zinc-400 shadow-xs transition-all"
          />
        </div>
        <button
          type="submit"
          className="px-6 py-3.5 bg-[#FF6B00] hover:bg-[#E66000] text-white text-xs sm:text-sm font-bold rounded-full transition-all shadow-sm flex items-center justify-center"
        >
          Search
        </button>
      </form>

      {/* 2. Hero Carousel */}
      <CarDetailingHero />

      {/* 3. Our Detailing Menu Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-855">
              Our Detailing Menu
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 font-semibold mt-1">
              Meticulous restoration treatments for ultimate cosmetic preservation.
            </p>
          </div>
          <button
            onClick={() => navigate("/car-detailing/services")}
            className="text-xs sm:text-sm font-bold text-[#FF6B00] hover:text-[#E66000] transition-colors flex items-center gap-1 shrink-0"
          >
            <span>View All</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Dynamic Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {activeServices.slice(0, 8).map((service) => (
            <CarDetailingCard key={service.id || service._id} service={service} />
          ))}
        </div>
      </div>

    </motion.div>
  );
}

