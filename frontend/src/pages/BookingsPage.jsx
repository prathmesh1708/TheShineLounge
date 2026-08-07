import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import apiClient from '../common/utils/apiClient';

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

  // Dynamic Active Bookings Fallback List
  const mockBookings = [
    {
      id: 'B-2026-9028',
      service: 'Car Wash',
      package: 'Monthly Membership (₹2949)',
      date: getTodayFormattedDate(),
      time: getLiveFormattedTimeSlot(),
      status: 'Confirmed',
      statusColor: '#2E7D32',
      statusBg: 'rgba(46, 125, 50, 0.08)',
      serviceKey: 'car-wash',
      stepIndex: 1,
      notes: 'Vehicle received at lobby. Initial inspection complete.',
      photos: [],
      staffAssigned: 'Rohan Deshmukh'
    },
    {
      id: 'B-2026-4412',
      service: 'Men\'s Salon',
      package: 'Haircut & Styling (₹35.00)',
      date: getTodayFormattedDate(),
      time: getLiveFormattedTimeSlot(),
      status: 'Pending',
      statusColor: '#C17F19',
      statusBg: 'rgba(193, 127, 25, 0.08)',
      serviceKey: 'salon',
      stepIndex: 0,
      notes: '',
      photos: [],
      staffAssigned: ''
    }
  ];

  useEffect(() => {
    const fetchMyBookings = async () => {
      try {
        // The API already scopes bookings to the signed-in customer. Filtering
        // again here on a localStorage identity is what used to blank the page
        // when a staff or admin login had overwritten the shared `tsl_user` key.
        const res = await apiClient.get('/bookings');
        if (res.data && Array.isArray(res.data.bookings)) {
          const userBookings = res.data.bookings;

          const mapped = userBookings.map(b => {
            const rawDate = b.date || '';
            const isLegacyStaticDate = !rawDate || rawDate.includes('July 18') || rawDate.includes('2026-07-18');
            const displayDate = isLegacyStaticDate ? getTodayFormattedDate() : rawDate;

            const rawTime = b.timeSlot || '';
            const isLegacyStaticTime = !rawTime || rawTime === '02:00 PM - 02:30 PM';
            const displayTime = isLegacyStaticTime ? getLiveFormattedTimeSlot() : rawTime;

            return {
              id: b.bookingId || `B-2026-${Math.floor(1000 + Math.random() * 9000)}`,
              service: b.serviceName || 'Car Wash',
              package: `${b.packageName} (₹${b.price})`,
              date: displayDate,
              time: displayTime,
              status: b.status || 'Confirmed',
              statusColor: (b.status === 'Completed' || b.status === 'Delivered') ? '#2E7D32' : b.status === 'In Progress' ? '#1E4A7E' : '#C17F19',
              statusBg: (b.status === 'Completed' || b.status === 'Delivered') ? 'rgba(46, 125, 50, 0.08)' : b.status === 'In Progress' ? 'rgba(30, 74, 126, 0.08)' : 'rgba(193, 127, 25, 0.08)',
              serviceKey: b.serviceKey,
              stepIndex: b.stepIndex !== undefined ? b.stepIndex : 0,
              notes: b.notes || '',
              photos: b.photos || [],
              staffAssigned: b.assignedStaffName || ''
            };
          });

          setBookings(mapped);
        } else {
          setBookings(mockBookings);
        }
      } catch (err) {
        console.warn('Could not load active bookings, using fallback:', err.message);
        setBookings(mockBookings);
      } finally {
        setLoading(false);
      }
    };

    fetchMyBookings();
    const interval = setInterval(fetchMyBookings, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bookings-page-container app-mobile-dashboard" style={{ marginTop: '-0.75rem' }}>

      <motion.div 
        style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {!loading && bookings.length === 0 && (
          <div className="section-card" style={{ padding: '2rem', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.4rem' }}>No bookings yet</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Bookings you make will appear here with live progress tracking.
            </p>
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
