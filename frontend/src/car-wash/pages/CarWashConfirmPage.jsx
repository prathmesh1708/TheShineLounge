import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import apiClient from '../../common/utils/apiClient';
import { cacheService } from '../../common/utils/serviceCache';
import {
  isMembershipPackage,
  scheduleNewMembership,
  buildMembershipSchedule
} from '../../common/utils/membershipUtils';
import {
  readScoped,
  writeScoped,
  currentUserEmail,
  normalizeEmail
} from '../../common/utils/userScopedStorage';

export default function CarWashConfirmPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Retrieve booking details from state
  const { service, slot, vehicle } = location.state || {
    service: { name: 'Premium Hydro Wash', price: 299, duration: '40 min' },
    slot: { label: 'Today 4:30 PM' },
    vehicle: { name: 'Hyundai Elite i20', plate: 'MP09WC4444', icon: '🏎️' }
  };

  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [scheduledPass, setScheduledPass] = useState(null);
  const [dbService, setDbService] = useState(null);

  React.useEffect(() => {
    const fetchServiceData = async () => {
      try {
        const cached = localStorage.getItem('tsl_car_wash_service');
        if (cached) {
          setDbService(JSON.parse(cached));
        }
        const res = await apiClient.get('/services/car-wash');
        if (res.data && res.data.service) {
          setDbService(res.data.service);
          cacheService('tsl_car_wash_service', res.data.service);
        }
      } catch (err) {
        console.warn('Could not load service details for discount computation');
      }
    };
    fetchServiceData();
  }, []);

  // Detect number of registered cars
  let numCars = 1;
  const isMembership = (service.name || '').toLowerCase().includes('membership') || (service.name || '').toLowerCase().includes('pass');
  
  const savedVehicles = readScoped('tsl_saved_vehicles', currentUserEmail(), []);
  if (Array.isArray(savedVehicles) && savedVehicles.length > 0) {
    numCars = savedVehicles.length;
  }

  // Price calculations
  const basePrice = service.price;
  const totalBasePrice = isMembership ? (basePrice * numCars) : basePrice;
  const isPremiumWashPromo = service.id === 'premium-wash';
  
  // Calculate discounts
  let totalDiscount = 0;
  if (isMembership && numCars > 1) {
    // Per-car discount is only applicable if the user has added multiple cars (numCars > 1)
    if (dbService?.perCarDiscountActive) {
      let discountPerCar = 0;
      if (dbService.perCarDiscountType === 'percent') {
        discountPerCar = Math.round(basePrice * (dbService.perCarDiscountAmount / 100));
      } else {
        discountPerCar = dbService.perCarDiscountAmount;
      }
      totalDiscount = discountPerCar * numCars;
    } else {
      totalDiscount = isPremiumWashPromo ? Math.round(basePrice * 0.2) * numCars : 0;
    }
  } else {
    // For single car or single wash bookings, no per-car discount is applied
    totalDiscount = isPremiumWashPromo ? Math.round(basePrice * 0.2) : 0;
  }

  const taxRate = 0.18; // 18% GST
  const taxableAmount = Math.max(0, totalBasePrice - totalDiscount);
  const gst = Math.round(taxableAmount * taxRate);
  const finalTotal = taxableAmount + gst;

  const handleConfirm = async () => {
    try {
      // Get customer info from localStorage / AuthContext
      let customerName = 'Valued Customer';
      let customerEmail = '';
      try {
        const stored = localStorage.getItem('tsl_user') || localStorage.getItem('tsl_customer_user') || localStorage.getItem('tsl_admin_user');
        if (stored) {
          const u = JSON.parse(stored);
          customerName = u.fullName || u.name || customerName;
          customerEmail = (u.email || '').toLowerCase().trim();
        }
      } catch (e) {
        console.warn('Error reading customer from localStorage:', e);
      }
      if (!customerEmail) {
        customerEmail = 'customer@theshinelounge.com';
      }

      // Parse date and timeslot dynamically from system clock
      const now = new Date();
      const liveDateStr = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      const liveTimeStart = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      const liveTimeEnd = new Date(now.getTime() + 30 * 60000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

      let dateVal = liveDateStr;
      let timeSlotVal = `${liveTimeStart} - ${liveTimeEnd}`;

      if (slot?.label) {
        if (slot.label.includes('Today')) {
          dateVal = liveDateStr;
          timeSlotVal = slot.label.replace('Today', '').trim() || `${liveTimeStart} - ${liveTimeEnd}`;
        } else {
          dateVal = slot.label;
          timeSlotVal = slot.label;
        }
      }

      const payload = {
        bookingId: `B-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        serviceKey: 'car-wash',
        serviceName: 'Car Wash',
        packageName: service.name,
        price: finalTotal,
        date: dateVal,
        timeSlot: timeSlotVal,
        customerName,
        customerEmail,
        vehicleNo: vehicle?.plate || 'MP09WC4444',
        vehicleType: vehicle?.name || 'Hyundai Elite i20',
        purchasedAt: new Date().toISOString()
      };

      // A pass bought while another one is still running is queued behind it
      // instead of overwriting it, so no paid days are lost on an upgrade.
      const scopeEmail = normalizeEmail(customerEmail);
      let localBookings = readScoped('tsl_user_bookings', scopeEmail, []);
      if (!Array.isArray(localBookings)) localBookings = [];

      if (isMembershipPackage(payload.packageName)) {
        let priorPasses = localBookings.filter(b => isMembershipPackage(b.packageName || b.plan));

        // localStorage can be cleared between purchases; the server still knows.
        try {
          const res = await apiClient.get('/bookings');
          const serverBookings = (res.data?.bookings || []).filter(
            b => (b.customerEmail || '').toLowerCase().trim() === customerEmail
              && isMembershipPackage(b.packageName)
          );
          const knownIds = new Set(priorPasses.map(b => b.bookingId));
          serverBookings.forEach(b => {
            if (!knownIds.has(b.bookingId)) priorPasses.push(b);
          });
        } catch (err) {
          console.warn('Could not load prior passes from server, stacking on local history only');
        }

        const scheduled = scheduleNewMembership(priorPasses, payload, { catalog: dbService?.memberships });
        setScheduledPass(scheduled);
        if (scheduled) {
          payload.membershipStartDate = scheduled.startISO;
          payload.membershipExpiryDate = scheduled.expiryISO;
          payload.membershipStartLabel = scheduled.startLabel;
          payload.membershipExpiryLabel = scheduled.expiryLabel;
          payload.membershipStatus = scheduled.status;
        }
      }

      try {
        // membership* fields are derived client-side and are not part of the
        // booking schema, so they stay out of the request body.
        const { membershipStartDate, membershipExpiryDate, membershipStartLabel,
          membershipExpiryLabel, membershipStatus, ...bookingPayload } = payload;
        await apiClient.post('/bookings', bookingPayload);
      } catch (err) {
        console.warn('Backend POST /bookings failed, preserving locally:', err.message);
      }

      // Save under this customer's own scope so Profile & Bookings update
      // instantly without leaking into the next account on this browser.
      localBookings.unshift(payload);
      writeScoped('tsl_user_bookings', scopeEmail, localBookings);

      if (isMembershipPackage(payload.packageName)) {
        const passes = localBookings.filter(b => isMembershipPackage(b.packageName || b.plan));
        writeScoped('tsl_membership_passes', scopeEmail, passes);

        // Legacy single-pass key: keep it pointing at whatever is running now,
        // falling back to the newest purchase when everything is still queued.
        const schedule = buildMembershipSchedule(passes, { catalog: dbService?.memberships });
        const current = schedule.find(r => r.isActive) || schedule[schedule.length - 1];
        writeScoped('tsl_active_membership', scopeEmail, current ? current.booking : payload);
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('tsl_booking_created', { detail: payload }));
      }

      setBookingConfirmed(true);
      setTimeout(() => {
        navigate('/bookings');
      }, 2500);
    } catch (err) {
      console.error('Error submitting booking:', err);
      alert('Failed to register booking: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="carwash-confirm-container">
      
      {/* Header */}
      <div className="confirm-header-row">
        <button className="confirm-back-btn" onClick={() => navigate('/car-wash')}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <h1 className="confirm-header-title">Confirm Booking</h1>
        <div style={{ width: '44px' }} /> {/* Spacing spacer */}
      </div>

      {bookingConfirmed ? (
        <div className="confirm-success-card">
          <div className="success-icon-badge">✨</div>
          <h2 className="success-title">Booking Confirmed!</h2>
          {scheduledPass?.isQueued ? (
            <p className="success-desc">
              Your current pass keeps running until {scheduledPass.startLabel}. The upgraded{' '}
              <strong>{scheduledPass.packageName}</strong> is queued and starts{' '}
              {scheduledPass.startLabel}, valid until {scheduledPass.expiryLabel}. Redirecting you to bookings...
            </p>
          ) : (
            <p className="success-desc">
              Your wash session has been scheduled successfully. Redirecting you to bookings...
            </p>
          )}
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

          {/* Vehicle & Slot details */}
          <div className="confirm-section-card">
            <h3 className="confirm-card-heading">Booking Details</h3>
            <div className="confirm-details-list">
              <div className="confirm-detail-item">
                <span className="confirm-detail-label">Vehicle</span>
                <span className="confirm-detail-value">
                  {vehicle.icon} {vehicle.name} ({vehicle.plate})
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
                <span className="bill-label">
                  {isMembership && numCars > 1 ? `Service Base Price (₹${basePrice} × ${numCars} cars)` : 'Service Base Price'}
                </span>
                <span className="bill-val">₹{totalBasePrice}</span>
              </div>
              {totalDiscount > 0 && (
                <div className="bill-row promo">
                  <span className="bill-label">
                    {isMembership && numCars > 1 && dbService?.perCarDiscountActive
                      ? `Applied Discount (${dbService.perCarDiscountType === 'percent' ? `${dbService.perCarDiscountAmount}%` : `₹${dbService.perCarDiscountAmount}`} off per car × ${numCars})`
                      : 'Promo Discount (20% off)'}
                  </span>
                  <span className="bill-val">-₹{totalDiscount}</span>
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
