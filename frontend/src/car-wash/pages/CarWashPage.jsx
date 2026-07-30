import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { carwashMockData } from '../data/carwashMockData';
import serviceApi from '../../common/services/serviceApi';

export default function CarWashPage() {
  const navigate = useNavigate();
  const { vehicle } = carwashMockData;

  const [dbService, setDbService] = useState(null);
  const [selectedService, setSelectedService] = useState(
    { id: 'single', name: 'Single Wash', price: 699 }
  );
  const [showVehicleSwitcher, setShowVehicleSwitcher] = useState(false);

  // Video fallback and media checks
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const videoRef = useRef(null);

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
          localStorage.setItem('tsl_car_wash_service', JSON.stringify(res.service));
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
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handler = (e) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (!prefersReducedMotion && videoRef.current) {
      const video = videoRef.current;
      video.defaultMuted = true;
      video.muted = true;
      
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.warn("Autoplay was prevented or video failed to play:", error);
        });
      }
    }
  }, [prefersReducedMotion]);

  const handleBook = () => {
    navigate('/car-wash/confirm', {
      state: {
        service: selectedService,
        vehicle: vehicle
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

  const pricingItems = rawPricing.map(p => ({
    _id: p._id || p.id || p.title || p.name,
    title: p.title || p.name,
    price: p.price,
    description: p.description || (p.features && p.features.join(', '))
  }));

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
            src="/videos/car-tunnel.mp4"
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
      <div className="carwash-vehicle-card-wrapper">
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
              <span className="carwash-vehicle-name">{vehicle.name}</span>
              <span className="carwash-vehicle-plate">{vehicle.plate}</span>
            </div>
          </div>
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

        {showVehicleSwitcher && (
          <div className="carwash-vehicle-dropdown">
            <div className="carwash-dropdown-item active">
              <span>🚗 {vehicle.name} ({vehicle.plate})</span>
              <span className="active-tag">Active</span>
            </div>
          </div>
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
          Book {selectedService.name} · ₹{selectedService.price}
        </button>
      </div>

    </div>
  );
}
