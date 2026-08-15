import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import apiClient from '../common/utils/apiClient';
import { useAuth } from '../common/context/AuthContext';
import { readScoped, normalizeEmail } from '../common/utils/userScopedStorage';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 22 } }
};

export default function BookingsPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const userEmail = normalizeEmail(user?.email);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedBookingId, setExpandedBookingId] = useState(null);

  const getSteps = (serviceKey) => {
    const key = (serviceKey || '').toLowerCase();
    if (key.includes('wash') && !key.includes('dog')) {
      return ['Pending', 'Received', 'Wash Started', 'Completed', 'Delivered'];
    }
    if (key.includes('detail')) {
      return ['Pending', 'Received', 'Inspection', 'Detailing', 'Delivered'];
    }
    if (key.includes('dog')) {
      return ['Pending', 'Station', 'Bath & Dry', 'Finished', 'Delivered'];
    }
    if (key.includes('salon')) {
      return ['Pending', 'Chair', 'Treatment', 'Completed'];
    }
    if (key.includes('cafe')) {
      return ['Received', 'Kitchen', 'Ready', 'Delivered'];
    }
    return ['Pending', 'Confirmed', 'In Progress', 'Completed'];
  };

  const getTodayFormattedDate = () => {
    return new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const getLiveFormattedTimeSlot = () => {
    const now = new Date();
    const start = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const end = new Date(now.getTime() + 30 * 60000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${start} - ${end}`;
  };

  const shouldShowTimeSlot = (booking) => {
    const key = (booking.serviceKey || '').toLowerCase();
    const serviceName = (booking.service || '').toLowerCase();
    return (
      key.includes('salon') ||
      key.includes('cafe') ||
      serviceName.includes('salon') ||
      serviceName.includes('cafe')
    );
  };

  useEffect(() => {
    const fetchMyBookings = async () => {
      // Only this customer's bookings. The endpoint returns the whole table,
      // so an unfiltered render showed every other customer's history.
      const isMine = (b) => {
        const owner = normalizeEmail(b.customerEmail);
        if (!userEmail) return false;
        return owner === userEmail;
      };

      let combinedRawBookings = [];
      try {
        const res = await apiClient.get('/bookings');
        if (res.data && Array.isArray(res.data.bookings)) {
          combinedRawBookings = res.data.bookings.filter(isMine);
        }
      } catch (err) {
        console.warn('Could not load active bookings from backend:', err.message);
      }

      // Merge bookings created in this browser, from this customer's own scope.
      try {
        const localBookings = readScoped('tsl_user_bookings', userEmail, []);
        if (Array.isArray(localBookings) && localBookings.length > 0) {
          const apiIds = new Set(combinedRawBookings.map(b => b.bookingId || b.id || b._id));
          localBookings.filter(isMine).forEach(lb => {
            if (!apiIds.has(lb.bookingId) && !apiIds.has(lb.id)) {
              combinedRawBookings.unshift(lb);
            }
          });
        }
      } catch (e) {}

      const mapped = combinedRawBookings.map(b => {
        const rawDate = b.date || '';
        const isLegacyStaticDate = !rawDate || rawDate.includes('July 18') || rawDate.includes('2026-07-18');
        const displayDate = isLegacyStaticDate ? getTodayFormattedDate() : rawDate;

        const rawTime = b.timeSlot || b.time || '';
        const isLegacyStaticTime = !rawTime || rawTime === '02:00 PM - 02:30 PM';
        const displayTime = isLegacyStaticTime ? getLiveFormattedTimeSlot() : rawTime;

        const pkgName = b.packageName || b.package || b.service || 'Service Order';
        const priceVal = b.price !== undefined ? b.price : (b.amount || 699);

        return {
          id: b.bookingId || b.id || `B-2026-${Math.floor(1000 + Math.random() * 9000)}`,
          service: b.serviceName || b.service || 'Car Wash',
          package: pkgName.includes('₹') ? pkgName : `${pkgName} (₹${priceVal})`,
          date: displayDate,
          time: displayTime,
          status: b.status || 'Confirmed',
          statusColor: (b.status === 'Completed' || b.status === 'Delivered') ? '#2E7D32' : b.status === 'In Progress' ? '#1E4A7E' : '#C17F19',
          statusBg: (b.status === 'Completed' || b.status === 'Delivered') ? 'rgba(46, 125, 50, 0.08)' : b.status === 'In Progress' ? 'rgba(30, 74, 126, 0.08)' : 'rgba(193, 127, 25, 0.08)',
          serviceKey: b.serviceKey || 'car-wash',
          stepIndex: b.stepIndex !== undefined ? b.stepIndex : 0,
          notes: b.notes || '',
          photos: b.photos || [],
          staffAssigned: b.assignedStaffName || ''
        };
      });

      setBookings(mapped);
      setLoading(false);
    };

    if (!userEmail) {
      setBookings([]);
      setLoading(false);
      return undefined;
    }

    fetchMyBookings();
    const interval = setInterval(fetchMyBookings, 5000);

    const handleUpdate = () => fetchMyBookings();
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('tsl_booking_created', handleUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('tsl_booking_created', handleUpdate);
    };
  }, [userEmail]);

  return (
    <div className="bookings-page-container app-mobile-dashboard" style={{ marginTop: '-0.75rem' }}>

      <motion.div 
        style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {!loading && bookings.length === 0 && (
          <div className="section-card" style={{ padding: '2.5rem 1.75rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2.25rem', marginBottom: '0.75rem' }}>🧼</div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '0.4rem' }}>
              {isAuthenticated ? 'No Active Bookings Yet' : 'Sign in to see your bookings'}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              {isAuthenticated
                ? 'Book a Premium Wash or Detail — your orders will appear here with live progress tracking.'
                : 'Your bookings are tied to your account, so nothing is shown while you are browsing as a guest.'}
            </p>
            <button
              className="form-submit-btn"
              style={{ padding: '0.75rem 1.75rem', display: 'inline-flex' }}
              onClick={() => navigate(isAuthenticated ? '/car-wash' : '/login')}
            >
              {isAuthenticated ? 'Book Service' : 'Sign In'}
            </button>
          </div>
        )}

        {bookings.map((booking) => (
          <motion.div 
            key={booking.id} 
            variants={itemVariants}
            className="section-card cursor-pointer hover:border-amber-400 transition-all" 
            style={{ padding: '1.75rem', marginBottom: 0 }}
            onClick={() => setExpandedBookingId(expandedBookingId === booking.id ? null : booking.id)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-muted)' }}>
                  ID: {booking.id}
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '0.25rem' }}>{booking.service}</h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ 
                  fontSize: '0.75rem', 
                  fontWeight: 700, 
                  padding: '0.35rem 0.85rem', 
                  borderRadius: '9999px',
                  color: booking.statusColor,
                  backgroundColor: booking.statusBg
                }}>
                  {booking.status}
                </span>
                {expandedBookingId === booking.id ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="summary-label">Package:</span>
                <span className="summary-value">{booking.package}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="summary-label">Date:</span>
                <span className="summary-value">{booking.date}</span>
              </div>
              {shouldShowTimeSlot(booking) && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="summary-label">Time Slot:</span>
                  <span className="summary-value">{booking.time}</span>
                </div>
              )}
            </div>

            {/* Expanded Real-Time Progress Tracker Stepper */}
            {expandedBookingId === booking.id && (
              <div className="mt-5 pt-5 border-t border-gray-100 space-y-5 animate-fadeIn text-left" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] uppercase font-black tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                    Live Progress Status
                  </span>
                  {booking.staffAssigned && booking.staffAssigned !== 'Not Assigned' && (
                    <span className="text-[10px] text-gray-500 font-bold">
                      👤 Specialist: <strong className="text-gray-700">{booking.staffAssigned}</strong>
                    </span>
                  )}
                </div>

                {/* Progress Stepper Line & Nodes */}
                <div className="relative py-4 px-2 select-none">
                  {/* Connecting Line background */}
                  <div className="absolute top-1/2 left-4 right-4 h-1 bg-gray-200 -translate-y-1/2 rounded-full z-0" />
                  
                  {/* Active progress line fill */}
                  <div 
                    className="absolute top-1/2 left-4 h-1 bg-amber-500 -translate-y-1/2 rounded-full transition-all duration-500 z-0" 
                    style={{ 
                      width: `${(Math.min(booking.stepIndex || 0, getSteps(booking.serviceKey).length - 1) / (getSteps(booking.serviceKey).length - 1)) * 100}%`,
                      right: 'auto'
                    }}
                  />

                  {/* Stepper nodes */}
                  <div className="relative flex justify-between items-center z-10">
                    {getSteps(booking.serviceKey).map((stepLabel, idx) => {
                      const isCompleted = idx <= (booking.stepIndex || 0);
                      return (
                        <div key={idx} className="flex flex-col items-center">
                          {/* Circle Node */}
                          <div 
                            className={`w-7 h-7 rounded-full flex items-center justify-center border-2 font-bold text-xs shadow-xs transition-all duration-300 ${
                              isCompleted 
                                ? 'bg-amber-500 border-amber-500 text-white' 
                                : 'bg-white border-gray-300 text-gray-400'
                            }`}
                          >
                            {isCompleted ? '✓' : idx + 1}
                          </div>
                          {/* Step Label */}
                          <span 
                            className={`mt-2 text-[9px] font-black text-center max-w-[70px] leading-tight tracking-tighter ${
                              isCompleted ? 'text-amber-700' : 'text-gray-400'
                            }`}
                          >
                            {stepLabel}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Progress Notes */}
                {booking.notes && (
                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-[10px] text-gray-600 leading-relaxed italic">
                    📢 <strong>Specialist Notes:</strong> "{booking.notes}"
                  </div>
                )}

                {/* Progress Selfies / Photos */}
                {booking.photos && booking.photos.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-gray-800 uppercase tracking-wider block">Work In Progress Photos</span>
                    <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
                      {booking.photos.map((phUrl, pIdx) => (
                        <a href={phUrl} target="_blank" rel="noopener noreferrer" key={pIdx} className="flex-shrink-0">
                          <img 
                            src={phUrl} 
                            alt={`Progress photo ${pIdx + 1}`} 
                            className="w-20 h-20 object-cover rounded-xl border hover:opacity-90 transition-opacity" 
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        ))}
      </motion.div>

      <div style={{ textAlign: 'center', marginTop: 0 }}>
        <button 
          className="form-submit-btn" 
          onClick={() => navigate('/')}
          style={{ padding: '0.85rem 2rem', display: 'inline-flex' }}
        >
          Book Another Service
        </button>
      </div>
    </div>
  );
}
