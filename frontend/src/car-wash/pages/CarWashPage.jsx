import React, { useState, useEffect } from 'react';
import { servicesData } from '../../common/data/servicesData';
import PageHeader from '../../common/components/PageHeader';
import BookingForm from '../../common/components/BookingForm';
import { ShimmerPageHeader, ShimmerMenu, ShimmerForm } from '../../common/components/Shimmer';
import useEntrance from '../../common/hooks/useEntrance';

export default function CarWashPage() {
  const data = servicesData['car-wash'];
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 700);
    return () => clearTimeout(timer);
  }, []);

  const leftColRef = useEntrance({ x: -20, duration: 0.7, delay: loading ? 0 : 0.05 });
  const rightColRef = useEntrance({ x: 20, duration: 0.7, delay: loading ? 0 : 0.05 });

  const planOptions = data.plans.map(plan => `${plan.name} ($${plan.price.toFixed(2)})`);

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
        {/* Left Column: Pricing Plans */}
        <div ref={leftColRef} className="plans-column">
          <h2 className="section-title" style={{ marginBottom: '2rem' }}>Wash Packages & Memberships</h2>
          <div className="plans-container">
            {data.plans.map((plan) => (
              <div 
                key={plan.id} 
                className={`plan-card ${plan.isPopular ? 'popular' : ''}`}
              >
                {plan.isPopular && (
                  <span className="popular-badge">Most Popular</span>
                )}
                
                <div className="plan-header">
                  <h3 className="plan-name">{plan.name}</h3>
                  <div className="plan-price-container">
                    <span className="plan-price">${plan.price.toFixed(2)}</span>
                    <span className="plan-price-suffix">
                      {plan.id === 'single-wash' ? ' / wash' : plan.id === 'monthly' ? ' / mo' : ' / yr'}
                    </span>
                  </div>
                </div>

                <ul className="plan-features">
                  {plan.features.map((feature, idx) => (
                    <li key={idx}>{feature}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Booking Form */}
        <div ref={rightColRef}>
          <BookingForm
            serviceId={data.id}
            timeSlots={data.timeSlots}
            extraFieldLabel="Select Package"
            extraFieldOptions={planOptions}
            accentColor={data.accentColor}
          />
        </div>
      </div>
    </div>
  );
}

