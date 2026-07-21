import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

// Import Theme Context
import { useTheme } from '../common/context/ThemeContext';

// Import Dark UI Modular Components
import Header from '../common/components/Header';
import SearchBar from '../common/components/SearchBar';
import HeroBanner from '../common/components/HeroBanner';
import CarouselIndicator from '../common/components/CarouselIndicator';
import SectionHeader from '../common/components/SectionHeader';
import ServiceGrid from '../common/components/ServiceGrid';
import TrendingSection from '../common/components/TrendingSection';
import ServiceIcon from '../common/components/ServiceIcon';
import { ShimmerCard } from '../common/components/Shimmer';

// Import local image assets for trending items
import trendingCarWash from '../assets/images/trending_car_wash.png';
import trendingDogBath from '../assets/images/trending_dog_bath.png';
import trendingToast from '../assets/images/gourmet_toast.png';
import trendingChicken from '../assets/images/gourmet_chicken.png';
import trendingHero from '../assets/images/gourmet_hero.png';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 22 } }
};

export default function Home() {
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activePromoIndex, setActivePromoIndex] = useState(0);
  const [savedItems, setSavedItems] = useState([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 450);
    return () => clearTimeout(timer);
  }, []);

  const toggleSaveItem = (itemId, e) => {
    e.stopPropagation();
    setSavedItems(prev => 
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  // 6 Services list (identical to Light Theme)
  const darkServices = [
    { id: 'car-wash', label: 'Car Wash', path: '/car-wash' },
    { id: 'detailing', label: 'Car Detailing', path: '/car-detailing' },
    { id: 'dog-wash', label: 'Dog Bath', path: '/dog-wash' },
    { id: 'cafe', label: 'Cafe', path: '/cafe' },
    { id: 'drive-through', label: 'Drive-Through Cafe', path: '/drive-through-cafe' },
    { id: 'salon', label: 'Salon', path: '/salon' }
  ];

  const lightCategories = [
    { id: 'car-wash', label: 'Car Wash', icon: '🚗', path: '/car-wash', color: '#148F87' },
    { id: 'detailing', label: 'Car Detailing', icon: '🛡️', path: '/car-detailing', color: '#4A5568' },
    { id: 'dog-wash', label: 'Dog Bath', icon: '🐕', path: '/dog-wash', color: '#2E7D32' },
    { id: 'cafe', label: 'Cafe', icon: '☕', path: '/cafe', color: '#8D5B28' },
    { id: 'drive-through', label: 'Drive-Through Cafe', icon: '⏱️', path: '/drive-through-cafe', color: '#C17F19' },
    { id: 'salon', label: 'Salon', icon: '✂️', path: '/salon', color: '#7B1FA2' }
  ];

  const trendingItems = [
    {
      id: 'car-wash-trending',
      title: 'Single Wash Package',
      category: 'Car Wash',
      price: '₹699',
      rating: '4.9',
      distance: '1.2 km',
      image: trendingCarWash,
      path: '/car-wash'
    },
    {
      id: 'dog-bath-trending',
      title: 'Full Dog Spa & Bath',
      category: 'Dog Bath',
      price: '₹499',
      rating: '4.8',
      distance: '0.8 km',
      image: trendingDogBath,
      path: '/dog-wash'
    },
    {
      id: 'toast-trending',
      title: 'Sourdough Poached Egg Toast',
      category: 'Brunch Special',
      price: '₹350',
      rating: '4.9',
      distance: '0.5 km',
      image: trendingToast,
      path: '/cafe'
    },
    {
      id: 'chicken-trending',
      title: 'Herbed Chicken Skillet',
      category: 'Gourmet Mains',
      price: '₹550',
      rating: '4.7',
      distance: '0.5 km',
      image: trendingChicken,
      path: '/cafe'
    }
  ];

  const promos = [
    {
      title: 'BREAKFAST GOOD DEALS',
      subtitle: 'Discount up to 30% on freshly baked croissants & morning double lattes.',
      badge: 'Brunch Special',
      link: '/cafe',
      floatingArt: (
        <div className="floating-art">
          <span className="steam">~ ~ ~</span>
          <span className="cup">☕</span>
          <span className="croissant">🥐</span>
        </div>
      )
    },
    {
      title: 'DELUXE CAR WASH OFFER',
      subtitle: 'Save 20% on all detailing and executive polish packages this week.',
      badge: 'Wash Special',
      link: '/car-wash',
      floatingArt: (
        <div className="floating-art">
          <span className="steam">~ ~ ~</span>
          <span className="cup">🧼</span>
          <span className="croissant">🚗</span>
        </div>
      )
    }
  ];

  if (loading) {
    return (
      <div className="w-full max-w-[550px] mx-auto p-4">
        <div className="flex flex-col gap-4 mb-6">
          <div className="w-full h-14 rounded-2xl bg-gray-800/20 animate-pulse" />
          <div className="w-full h-44 rounded-3xl bg-gray-800/20 animate-pulse" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <ShimmerCard key={idx} />
          ))}
        </div>
      </div>
    );
  }

  // --- 1. DARK THEME UI VIEW ---
  if (isDark) {
    return (
      <div className="w-full max-w-[550px] mx-auto min-h-screen flex flex-col pb-24 px-1 bg-black">
        {/* Header */}
        <Header />

        {/* 56px Glass Search Bar */}
        <SearchBar 
          value={searchQuery}
          onChange={setSearchQuery}
          onFilterClick={() => navigate('/search')}
        />

        {/* Dark Blue Gradient Hero Banner */}
        <HeroBanner 
          promo={promos[activePromoIndex]}
          onExplore={() => navigate(promos[activePromoIndex].link)}
        />

        {/* Carousel Indicator */}
        <CarouselIndicator 
          total={promos.length} 
          activeIndex={activePromoIndex} 
          onSelect={setActivePromoIndex} 
        />

        {/* Our Services 3-Column Grid */}
        <SectionHeader 
          title="Our Services" 
          onViewAll={() => navigate('/car-wash')} 
        />
        <ServiceGrid 
          services={darkServices} 
          onServiceClick={(s) => navigate(s.path)} 
        />

        {/* Trending Near You Horizontal Scroll */}
        <TrendingSection 
          items={trendingItems} 
          onItemClick={(item) => navigate(item.path)}
          onViewAll={() => navigate('/cafe')}
        />
      </div>
    );
  }

  // --- 2. LIGHT THEME UI VIEW ---
  return (
    <div className="app-mobile-dashboard">
      
      {/* Top Search Bar */}
      <div className="top-search-bell-row" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', marginBottom: '0.5rem' }}>
        <div className="search-group-container" style={{ flexGrow: 1, width: 'auto' }}>
          <div className="search-input-wrapper">
            <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input 
              type="text" 
              placeholder="Search car wash, detailing, cafe, salon..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-field"
            />
            <button className="search-filter-btn" onClick={() => navigate('/search')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="4" y1="21" x2="4" y2="14" />
                <line x1="4" y1="10" x2="4" y2="3" />
                <line x1="12" y1="21" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12" y2="3" />
                <line x1="20" y1="21" x2="20" y2="16" />
                <line x1="20" y1="12" x2="20" y2="3" />
                <line x1="1" y1="14" x2="7" y2="14" />
                <line x1="9" y1="8" x2="15" y2="8" />
                <line x1="17" y1="16" x2="23" y2="16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Light Promo Banner */}
      <div className="promo-carousel">
        <div className="promo-card" onClick={() => navigate(promos[activePromoIndex].link)}>
          <div className="gradient-glow"></div>
          <div className="particle-stream"></div>
          <div className="promo-details">
            <span className="promo-badge">{promos[activePromoIndex].badge}</span>
            <h3 className="promo-title">{promos[activePromoIndex].title}</h3>
            <p className="promo-subtitle">{promos[activePromoIndex].subtitle}</p>
          </div>
          <div className="interactive-area">
            {promos[activePromoIndex].floatingArt}
            <button className="promo-action-btn pulse-glow-btn">Explore</button>
          </div>
        </div>
        
        <div className="promo-indicators">
          {promos.map((_, idx) => (
            <button 
              key={idx}
              className={`indicator-dot ${activePromoIndex === idx ? 'active' : ''}`}
              onClick={() => setActivePromoIndex(idx)}
            />
          ))}
        </div>
      </div>

      {/* Light Service Categories Circle Grid */}
      <div className="category-section">
        <motion.div 
          className="category-circle-grid"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {lightCategories.map((cat) => (
            <motion.button
              key={cat.id}
              variants={itemVariants}
              className="category-circle-item"
              onClick={() => navigate(cat.path)}
            >
              <div className="circle-icon-box" style={{ '--circle-accent': cat.color }}>
                <ServiceIcon name={cat.id === 'drive-through' ? 'drive-through-cafe' : cat.id} size={50} />
              </div>
              <span className="circle-label">{cat.label}</span>
            </motion.button>
          ))}
        </motion.div>
      </div>

      {/* Light Trending Showcase Section */}
      <div className="trending-section">
        <div className="trending-header">
          <h2 className="trending-title">Trending</h2>
          <button className="see-all-link" onClick={() => navigate('/cafe')}>See all</button>
        </div>

        <motion.div 
          className="trending-horizontal-scroll"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {trendingItems.map((item) => {
            const isSaved = savedItems.includes(item.id);
            return (
              <motion.div 
                key={item.id} 
                variants={itemVariants}
                className="trending-visual-card"
                onClick={() => navigate(item.path)}
              >
                <div className="trending-card-image-box">
                  <img src={item.image} alt={item.title} className="trending-card-img" />
                  <button 
                    className={`bookmark-btn ${isSaved ? 'saved' : ''}`}
                    onClick={(e) => toggleSaveItem(item.id, e)}
                  >
                    <svg className="bookmark-svg" width="16" height="16" viewBox="0 0 24 24" fill={isSaved ? '#c19a5b' : 'none'} stroke={isSaved ? '#c19a5b' : 'currentColor'} strokeWidth="2.5">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </svg>
                  </button>
                </div>

                <div className="trending-card-body">
                  <span className="trending-card-category">{item.category}</span>
                  <h4 className="trending-card-title">{item.title}</h4>
                  <div className="trending-card-footer">
                    <span className="trending-price">{item.price}</span>
                    <span className="trending-reviews">⭐ {item.rating}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

    </div>
  );
}
