import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

import CarDetailingHero from '../components/carDetailingHero';
import CarDetailingCard from '../components/carDetailingCard';
import { getServicesSync } from '../services/carDetailingApi';

export default function CarDetailingHomePage() {
  const navigate = useNavigate();
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

  const activeServices = servicesList.filter(s => s.status !== 'inactive');

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 md:space-y-8 text-zinc-800"
    >
      {/* Hero Carousel */}
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

