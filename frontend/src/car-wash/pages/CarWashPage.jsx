import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { carwashMockData } from '../data/carwashMockData';

export default function CarWashPage() {
  const navigate = useNavigate();
  const { vehicle } = carwashMockData;

  // Selected plan state
  const [selectedService, setSelectedService] = useState(
    { id: 'single', name: 'Single Wash', price: 699 }
  );
  const [showVehicleSwitcher, setShowVehicleSwitcher] = useState(false);

  // Video fallback and media checks
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handler = (e) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const handleBook = () => {
    // Navigate to confirm page with booking data in router state
    navigate('/car-wash/confirm', {
      state: {
        service: selectedService,
        vehicle: vehicle
      }
    });
  };

  return (
    <div className="carwash-booking-container">
      
      {/* 1. Hero Section with Looped Video & Overlay */}
      <div className="carwash-hero">
        {!prefersReducedMotion && !videoError ? (
          <video 
            ref={videoRef}
            autoPlay 
            muted 
            loop 
            playsInline 
            onError={() => setVideoError(true)}
            className="carwash-hero-video"
            poster="https://images.unsplash.com/photo-1552930294-6b595f4c2974?auto=format&fit=crop&w=800&q=80"
          >
            <source src="/videos/car-tunnel.mp4" type="video/mp4" />
          </video>
        ) : (
          <img 
            src="https://images.unsplash.com/photo-1552930294-6b595f4c2974?auto=format&fit=crop&w=800&q=80" 
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
            <div 
              className="carwash-dropdown-item add-vehicle"
              onClick={(e) => {
                e.stopPropagation();
                alert('Add vehicle dialog (mock demonstration).');
              }}
            >
              <span>➕ Add new vehicle</span>
            </div>
          </div>
        )}
      </div>

      {/* 3. Pricing Plans */}
      <div className="carwash-section-block">
        <h2 className="carwash-section-title">Choose a plan</h2>
        <div className="carwash-plans-list">

          {/* Single Wash Row */}
          <div 
            className={`carwash-plan-card carwash-plan-single ${selectedService.id === 'single' ? 'selected' : ''}`}
            onClick={() => setSelectedService({ id: 'single', name: 'Single Wash', price: 699 })}
          >
            <div className="carwash-plan-details">
              <h3 className="carwash-plan-name">Single Wash</h3>
              <p className="carwash-plan-desc">Complimentary – vacuum, polish, mat cleaning</p>
            </div>
            <div className="carwash-plan-price-box">
              <span className="carwash-plan-price">₹699</span>
              <span className="carwash-plan-price-sub">+ GST / wash</span>
            </div>
          </div>

          {/* Monthly Membership Row */}
          <div 
            className={`carwash-plan-card carwash-plan-monthly ${selectedService.id === 'monthly' ? 'selected' : ''}`}
            onClick={() => setSelectedService({ id: 'monthly', name: 'Monthly Membership', price: 2499 })}
          >
            <div className="carwash-plan-details">
              <h3 className="carwash-plan-name">Monthly Membership</h3>
              <p className="carwash-plan-desc">Up to 4 washes/month + interior car fragrance</p>
            </div>
            <div className="carwash-plan-price-box">
              <span className="carwash-plan-price">₹2,499</span>
              <span className="carwash-plan-price-sub">+ GST / month</span>
            </div>
          </div>

          {/* Yearly Membership Row */}
          <div 
            className={`carwash-plan-card carwash-plan-monthly ${selectedService.id === 'yearly' ? 'selected' : ''}`}
            onClick={() => setSelectedService({ id: 'yearly', name: 'Yearly Membership', price: 19999 })}
            style={{ position: 'relative' }}
          >
            <div className="carwash-plan-details">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                <h3 className="carwash-plan-name" style={{ margin: 0 }}>Yearly Membership</h3>
                <span className="best-value-badge">
                  BEST VALUE
                </span>
              </div>
              <p className="carwash-plan-desc">Unlimited washes + ceramic coating & 5x car fragrance</p>
            </div>
            <div className="carwash-plan-price-box">
              <span className="carwash-plan-price">₹19,999</span>
              <span className="carwash-plan-price-sub">+ GST / year</span>
            </div>
          </div>

        </div>
      </div>

      {/* Sticky Booking Button */}
      <div className="carwash-cta-wrapper">
        <button 
          className="carwash-book-btn"
          onClick={handleBook}
        >
          Book {selectedService.name} · ₹{selectedService.price}
        </button>
      </div>

    </div>
  );
}
