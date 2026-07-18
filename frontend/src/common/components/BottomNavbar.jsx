import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function BottomNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;

  const tabs = [
    { 
      id: 'home', 
      label: 'Home', 
      path: '/', 
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
      activeCheck: () => path === '/' || (path.startsWith('/car-detailing') && path !== '/car-detailing/booking') || (path.startsWith('/dog-wash') && path !== '/dog-wash/booking')
    },
    { 
      id: 'explore', 
      label: 'Explore', 
      path: '/cafe', 
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 8.88 9.88 16.24 7.76" />
        </svg>
      ),
      activeCheck: () => path === '/cafe' || path === '/drive-through-cafe'
    },
    { 
      id: 'search', 
      label: 'Search', 
      path: '/search', 
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      ),
      activeCheck: () => path === '/search'
    },
    { 
      id: 'booking', 
      label: 'Booking', 
      path: '/bookings', 
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
      activeCheck: () => path === '/bookings' || path === '/car-wash' || path === '/car-detailing/booking' || path === '/dog-wash/booking' || path === '/salon'
    },
    { 
      id: 'profile', 
      label: 'Profile', 
      path: '/profile', 
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
      activeCheck: () => path === '/profile'
    }
  ];

  return (
    <div className="floating-nav-container">
      {tabs.map((tab) => {
        const isActive = tab.activeCheck();
        return (
          <button
            key={tab.id}
            onClick={() => navigate(tab.path)}
            className={`nav-item ${isActive ? 'active' : ''}`}
          >
            {isActive && (
              <motion.div 
                layoutId="activeGlowPill"
                className="active-glow-pill"
                transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              />
            )}
            <div className="nav-content">
              <div className="bottom-nav-icon">{tab.icon}</div>
              <span className="bottom-nav-label">{tab.label}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
