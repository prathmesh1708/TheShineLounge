import React, { useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import gsap from 'gsap';

// Common Components & Layout
import Navbar from './common/components/Navbar';
import BottomNavbar from './common/components/BottomNavbar';

// Pages
import Home from './pages/Home';
import CafePage from './cafe/pages/CafePage';
import DriveThroughCafePage from './drive-through-cafe/pages/DriveThroughCafePage';
import CarWashPage from './car-wash/pages/CarWashPage';
import CarDetailingPage from './car-detailing/pages/CarDetailingPage';
import DogWashPage from './dog-wash/pages/DogWashPage';
import SalonPage from './salon/pages/SalonPage';
import SearchPage from './pages/SearchPage';
import BookingsPage from './pages/BookingsPage';
import ProfilePage from './pages/ProfilePage';

// Simple Page transition wrapper
function PageTransition({ children }) {
  const containerRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // Animate entering view
    gsap.fromTo(
      containerRef.current,
      { opacity: 0, y: 15 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
    );
  }, [location.pathname]);

  return <div ref={containerRef}>{children}</div>;
}

export default function App() {
  return (
    <Router>
      <div className="app-container">
        <Navbar />
        
        <main className="main-content">
          <PageTransition>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/cafe" element={<CafePage />} />
              <Route path="/drive-through-cafe" element={<DriveThroughCafePage />} />
              <Route path="/car-wash" element={<CarWashPage />} />
              <Route path="/car-detailing" element={<CarDetailingPage />} />
              <Route path="/dog-wash" element={<DogWashPage />} />
              <Route path="/salon" element={<SalonPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/bookings" element={<BookingsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Routes>
          </PageTransition>
        </main>


        <footer className="footer">
          <p className="footer-text">
            &copy; {new Date().getFullYear()} The Shine Lounge. All rights reserved. Premium multi-service booking platform.
          </p>
        </footer>

        <BottomNavbar />
      </div>
    </Router>
  );
}

