import React, { useState, useEffect } from 'react';
import ServiceCard from '../common/components/ServiceCard';
import { ShimmerCard } from '../common/components/Shimmer';
import { servicesData } from '../common/data/servicesData';
import useEntrance from '../common/hooks/useEntrance';

export default function Home() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 900);
    return () => clearTimeout(timer);
  }, []);

  // Stagger animate all children cards on mount
  const gridRef = useEntrance({
    y: 35,
    opacity: 0,
    duration: 0.8,
    stagger: 0.12,
    ease: 'power3.out',
    delay: loading ? 0 : 0.1 // Run after loading finishes
  });

  return (
    <div className="home-container">
      <div className="hero-banner">
        <h1 className="hero-title">The Shine Lounge</h1>
        <p className="hero-subtitle">
          Experience a new standard of luxury convenience. Access all of our premium café, auto-spa, and grooming services in one single lounge.
        </p>
      </div>

      <div ref={gridRef} className="services-grid">
        {loading ? (
          // Render 6 animated skeleton cards
          Array.from({ length: 6 }).map((_, idx) => (
            <ShimmerCard key={idx} />
          ))
        ) : (
          Object.values(servicesData).map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))
        )}
      </div>
    </div>
  );
}

