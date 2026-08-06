import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

// Import local image assets
import gourmetHero from '../../assets/images/gourmet_hero.png';
import gourmetToast from '../../assets/images/gourmet_toast.png';
import gourmetChicken from '../../assets/images/gourmet_chicken.png';
import gourmetDessert from '../../assets/images/gourmet_dessert.png';

import serviceApi from '../../common/services/serviceApi';
import apiClient from '../../common/utils/apiClient';
import { useAuth } from '../../common/context/AuthContext';
import CustomerAuthModal from '../../common/components/CustomerAuthModal';
import { cacheService } from '../../common/utils/serviceCache';

// Vehicles the customer can pick at the drive-through window. Any vehicle saved
// on the logged-in account is prepended to this fallback list.
const FALLBACK_VEHICLES = [
  { model: 'Tesla Model 3', plate: 'TSL-3000' },
  { model: 'Mercedes Benz C-Class', plate: 'MBZ-5500' },
  { model: 'Porsche Taycan', plate: 'PC-911' }
];

// Minutes ahead of now that each pickup option represents.
const PICKUP_OPTIONS = [
  { label: 'Now (Ready in 2 min)', minutes: 2 },
  { label: 'In 5 minutes', minutes: 5 },
  { label: 'In 15 minutes', minutes: 15 },
  { label: 'In 30 minutes', minutes: 30 }
];

export default function DriveThroughCafePage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isCustomer: authIsCustomer } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const isCustomer = authIsCustomer || (isAuthenticated && user?.role !== 'staff' && user?.role !== 'admin');

  // State variables for catalog flow
  const [activeCategory, setActiveCategory] = useState(null); // null = Home, otherwise name of category
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSubFilter, setActiveSubFilter] = useState('All');
  const [savedItems, setSavedItems] = useState([]);

  // Order & Cart States
  const [cart, setCart] = useState([]); // Array of { item, quantity }
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderStep, setOrderStep] = useState(0); // 0 = Browse/Cart, 1 = Checkout, 2 = Sending, 3 = Preparing, 4 = Ready
  const [pickupTime, setPickupTime] = useState(PICKUP_OPTIONS[0].label);
  const [prepProgress, setPrepProgress] = useState(0);
  const [orderError, setOrderError] = useState('');
  const [placedOrder, setPlacedOrder] = useState(null);

  // Vehicles saved on the account come first so the plate the staff sees is the
  // one the customer actually registered.
  const vehicleOptions = React.useMemo(() => {
    const saved = (user?.vehicles || []).map(v => ({
      model: [v.brand, v.model].filter(Boolean).join(' ') || 'My Vehicle',
      plate: v.registrationNumber || v.plate || ''
    })).filter(v => v.plate);

    const seen = new Set();
    return [...saved, ...FALLBACK_VEHICLES].filter(v => {
      if (seen.has(v.plate)) return false;
      seen.add(v.plate);
      return true;
    });
  }, [user]);

  const [selectedPlate, setSelectedPlate] = useState('');
  const selectedVehicle = vehicleOptions.find(v => v.plate === selectedPlate) || vehicleOptions[0];

  useEffect(() => {
    if (!selectedPlate && vehicleOptions.length > 0) {
      setSelectedPlate(vehicleOptions[0].plate);
    }
  }, [vehicleOptions, selectedPlate]);

  // Live Backend Database State for Drive-Through Cafe Service
  const [liveService, setLiveService] = useState(() => {
    const cached = localStorage.getItem('tsl_drive_through_cafe_service');
    return cached ? JSON.parse(cached) : null;
  });

  const fetchLiveService = async () => {
    try {
      const res = await serviceApi.getServiceBySlug('drive-through-cafe');
      if (res.success && res.service) {
        setLiveService(res.service);
        cacheService('tsl_drive_through_cafe_service', res.service);
        return;
      }
    } catch (err) {
      console.warn('Could not fetch live drive-through-cafe service:', err);
    }
    const cached = localStorage.getItem('tsl_drive_through_cafe_service');
    if (cached) {
      try {
        setLiveService(JSON.parse(cached));
      } catch (e) {}
    }
  };

  useEffect(() => {
    fetchLiveService();
    const handleStorageUpdate = () => {
      const cached = localStorage.getItem('tsl_drive_through_cafe_service');
      if (cached) {
        try {
          setLiveService(JSON.parse(cached));
        } catch (e) {}
      }
    };
    window.addEventListener('tsl_drive_through_cafe_updated', handleStorageUpdate);
    window.addEventListener('storage', handleStorageUpdate);
    return () => {
      window.removeEventListener('tsl_drive_through_cafe_updated', handleStorageUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, []);

  // Default mapping of drive-through categories
  const defaultCategoriesList = [
    {
      id: 'commute-coffee',
      title: 'Commuter Coffee',
      subtitle: 'Barista brews optimized for cup holders',
      desc: 'Double-filtered, hot or iced, ready in 90 seconds',
      bgColor: 'linear-gradient(135deg, #C17F19 0%, #8C5810 100%)',
      image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=600&q=80',
      items: [
        { name: 'Commuter Cold Brew', price: 4.95, weight: '16 oz', image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=600&q=80', subcat: 'Iced' },
        { name: 'Double Shot Americano', price: 3.80, weight: '12 oz', image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80', subcat: 'Hot' },
        { name: 'Roadtrip Caramel Latte', price: 5.45, weight: '16 oz', image: 'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?auto=format&fit=crop&w=600&q=80', subcat: 'Hot' },
        { name: 'Nitro Vanilla Sweet Cream', price: 5.75, weight: '16 oz', image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=600&q=80', subcat: 'Iced' },
        { name: 'Spiced Chai Milk Tea', price: 5.20, weight: '16 oz', image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80', subcat: 'Tea' }
      ]
    },
    {
      id: 'dashboard-breakfast',
      title: 'Dashboard Breakfast',
      subtitle: 'Warm wraps and mess-free sandwiches',
      desc: 'Freshly heated, easy to eat while driving',
      bgColor: 'linear-gradient(135deg, #D49A7F 0%, #A0522D 100%)',
      image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=600&q=80',
      items: [
        { name: 'Drive-Through Breakfast Burrito', price: 8.50, weight: '300g', image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=600&q=80', subcat: 'Wraps' },
        { name: 'Brioche Bacon & Egg Club', price: 9.25, weight: '220g', image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80', subcat: 'Sandwiches' },
        { name: 'Avocado Spinach Wrap', price: 7.95, weight: '280g', image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80', subcat: 'Wraps' },
        { name: 'Glazed Morning Cinnamon Roll', price: 4.50, weight: '150g', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80', subcat: 'Sides' }
      ]
    },
    {
      id: 'express-sweet-box',
      title: 'Express Sweet Box',
      subtitle: 'Quick road snacks and baked treats',
      desc: 'Packaged neatly for leak-proof transit',
      bgColor: 'linear-gradient(135deg, #B7094C 0%, #800E13 100%)',
      image: 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?auto=format&fit=crop&w=600&q=80',
      items: [
        { name: 'Blueberry Oat Muffin', price: 4.25, weight: '130g', image: 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?auto=format&fit=crop&w=600&q=80', subcat: 'Muffins' },
        { name: 'Choco-Chip Cookie Pack', price: 5.50, weight: '180g', image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=600&q=80', subcat: 'Cookies' },
        { name: 'Lemon Drizzle Pound Cake', price: 4.75, weight: '110g', image: 'https://images.unsplash.com/photo-1519869325930-281384150729?auto=format&fit=crop&w=600&q=80', subcat: 'Slices' }
      ]
    }
  ];

  // Dynamically compute categoriesList from liveService if present
  let categoriesList = defaultCategoriesList;
  if (liveService && Array.isArray(liveService.menuSections) && liveService.menuSections.length > 0 && Array.isArray(liveService.plans) && liveService.plans.length > 0) {
    categoriesList = liveService.menuSections.map(section => {
      const sectionItems = liveService.plans.filter(p => p.section === section.title);
      let bg = section.bgColor;
      if (!bg || bg.includes('A06A42')) bg = 'linear-gradient(135deg, #C17F19 0%, #8C5810 100%)';
      return {
        id: section._id || section.title.toLowerCase().replace(/\s+/g, '-'),
        title: section.title,
        subtitle: section.subtitle || 'Express Drive-Through Menu',
        desc: section.description || '',
        bgColor: bg,
        image: section.image || gourmetHero,
        items: sectionItems.map(item => ({
          name: item.name,
          price: Number(item.price),
          weight: item.weight || 'Standard',
          image: item.image || gourmetHero,
          subcat: item.subcat || 'General',
          description: item.description || ''
        }))
      };
    });
  }

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
    // Step 2 (transmitting) is driven by the actual POST in handlePlaceOrder,
    // so it only advances once the order is really saved.
    if (orderStep === 3) {
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

  const handlePlaceOrder = async () => {
    if (!isCustomer) {
      setShowAuthModal(true);
      return;
    }
    if (cart.length === 0) return;

    setOrderError('');
    setPrepProgress(0);
    setOrderStep(2); // Transmitting screen

    const now = new Date();
    const pickupOption = PICKUP_OPTIONS.find(p => p.label === pickupTime) || PICKUP_OPTIONS[0];
    const expectedAt = new Date(now.getTime() + pickupOption.minutes * 60000);

    const fmtTime = (d) => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    const bookingId = `DT-${Math.floor(1000 + Math.random() * 9000)}`;
    const itemsSummary = cart.map(c => `${c.quantity}x ${c.item.name}`).join(', ');

    const payload = {
      bookingId,
      serviceKey: 'drive-through-cafe',
      serviceName: 'Drive-Through Café',
      packageName: itemsSummary.slice(0, 120) || 'Express Order',
      price: Number(getCartTotal().toFixed(2)),
      date: now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      timeSlot: `${fmtTime(now)} - ${fmtTime(expectedAt)}`,
      customerName: user?.fullName || user?.name || 'Guest Customer',
      customerEmail: user?.email || '',
      vehicleNo: selectedVehicle?.plate || '',
      vehicleType: selectedVehicle?.model || '',
      items: cart.map(c => ({
        name: c.item.name,
        quantity: c.quantity,
        price: c.item.price
      })),
      pickupTime,
      expectedAt: expectedAt.toISOString(),
      status: 'Order Received'
    };

    try {
      const res = await apiClient.post('/bookings', payload);
      setPlacedOrder(res.data?.booking || { ...payload, _id: bookingId });
      setOrderStep(3); // Preparing
    } catch (err) {
      console.error('Error placing drive-through order:', err);
      setOrderError(
        err.response?.data?.message || err.message || 'Could not reach the drive-through console.'
      );
      setOrderStep(1); // Back to checkout so the customer can retry
      setShowCheckout(true);
    }
  };

  const handleCompleteOrder = () => {
    setCart([]);
    setOrderStep(0);
    setShowCheckout(false);
    setActiveCategory(null);
    setPlacedOrder(null);
    setOrderError('');
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
                  Drive up to <strong>Window 2</strong> now. Show this screen or mention order{' '}
                  <strong>#{placedOrder?.bookingId || 'DT-0000'}</strong>.
                </p>
                <p className="success-desc" style={{ marginTop: '0.35rem' }}>
                  Vehicle <strong>{placedOrder?.vehicleNo || selectedVehicle?.plate}</strong> ·
                  Pickup <strong>{placedOrder?.pickupTime || pickupTime}</strong>
                  {placedOrder?.assignedStaffName ? <> · Barista <strong>{placedOrder.assignedStaffName}</strong></> : null}
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
                  style={{ background: '#f38200', marginTop: '1.5rem' }}
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
            <div className="catalog-detail-header" style={{ alignItems: 'center' }}>
              <button className="confirm-back-btn" onClick={() => setShowCheckout(false)}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
              </button>
              <h2 className="catalog-detail-title" style={{ margin: 0, lineHeight: 1 }}>Express Checkout</h2>
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
                      value={selectedPlate}
                      onChange={(e) => setSelectedPlate(e.target.value)}
                      style={{
                        border: '1px solid var(--border-color)',
                        background: '#ffffff',
                        borderRadius: '0.5rem',
                        padding: '0.4rem',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        color: 'var(--text-main)',
                        maxWidth: '175px',
                        width: '100%'
                      }}
                    >
                      {vehicleOptions.map(v => (
                        <option key={v.plate} value={v.plate}>
                          {v.model} ({v.plate})
                        </option>
                      ))}
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
                        color: 'var(--text-main)',
                        maxWidth: '175px',
                        width: '100%'
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
                    <span className="bill-val" style={{ color: '#f38200', fontWeight: 700 }}>FREE</span>
                  </div>
                  <hr className="bill-divider" />
                  <div className="bill-row total">
                    <span className="bill-label">Estimated Total</span>
                    <span className="bill-val">₹{getCartTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {orderError && (
                <div
                  role="alert"
                  style={{
                    background: '#fee2e2',
                    border: '1px solid #fca5a5',
                    color: '#991b1b',
                    borderRadius: '0.75rem',
                    padding: '0.75rem 1rem',
                    fontSize: '0.85rem',
                    fontWeight: 700
                  }}
                >
                  Order not sent: {orderError}
                </div>
              )}

              {/* Order CTA */}
              <button
                className="confirm-final-btn"
                onClick={handlePlaceOrder}
                style={{ background: '#f38200' }}
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
            <div className="catalog-detail-header" style={{ alignItems: 'center' }}>
              <button className="confirm-back-btn" onClick={() => setActiveCategory(null)}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
              </button>
              <h2 className="catalog-detail-title" style={{ margin: 0, lineHeight: 1 }}>{activeCategory}</h2>
              <div style={{ width: '44px' }} /> {/* Spacer */}
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
                        style={{ background: cartQty > 0 ? '#f38200' : 'rgba(255,255,255,0.7)', color: cartQty > 0 ? '#ffffff' : 'var(--text-main)', border: 'none' }}
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
                        <span style={{ fontSize: '0.75rem', color: '#f38200', fontWeight: 700 }}>+ Add</span>
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
                background: '#f38200', 
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

      {/* Guest Authentication Modal on Order Checkout */}
      <CustomerAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode="login"
        titlePrompt="Sign In to Transmit Drive-Thru Order"
        onSuccess={() => {
          setPrepProgress(0);
          setOrderStep(2);
        }}
      />

    </div>
  );
}
