import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import serviceApi from '../../common/services/serviceApi';
import dogWashVideo from '../../assets/images/dog-wash-banner.mp4';

export default function DogWashHomePage() {
  const navigate = useNavigate();

  const pet = {
    name: 'Max',
    breed: 'Golden Retriever · 25 kg',
    icon: '🐕'
  };

  const [dbService, setDbService] = useState(null);
  const [selectedService, setSelectedService] = useState(
    { id: '2-min', name: '2 Minutes Wash', price: 100 }
  );
  const [showPetSwitcher, setShowPetSwitcher] = useState(false);

  // Video fallback and media checks
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const videoRef = useRef(null);

  // Fetch dynamic service details from backend API
  useEffect(() => {
    const fetchServiceData = async () => {
      try {
        const cached = localStorage.getItem('tsl_dog_wash_service');
        if (cached) {
          const parsed = JSON.parse(cached);
          setDbService(parsed);
          const initialPricing = parsed.pricing && parsed.pricing.length > 0
            ? parsed.pricing
            : parsed.plans;
          if (initialPricing && initialPricing.length > 0) {
            setSelectedService({
              id: initialPricing[0]._id || initialPricing[0].id || '2-min',
              name: initialPricing[0].title || initialPricing[0].name,
              price: initialPricing[0].price
            });
          }
        }
        const res = await serviceApi.getServiceBySlug('dog-wash');
        if (res.success && res.service) {
          setDbService(res.service);
          localStorage.setItem('tsl_dog_wash_service', JSON.stringify(res.service));
          const livePricing = res.service.pricing && res.service.pricing.length > 0
            ? res.service.pricing
            : res.service.plans;
          if (livePricing && livePricing.length > 0) {
            setSelectedService({
              id: livePricing[0]._id || livePricing[0].id || '2-min',
              name: livePricing[0].title || livePricing[0].name,
              price: livePricing[0].price
            });
          }
        }
      } catch (err) {
        console.warn('Using cached or default dog-wash layout data');
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
    navigate('/dog-wash/confirm', {
      state: {
        service: selectedService,
        vehicle: {
          name: pet.name,
          plate: pet.breed,
          icon: pet.icon
        }
      }
    });
  };

  // Dynamic Bath Pricing Options
  const rawItems = (dbService?.pricing && dbService.pricing.length > 0)
    ? dbService.pricing
    : ((dbService?.plans && dbService.plans.length > 0)
      ? dbService.plans
      : [
          { _id: '2-min', title: '2 Minutes Wash', price: 100, description: 'Quick 2 minutes warm hydrobath session' },
          { _id: '5-min', title: '5 Minutes Wash', price: 200, description: 'Standard 5 minutes warm hydrobath session' },
          { _id: '12-min', title: '12 Minutes Wash', price: 500, description: 'Extended 12 minutes deluxe warm hydrobath session' }
        ]);

  const pricingItems = rawItems.map(p => ({
    _id: p._id || p.id || p.title || p.name,
    title: p.title || p.name,
    price: p.price,
    description: p.description || (p.features && p.features.join(', '))
  }));

  return (
    <div className="carwash-booking-container">
      
      {/* 1. Hero Section */}
      <div className="carwash-hero">
        {!prefersReducedMotion ? (
          <video 
            ref={videoRef}
            src={dogWashVideo}
            autoPlay 
            muted 
            loop 
            playsInline 
            className="carwash-hero-video"
            poster={dbService?.bannerImage || "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=800&q=80"}
          />
        ) : (
          <img 
            src={dbService?.bannerImage || "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=800&q=80"} 
            alt="Dog wash fallback"
            className="carwash-hero-fallback-img"
          />
        )}
      </div>

      {/* 2. Pet Selector Card */}
      <div className="carwash-vehicle-card-wrapper">
        <div 
          className="carwash-vehicle-card"
          onClick={() => setShowPetSwitcher(!showPetSwitcher)}
        >
          <div className="carwash-vehicle-info">
            <span className="carwash-vehicle-icon" style={{ fontSize: '1.75rem', lineHeight: 1 }}>
              🐕
            </span>
            <div className="carwash-vehicle-text">
              <span className="carwash-vehicle-name">{pet.name}</span>
              <span className="carwash-vehicle-plate">{pet.breed}</span>
            </div>
          </div>
          <svg 
            className={`carwash-chevron ${showPetSwitcher ? 'rotated' : ''}`}
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

        {showPetSwitcher && (
          <div className="carwash-vehicle-dropdown">
            <div className="carwash-dropdown-item active">
              <span>🐕 {pet.name} ({pet.breed})</span>
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
              className={`carwash-plan-card carwash-plan-single ${selectedService.id === p._id ? 'selected' : ''}`}
              onClick={() => setSelectedService({ id: p._id, name: p.title, price: p.price })}
            >
              <div className="carwash-plan-details">
                <h3 className="carwash-plan-name">{p.title}</h3>
                <p className="carwash-plan-desc">{p.description || 'Includes complete warm hydrobath & blow dry'}</p>
              </div>
              <div className="carwash-plan-price-box">
                <span className="carwash-plan-price">₹{p.price}</span>
                <span className="carwash-plan-price-sub">+ GST / wash</span>
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
