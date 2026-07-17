import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { carwashMockData } from '../data/carwashMockData';

export default function CarWashPage() {
  const navigate = useNavigate();
  const { vehicle, services, slots } = carwashMockData;

  // Selected states
  const [selectedService, setSelectedService] = useState(
    services.find(s => s.isPopular) || services[0]
  );
  const [selectedSlot, setSelectedSlot] = useState(slots[0]);
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
        slot: selectedSlot,
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
            <source src="/videos/carwash-loop.mp4" type="video/mp4" />
          </video>
        ) : (
          <img 
            src="https://images.unsplash.com/photo-1552930294-6b595f4c2974?auto=format&fit=crop&w=800&q=80" 
            alt="Car wash fallback"
            className="carwash-hero-fallback-img"
          />
        )}
        
        {/* Dark overlay */}
        <div className="carwash-hero-overlay" />

        {/* Overlay Content */}
        <div className="carwash-hero-content">
          <div className="carwash-hero-header">
            <span className="carwash-hero-logo">💧 Shine Wash</span>
            <button 
              className="carwash-hero-bell"
              onClick={() => alert('No new wash updates.')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </button>
          </div>

          <div className="carwash-hero-promo">
            <span className="carwash-promo-badge">SEASON OFFER</span>
            <h1 className="carwash-promo-title">20% off Premium Wash</h1>
            <p className="carwash-promo-subtitle">Book any weekday slot before 10 AM</p>
          </div>
        </div>
      </div>

      {/* 2. Vehicle Selector Card */}
      <div className="carwash-vehicle-card-wrapper">
        <div 
          className="carwash-vehicle-card"
          onClick={() => setShowVehicleSwitcher(!showVehicleSwitcher)}
        >
          <div className="carwash-vehicle-info">
            <span className="carwash-vehicle-icon">{vehicle.icon}</span>
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

      {/* 3. Service Selection List */}
      <div className="carwash-section-block">
        <h2 className="carwash-section-title">Choose a service</h2>
        <div className="carwash-services-list">
          {services.map((service) => {
            const isSelected = selectedService.id === service.id;
            return (
              <div 
                key={service.id}
                className={`carwash-service-card ${isSelected ? 'selected' : ''}`}
                onClick={() => setSelectedService(service)}
              >
                <img 
                  src={service.image} 
                  alt={service.name} 
                  className="carwash-service-img" 
                />
                
                <div className="carwash-service-details">
                  <div className="carwash-service-header-row">
                    <h3 className="carwash-service-name">{service.name}</h3>
                    {service.isPopular && (
                      <span className="popular-pill">Popular</span>
                    )}
                  </div>
                  <p className="carwash-service-desc">{service.description}</p>
                  <span className="carwash-service-duration">⏱️ {service.duration}</span>
                </div>

                <div className="carwash-service-price-box">
                  <span className="carwash-service-price">₹{service.price}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Time Slot Picker */}
      <div className="carwash-section-block">
        <h2 className="carwash-section-title">Pick a slot</h2>
        <div className="carwash-slots-row">
          {slots.map((slot) => {
            const isSelected = selectedSlot.id === slot.id;
            return (
              <button
                key={slot.id}
                className={`carwash-slot-chip ${isSelected ? 'selected' : ''}`}
                onClick={() => setSelectedSlot(slot)}
              >
                <span className="slot-chip-label">{slot.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Sticky Booking Button */}
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
