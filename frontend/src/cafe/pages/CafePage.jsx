import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { servicesData } from '../../common/data/servicesData';

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

  // Mock mapping of categories to display banners
  const categoriesList = [
    {
      id: 'main-menu',
      title: 'Main Menu',
      subtitle: 'Complete list of premium lounge meals',
      desc: 'Prepared fresh, served within 15 minutes',
      bgColor: 'linear-gradient(135deg, #F5A623 0%, #D48806 100%)', // Yellow-orange gradient
      image: gourmetHero,
      items: [
        { name: 'Sourdough Avocado Toast', price: 11.00, weight: '220g', image: gourmetToast, subcat: 'Brunch' },
        { name: 'Truffle Mushroom Panini', price: 14.00, weight: '250g', image: gourmetChicken, subcat: 'Mains' },
        { name: 'Pesto Chicken Focaccia', price: 15.00, weight: '280g', image: gourmetHero, subcat: 'Mains' },
        { name: 'Smoked Salmon Bagel', price: 13.50, weight: '240g', image: gourmetToast, subcat: 'Brunch' },
        { name: 'Shine Lounge Caesar Salad', price: 12.50, weight: '200g', image: gourmetDessert, subcat: 'Mains' }
      ]
    },
    {
      id: 'express-menu',
      title: 'Express Menu',
      subtitle: 'Fast barista brews and fresh croissants',
      desc: 'Ready in 2 minutes for immediate pickup',
      bgColor: 'linear-gradient(135deg, #FA541C 0%, #D4380D 100%)', // Bright orange gradient
      image: gourmetToast,
      items: [
        { name: 'Espresso Double Shot', price: 3.50, weight: '60ml', image: gourmetHero, subcat: 'Coffee' },
        { name: 'Cortado / Macchiato', price: 4.00, weight: '80ml', image: gourmetHero, subcat: 'Coffee' },
        { name: 'Classic Cappuccino', price: 4.50, weight: '180ml', image: gourmetHero, subcat: 'Coffee' },
        { name: 'Madagascar Vanilla Latte', price: 5.00, weight: '220ml', image: gourmetHero, subcat: 'Coffee' },
        { name: 'Ceremonial Matcha Latte', price: 5.50, weight: '220ml', image: gourmetHero, subcat: 'Tea' },
        { name: 'Shaken Iced Espresso', price: 4.75, weight: '240ml', image: gourmetHero, subcat: 'Iced' },
        { name: 'Cold Brew Blend', price: 4.50, weight: '240ml', image: gourmetHero, subcat: 'Iced' },
        { name: 'Almond Croissant', price: 5.50, weight: '110g', image: gourmetToast, subcat: 'Bakery' }
      ]
    },
    {
      id: 'custom-cakes',
      title: 'Cakes & Sweet Tarts',
      subtitle: 'Chef-crafted desserts and sweet plates',
      desc: 'Prepared and decorated within 12 minutes',
      bgColor: 'linear-gradient(135deg, #B7094C 0%, #800E13 100%)', // Deep plum/crimson gradient
      image: gourmetDessert,
      items: [
        { name: 'Salted Caramel Chocolate Tart', price: 6.50, weight: '120g', image: gourmetDessert, subcat: 'Tarts' },
        { name: 'Classic Tiramisu Slice', price: 7.00, weight: '140g', image: gourmetDessert, subcat: 'Cakes' },
        { name: 'Dark Chocolate Fudge Brownie', price: 5.00, weight: '90g', image: gourmetDessert, subcat: 'Cakes' }
      ]
    },
    {
      id: 'hot-bakery',
      title: 'Oven-Hot Bakery',
      subtitle: 'Savory pies and warm artisan pastries',
      desc: 'Freshly baked and served hot from the oven',
      bgColor: 'linear-gradient(135deg, #A06A42 0%, #704224 100%)', // Deep tan/brown gradient
      image: gourmetChicken,
      items: [
        { name: 'Almond Croissant (Warm)', price: 5.50, weight: '110g', image: gourmetToast, subcat: 'Sweet' },
        { name: 'Truffle Mushroom Pie', price: 14.00, weight: '250g', image: gourmetChicken, subcat: 'Savory' },
        { name: 'Smoked Salmon Bagel (Toasted)', price: 13.50, weight: '240g', image: gourmetToast, subcat: 'Savory' }
      ]
    }
  ];

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
                      <span className="grid-item-price">${item.price.toFixed(2)}</span>
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
