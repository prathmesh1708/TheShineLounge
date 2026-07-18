import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

// Import local image assets
import gourmetHero from '../../assets/images/gourmet_hero.png';
import gourmetToast from '../../assets/images/gourmet_toast.png';
import gourmetChicken from '../../assets/images/gourmet_chicken.png';
import gourmetDessert from '../../assets/images/gourmet_dessert.png';

export default function DriveThroughCafePage() {
  const navigate = useNavigate();

  // State variables for catalog flow
  const [activeCategory, setActiveCategory] = useState(null); // null = Home, otherwise name of category
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSubFilter, setActiveSubFilter] = useState('All');
  const [savedItems, setSavedItems] = useState([]);

  // Order & Cart States
  const [cart, setCart] = useState([]); // Array of { item, quantity }
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderStep, setOrderStep] = useState(0); // 0 = Browse/Cart, 1 = Checkout, 2 = Sending, 3 = Preparing, 4 = Ready
  const [pickupTime, setPickupTime] = useState('Now (Ready in 2 min)');
  const [selectedVehicle, setSelectedVehicle] = useState('Tesla Model 3 (TSL-3000)');
  const [prepProgress, setPrepProgress] = useState(0);

  // Mock mapping of drive-through categories to display banners
  const categoriesList = [
    {
      id: 'commute-coffee',
      title: 'Commuter Coffee',
      subtitle: 'Barista brews optimized for cup holders',
      desc: 'Double-filtered, hot or iced, ready in 90 seconds',
      bgColor: 'linear-gradient(135deg, #C17F19 0%, #8C5810 100%)', // Golden-amber gradient
      image: gourmetHero,
      items: [
        { name: 'Commuter Cold Brew', price: 4.95, weight: '16 oz', image: gourmetHero, subcat: 'Iced' },
        { name: 'Double Shot Americano', price: 3.80, weight: '12 oz', image: gourmetHero, subcat: 'Hot' },
        { name: 'Roadtrip Caramel Latte', price: 5.45, weight: '16 oz', image: gourmetHero, subcat: 'Hot' },
        { name: 'Nitro Vanilla Sweet Cream', price: 5.75, weight: '16 oz', image: gourmetHero, subcat: 'Iced' },
        { name: 'Spiced Chai Milk Tea', price: 5.20, weight: '16 oz', image: gourmetHero, subcat: 'Tea' }
      ]
    },
    {
      id: 'dashboard-breakfast',
      title: 'Dashboard Breakfast',
      subtitle: 'Warm wraps and mess-free sandwiches',
      desc: 'Freshly heated, easy to eat while driving',
      bgColor: 'linear-gradient(135deg, #D49A7F 0%, #A0522D 100%)', // Terracotta gradient
      image: gourmetToast,
      items: [
        { name: 'Drive-Through Breakfast Burrito', price: 8.50, weight: '300g', image: gourmetToast, subcat: 'Wraps' },
        { name: 'Brioche Bacon & Egg Club', price: 9.25, weight: '220g', image: gourmetChicken, subcat: 'Sandwiches' },
        { name: 'Avocado Spinach Wrap', price: 7.95, weight: '280g', image: gourmetToast, subcat: 'Wraps' },
        { name: 'Glazed Morning Cinnamon Roll', price: 4.50, weight: '150g', image: gourmetToast, subcat: 'Sides' }
      ]
    },
    {
      id: 'express-sweet-box',
      title: 'Express Sweet Box',
      subtitle: 'Quick road snacks and baked treats',
      desc: 'Packaged neatly for leak-proof transit',
      bgColor: 'linear-gradient(135deg, #B7094C 0%, #800E13 100%)', // Deep plum/crimson gradient
      image: gourmetDessert,
      items: [
        { name: 'Blueberry Oat Muffin', price: 4.25, weight: '130g', image: gourmetDessert, subcat: 'Muffins' },
        { name: 'Choco-Chip Cookie Pack', price: 5.50, weight: '180g', image: gourmetDessert, subcat: 'Cookies' },
        { name: 'Lemon Drizzle Pound Cake', price: 4.75, weight: '110g', image: gourmetDessert, subcat: 'Slices' }
      ]
    }
  ];

  // Cart operations
  const addToCart = (item, e) => {
    e.stopPropagation();
    setCart(prev => {
      const existing = prev.find(i => i.item.name === item.name);
      if (existing) {
        return prev.map(i => i.item.name === item.name ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const updateQuantity = (itemName, delta) => {
    setCart(prev => {
      return prev.map(i => {
        if (i.item.name === itemName) {
          const newQty = i.quantity + delta;
          return newQty > 0 ? { ...i, quantity: newQty } : null;
        }
        return i;
      }).filter(Boolean);
    });
  };

  const getCartTotal = () => {
    return cart.reduce((total, i) => total + (i.item.price * i.quantity), 0);
  };

  const getCartCount = () => {
    return cart.reduce((total, i) => total + i.quantity, 0);
  };

  const toggleSaveItem = (itemName, e) => {
    e.stopPropagation();
    setSavedItems(prev => 
      prev.includes(name) ? prev.filter(name => name !== itemName) : [...prev, itemName]
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

  // Order processing animation effect
  useEffect(() => {
    let timer;
    if (orderStep === 2) {
      // Step 2: Sending order (1.5s)
      timer = setTimeout(() => {
        setOrderStep(3);
      }, 1500);
    } else if (orderStep === 3) {
      // Step 3: Preparing order (3s progress animation)
      const interval = setInterval(() => {
        setPrepProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setOrderStep(4);
            return 100;
          }
          return prev + 10;
        });
      }, 250);
      return () => clearInterval(interval);
    }
    return () => clearTimeout(timer);
  }, [orderStep]);

  const handlePlaceOrder = () => {
    setPrepProgress(0);
    setOrderStep(2); // Start sending order
  };

  const handleCompleteOrder = () => {
    setCart([]);
    setOrderStep(0);
    setShowCheckout(false);
    setActiveCategory(null);
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
    <div className="cafe-catalog-container" style={{ position: 'relative', marginTop: '-0.75rem' }}>
      
      <AnimatePresence mode="wait">
        
        {/* ORDER PROCESSING SCREENS */}
        {orderStep > 1 ? (
          <motion.div
            key="processing"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="confirm-success-card"
            style={{ marginTop: '2rem', padding: '3rem 2rem' }}
          >
            {orderStep === 2 && (
              <>
                <div className="success-icon-badge" style={{ animation: 'none' }}>📡</div>
                <h2 className="success-title">Transmitting Order</h2>
                <p className="success-desc">Connecting to Drive-Through Barista console...</p>
                <div className="dt-pulse-circle"></div>
              </>
            )}

            {orderStep === 3 && (
              <>
                <div className="success-icon-badge" style={{ animation: 'none' }}>☕</div>
                <h2 className="success-title">Preparing Your Order</h2>
                <p className="success-desc">Our barista is crafting your fresh brews and bites.</p>
                <div className="dt-progress-bar-wrapper" style={{ width: '100%', height: '8px', background: 'var(--border-color)', borderRadius: '999px', overflow: 'hidden', marginTop: '1.5rem' }}>
                  <div 
                    style={{ 
                      width: `${prepProgress}%`, 
                      height: '100%', 
                      background: 'var(--accent-color)', 
                      transition: 'width 0.25s linear' 
                    }} 
                  />
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginTop: '0.5rem' }}>{prepProgress}% Complete</span>
              </>
            )}

            {orderStep === 4 && (
              <>
                <div className="success-icon-badge">✨</div>
                <h2 className="success-title">Ready for Pickup!</h2>
                <p className="success-desc">
                  Drive up to **Window 2** now. Show this screen or mention order **#DT-4820**.
                </p>

                {/* Simulated QR Code */}
                <div style={{ margin: '1.5rem 0', padding: '1rem', background: '#ffffff', borderRadius: '1rem', display: 'inline-block', border: '1px solid var(--border-color)' }}>
                  <svg width="120" height="120" viewBox="0 0 100 100">
                    <rect x="10" y="10" width="20" height="20" fill="var(--text-main)" />
                    <rect x="15" y="15" width="10" height="10" fill="#ffffff" />
                    <rect x="70" y="10" width="20" height="20" fill="var(--text-main)" />
                    <rect x="75" y="15" width="10" height="10" fill="#ffffff" />
                    <rect x="10" y="70" width="20" height="20" fill="var(--text-main)" />
                    <rect x="15" y="75" width="10" height="10" fill="#ffffff" />
                    <rect x="40" y="40" width="20" height="20" fill="var(--text-main)" />
                    <rect x="45" y="45" width="10" height="10" fill="#ffffff" />
                    <rect x="40" y="15" width="10" height="10" fill="var(--text-main)" />
                    <rect x="55" y="20" width="10" height="15" fill="var(--text-main)" />
                    <rect x="75" y="45" width="15" height="10" fill="var(--text-main)" />
                    <rect x="15" y="45" width="10" height="15" fill="var(--text-main)" />
                    <rect x="45" y="75" width="15" height="15" fill="var(--text-main)" />
                  </svg>
                </div>

                <div className="confirm-section-card" style={{ width: '100%', background: 'rgba(255,255,255,0.4)', textAlign: 'left' }}>
                  <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Order Details</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.9rem' }}>
                    {cart.map((i, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{i.quantity}x {i.item.name}</span>
                        <span style={{ fontWeight: 700 }}>₹{(i.item.price * i.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                    <hr style={{ border: 'none', borderTop: '1px dashed var(--border-color)', margin: '0.5rem 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}>
                      <span>Total Paid</span>
                      <span>₹{getCartTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <button 
                  className="confirm-final-btn"
                  onClick={handleCompleteOrder}
                  style={{ background: '#0F6E56', marginTop: '1.5rem' }}
                >
                  Done & Back to Menu
                </button>
              </>
            )}
          </motion.div>
        ) : showCheckout ? (
          /* CHECKOUT / CART DETAIL SCREEN */
          <motion.div
            key="checkout"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="catalog-detail-flow"
          >
            {/* Header */}
            <div className="catalog-detail-header">
              <button className="back-btn-round" onClick={() => setShowCheckout(false)}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
              </button>
              <h2 className="catalog-detail-title">Express Checkout</h2>
              <div style={{ width: '44px' }} /> {/* Spacer */}
            </div>

            {/* Cart Items list */}
            <div className="confirm-body-stack">
              <div className="confirm-section-card">
                <h3 className="confirm-card-heading">Your Cart Items</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {cart.map((cartItem) => (
                    <div key={cartItem.item.name} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <img src={cartItem.item.image} alt={cartItem.item.name} style={{ width: '45px', height: '45px', borderRadius: '0.5rem', objectFit: 'cover' }} />
                      <div style={{ flexGrow: 1 }}>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>{cartItem.item.name}</h4>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>₹{cartItem.item.price.toFixed(2)} each</span>
                      </div>
                      
                      {/* Quantity Selector */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', background: 'var(--border-color)', padding: '0.25rem 0.5rem', borderRadius: '0.5rem' }}>
                        <button onClick={() => updateQuantity(cartItem.item.name, -1)} style={{ border: 'none', background: 'none', fontWeight: 800, cursor: 'pointer', fontSize: '1rem' }}>-</button>
                        <span style={{ fontSize: '0.9rem', fontWeight: 800 }}>{cartItem.quantity}</span>
                        <button onClick={() => updateQuantity(cartItem.item.name, 1)} style={{ border: 'none', background: 'none', fontWeight: 800, cursor: 'pointer', fontSize: '1rem' }}>+</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Drive-Through Settings */}
              <div className="confirm-section-card">
                <h3 className="confirm-card-heading">Drive-Through Pickup Settings</h3>
                <div className="confirm-details-list">
                  <div className="confirm-detail-item">
                    <span className="confirm-detail-label">Vehicle Registered</span>
                    <select 
                      value={selectedVehicle}
                      onChange={(e) => setSelectedVehicle(e.target.value)}
                      style={{ 
                        border: '1px solid var(--border-color)', 
                        background: '#ffffff', 
                        borderRadius: '0.5rem', 
                        padding: '0.4rem', 
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        color: 'var(--text-main)'
                      }}
                    >
                      <option>Tesla Model 3 (TSL-3000)</option>
                      <option>Mercedes Benz C-Class (MBZ-5500)</option>
                      <option>Porsche Taycan (PC-911)</option>
                    </select>
                  </div>
                  <div className="confirm-detail-item">
                    <span className="confirm-detail-label">Expected Pickup Time</span>
                    <select 
                      value={pickupTime}
                      onChange={(e) => setPickupTime(e.target.value)}
                      style={{ 
                        border: '1px solid var(--border-color)', 
                        background: '#ffffff', 
                        borderRadius: '0.5rem', 
                        padding: '0.4rem', 
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        color: 'var(--text-main)'
                      }}
                    >
                      <option>Now (Ready in 2 min)</option>
                      <option>In 5 minutes</option>
                      <option>In 15 minutes</option>
                      <option>In 30 minutes</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Bill Details */}
              <div className="confirm-section-card">
                <h3 className="confirm-card-heading">Bill details</h3>
                <div className="bill-breakdown-list">
                  <div className="bill-row">
                    <span className="bill-label">Subtotal</span>
                    <span className="bill-val">₹{getCartTotal().toFixed(2)}</span>
                  </div>
                  <div className="bill-row">
                    <span className="bill-label">Express Pickup Fee</span>
                    <span className="bill-val" style={{ color: '#0F6E56', fontWeight: 700 }}>FREE</span>
                  </div>
                  <hr className="bill-divider" />
                  <div className="bill-row total">
                    <span className="bill-label">Estimated Total</span>
                    <span className="bill-val">₹{getCartTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Order CTA */}
              <button 
                className="confirm-final-btn"
                onClick={handlePlaceOrder}
                style={{ background: '#0F6E56' }}
              >
                Transmit Order · ₹{getCartTotal().toFixed(2)}
              </button>
            </div>
          </motion.div>
        ) : activeCategory === null ? (
          /* 1. Main Directory Catalog view */
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
                placeholder="Search drive-through brews..." 
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
              <div style={{ width: '44px' }} /> {/* Spacer */}
            </div>

            {/* Quick Stats Banner */}
            <div className="detail-quick-stats-row">
              <div className="quick-stat-pill">
                <span className="stat-pill-icon">⏱️</span>
                <span className="stat-pill-text">90s Prep Target</span>
              </div>
              <div className="quick-stat-pill">
                <span className="stat-pill-icon">🚗</span>
                <span className="stat-pill-text">Cup-Holder Ready</span>
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
                const cartQty = cart.find(i => i.item.name === item.name)?.quantity || 0;
                
                return (
                  <motion.div 
                    key={idx} 
                    variants={itemVariants}
                    whileHover={{ y: -1 }}
                    className="catalog-grid-item"
                    style={{ position: 'relative' }}
                  >
                    <div className="grid-item-img-box">
                      <img src={item.image} alt={item.name} className="grid-item-img" />
                      
                      {/* Add to order indicator button */}
                      <button 
                        className={`grid-item-save-btn ${cartQty > 0 ? 'saved' : ''}`}
                        onClick={(e) => addToCart(item, e)}
                        style={{ background: cartQty > 0 ? '#0F6E56' : 'rgba(255,255,255,0.7)', color: cartQty > 0 ? '#ffffff' : 'var(--text-main)', border: 'none' }}
                      >
                        {cartQty > 0 ? (
                          <span style={{ fontSize: '0.8rem', fontWeight: 800 }}>+{cartQty}</span>
                        ) : (
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                          </svg>
                        )}
                      </button>
                    </div>

                    <div className="grid-item-details" onClick={(e) => addToCart(item, e)} style={{ cursor: 'pointer' }}>
                      <span className="grid-item-price">₹{item.price.toFixed(2)}</span>
                      <h4 className="grid-item-name">{item.name}</h4>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <span className="grid-item-weight">{item.weight}</span>
                        <span style={{ fontSize: '0.75rem', color: '#0F6E56', fontWeight: 700 }}>+ Add</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Indicator / Checkout Floating Bar - Rendered via React Portal directly into body with margin centering */}
      {cart.length > 0 && orderStep < 2 && createPortal(
        <motion.div 
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          style={{ 
            position: 'fixed',
            left: 0,
            right: 0,
            margin: '0 auto',
            bottom: '80px', 
            maxWidth: '400px', 
            width: '90%', 
            background: 'var(--text-main)', 
            color: '#FAF9F6', 
            padding: '12px 18px',
            borderRadius: '1.25rem',
            border: 'none',
            boxShadow: '0 8px 30px rgba(0,0,0,0.18)',
            zIndex: 9999,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 600, opacity: 0.8 }}>DRIVE-THROUGH BAG</span>
              <span style={{ fontSize: '0.9rem', fontWeight: 800 }}>{getCartCount()} items · ₹{getCartTotal().toFixed(2)}</span>
            </div>
            
            <button 
              onClick={() => setShowCheckout(true)}
              style={{ 
                background: '#0F6E56', 
                color: '#FAF9F6', 
                border: 'none', 
                borderRadius: '0.75rem', 
                padding: '0.5rem 1rem', 
                fontWeight: 800, 
                fontSize: '0.8rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(15,110,86,0.25)'
              }}
            >
              Checkout →
            </button>
          </div>
        </motion.div>,
        document.body
      )}

      {/* Info notice */}
      {orderStep < 2 && (
        <div className="info-box" style={{ marginTop: '2.5rem' }}>
          <span className="info-box-icon">⏱️</span>
          <span className="info-box-text">
            Add items to order ahead. Simply pick up at the express drive-through window in your registered vehicle.
          </span>
        </div>
      )}

    </div>
  );
}
