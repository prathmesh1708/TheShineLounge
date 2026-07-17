import React, { useState, useEffect } from 'react';
import { servicesData } from '../../common/data/servicesData';
import PageHeader from '../../common/components/PageHeader';
import BookingForm from '../../common/components/BookingForm';
import { ShimmerPageHeader, ShimmerMenu, ShimmerForm } from '../../common/components/Shimmer';
import useEntrance from '../../common/hooks/useEntrance';

export default function DogWashPage() {
  const data = servicesData['dog-wash'];
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 700);
    return () => clearTimeout(timer);
  }, []);

  const leftColRef = useEntrance({ x: -20, duration: 0.7, delay: loading ? 0 : 0.05 });
  const rightColRef = useEntrance({ x: 20, duration: 0.7, delay: loading ? 0 : 0.05 });

  const durationOptions = data.durations.map(d => `${d.name} (₹${d.price.toFixed(2)})`);

  if (loading) {
    return (
      <div style={{ '--accent-color': data.accentColor }}>
        <ShimmerPageHeader />
        <div className="service-split-layout">
          <ShimmerMenu />
          <ShimmerForm />
        </div>
      </div>
    );
  }

  return (
    <div style={{ '--accent-color': data.accentColor }}>
      <PageHeader 
        id={data.id} 
        name={data.name} 
        tagline={data.tagline} 
        accentColor={data.accentColor} 
      />

      <div className="service-split-layout">
        {/* Left Column: Duration Price Tiles */}
        <div ref={leftColRef} className="section-card">
          <h2 className="section-title">Session Durations</h2>
          <p className="text-muted" style={{ marginBottom: '1.5rem', fontSize: '0.95rem' }}>
            Book premium warm water baths equipped with shampoo selectors, conditioner sprays, and high-velocity dryers.
          </p>
          <div className="dog-wash-tiles">
            {data.durations.map((tile) => (
              <div key={tile.id} className="duration-tile">
                <h3 className="tile-label">{tile.name.split(' (')[0]}</h3>
                <span className="tile-price">₹{tile.price.toFixed(2)}</span>
                <p className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  {tile.name.includes('2 Minutes') ? 'Express rinse' : tile.name.includes('5 Minutes') ? 'Standard shampoo' : 'Condition + wash'}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Booking Form */}
        <div ref={rightColRef}>
          <BookingForm
            serviceId={data.id}
            timeSlots={data.timeSlots}
            extraFieldLabel="Select Session"
            extraFieldOptions={durationOptions}
            accentColor={data.accentColor}
          />
        </div>
      </div>
    </div>
  );
}

