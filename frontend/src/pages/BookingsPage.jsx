import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function BookingsPage() {
  const navigate = useNavigate();

  // Mock Active Bookings List
  const mockBookings = [
    {
      id: 'B-2026-9028',
      service: 'Car Wash',
      package: 'Executive Wash ($18.00)',
      date: 'July 18, 2026',
      time: '02:00 PM - 02:30 PM',
      status: 'Confirmed',
      statusColor: '#2E7D32',
      statusBg: 'rgba(46, 125, 50, 0.08)'
    },
    {
      id: 'B-2026-4412',
      service: 'Men\'s Salon',
      package: 'Haircut & Styling ($35.00)',
      date: 'July 18, 2026',
      time: '03:30 PM - 04:00 PM',
      status: 'Pending',
      statusColor: '#C17F19',
      statusBg: 'rgba(193, 127, 25, 0.08)'
    }
  ];

  return (
    <div className="bookings-page-container app-mobile-dashboard">
      <div className="greeting-text-block">
        <h1 className="greeting-title">My Bookings</h1>
        <p className="greeting-subtitle">Track your active lounge sessions and reservations</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1rem' }}>
        {mockBookings.map((booking) => (
          <div key={booking.id} className="section-card" style={{ padding: '1.75rem', marginBottom: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-muted)' }}>
                  ID: {booking.id}
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '0.25rem' }}>{booking.service}</h3>
              </div>
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
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="summary-label">Time Slot:</span>
                <span className="summary-value">{booking.time}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
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
