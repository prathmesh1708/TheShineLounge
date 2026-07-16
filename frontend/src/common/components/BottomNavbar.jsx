import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

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
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
      activeCheck: () => path === '/'
    },
    { 
      id: 'cafe', 
      label: 'Café', 
      path: '/cafe', 
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
          <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
          <line x1="6" y1="2" x2="6" y2="4" />
          <line x1="10" y1="2" x2="10" y2="4" />
          <line x1="14" y1="2" x2="14" y2="4" />
        </svg>
      ),
      activeCheck: () => path === '/cafe' || path === '/drive-through-cafe'
    },
    { 
      id: 'wash', 
      label: 'Wash', 
      path: '/car-wash', 
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
          <circle cx="7" cy="17" r="2" />
          <circle cx="17" cy="17" r="2" />
        </svg>
      ),
      activeCheck: () => path === '/car-wash' || path === '/car-detailing'
    },
    { 
      id: 'dog', 
      label: 'Dog Wash', 
      path: '/dog-wash', 
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 18 18c0-2.2-1.8-4-4-4" />
          <path d="M12 5c0-1.5 1.5-3 3.5-3s3.5 1.5 3.5 3c0 2-2 4-3.5 5" />
        </svg>
      ),
      activeCheck: () => path === '/dog-wash'
    },
    { 
      id: 'salon', 
      label: 'Salon', 
      path: '/salon', 
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="6" cy="6" r="3" />
          <circle cx="6" cy="18" r="3" />
          <line x1="9.8" y1="8.2" x2="20" y2="17" />
          <line x1="9.8" y1="15.8" x2="20" y2="7" />
        </svg>
      ),
      activeCheck: () => path === '/salon'
    }
  ];

  return (
    <div className="bottom-navbar">
      <div className="bottom-navbar-container">
        {tabs.map((tab) => {
          const isActive = tab.activeCheck();
          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              className={`bottom-nav-tab ${isActive ? 'active' : ''}`}
            >
              <div className="bottom-nav-icon">{tab.icon}</div>
              <span className="bottom-nav-label">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
