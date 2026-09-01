import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import apiClient from '../../common/utils/apiClient';

export default function CarDetailingConfirmPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Retrieve booking details from state or fallback defaults
  const stateData = location.state || {};
  const service = {
    name: stateData.item || stateData.service?.name || 'Paint Protection Film (PPF)',
    price: stateData.price || stateData.service?.price || 490,
    duration: stateData.duration || stateData.service?.duration || '45 mins'
  };
  // No stand-in car. A booking confirmed against "Tesla Model 3 (TSL-3000)"
  // names a vehicle that belongs to nobody.
  const vehicle = {
    name: stateData.vehicle || '',
    icon: '🚗'
  };

  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Price calculations
  const basePrice = service.price;
  const discount = Math.round(basePrice * 0.1); // 10% promo discount
  const taxRate = 0.18; // 18% GST
  const taxableAmount = basePrice - discount;
  const gst = Math.round(taxableAmount * taxRate);
  const finalTotal = taxableAmount + gst;

  const handleConfirm = async () => {
    if (submitting) return;
    setSubmitting(true);

    let customerName = 'Car Owner';
    let customerEmail = '';
    try {
      const stored = localStorage.getItem('tsl_user');
      if (stored) {
        const u = JSON.parse(stored);
        if (u.name) customerName = u.name;
        if (u.email) customerEmail = u.email;
      }
    } catch (e) {}

    const generatedBookingId = `BK-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const payload = {
      bookingId: generatedBookingId,
      serviceKey: 'car-detailing',
      serviceName: 'Car Detailing',
      packageName: service.name || 'Paint Protection Film (PPF)',
      price: finalTotal,
      customerName,
      customerEmail,
      vehicleNo: vehicle.name,
      vehicleType: 'Car'
    };

    try {
      await apiClient.post('/bookings', payload);
    } catch (err) {
      console.warn('Error creating car detailing booking in DB:', err.message);
    }

    setBookingConfirmed(true);
    setTimeout(() => {
      navigate('/car-detailing/my-bookings');
    }, 2200);
  };

  return (
    <div className="carwash-confirm-container">
      
      {/* Header */}
      <div className="confirm-header-row">
        <button className="confirm-back-btn" onClick={() => navigate('/car-detailing')}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <h1 className="confirm-header-title">Confirm Detailing</h1>
        <div style={{ width: '44px' }} /> {/* Spacing spacer */}
      </div>

      {bookingConfirmed ? (
        <div className="confirm-success-card">
          <div className="success-icon-badge">✨🚗</div>
          <h2 className="success-title">Booking Confirmed!</h2>
          <p className="success-desc">
            Your car detailing session has been scheduled successfully. Redirecting to your bookings...
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
                <span className="summary-service-duration">⏱️ {service.duration}</span>
              </div>
              <span className="summary-service-price">₹{service.price}</span>
            </div>
          </div>

          {/* Vehicle details */}
          <div className="confirm-section-card">
            <h3 className="confirm-card-heading">Booking Details</h3>
            <div className="confirm-details-list">
              <div className="confirm-detail-item">
                <span className="confirm-detail-label">Vehicle</span>
                <span className="confirm-detail-value">
                  {vehicle.icon} {vehicle.name}
                </span>
              </div>
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
                  <span className="bill-label">Promo Discount (10% off)</span>
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
            style={{ backgroundColor: '#FF6B00' }}
            onClick={handleConfirm}
          >
            Confirm Booking · ₹{finalTotal}
          </button>

        </div>
      )}

    </div>
  );
}
