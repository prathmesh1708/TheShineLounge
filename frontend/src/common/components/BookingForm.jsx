import React, { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import Button from './button';

export default function BookingForm({ 
  serviceId, 
  timeSlots, 
  extraFieldLabel, 
  extraFieldOptions = [],
  accentColor 
}) {
  const [formData, setFormData] = useState({
    fullName: '',
    mobileNumber: '',
    date: new Date().toISOString().split('T')[0], // Defaults to today
    timeSlot: timeSlots[0] || '',
    extraField: extraFieldOptions[0] || ''
  });
  
  const [isConfirmed, setIsConfirmed] = useState(false);
  const successRef = useRef(null);

  // Set default values when options change
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      timeSlot: timeSlots[0] || '',
      extraField: extraFieldOptions[0] || ''
    }));
  }, [timeSlots, extraFieldOptions]);

  // GSAP animation for success screen on load
  useEffect(() => {
    if (isConfirmed && successRef.current) {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) return;

      const elements = successRef.current.children;
      gsap.fromTo(
        elements,
        { opacity: 0, y: 20, scale: 0.95 },
        { 
          opacity: 1, 
          y: 0, 
          scale: 1, 
          duration: 0.6, 
          stagger: 0.15, 
          ease: 'back.out(1.5)' 
        }
      );
    }
  }, [isConfirmed]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.mobileNumber) return;
    setIsConfirmed(true);
  };

  const handleReset = () => {
    setIsConfirmed(false);
    setFormData({
      fullName: '',
      mobileNumber: '',
      date: new Date().toISOString().split('T')[0],
      timeSlot: timeSlots[0] || '',
      extraField: extraFieldOptions[0] || ''
    });
  };

  if (isConfirmed) {
    return (
      <div className="booking-panel" style={{ '--accent-color': accentColor }}>
        <div ref={successRef} className="confirmation-container">
          <div className="checkmark-circle">✓</div>
          <h3 className="confirmation-title">Booking Confirmed!</h3>
          <p className="confirmation-subtitle">Your appointment has been successfully scheduled.</p>
          
          <div className="booking-summary-card">
            <div className="summary-row">
              <span className="summary-label">Customer Name</span>
              <span className="summary-value">{formData.fullName}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Mobile Number</span>
              <span className="summary-value">{formData.mobileNumber}</span>
            </div>
            
            {serviceId !== 'drive-through-cafe' && (
              <div className="summary-row">
                <span className="summary-label">Booking Date</span>
                <span className="summary-value">{formData.date}</span>
              </div>
            )}
            
            <div className="summary-row">
              <span className="summary-label">
                {serviceId === 'drive-through-cafe' ? 'Pickup Slot' : 'Time Slot'}
              </span>
              <span className="summary-value highlight">{formData.timeSlot}</span>
            </div>

            {extraFieldLabel && (
              <div className="summary-row">
                <span className="summary-label">{extraFieldLabel}</span>
                <span className="summary-value">{formData.extraField}</span>
              </div>
            )}
          </div>

          <button 
            type="button" 
            onClick={handleReset} 
            className="form-submit-btn"
            style={{ width: '100%' }}
          >
            Book Another Slot
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="booking-panel" style={{ '--accent-color': accentColor }}>
      <h3 className="booking-title">
        <span>📅</span> Secure Your Spot
      </h3>
      
      <form onSubmit={handleSubmit} className="booking-form">
        <div className="form-group">
          <label className="form-label">Full Name</label>
          <input 
            type="text" 
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="John Doe"
            className="form-input" 
            required 
          />
        </div>

        <div className="form-group">
          <label className="form-label">Mobile Number</label>
          <input 
            type="tel" 
            name="mobileNumber"
            value={formData.mobileNumber}
            onChange={handleChange}
            placeholder="+1 (555) 000-0000"
            className="form-input" 
            required 
          />
        </div>

        {/* Omit date field for drive-through café order ahead */}
        {serviceId !== 'drive-through-cafe' && (
          <div className="form-group">
            <label className="form-label">Select Date</label>
            <input 
              type="date" 
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="form-input" 
              required 
            />
          </div>
        )}

        <div className="form-group">
          <label className="form-label">
            {serviceId === 'drive-through-cafe' ? 'Pickup Time Slot' : 'Preferred Time'}
          </label>
          <select 
            name="timeSlot"
            value={formData.timeSlot}
            onChange={handleChange}
            className="form-select"
            required
          >
            {timeSlots.map((slot, index) => (
              <option key={index} value={slot}>{slot}</option>
            ))}
          </select>
        </div>

        {extraFieldLabel && (
          <div className="form-group">
            <label className="form-label">{extraFieldLabel}</label>
            <select 
              name="extraField"
              value={formData.extraField}
              onChange={handleChange}
              className="form-select"
              required
            >
              {extraFieldOptions.map((opt, index) => (
                <option key={index} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        )}

        <button type="submit" className="form-submit-btn">
          Confirm Appointment
        </button>
      </form>
    </div>
  );
}
