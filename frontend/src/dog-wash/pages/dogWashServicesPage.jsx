import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, SlidersHorizontal } from 'lucide-react';

import DogWashSearchBar from '../components/dogWashSearchBar';
import DogWashFilterChips from '../components/dogWashFilterChips';
import DogWashCard from '../components/dogWashCard';
import { SERVICES } from '../services/dogWashApi';

const CATEGORIES = [
  "All",
  "Washing",
  "Grooming",
  "Wellness",
  "Therapy"
];

export default function DogWashServicesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get("search") || "";
  const initialCategory = searchParams.get("category") || "All";

  const [query, setQuery] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);

  useEffect(() => {
    const params = {};
    if (query) params.search = query;
    if (selectedCategory !== "All") params.category = selectedCategory;
    setSearchParams(params);
  }, [query, selectedCategory]);

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
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-zinc-855">Grooming & Wash Menu</h1>
        <p className="text-xs md:text-sm text-zinc-500 font-semibold mt-1">
          Select standard shampoo rinse cycles, claw trimming, deshedding blowouts, or bubble spa therapies.
        </p>
      </div>

      <div className="space-y-4">
        <DogWashSearchBar value={query} onChange={setQuery} />
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-zinc-450 text-xs font-bold mr-1">
            <SlidersHorizontal className="w-4 h-4 text-grooming-primary" />
            <span>Filter Type:</span>
          </div>
          <div className="flex-grow">
            <DogWashFilterChips
              categories={CATEGORIES}
              selectedCategory={selectedCategory}
              onSelect={setSelectedCategory}
            />
          </div>
        </div>
      </div>

      <div className="pt-4">
        <AnimatePresence mode="popLayout">
          {filteredServices.length > 0 ? (
            <motion.div
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredServices.map(service => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  key={service.id}
                >
                  <DogWashCard service={service} />
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
              <h3 className="text-lg font-bold text-zinc-800">No Services Found</h3>
              <p className="text-xs text-zinc-500 leading-relaxed font-semibold">
                We couldn't find any grooming treatments matching "{query}" under category "{selectedCategory}". Please adjust search criteria.
              </p>
              <button
                onClick={() => { setQuery(""); setSelectedCategory("All"); }}
                className="py-2.5 px-5 bg-grooming-primary hover:bg-grooming-hover text-white text-xs font-semibold rounded-20 shadow-premium transition-all"
              >
                Clear Filters
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </motion.div>
  );
}
