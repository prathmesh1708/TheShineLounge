import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, SlidersHorizontal, Sparkles } from 'lucide-react';

import SalonServiceCard from '../components/salonServiceCard';
import { SERVICES } from '../services/salonApi';

const CATEGORIES_FILTER = [
  "All",
  "Hair Cut",
  "Hair Styling",
  "Hair Coloring",
  "Beard Trim",
  "Facial",
  "Cleanup",
  "Spa",
  "Massage",
  "Manicure",
  "Pedicure",
  "Makeup",
  "Bridal Makeup"
];

export default function SalonServicesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchParamVal = searchParams.get("search") || "";
  const catParamVal = searchParams.get("category") || "All";

  const [searchVal, setSearchVal] = useState(searchParamVal);
  const [selectedCat, setSelectedCat] = useState(catParamVal);

  // Sync state with URL params
  useEffect(() => {
    setSearchVal(searchParamVal);
    setSelectedCat(catParamVal);
  }, [searchParamVal, catParamVal]);

  const handleCategorySelect = (cat) => {
    setSelectedCat(cat);
    const newParams = new URLSearchParams(searchParams);
    if (cat === "All") {
      newParams.delete("category");
    } else {
      newParams.set("category", cat);
    }
    setSearchParams(newParams);
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchVal(val);
    const newParams = new URLSearchParams(searchParams);
    if (val.trim() === "") {
      newParams.delete("search");
    } else {
      newParams.set("search", val);
    }
    setSearchParams(newParams);
  };

  const filteredServices = SERVICES.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchVal.toLowerCase()) ||
                          service.tagline.toLowerCase().includes(searchVal.toLowerCase()) ||
                          service.description.toLowerCase().includes(searchVal.toLowerCase());
    const matchesCategory = selectedCat === "All" || service.category === selectedCat;
    return matchesSearch && matchesCategory;
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 text-zinc-800"
    >
      {/* Title */}
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-zinc-855">Beauty & Grooming Menu</h1>
        <p className="text-xs md:text-sm text-zinc-500 font-semibold mt-1.5 font-sans">
          Select individual treatments or professional styling packages. Rescheduling is free.
        </p>
      </div>

      {/* Search Input Bar */}
      <div className="relative w-full max-w-2xl">
        <Search className="absolute left-4.5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
        <input
          type="text"
          placeholder="Search precision cuts, deep pore facials, spa massages..."
          value={searchVal}
          onChange={handleSearchChange}
          className="w-full py-4 pl-13 pr-12 bg-white border border-zinc-200 focus:border-primary text-zinc-800 placeholder-zinc-450 rounded-22 outline-none text-sm transition-all shadow-premium font-semibold"
        />
        <SlidersHorizontal className="absolute right-4.5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-450 pointer-events-none" />
      </div>

      {/* Horizontal Scrollable Category Filter Chips */}
      <div className="flex gap-2.5 overflow-x-auto pb-3 pt-1 scrollbar-thin scrollbar-thumb-zinc-200 scrollbar-track-transparent -mx-4 px-4 md:mx-0 md:px-0">
        {CATEGORIES_FILTER.map((cat, idx) => {
          const isSelected = selectedCat === cat;
          return (
            <motion.button
              key={idx}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleCategorySelect(cat)}
              className={`flex-shrink-0 px-5 py-2.5 rounded-full text-xs font-bold transition-all border ${
                isSelected
                  ? 'bg-primary border-primary text-white shadow-premium'
                  : 'bg-white border-zinc-200/80 hover:border-zinc-300 text-zinc-650'
              }`}
            >
              {cat}
            </motion.button>
          );
        })}
      </div>

      {/* Catalog Display Grid */}
      {filteredServices.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredServices.map((service) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <SalonServiceCard service={service} />
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-white border border-zinc-200 rounded-24 shadow-sm max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h4 className="text-lg font-bold text-zinc-800">No Services Found</h4>
            <p className="text-xs md:text-sm text-zinc-550 leading-relaxed font-semibold mt-1">
              We couldn't find any matches for "{searchVal}". Try modifying your text search or category filters.
            </p>
          </div>
          <button
            onClick={() => {
              setSearchVal("");
              handleCategorySelect("All");
            }}
            className="px-5 py-2.5 bg-primary hover:bg-primary/95 text-white text-xs font-bold rounded-15 transition-all shadow-sm"
          >
            Clear Filters
          </button>
        </div>
      )}

    </motion.div>
  );
}
