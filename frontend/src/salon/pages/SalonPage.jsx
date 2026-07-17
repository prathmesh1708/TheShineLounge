import React, { useState, useEffect } from 'react';
import { servicesData } from '../../common/data/servicesData';
import PageHeader from '../../common/components/PageHeader';
import BookingForm from '../../common/components/BookingForm';
import { ShimmerPageHeader, ShimmerMenu, ShimmerForm } from '../../common/components/Shimmer';
import useEntrance from '../../common/hooks/useEntrance';

export default function SalonPage() {
  const data = servicesData.salon;
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 700);
    return () => clearTimeout(timer);
  }, []);

  const leftColRef = useEntrance({ x: -20, duration: 0.7, delay: loading ? 0 : 0.05 });
  const rightColRef = useEntrance({ x: 20, duration: 0.7, delay: loading ? 0 : 0.05 });

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
        {/* Left Column: Salon Services */}
        <div ref={leftColRef} className="section-card">
          <h2 className="section-title">Grooming & Haircuts</h2>
          <p className="text-muted" style={{ marginBottom: '1.5rem', fontSize: '0.95rem' }}>
            Book premium hair treatments, precision cuts, shaves, and grooming services tailored for the modern gentleman.
          </p>
          <div className="menu-items-list">
            {data.services.map((service, idx) => (
              <div key={idx} className="menu-item">
                <span className="menu-item-name">
                  {service.name}
                  <span className="item-duration">({service.duration})</span>
                </span>
                <span className="menu-item-leader"></span>
                <span className="menu-item-price">₹{service.price.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Booking Form */}
        <div ref={rightColRef}>
          <BookingForm
            serviceId={data.id}
            timeSlots={data.timeSlots}
            extraFieldLabel="Preferred Barber"
            extraFieldOptions={data.barbers}
            accentColor={data.accentColor}
          />
        </div>
      </div>
    </div>
  );
}

