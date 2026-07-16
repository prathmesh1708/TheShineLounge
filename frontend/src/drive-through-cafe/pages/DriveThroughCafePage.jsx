import React, { useState, useEffect } from 'react';
import { servicesData } from '../../common/data/servicesData';
import PageHeader from '../../common/components/PageHeader';
import BookingForm from '../../common/components/BookingForm';
import { ShimmerPageHeader, ShimmerMenu, ShimmerForm } from '../../common/components/Shimmer';
import useEntrance from '../../common/hooks/useEntrance';

export default function DriveThroughCafePage() {
  const data = servicesData['drive-through-cafe'];
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 700);
    return () => clearTimeout(timer);
  }, []);

  const leftColRef = useEntrance({ x: -20, duration: 0.7, delay: loading ? 0 : 0.05 });
  const rightColRef = useEntrance({ x: 20, duration: 0.7, delay: loading ? 0 : 0.05 });

  // Map quickMenu items to strings for extra dropdown option selections
  const menuOptions = data.quickMenu.map(item => `${item.name} ($${item.price.toFixed(2)})`);

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
        {/* Left Column: Quick Menu */}
        <div ref={leftColRef} className="section-card">
          <h2 className="section-title">Order Ahead Quick-Menu</h2>
          <p className="text-muted" style={{ marginBottom: '1.5rem', fontSize: '0.95rem' }}>
            Choose a quick snack or drink below to add to your order. Pick up at our express drive-through window.
          </p>
          <div className="menu-items-list">
            {data.quickMenu.map((item, idx) => (
              <div key={idx} className="menu-item">
                <span className="menu-item-name">{item.name}</span>
                <span className="menu-item-leader"></span>
                <span className="menu-item-price">${item.price.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Order Ahead Booking Form */}
        <div ref={rightColRef}>
          <BookingForm
            serviceId={data.id}
            timeSlots={data.timeSlots}
            extraFieldLabel="Add Menu Item"
            extraFieldOptions={menuOptions}
            accentColor={data.accentColor}
          />
        </div>
      </div>
    </div>
  );
}

