import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

import CarDetailingHero from '../components/carDetailingHero';
import CarDetailingCard from '../components/carDetailingCard';
import { PrimaryButton } from '../components/carDetailingUI';

import { SERVICES } from '../services/carDetailingApi';

export default function CarDetailingHomePage() {
  const navigate = useNavigate();
  const [searchVal, setSearchVal] = useState("");

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchVal.trim()) {
      navigate(`/car-detailing/services?search=${encodeURIComponent(searchVal)}`);
    } else {
      navigate('/car-detailing/services');
    }
  };

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

    </motion.div>
  );
}
