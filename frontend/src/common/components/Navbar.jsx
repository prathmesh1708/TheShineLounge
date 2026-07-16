import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import TSLLogo from './TSLLogo';
import { servicesData } from '../data/servicesData';

export default function Navbar() {
  const location = useLocation();
  const path = location.pathname.substring(1); // Get service ID from path
  
  const currentService = servicesData[path];
  const isService = !!currentService;
  const accentColor = currentService?.accentColor || '#3bcfc6';

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="logo-link">
          <div className="logo-badge">
            <TSLLogo accentColor={accentColor} isService={isService} />
          </div>
          <span className="logo-text">THE SHINE LOUNGE</span>
        </Link>
        
        {isService && (
          <Link to="/" className="nav-home-btn">
            ← Services
          </Link>
        )}
      </div>
    </nav>
  );
}
