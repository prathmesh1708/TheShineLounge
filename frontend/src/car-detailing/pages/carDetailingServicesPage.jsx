import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, SlidersHorizontal, ArrowLeft } from 'lucide-react';

import CarDetailingSearchBar from '../components/carDetailingSearchBar';
import CarDetailingFilterChips from '../components/carDetailingFilterChips';
import CarDetailingCard from '../components/carDetailingCard';
import { SERVICES } from '../services/carDetailingApi';

const CATEGORIES = [
  "All",
  "Paint Protection",
  "Ceramic Coating",
  "Paint Correction",
  "Full Detailing",
  "Engine Bay Detailing",
  "Steam Detailing",
  "Headlight Restoration",
  "Leather Restoration"
];

export default function CarDetailingServicesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get("search") || "";
  const initialCategory = searchParams.get("category") || "All";

  const [query, setQuery] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);

  // Sync state with URL params
  useEffect(() => {
    const params = {};
    if (query) params.search = query;
    if (selectedCategory !== "All") params.category = selectedCategory;
    setSearchParams(params);
  }, [query, selectedCategory]);

  // Filter logic
  const filteredServices = SERVICES.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(query.toLowerCase()) ||
                          service.tagline.toLowerCase().includes(query.toLowerCase()) ||
                          service.description.toLowerCase().includes(query.toLowerCase());
    
    const matchesCategory = selectedCategory === "All" || service.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-8 text-zinc-800"
    >
      {/* Back Button */}
      <div>
        <button
          onClick={() => navigate('/car-detailing')}
          className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-800 transition-colors font-bold"
        >
          <ArrowLeft className="w-4.5 h-4.5" />
          <span>Back</span>
        </button>
      </div>

      {/* Search & Filter controls */}
      <div className="space-y-4">
        <CarDetailingSearchBar value={query} onChange={setQuery} />
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-zinc-450 text-xs font-bold mr-1">
            <SlidersHorizontal className="w-4 h-4 text-luxury-emerald" />
            <span>Category:</span>
          </div>
          <div className="flex-grow">
            <CarDetailingFilterChips
              categories={CATEGORIES}
              selectedCategory={selectedCategory}
              onSelect={setSelectedCategory}
            />
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="pt-4">
        <AnimatePresence>
          {filteredServices.length > 0 ? (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredServices.map(service => (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  key={service.id}
                >
                  <CarDetailingCard service={service} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="bg-white border border-zinc-200 rounded-24 p-12 text-center flex flex-col items-center justify-center space-y-4 max-w-md mx-auto shadow-premium"
            >
              <AlertCircle className="w-12 h-12 text-zinc-300" />
              <h3 className="text-lg font-bold text-zinc-800">No Detailing Services Found</h3>
              <p className="text-xs text-zinc-500 leading-relaxed font-semibold">
                We couldn't find any services matching "{query}" under category "{selectedCategory}". Please try clearing filters or adjusting your query.
              </p>
              <button
                onClick={() => { setQuery(""); setSelectedCategory("All"); }}
                className="py-2.5 px-5 bg-luxury-emerald hover:bg-luxury-emeraldHover text-white text-xs font-semibold rounded-20 shadow-premium transition-all"
              >
                Clear Search & Filters
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </motion.div>
  );
}
