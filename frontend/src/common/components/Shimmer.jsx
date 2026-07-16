import React from 'react';

// Common base shimmer element
export function ShimmerBlock({ className = '', style = {} }) {
  return (
    <div 
      className={`shimmer-placeholder ${className}`} 
      style={style}
    />
  );
}

// Shimmer card matching the home service card layout
export function ShimmerCard() {
  return (
    <div className="service-card shimmer-card-container">
      <div className="service-card-header" style={{ marginBottom: '1.5rem' }}>
        <ShimmerBlock style={{ width: '48px', height: '48px', borderRadius: '0.75rem' }} />
        <ShimmerBlock style={{ width: '16px', height: '16px', borderRadius: '50%' }} />
      </div>
      <ShimmerBlock style={{ width: '60%', height: '1.5rem', marginBottom: '0.75rem' }} />
      <ShimmerBlock style={{ width: '90%', height: '1rem', marginBottom: '0.5rem' }} />
      <ShimmerBlock style={{ width: '75%', height: '1rem' }} />
    </div>
  );
}

// Shimmer block representing the PageHeader banner
export function ShimmerPageHeader() {
  return (
    <div className="page-header-container" style={{ pointerEvents: 'none' }}>
      <ShimmerBlock style={{ width: '68px', height: '68px', borderRadius: '1rem', flexShrink: 0 }} />
      <div className="page-header-text" style={{ flexGrow: 1, gap: '0.5rem' }}>
        <ShimmerBlock style={{ width: '40%', height: '2rem' }} />
        <ShimmerBlock style={{ width: '65%', height: '1rem' }} />
      </div>
    </div>
  );
}

// Shimmer block representing list items (menu items, services)
export function ShimmerMenu() {
  return (
    <div className="section-card">
      <ShimmerBlock style={{ width: '40%', height: '1.75rem', marginBottom: '2rem' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {[1, 2, 3, 4].map((n) => (
          <div key={n} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <ShimmerBlock style={{ width: '45%', height: '1.25rem' }} />
            <ShimmerBlock style={{ width: '10%', height: '1.25rem' }} />
          </div>
        ))}
      </div>
    </div>
  );
}

// Shimmer block representing the Booking Form
export function ShimmerForm() {
  return (
    <div className="booking-panel" style={{ pointerEvents: 'none' }}>
      <ShimmerBlock style={{ width: '50%', height: '1.5rem', marginBottom: '2rem' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {[1, 2, 3, 4].map((n) => (
          <div key={n} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <ShimmerBlock style={{ width: '30%', height: '0.85rem' }} />
            <ShimmerBlock style={{ width: '100%', height: '2.5rem', borderRadius: '0.75rem' }} />
          </div>
        ))}
        <ShimmerBlock style={{ width: '100%', height: '3rem', borderRadius: '0.75rem', marginTop: '0.5rem' }} />
      </div>
    </div>
  );
}
