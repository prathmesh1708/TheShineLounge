import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { carwashMockData } from '../data/carwashMockData';
import serviceApi from '../../common/services/serviceApi';
import { cacheService } from '../../common/utils/serviceCache';
import { useAuth } from '../../common/context/AuthContext';
import CustomerAuthModal from '../../common/components/CustomerAuthModal';
import vehicleService from '../../common/services/vehicleService';
import { readScoped, writeScoped, normalizeEmail } from '../../common/utils/userScopedStorage';

export default function CarWashPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const userEmail = normalizeEmail(user?.email);

  // A garage holds the cars this visitor actually registered and nothing else.
  // There used to be a DEFAULT_VEHICLES array standing in for guests, which
  // meant an anonymous visitor was shown three cars — plate, model and year —
  // that belonged to no one, and could take those plates all the way to a
  // booking. An empty garage now looks empty.
  const readLocalVehicles = (email) => {
    const saved = readScoped('tsl_saved_vehicles', email, null);
    return Array.isArray(saved) ? saved : [];
  };

  const [vehicles, setVehicles] = useState(() => readLocalVehicles(userEmail));
  const [selectedVehicleId, setSelectedVehicleId] = useState(
    () => readScoped('tsl_selected_vehicle_id', userEmail, null) || ''
  );
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [vehicleError, setVehicleError] = useState('');
  const [savingVehicle, setSavingVehicle] = useState(false);

  // Signing in, signing out or switching accounts swaps the whole garage. For a
  // signed-in customer the server is the source of truth; the scoped local copy
  // is only a cache so the page still renders their own cars while offline.
  const loadedScopeRef = useRef(null);
  useEffect(() => {
    const scope = `${userEmail}|${isAuthenticated}`;
    if (loadedScopeRef.current === scope) return;
    loadedScopeRef.current = scope;

    let cancelled = false;
    const cached = readLocalVehicles(userEmail);
    setVehicles(cached);
    setSelectedVehicleId(readScoped('tsl_selected_vehicle_id', userEmail, null) || cached[0]?.id || '');

    if (!isAuthenticated) return undefined;

    vehicleService.getMyVehicles()
      .then(serverVehicles => {
        if (cancelled) return;
        setVehicles(serverVehicles);
        setSelectedVehicleId(prev =>
          serverVehicles.some(v => v.id === prev) ? prev : (serverVehicles[0]?.id || '')
        );
      })
      .catch(err => {
        // Keep showing this account's cached cars rather than inventing any.
        console.warn('Could not load your vehicles from the server:', err.message);
      });

    return () => { cancelled = true; };
  }, [userEmail, isAuthenticated]);

  useEffect(() => {
    writeScoped('tsl_saved_vehicles', userEmail, vehicles);
  }, [vehicles, userEmail]);

  useEffect(() => {
    if (selectedVehicleId) {
      writeScoped('tsl_selected_vehicle_id', userEmail, selectedVehicleId);
    }
  }, [selectedVehicleId, userEmail]);

  const currentVehicle = vehicles.find(v => v.id === selectedVehicleId) || vehicles[0] || null;

  // Vehicle Modal State (Add / Edit)
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [editingVehicleId, setEditingVehicleId] = useState(null); // null = Add, string = Edit
  // Blank, not pre-filled with a sample car. A pre-filled plate is one hurried
  // tap away from being registered as a real vehicle on a real account.
  const [vehicleForm, setVehicleForm] = useState({
    brand: '',
    name: '',
    year: '',
    plate: ''
  });

  const [dbService, setDbService] = useState(null);
  const [selectedService, setSelectedService] = useState(
    { id: 'single', name: 'Single Wash', price: 699 }
  );
  const [showVehicleSwitcher, setShowVehicleSwitcher] = useState(false);

  // Video fallback and media checks
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const videoRef = useRef(null);

  // Handlers for Vehicle Modal
  const handleOpenAddVehicle = (e) => {
    if (e) e.stopPropagation();
    setVehicleError('');
    setEditingVehicleId(null);
    setVehicleForm({
      brand: '',
      name: '',
      year: new Date().getFullYear().toString(),
      plate: ''
    });
    setShowVehicleModal(true);
  };

  const handleOpenEditVehicle = (v, e) => {
    if (e) e.stopPropagation();
    setVehicleError('');
    setEditingVehicleId(v.id);
    // Extract brand/model if name includes brand
    let brandVal = v.brand || '';
    let nameVal = v.name || '';
    if (!brandVal && nameVal.includes(' ')) {
      const parts = nameVal.split(' ');
      brandVal = parts[0];
      nameVal = parts.slice(1).join(' ');
    }
    setVehicleForm({
      brand: brandVal,
      name: nameVal,
      year: v.year || '',
      plate: v.plate || ''
    });
    setShowVehicleModal(true);
  };

  const handleSaveVehicle = async (e) => {
    e.preventDefault();
    setVehicleError('');

    if (!vehicleForm.name.trim() || !vehicleForm.plate.trim()) {
      setVehicleError('Please enter the car model and its registration number.');
      return;
    }

    const brandStr = vehicleForm.brand.trim();
    const modelStr = vehicleForm.name.trim();
    const formattedFullName = brandStr && !modelStr.toLowerCase().startsWith(brandStr.toLowerCase())
      ? `${brandStr} ${modelStr}`
      : modelStr;

    const draft = {
      brand: brandStr,
      name: formattedFullName,
      year: vehicleForm.year.trim(),
      plate: vehicleForm.plate.trim().toUpperCase(),
      icon: '🚗'
    };

    // A signed-in customer's garage lives on their account, so the same cars
    // are there on their next device and staff see the real plate at the bay.
    // A guest's entry stays in this browser until they sign in.
    if (isAuthenticated) {
      setSavingVehicle(true);
      try {
        if (editingVehicleId) {
          // Plates are the account's identity to the ANPR camera, so an edit is
          // a remove-then-add rather than an in-place rewrite.
          const editing = vehicles.find(v => v.id === editingVehicleId);
          if (editing?._id) {
            await vehicleService.deleteMyVehicle(editing._id);
          }
        }
        const updated = await vehicleService.addMyVehicle(draft);
        setVehicles(updated);
        const saved = updated.find(v => v.plate === draft.plate);
        setSelectedVehicleId(saved?.id || updated[0]?.id || '');
      } catch (err) {
        setVehicleError(
          err.response?.data?.message || 'Could not save this vehicle. Please check the registration number and try again.'
        );
        return;
      } finally {
        setSavingVehicle(false);
      }
    } else if (editingVehicleId) {
      setVehicles(prev => prev.map(v => (v.id === editingVehicleId ? { ...v, ...draft } : v)));
    } else {
      const newId = `v_${Date.now()}`;
      setVehicles(prev => [...prev, { id: newId, ...draft }]);
      setSelectedVehicleId(newId);
    }

    setShowVehicleModal(false);
    setShowVehicleSwitcher(false);
  };

  const handleDeleteVehicle = async (id, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to remove this vehicle?')) return;

    const target = vehicles.find(v => v.id === id);

    if (isAuthenticated && target?._id) {
      try {
        const updated = await vehicleService.deleteMyVehicle(target._id);
        setVehicles(updated);
        if (selectedVehicleId === id) {
          setSelectedVehicleId(updated[0]?.id || '');
        }
        return;
      } catch (err) {
        setVehicleError(err.response?.data?.message || 'Could not remove this vehicle. Please try again.');
        return;
      }
    }

    const updated = vehicles.filter(v => v.id !== id);
    setVehicles(updated);
    if (selectedVehicleId === id) {
      setSelectedVehicleId(updated[0]?.id || '');
    }
  };

  // Fetch dynamic service details from backend API & local cache
  useEffect(() => {
    const fetchServiceData = async () => {
      try {
        const cached = localStorage.getItem('tsl_car_wash_service');
        if (cached) {
          const parsed = JSON.parse(cached);
          setDbService(parsed);
          const initialItems = (parsed.pricing && parsed.pricing.length > 0) ? parsed.pricing : parsed.plans;
          if (initialItems && initialItems.length > 0) {
            setSelectedService({
              id: initialItems[0]._id || initialItems[0].id || 'single',
              name: initialItems[0].title || initialItems[0].name,
              price: initialItems[0].price
            });
          }
        }
        const res = await serviceApi.getServiceBySlug('car-wash');
        if (res.success && res.service) {
          setDbService(res.service);
          cacheService('tsl_car_wash_service', res.service);
          const liveItems = (res.service.pricing && res.service.pricing.length > 0) ? res.service.pricing : res.service.plans;
          if (liveItems && liveItems.length > 0) {
            setSelectedService({
              id: liveItems[0]._id || liveItems[0].id || 'single',
              name: liveItems[0].title || liveItems[0].name,
              price: liveItems[0].price
            });
          }
        }
      } catch (err) {
        console.warn('Using cached or default car-wash layout data');
      }
    };
    fetchServiceData();

    const handleLiveUpdate = (e) => {
      if (e?.detail) {
        if (e.detail.slug === 'car-wash') {
          setDbService(e.detail);
        }
      } else {
        const cached = localStorage.getItem('tsl_car_wash_service');
        if (cached) {
          try { 
            const parsed = JSON.parse(cached);
            if (parsed.slug === 'car-wash' || !parsed.slug) {
              setDbService(parsed);
            }
          } catch (err) {}
        }
      }
    };

    window.addEventListener('storage', handleLiveUpdate);
    window.addEventListener('tsl_service_updated', handleLiveUpdate);

    return () => {
      window.removeEventListener('storage', handleLiveUpdate);
      window.removeEventListener('tsl_service_updated', handleLiveUpdate);
    };
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handler = (e) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    let isMounted = true;
    if (!prefersReducedMotion && videoRef.current) {
      const video = videoRef.current;
      video.defaultMuted = true;
      video.muted = true;
      
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          // Suppress harmless AbortError caused by component unmounting or route changes
          if (error.name !== 'AbortError' && error.name !== 'NotAllowedError' && isMounted) {
            console.warn("Autoplay notice:", error.message);
          }
        });
      }
    }
    return () => {
      isMounted = false;
    };
  }, [prefersReducedMotion]);

  const handleBook = () => {
    // Without a real vehicle there is nothing to attach the wash to — the page
    // used to have a demo car standing by, so this could never be reached.
    if (!currentVehicle) {
      setVehicleError('Add your vehicle first so we know which car to service.');
      handleOpenAddVehicle();
      return;
    }
    navigate('/car-wash/confirm', {
      state: {
        service: selectedService,
        vehicle: currentVehicle
      }
    });
  };

  // Dynamic Pricing list
  const rawPricing = (dbService?.pricing !== undefined)
    ? dbService.pricing
    : ((dbService?.plans !== undefined)
      ? dbService.plans
      : [
          { _id: 'single', title: 'Express Foam Wash', price: 699, description: 'High-pressure foam wash, wheel cleaning & tire shine' },
          { _id: 'super', title: 'Deluxe Interior & Exterior', price: 1299, description: 'Foam wash + interior vacuum, dashboard polish & steam' }
        ]);

  const pricingItems = rawPricing.map(p => {
    const titleLower = (p.title || p.name || '').toLowerCase();
    const isSingleWash = titleLower.includes('single') || titleLower.includes('express');
    const safePrice = (isSingleWash && Number(p.price) >= 20000) ? 699 : (Number(p.price) || 699);
    return {
      _id: p._id || p.id || p.title || p.name,
      title: p.title || p.name,
      price: safePrice,
      description: p.description || (p.features && p.features.join(', '))
    };
  });

  // Dynamic Memberships list
  const rawMemberships = (dbService?.memberships !== undefined)
    ? dbService.memberships
    : [
        { _id: 'monthly', name: 'Unlimited Monthly Wash Pass', price: 2499, benefits: ['Unlimited Express Hydrobath Washes + Interior Steam once a month'], badge: 'MOST POPULAR' }
      ];

  const membershipItems = rawMemberships.map(m => ({
    _id: m._id || m.id || m.name,
    name: m.name || m.title,
    price: m.price,
    benefits: Array.isArray(m.benefits) ? m.benefits : [m.benefits || m.description || ''],
    badge: m.badge
  }));

  return (
    <div className="carwash-booking-container">
      
      {/* 1. Hero Section */}
      <div className="carwash-hero">
        {!prefersReducedMotion ? (
          <video 
            ref={videoRef}
            key={dbService?.heroVideo || dbService?.bannerVideo || 'default-tunnel-video'}
            src={dbService?.heroVideo || dbService?.bannerVideo || "/videos/car-tunnel.mp4"}
            autoPlay 
            muted 
            loop 
            playsInline 
            className="carwash-hero-video"
            poster={dbService?.bannerImage || "https://images.unsplash.com/photo-1552930294-6b595f4c2974?auto=format&fit=crop&w=800&q=80"}
          />
        ) : (
          <img 
            src={dbService?.bannerImage || "https://images.unsplash.com/photo-1552930294-6b595f4c2974?auto=format&fit=crop&w=800&q=80"} 
            alt="Car wash fallback"
            className="carwash-hero-fallback-img"
          />
        )}
      </div>

      {/* 2. Vehicle Selector Card */}
      <div className="carwash-vehicle-card-wrapper" style={{ position: 'relative' }}>
        {vehicles.length === 0 ? (
          /* No cars on this account (or no account yet). Say so plainly and
             offer the two ways forward — signing in restores a garage that
             already exists, adding a car starts one here. */
          <div className="carwash-vehicle-card" style={{ display: 'block', cursor: 'default' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.85rem' }}>
              <span className="carwash-vehicle-icon">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 17h14M5 17a2 2 0 0 1-2-2v-2a1 1 0 0 1 1-1h1l2.5-4.5A2 2 0 0 1 9.24 6h5.52a2 2 0 0 1 1.74 1.01L19 11.5h1a1 1 0 0 1 1 1V15a2 2 0 0 1-2 2" />
                  <circle cx="7.5" cy="17" r="2" />
                  <circle cx="16.5" cy="17" r="2" />
                </svg>
              </span>
              <div className="carwash-vehicle-text">
                <span className="carwash-vehicle-name">
                  {isAuthenticated ? 'Your garage is empty' : 'No vehicle registered'}
                </span>
                <span className="carwash-vehicle-plate">
                  {isAuthenticated
                    ? 'Add your car so we know which vehicle to service'
                    : 'Sign in to load your saved cars, or add one now'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {!isAuthenticated && (
                <button
                  type="button"
                  onClick={() => setShowAuthModal(true)}
                  className="flex-1 px-3 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black transition-all shadow-sm"
                  style={{ minWidth: '150px' }}
                >
                  🔐 Sign In to Access Your Garage
                </button>
              )}
              <button
                type="button"
                onClick={(e) => handleOpenAddVehicle(e)}
                className={`flex-1 px-3 py-2.5 rounded-xl text-xs font-black transition-all ${
                  isAuthenticated
                    ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm'
                    : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                }`}
                style={{ minWidth: '130px' }}
              >
                + Add Vehicle
              </button>
            </div>

            {vehicleError && (
              <p className="mt-2.5 text-[11px] font-bold text-rose-600">{vehicleError}</p>
            )}
          </div>
        ) : (
        <>
        <div
          className="carwash-vehicle-card"
          onClick={() => setShowVehicleSwitcher(!showVehicleSwitcher)}
        >
          <div className="carwash-vehicle-info">
            <span className="carwash-vehicle-icon">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 17h14M5 17a2 2 0 0 1-2-2v-2a1 1 0 0 1 1-1h1l2.5-4.5A2 2 0 0 1 9.24 6h5.52a2 2 0 0 1 1.74 1.01L19 11.5h1a1 1 0 0 1 1 1V15a2 2 0 0 1-2 2" />
                <circle cx="7.5" cy="17" r="2" />
                <circle cx="16.5" cy="17" r="2" />
              </svg>
            </span>
            <div className="carwash-vehicle-text">
              <span className="carwash-vehicle-name">
                {`${currentVehicle.name} ${currentVehicle.year ? `(${currentVehicle.year})` : ''}`}
              </span>
              <span className="carwash-vehicle-plate">{currentVehicle.plate}</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={(e) => handleOpenEditVehicle(currentVehicle, e)}
              className="p-1.5 rounded-lg hover:bg-amber-100/60 text-amber-800 transition-all"
              title="Edit Current Car Details"
            >
              ✏️
            </button>
            <svg
              className={`carwash-chevron ${showVehicleSwitcher ? 'rotated' : ''}`}
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>

        {/* Dropdown Menu to Select or Manage Cars */}
        {showVehicleSwitcher && (
          <div className="carwash-vehicle-dropdown shadow-xl border rounded-2xl bg-white overflow-hidden text-left">
            <div className="px-3 py-2 bg-slate-50 border-b text-[11px] font-black uppercase text-slate-500 tracking-wider flex justify-between items-center">
              <span>Select Registered Vehicle</span>
              <button 
                onClick={(e) => handleOpenAddVehicle(e)}
                className="text-amber-700 font-extrabold hover:underline normal-case text-xs"
              >
                + Add Car
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
              {vehicles.map(v => {
                const isSelected = v.id === selectedVehicleId;
                return (
                  <div 
                    key={v.id} 
                    className={`carwash-dropdown-item flex items-center justify-between p-3 cursor-pointer transition-colors ${isSelected ? 'bg-amber-50/80 font-bold' : 'hover:bg-slate-50'}`}
                    onClick={() => {
                      setSelectedVehicleId(v.id);
                      setShowVehicleSwitcher(false);
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{v.icon || '🚗'}</span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-slate-800">{v.name}</span>
                          {v.year && <span className="text-[10px] text-slate-500 font-medium">({v.year})</span>}
                          {isSelected && <span className="active-tag text-[9px] bg-amber-600 text-white font-black px-1.5 py-0.2 rounded-full ml-1">Active</span>}
                        </div>
                        <span className="text-[11px] text-slate-500 font-semibold block">{v.plate}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={(e) => handleOpenEditVehicle(v, e)}
                        className="p-1 text-slate-400 hover:text-amber-700 text-xs rounded"
                        title="Edit Car"
                      >
                        ✏️
                      </button>
                      {vehicles.length > 1 && (
                        <button
                          onClick={(e) => handleDeleteVehicle(v.id, e)}
                          className="p-1 text-slate-400 hover:text-red-600 text-xs rounded"
                          title="Delete Car"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={(e) => handleOpenAddVehicle(e)}
              className="w-full p-3 bg-amber-50/50 hover:bg-amber-100/60 text-amber-800 text-xs font-black flex items-center justify-center gap-1.5 border-t transition-colors"
            >
              <span>✨</span>
              <span>Add New Vehicle</span>
            </button>
          </div>
        )}

        {vehicleError && (
          <p className="mt-2 text-[11px] font-bold text-rose-600">{vehicleError}</p>
        )}
        </>
        )}
      </div>

      {/* 3. Dynamic Pricing Plans */}
      <div className="carwash-section-block">
        <h2 className="carwash-section-title">Choose a plan</h2>
        <div className="carwash-plans-list">

          {/* Pricing Options */}
          {pricingItems.map((p) => (
            <div 
              key={p._id || p.title}
              className={`carwash-plan-card carwash-plan-single ${(selectedService.id === p._id || selectedService.name === p.title) ? 'selected' : ''}`}
              onClick={() => setSelectedService({ id: p._id, name: p.title, price: p.price })}
            >
              <div className="carwash-plan-details">
                <h3 className="carwash-plan-name">{p.title}</h3>
                <p className="carwash-plan-desc">{p.description || 'Includes complete wash and interior dry'}</p>
              </div>
              <div className="carwash-plan-price-box">
                <span className="carwash-plan-price">₹{p.price}</span>
                <span className="carwash-plan-price-sub">+ GST / wash</span>
              </div>
            </div>
          ))}

          {/* Memberships Options */}
          {membershipItems.map((m) => (
            <div 
              key={m._id || m.name}
              className={`carwash-plan-card carwash-plan-monthly ${(selectedService.id === m._id || selectedService.name === m.name) ? 'selected' : ''}`}
              onClick={() => setSelectedService({ id: m._id, name: m.name, price: m.price })}
              style={{ position: 'relative' }}
            >
              <div className="carwash-plan-details">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                  <h3 className="carwash-plan-name" style={{ margin: 0 }}>{m.name}</h3>
                  {m.badge && (
                    <span className="best-value-badge">
                      {m.badge}
                    </span>
                  )}
                </div>
                <p className="carwash-plan-desc">{Array.isArray(m.benefits) ? m.benefits.join(', ') : m.benefits}</p>
              </div>
              <div className="carwash-plan-price-box">
                <span className="carwash-plan-price">₹{m.price.toLocaleString()}</span>
                <span className="carwash-plan-price-sub">+ GST / pass</span>
              </div>
            </div>
          ))}

        </div>
      </div>

      {/* Sticky Booking Button */}
      <div className="carwash-cta-wrapper">
        <button 
          className="carwash-book-btn"
          onClick={handleBook}
          style={dbService?.theme?.buttonColor ? { backgroundColor: dbService.theme.buttonColor } : {}}
        >
          <span className="carwash-book-btn-text">Book {selectedService?.name || 'Service'}</span>
          <span className="carwash-book-btn-price">₹{selectedService?.price || 699}</span>
        </button>
      </div>

      {/* 4. Add / Edit Vehicle Modal */}
      {showVehicleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 text-left">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {editingVehicleId ? '✏️ Edit Vehicle Details' : '🚗 Add New Vehicle'}
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  {editingVehicleId ? 'Update your vehicle information' : 'Register a new car for easy booking'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowVehicleModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-black hover:bg-slate-200 transition-colors flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveVehicle} className="space-y-3 text-xs">
              {vehicleError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-bold">
                  ⚠️ {vehicleError}
                </div>
              )}
              {!isAuthenticated && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl font-semibold">
                  This car is saved in this browser only.{' '}
                  <button
                    type="button"
                    onClick={() => { setShowVehicleModal(false); setShowAuthModal(true); }}
                    className="font-black underline"
                  >
                    Sign in
                  </button>{' '}
                  to keep it on your account.
                </div>
              )}
              <div>
                <label className="block font-extrabold text-slate-700 mb-1">Car Brand / Make</label>
                <input
                  type="text"
                  placeholder="e.g. Tesla, BMW, Audi, Mercedes, Honda, Toyota, Tata"
                  value={vehicleForm.brand}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, brand: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block font-extrabold text-slate-700 mb-1">Car Model / Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Model 3, X5, City, Fortuner, Thar"
                  value={vehicleForm.name}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-amber-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">Manufacturing Year</label>
                  <input
                    type="text"
                    placeholder="e.g. 2024"
                    value={vehicleForm.year}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, year: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-amber-600"
                  />
                </div>

                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">Registration / Plate No. *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TSL-3000 or MH-12-AB-1234"
                    value={vehicleForm.plate}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, plate: e.target.value.toUpperCase() })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 uppercase focus:outline-none focus:border-amber-600"
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowVehicleModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingVehicle}
                  className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-xl shadow-md transition-all disabled:opacity-60"
                >
                  {savingVehicle ? 'Saving…' : (editingVehicleId ? 'Save Changes' : 'Add Vehicle')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Sign-in for guests, so their real garage replaces the empty state */}
      <CustomerAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        titlePrompt="Sign In to Access Your Garage"
        onSuccess={() => setShowAuthModal(false)}
      />

    </div>
  );
}
