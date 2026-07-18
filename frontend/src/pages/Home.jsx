import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShimmerCard } from '../common/components/Shimmer';
import { servicesData } from '../common/data/servicesData';
import useEntrance from '../common/hooks/useEntrance';
import ServiceIcon from '../common/components/ServiceIcon';

// Import local image assets for trending items
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
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  // Custom states for interactive elements
  const [searchQuery, setSearchQuery] = useState('');
  const [activePromoIndex, setActivePromoIndex] = useState(0);
  const [savedItems, setSavedItems] = useState([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 850);
    return () => clearTimeout(timer);
  }, []);

  // Stagger animate sections on mount
  const contentRef = useEntrance({
    y: 25,
    opacity: 0,
    duration: 0.8,
    stagger: 0.12,
    ease: 'power3.out',
    delay: loading ? 0 : 0.05
  });

  const toggleSaveItem = (itemId, e) => {
    e.stopPropagation();
    setSavedItems(prev => 
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  // Promo deals list
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

  // Circular Category Data (mapped to our 6 services)
  const categories = [
    { 
      id: 'cafe', 
      label: 'Cafe', 
      icon: '☕', 
      path: '/cafe',
      color: '#8D5B28'
    },
    { 
      id: 'drive-through', 
      label: 'Drive-Through Cafe', 
      icon: '⏱️', 
      path: '/drive-through-cafe',
      color: '#C17F19'
    },
    { 
      id: 'car-wash', 
      label: 'Car Wash', 
      icon: '🚗', 
      path: '/car-wash',
      color: '#148F87'
    },
    { 
      id: 'detailing', 
      label: 'Car Detailing', 
      icon: '🛡️', 
      path: '/car-detailing',
      color: '#4A5568'
    },
    { 
      id: 'dog-wash', 
      label: 'Dog Bath', 
      icon: '🐕', 
      path: '/dog-wash',
      color: '#2E7D32'
    },
    { 
      id: 'salon', 
      label: 'Salon', 
      icon: '✂️', 
      path: '/salon',
      color: '#7B1FA2'
    }
  ];

  // Trending showcase items using our custom data and assets
  const trendingItems = [
    {
      id: 'toast',
      title: 'Sourdough Poached Egg Toast',
      category: 'Brunch Special',
      price: '₹11.00',
      rating: '⭐ 4.9 (124 reviews)',
      image: trendingToast,
      path: '/cafe'
    },
    {
      id: 'chicken',
      title: 'Herbed Chicken Skillet',
      category: 'Gourmet Mains',
      price: '₹14.00',
      rating: '⭐ 4.7 (86 reviews)',
      image: trendingChicken,
      path: '/cafe'
    },
    {
      id: 'pancakes',
      title: 'Signature Pancakes Stack',
      category: 'Sweet Plates',
      price: '₹9.50',
      rating: '⭐ 4.8 (98 reviews)',
      image: trendingHero,
      path: '/cafe'
    }
  ];

  if (loading) {
    return (
      <div className="home-container">
        {/* Shimmer header & search */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#efebe4', animation: 'shimmerSweep 1.5s infinite' }} />
            <div style={{ width: '120px', height: '28px', borderRadius: '9999px', backgroundColor: '#efebe4', animation: 'shimmerSweep 1.5s infinite' }} />
            <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#efebe4', animation: 'shimmerSweep 1.5s infinite' }} />
          </div>
          <div style={{ width: '100%', height: '54px', borderRadius: '0.75rem', backgroundColor: '#efebe4', animation: 'shimmerSweep 1.5s infinite' }} />
        </div>
        <div className="services-grid">
          {Array.from({ length: 6 }).map((_, idx) => (
            <ShimmerCard key={idx} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="app-mobile-dashboard" ref={contentRef}>
      
      {/* Top Search & Bell Row */}
      <div className="top-search-bell-row" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', marginBottom: '0.5rem' }}>
        <div className="search-group-container" style={{ flexGrow: 1, width: 'auto' }}>
          <div className="search-input-wrapper">
            <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input 
              type="text" 
              placeholder="Search restaurants, salon..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-field"
            />
            <button className="search-filter-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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

      {/* Promos Carousel Banners */}
      <div className="promo-carousel">
        <div className="promo-card" onClick={() => navigate(promos[activePromoIndex].link)}>
          {/* Decorative background animations */}
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

      {/* Circular Service Categories Grid */}
      <div className="category-section">
        <motion.div 
          className="category-circle-grid"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {categories.map((cat) => (
            <motion.button
              key={cat.id}
              variants={itemVariants}
              className="category-circle-item"
              onClick={() => {
                if (cat.isPlaceholder) {
                  alert(`You clicked ${cat.label}! This is placeholder module demonstration.`);
                } else {
                  navigate(cat.path);
                }
              }}
            >
              <div className="circle-icon-box" style={{ '--circle-accent': cat.color }}>
                <ServiceIcon name={cat.id === 'drive-through' ? 'drive-through-cafe' : cat.id} size={38} />
              </div>
              <span className="circle-label">{cat.label}</span>
            </motion.button>
          ))}
        </motion.div>
      </div>

      {/* Trending Showcase Section */}
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
                  
                  {/* Floating save/bookmark button */}
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
                    <span className="trending-reviews">{item.rating.split(' (')[0]}</span>
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
