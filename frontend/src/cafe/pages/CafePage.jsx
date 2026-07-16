import React, { useState, useEffect } from 'react';
import { servicesData } from '../../common/data/servicesData';
import PageHeader from '../../common/components/PageHeader';
import { ShimmerPageHeader, ShimmerMenu } from '../../common/components/Shimmer';
import useEntrance from '../../common/hooks/useEntrance';
import gsap from 'gsap';

// Import local generated image assets
import gourmetHero from '../../assets/images/gourmet_hero.png';
import gourmetToast from '../../assets/images/gourmet_toast.png';
import gourmetChicken from '../../assets/images/gourmet_chicken.png';
import gourmetDessert from '../../assets/images/gourmet_dessert.png';

export default function CafePage() {
  const data = servicesData.cafe;
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  
  // Interactive recipe state for Herbed Chicken Skillet
  const [chickenIngredients, setChickenIngredients] = useState([
    { id: 'chicken', name: 'Organic Chicken', selected: true, priceDelta: 0 },
    { id: 'rosemary', name: 'Rosemary Herbs', selected: true, priceDelta: 0 },
    { id: 'tomatoes', name: 'Blistered Tomatoes', selected: true, priceDelta: 0 },
    { id: 'truffle', name: 'Truffle Glaze', selected: false, priceDelta: 2.50 },
    { id: 'avocado', name: 'Avocado Slice', selected: false, priceDelta: 1.50 }
  ]);
  
  // Custom booking notification
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 700);
    return () => clearTimeout(timer);
  }, []);

  const contentRef = useEntrance({ 
    y: 25, 
    duration: 0.7, 
    stagger: 0.1,
    delay: loading ? 0 : 0.05
  });

  if (loading) {
    return (
      <div className="service-single-layout" style={{ '--accent-color': data.accentColor }}>
        <ShimmerPageHeader />
        <ShimmerMenu />
      </div>
    );
  }

  // Calculate chicken skillet custom price based on selected ingredients
  const baseChickenPrice = 14.00;
  const currentChickenPrice = baseChickenPrice + chickenIngredients
    .filter(i => i.selected)
    .reduce((sum, item) => sum + item.priceDelta, 0);

  // Toggle ingredient checkboxes
  const handleIngredientChange = (id) => {
    setChickenIngredients(chickenIngredients.map(item => 
      item.id === id ? { ...item, selected: !item.selected } : item
    ));
  };

  // Trigger add order animation and notification
  const triggerOrder = (dishName, finalPrice) => {
    setToastMessage(`Added ${dishName} ($${finalPrice.toFixed(2)}) to your booking session!`);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3500);
  };

  // Menu categorization options
  const filterCategories = ['All', 'Beverages', 'Breakfast & Brunch', 'Mains & Plates', 'Desserts'];

  // Map raw data category items into active filters
  const getFilteredItems = () => {
    const allItems = [];
    Object.entries(data.menu).forEach(([category, items]) => {
      items.forEach(item => {
        allItems.push({ ...item, category });
      });
    });

    if (activeFilter === 'All') return allItems;
    if (activeFilter === 'Beverages') {
      return allItems.filter(item => item.category.includes('Beverages'));
    }
    if (activeFilter === 'Breakfast & Brunch') {
      return allItems.filter(item => item.category === 'Breakfast');
    }
    if (activeFilter === 'Mains & Plates') {
      return allItems.filter(item => item.category === 'Mains');
    }
    if (activeFilter === 'Desserts') {
      return allItems.filter(item => item.category === 'Desserts');
    }
    return allItems;
  };

  return (
    <div className="gourmet-cafe-layout" style={{ '--accent-color': '#c19a5b' }}>
      
      {/* Toast Notification (kept as utility, although direct buttons are hidden) */}
      {showToast && (
        <div className="gourmet-toast">
          <div className="toast-content">
            <span className="toast-icon">✨</span>
            <span className="toast-text">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Gourmet Hero Section */}
      <div className="gourmet-hero">
        <div className="gourmet-hero-content">
          <span className="gourmet-hero-badge">SIGNATURE MENU</span>
          <h1 className="gourmet-hero-title">Gourmet Recipes</h1>
          <p className="gourmet-hero-subtitle">
            Indulge in our curated selection of fine lounge plates. Experience hand-crafted culinary recipes designed to elevate your wait.
          </p>
          <button 
            className="gourmet-hero-btn"
            onClick={() => {
              document.getElementById('menu-list-section').scrollIntoView({ behavior: 'smooth' });
            }}
          >
            Explore Full Menu
          </button>
        </div>
        <div className="gourmet-hero-image-box">
          <img src={gourmetHero} alt="Signature stack pancakes" className="gourmet-hero-img" />
          <div className="gourmet-hero-img-overlay"></div>
        </div>
      </div>

      {/* Gourmet Highlights & Stats */}
      <div className="gourmet-highlights-row">
        {/* Ochre Specialties card */}
        <div className="gourmet-highlight-card">
          <div className="highlight-card-header">
            <div className="highlight-icon">⚜️</div>
            <span className="highlight-label">Gourmet Specialties</span>
          </div>
          <p className="highlight-text" style={{ marginBottom: 0 }}>
            Delicate ingredient combinations crafted with organic farms, premium cuts, and artisan coffee pairings.
          </p>
        </div>

        {/* 3 Columns outline stats */}
        <div className="gourmet-stats-container">
          <div className="gourmet-stat-item">
            <div className="stat-icon-wrapper">🍵</div>
            <div className="stat-text-box">
              <span className="stat-title">Latest</span>
              <span className="stat-desc">Seasonal tea extracts</span>
            </div>
          </div>
          <div className="gourmet-stat-item">
            <div className="stat-icon-wrapper">🍳</div>
            <div className="stat-text-box">
              <span className="stat-title">Features</span>
              <span className="stat-desc">100% organic recipes</span>
            </div>
          </div>
          <div className="gourmet-stat-item">
            <div className="stat-icon-wrapper">👨‍🍳</div>
            <div className="stat-text-box">
              <span className="stat-title">Barista</span>
              <span className="stat-desc">Custom roasted pairings</span>
            </div>
          </div>
        </div>
      </div>

      {/* Signature Dishes Showcase (Poached Egg Toast & Chicken Skillet) */}
      <div className="gourmet-showcase" ref={contentRef}>
        <h2 className="showcase-section-title">Chef's Showcase Plates</h2>
        
        <div className="gourmet-showcase-grid">
          
          {/* Card 1: Poached Egg Avocado Toast */}
          <div className="gourmet-showcase-card">
            <div className="showcase-img-box">
              <img src={gourmetToast} alt="Poached egg avocado toast" className="showcase-card-img" />
              <span className="showcase-card-badge">Brunch Classic</span>
            </div>
            <div className="showcase-card-body">
              <div className="showcase-card-header-row">
                <h3 className="showcase-dish-title">Sourdough Poached Egg Toast</h3>
                <span className="showcase-dish-price">$11.00</span>
              </div>
              <p className="showcase-dish-desc">
                Avocado mash, double organic poached eggs, cherry tomatoes, and micro-greens layered on toasted artisan sourdough.
              </p>
              <div className="showcase-card-footer">
                <span className="dish-rating">⭐ 4.9 (124 reviews)</span>
              </div>
            </div>
          </div>

          {/* Card 2: Seared Herbed Chicken Skillet - SPLIT INTERACTIVE CARD */}
          <div className="gourmet-split-card">
            <div className="split-card-image-panel">
              <img src={gourmetChicken} alt="Herbed chicken skillet" className="split-img" />
              <div className="split-img-badge">Signature Mains</div>
            </div>
            
            <div className="split-card-details-panel">
              <div className="split-header">
                <span className="split-category">Organically Sourced</span>
                <h3 className="split-title">Herbed Chicken Skillet</h3>
                <p className="split-desc">
                  Tender seared chicken breast cooked with garlic butter, fresh garden rosemary, and blistered red cherry tomatoes.
                </p>
              </div>

              {/* Recipe Checklist Builder */}
              <div className="recipe-builder-box">
                <span className="builder-label">Customize Recipe Ingredients:</span>
                <div className="ingredients-checklist">
                  {chickenIngredients.map((ing) => (
                    <label key={ing.id} className="ingredient-item-label">
                      <input 
                        type="checkbox" 
                        checked={ing.selected} 
                        onChange={() => handleIngredientChange(ing.id)}
                        className="ingredient-checkbox"
                      />
                      <span className="custom-check-text">
                        {ing.name} {ing.priceDelta > 0 ? `(+$${ing.priceDelta.toFixed(2)})` : ''}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price */}
              <div className="split-footer">
                <div className="split-price-box">
                  <span className="price-label">ESTIMATED PRICE</span>
                  <span className="price-value">${currentChickenPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Dessert Showcase */}
          <div className="gourmet-showcase-card">
            <div className="showcase-img-box">
              <img src={gourmetDessert} alt="Salted Caramel Tart" className="showcase-card-img" />
              <span className="showcase-card-badge">Dessert Special</span>
            </div>
            <div className="showcase-card-body">
              <div className="showcase-card-header-row">
                <h3 className="showcase-dish-title">Salted Caramel Chocolate Tart</h3>
                <span className="showcase-dish-price">$6.50</span>
              </div>
              <p className="showcase-dish-desc">
                Dark cocoa crust, smooth rich salted caramel layer, topped with gold leaf flake crystals and sea salt.
              </p>
              <div className="showcase-card-footer">
                <span className="dish-rating">⭐ 4.8 (98 reviews)</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Full Lounge Menu List Section */}
      <div id="menu-list-section" className="section-card gourmet-full-menu">
        <h2 className="section-title">Lounge Menu Directory</h2>
        
        {/* Category Filter Tabs */}
        <div className="menu-filter-bar">
          {filterCategories.map((category) => (
            <button
              key={category}
              className={`filter-tab-btn ${activeFilter === category ? 'active' : ''}`}
              onClick={() => setActiveFilter(category)}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Dynamic Items Listing */}
        <div className="gourmet-items-grid">
          {getFilteredItems().map((item, idx) => (
            <div key={idx} className="gourmet-item-row">
              <div className="gourmet-item-info">
                <h4 className="gourmet-item-name">{item.name}</h4>
                <span className="gourmet-item-category">{item.category}</span>
              </div>
              <div className="gourmet-item-price-col">
                <span className="gourmet-price-badge">${item.price.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Info notice */}
      <div className="info-box" style={{ marginTop: '2rem' }}>
        <span className="info-box-icon">☕</span>
        <span className="info-box-text">
          Lounge menu is display-only. Please place orders directly with our lounge baristas at the service counter.
        </span>
      </div>

    </div>
  );
}
