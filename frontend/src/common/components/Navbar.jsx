import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import TSLLogo from './TSLLogo';
import { servicesData } from '../data/servicesData';

export default function Navbar() {
  const location = useLocation();
  const path = location.pathname.substring(1); // Get service ID from path
  
  const currentService = servicesData[path];
  const isService = !!currentService;
  const accentColor = currentService?.accentColor || '#D49A7F';

  return (
    <nav className="navbar">
      <div className="navbar-container">
        
        {/* Left Side: Logo Link */}
        <Link to="/" className="logo-link">
          <div className="logo-badge">
            <TSLLogo accentColor={accentColor} isService={isService} />
          </div>
          <span className="logo-text">THE SHINE LOUNGE</span>
        </Link>
        
        {/* Right Side: Profile & Notification Actions */}
        <div className="navbar-right-actions">
          {/* Notification Bell */}
          <button 
            className="navbar-action-btn"
            onClick={() => alert('No new notifications')}
            aria-label="Notifications"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
          </button>
          
          {/* Profile Icon */}
          <Link 
            to="/profile" 
            className="navbar-action-btn"
            aria-label="Profile"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </Link>
        </div>

      </div>
    </nav>
  );
}
