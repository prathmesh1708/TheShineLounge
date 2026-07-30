import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function DogWashConfirmPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Retrieve booking details from state or fallback defaults
  const stateData = location.state || {};
  const service = stateData.service || {
    name: stateData.item || '2 Minutes Wash',
    price: stateData.price || 100,
    duration: stateData.duration || '2 Minutes'
  };
  const slot = stateData.slot || {
    label: stateData.time || 'Today 4:30 PM'
  };
  const vehicle = stateData.vehicle || {
    name: 'Max',
    plate: 'Golden Retriever · 25 kg',
    icon: '🐕'
  };

  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  // Price calculations
  const basePrice = service.price;
  const discount = 0;
  const taxRate = 0.18; // 18% GST
  const taxableAmount = basePrice - discount;
  const gst = Math.round(taxableAmount * taxRate);
  const finalTotal = taxableAmount + gst;

  const handleConfirm = () => {
    setBookingConfirmed(true);
    setTimeout(() => {
      navigate('/bookings');
    }, 2200);
  };

  return (
    <div className="carwash-confirm-container">
      
      {/* Header */}
      <div className="confirm-header-row">
        <button className="confirm-back-btn" onClick={() => navigate('/dog-wash')}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <h1 className="confirm-header-title">Confirm Dog Wash</h1>
        <div style={{ width: '44px' }} /> {/* Spacing spacer */}
      </div>

      {bookingConfirmed ? (
        <div className="confirm-success-card">
          <div className="success-icon-badge">🐕✨</div>
          <h2 className="success-title">Wash Confirmed!</h2>
          <p className="success-desc">
            Your pet wash session has been scheduled successfully. Redirecting to your bookings...
          </p>
        </div>
      ) : (
        <div className="confirm-body-stack">
          
          {/* Service detail card */}
          <div className="confirm-section-card">
            <h3 className="confirm-card-heading">Selected Service</h3>
            <div className="confirm-service-summary">
              <div>
                <h4 className="summary-service-name">{service.name}</h4>
                <span className="summary-service-duration">⏱️ {service.duration || '20 min'}</span>
              </div>
              <span className="summary-service-price">₹{service.price}</span>
            </div>
          </div>

          {/* Vehicle & Slot details */}
          <div className="confirm-section-card">
            <h3 className="confirm-card-heading">Booking Details</h3>
            <div className="confirm-details-list">
              <div className="confirm-detail-item">
                <span className="confirm-detail-label">Pet Profile</span>
                <span className="confirm-detail-value">
                  {vehicle.icon || '🐕'} {vehicle.name} ({vehicle.plate || vehicle.breed || 'Golden Retriever'})
                </span>
              </div>
              {slot?.label && (
                <div className="confirm-detail-item">
                  <span className="confirm-detail-label">Schedule Slot</span>
                  <span className="confirm-detail-value">{slot.label}</span>
                </div>
              )}
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="confirm-section-card">
            <h3 className="confirm-card-heading">Bill Details</h3>
            <div className="bill-breakdown-list">
              <div className="bill-row">
                <span className="bill-label">Service Base Price</span>
                <span className="bill-val">₹{basePrice}</span>
              </div>
              {discount > 0 && (
                <div className="bill-row promo">
                  <span className="bill-label">Promo Discount</span>
                  <span className="bill-val">-₹{discount}</span>
                </div>
              )}
              <div className="bill-row">
                <span className="bill-label">GST (18%)</span>
                <span className="bill-val">₹{gst}</span>
              </div>
              <hr className="bill-divider" />
              <div className="bill-row total">
                <span className="bill-label">Grand Total</span>
                <span className="bill-val">₹{finalTotal}</span>
              </div>
            </div>
          </div>

          {/* Bottom Confirmation CTA */}
          <button 
            className="confirm-final-btn"
            onClick={handleConfirm}
          >
            Confirm Booking · ₹{finalTotal}
          </button>

        </div>
      )}

    </div>
  );
}
