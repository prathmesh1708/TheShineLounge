import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { servicesData } from '../../common/data/servicesData';
import apiClient from '../../common/utils/apiClient';

// Import local image assets
import gourmetHero from '../../assets/images/gourmet_hero.png';
import gourmetToast from '../../assets/images/gourmet_toast.png';
import gourmetChicken from '../../assets/images/gourmet_chicken.png';
import gourmetDessert from '../../assets/images/gourmet_dessert.png';

export default function CafePage() {
  const navigate = useNavigate();
  const data = servicesData.cafe;
  
  // State variables for catalog flow
  const [activeCategory, setActiveCategory] = useState(null); // null = Home, otherwise name of category
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSubFilter, setActiveSubFilter] = useState('All');
  const [savedItems, setSavedItems] = useState([]);

  // Live database state
  const [serviceMain, setServiceMain] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCafeService = async () => {
      try {
        const res = await apiClient.get('/services/cafe');
        if (res.data && res.data.service) {
          setServiceMain(res.data.service);
        }
      } catch (err) {
        console.warn('Error loading Cafe service:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCafeService();
  }, []);

  // Dynamically map categories & dishes from the database
  const categoriesList = serviceMain?.menuSections?.map((sec, idx) => {
    // Fallback default assets if cover/banner image not set
    const defaultAssets = [gourmetHero, gourmetToast, gourmetDessert, gourmetChicken];
    const imageAsset = sec.image || defaultAssets[idx % defaultAssets.length];

    return {
      id: sec._id || `sec-${idx}`,
      title: sec.title,
      subtitle: sec.subtitle || sec.description,
      desc: sec.description || sec.subtitle,
      bgColor: sec.bgColor || 'linear-gradient(135deg, #F5A623 0%, #D48806 100%)',
      image: imageAsset,
      items: (serviceMain.plans || [])
        .filter(p => p.section === sec.title && p.status === 'active')
        .map(p => ({
          name: p.name,
          price: p.price,
          weight: p.weight || '220g',
          image: p.image || imageAsset,
          subcat: p.subcat || 'Mains'
        }))
    };
  }) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#fffbeb] text-amber-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-black tracking-wide opacity-80">Loading Premium Menu...</span>
        </div>
      </div>
    );
  }

  const toggleSaveItem = (itemName, e) => {
    e.stopPropagation();
    setSavedItems(prev => 
      prev.includes(itemName) ? prev.filter(name => name !== itemName) : [...prev, itemName]
    );
  };

  // Get active category object
  const activeCategoryObj = categoriesList.find(c => c.title === activeCategory);

  // Filter items in the sub-category details view
  const getSubFilteredItems = () => {
    if (!activeCategoryObj) return [];
    let items = activeCategoryObj.items;
    
    // Search query filter
    if (searchQuery) {
      items = items.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    // Horizontal category pills filter
    if (activeSubFilter === 'All') return items;
    return items.filter(i => i.subcat === activeSubFilter);
  };

  // Sub-categories list for the active menu details view
  const getSubcategories = () => {
    if (!activeCategoryObj) return [];
    const list = ['All'];
    activeCategoryObj.items.forEach(i => {
      if (!list.includes(i.subcat)) list.push(i.subcat);
    });
    return list;
  };

  // Catalog home search filter
  const getFilteredCategories = () => {
    if (!searchQuery) return categoriesList;
    return categoriesList.filter(c => 
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.items.some(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  };

  // Framer Motion Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } }
  };

  return (
    <div className="cafe-catalog-container">
      
      <AnimatePresence mode="wait">
        
        {/* 1. Main Directory Catalog view */}
        {activeCategory === null ? (
          <motion.div 
            key="directory"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="catalog-main-flow"
          >

            {/* Catalog Search Bar */}
            <div className="catalog-search-bar-wrapper">
              <input 
                type="text" 
                placeholder="Search across catalog..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="catalog-search-input"
              />
              <svg className="catalog-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>

            {/* stacked directory banners */}
            <motion.div 
              className="catalog-banners-stack"
              variants={containerVariants}
              initial="hidden"
              animate="show"
            >
              {getFilteredCategories().map((cat) => (
                <motion.div 
                  key={cat.id} 
                  variants={itemVariants}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="category-banner-card"
                  style={{ background: cat.bgColor }}
                  onClick={() => {
                    setActiveCategory(cat.title);
                    setActiveSubFilter('All');
                  }}
                >
                  <div className="category-banner-content">
                    <h2 className="banner-title">{cat.title}</h2>
                    <p className="banner-subtitle">{cat.subtitle}</p>
                    <span className="banner-desc">{cat.desc}</span>
                  </div>
                  <div className="category-banner-img-frame">
                    <img src={cat.image} alt={cat.title} className="banner-overlay-img" />
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        ) : (
          /* 2. Sub-Category Items Detail View */
          <motion.div 
            key="detail"
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="catalog-detail-flow"
          >
            
            {/* Header Row: Back button, Title, Filter icon */}
            <div className="catalog-detail-header">
              <button className="back-btn-round" onClick={() => setActiveCategory(null)}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
              </button>
              <h2 className="catalog-detail-title">{activeCategory}</h2>
              <button className="back-btn-round" style={{ opacity: 0.8 }} onClick={() => alert('Filter settings options (demonstration only).')}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
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

            {/* Quick Stats Banner */}
            <div className="detail-quick-stats-row">
              <div className="quick-stat-pill">
                <span className="stat-pill-icon">⏱️</span>
                <span className="stat-pill-text">{activeCategoryObj?.desc.split(' served ')[1] || 'Freshly Brewed'}</span>
              </div>
              <div className="quick-stat-pill">
                <span className="stat-pill-icon">⚜️</span>
                <span className="stat-pill-text">Premium Grade</span>
              </div>
            </div>

            {/* Horizontal sub-category pills scrolling bar */}
            <div className="subcat-scroll-bar">
              {getSubcategories().map((subcat) => (
                <button
                  key={subcat}
                  className={`subcat-pill-btn ${activeSubFilter === subcat ? 'active' : ''}`}
                  onClick={() => setActiveSubFilter(subcat)}
                >
                  {subcat}
                </button>
              ))}
            </div>

            {/* 2-Column Catalog Items Grid */}
            <motion.div 
              className="catalog-grid-2col"
              variants={containerVariants}
              initial="hidden"
              animate="show"
            >
              {getSubFilteredItems().map((item, idx) => {
                const isSaved = savedItems.includes(item.name);
                return (
                  <motion.div 
                    key={idx} 
                    variants={itemVariants}
                    whileHover={{ y: -1 }}
                    className="catalog-grid-item"
                  >
                    <div className="grid-item-img-box">
                      <img src={item.image} alt={item.name} className="grid-item-img" />
                      
                      {/* Floating save button */}
                      <button 
                        className={`grid-item-save-btn ${isSaved ? 'saved' : ''}`}
                        onClick={(e) => toggleSaveItem(item.name, e)}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill={isSaved ? '#c19a5b' : 'none'} stroke={isSaved ? '#c19a5b' : 'currentColor'} strokeWidth="2.5">
                          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                        </svg>
                      </button>
                    </div>

                    <div className="grid-item-details">
                      <span className="grid-item-price">₹{item.price.toFixed(2)}</span>
                      <h4 className="grid-item-name">{item.name}</h4>
                      <span className="grid-item-weight">{item.weight}</span>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* Info notice */}
      <div className="info-box" style={{ marginTop: '2.5rem' }}>
        <span className="info-box-icon">☕</span>
        <span className="info-box-text">
          Lounge menu is display-only. Please place orders directly with our lounge baristas at the service counter.
        </span>
      </div>

    </div>
  );
}
