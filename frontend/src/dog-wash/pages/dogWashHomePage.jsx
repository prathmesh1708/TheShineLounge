import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import serviceApi from '../../common/services/serviceApi';
import dogWashVideo from '../../assets/images/dog-wash-banner.mp4';
import { getMachineConfig } from '../services/dogWashApi';
import { cacheService } from '../../common/utils/serviceCache';

const DEFAULT_FAQS = [
  {
    q: "How does the Self-Serve Dog Wash machine work?",
    a: "Our machine is an easy 4-step automated hydrobath kiosk. Simply secure your dog with the safety harness, select your desired wash duration on the touchscreen, use the warm water shampoo wand, and finish with the silent warm air dryer."
  },
  {
    q: "Is the water temperature safe for my pet?",
    a: "Yes! Water temperature is automatically thermostatically regulated at a comfortable 36°C - 38°C (96.8°F - 100.4°F) suitable for dogs of all breeds and sizes."
  },
  {
    q: "What safety features are included in the machine?",
    a: "The station includes non-slip rubber flooring, an adjustable safety tether latch, an Emergency Stop button, and automatic tub disinfection after every session."
  },
  {
    q: "Do I need to bring my own shampoo or towels?",
    a: "No! All washes automatically infuse organic pH-balanced tearless shampoo and conditioner through the spray wand. Fresh sanitized microfiber towels are also provided at the kiosk."
  },
  {
    q: "What are the kiosk operating hours?",
    a: "Our self-serve dog wash stations operate daily from 08:00 AM to 10:00 PM IST (Monday to Sunday)."
  }
];

export default function DogWashHomePage() {
  const navigate = useNavigate();

  const pet = {
    name: 'Max',
    breed: 'Golden Retriever · 25 kg',
    icon: '🐕'
  };

  const [dbService, setDbService] = useState(null);
  const [machineConfig, setMachineConfig] = useState(getMachineConfig());
  const [selectedService, setSelectedService] = useState(
    { id: '2-min', name: '2 Minutes Wash', price: 100 }
  );
  const [showPetSwitcher, setShowPetSwitcher] = useState(false);
  const [faqSearchQuery, setFaqSearchQuery] = useState('');
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  useEffect(() => {
    const handleMachineChange = () => setMachineConfig(getMachineConfig());
    window.addEventListener('dogWashMachineConfigChanged', handleMachineChange);
    return () => window.removeEventListener('dogWashMachineConfigChanged', handleMachineChange);
  }, []);

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
          cacheService('tsl_dog_wash_service', res.service);
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

    const handleDataChange = () => {
      fetchServiceData();
    };
    window.addEventListener('dogWashDataChanged', handleDataChange);
    return () => {
      window.removeEventListener('dogWashDataChanged', handleDataChange);
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

  const activeVideoSrc = dbService?.heroVideo || dbService?.bannerVideo || dogWashVideo;

  return (
    <div className="carwash-booking-container space-y-6">
      
      {/* 1. Hero Section & Service Information */}
      <div className="carwash-hero">
        {!prefersReducedMotion ? (
          <video 
            ref={videoRef}
            key={activeVideoSrc}
            src={activeVideoSrc}
            autoPlay 
            muted 
            loop 
            playsInline 
            className="carwash-hero-video"
            poster={dbService?.bannerImage || "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&q=80&w=800&q=80"}
          />
        ) : (
          <img 
            src={dbService?.bannerImage || "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&q=80&w=800&q=80"} 
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


      {/* 4. Pricing Plans */}
      <div className="carwash-section-block">
        <h2 className="carwash-section-title">Select Pricing Plan</h2>
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

          {/* Booking Button perfectly aligned in the plan list flex layout */}
          <div className="carwash-cta-wrapper">
            <button 
              className="carwash-book-btn"
              onClick={handleBook}
              style={dbService?.theme?.buttonColor ? { backgroundColor: dbService.theme.buttonColor } : {}}
            >
              <span className="carwash-book-btn-text">Book {selectedService.name}</span>
              <span className="carwash-book-btn-price">₹{selectedService.price}</span>
            </button>
          </div>

        </div>
      </div>

      {/* 5. Instructions for Using the Machine */}
      <div className="space-y-3">
        <h2 className="carwash-section-title">Instructions for Using the Machine</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(machineConfig?.instructions && machineConfig.instructions.length > 0 ? machineConfig.instructions : [
            { step: '1', title: 'Secure Your Pet', desc: 'Place your dog inside the non-slip tub & latch the safety tether lead.' },
            { step: '2', title: 'Select Duration & Pay', desc: 'Choose 2, 5, or 12 minute wash duration on the touchscreen kiosk.' },
            { step: '3', title: 'Hydrobath & Shampoo', desc: 'Use the warm spray nozzle to rinse & infuse gentle organic shampoo.' },
            { step: '4', title: 'Warm Blow Dry', desc: 'Use the two-speed silent warm air dryer for a fluffy, dry coat finish.' }
          ]).map((item, idx) => (
            <div key={item.step || idx} className="p-3.5 bg-teal-50/40 border border-teal-100 rounded-2xl flex items-start gap-3">
              <div className="w-7 h-7 rounded-xl bg-teal-600 text-white flex items-center justify-center text-xs font-black shrink-0">
                {item.step || idx + 1}
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-900">{item.title}</h4>
                <p className="text-[11px] text-gray-500 font-medium leading-snug mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Safety Instructions */}
      <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 space-y-2 mb-6">
        <h3 className="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
          <span>🛡️</span>
          <span>Safety Instructions & Pet Protection</span>
        </h3>
        <ul className="text-xs text-amber-800 font-semibold space-y-1.5 list-disc list-inside">
          {(machineConfig?.safetyGuidelines && machineConfig.safetyGuidelines.length > 0 ? machineConfig.safetyGuidelines : [
            "Keep your pet leashed and latched to the safety tether at all times inside the tub.",
            "Thermostatic temperature safety lock keeps water safely below 38°C (100°F).",
            "Press the red Emergency Stop button on the kiosk console if needed.",
            "Automatic UV & sanitization flush runs after every completed wash session."
          ]).map((rule, idx) => (
            <li key={idx}>{rule}</li>
          ))}
        </ul>
      </div>

    </div>
  );
}
