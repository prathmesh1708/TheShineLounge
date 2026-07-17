import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import SalonNavbar from '../components/salonNavbar';

// Sub Pages
import SalonHomePage from './salonHomePage';
import SalonServicesPage from './salonServicesPage';
import SalonServiceDetailsPage from './salonServiceDetailsPage';
import SalonStylistProfilePage from './salonStylistProfilePage';
import SalonBookingPage from './salonBookingPage';
import SalonSuccessPage from './salonSuccessPage';
import SalonMyBookingsPage from './salonMyBookingsPage';
import SalonOffersPage from './salonOffersPage';
import SalonReviewsPage from './salonReviewsPage';
import SalonProfilePage from './salonProfilePage';
import SalonSettingsPage from './salonSettingsPage';

export default function SalonPage() {
  // Dynamically hide the global footer inside the salon portal
  useEffect(() => {
    const globalFooter = document.querySelector('.footer');
    if (globalFooter) {
      globalFooter.style.display = 'none';
    }
    return () => {
      if (globalFooter) {
        globalFooter.style.display = 'block';
      }
    };
  }, []);

  return (
    <div className="bg-transparent min-h-screen text-zinc-800 flex flex-col justify-between selection:bg-primary selection:text-white salon-portal">
      {/* Brand Header */}
      <SalonNavbar />

      {/* Nested Route Outlets */}
      <main className="flex-grow w-full py-4 space-y-12">
        <Routes>
          <Route path="/" element={<SalonHomePage />} />
          <Route path="/services" element={<SalonServicesPage />} />
          <Route path="/service/:id" element={<SalonServiceDetailsPage />} />
          <Route path="/stylist/:id" element={<SalonStylistProfilePage />} />
          <Route path="/booking" element={<SalonBookingPage />} />
          <Route path="/success" element={<SalonSuccessPage />} />
          <Route path="/my-bookings" element={<SalonMyBookingsPage />} />
          <Route path="/offers" element={<SalonOffersPage />} />
          <Route path="/reviews" element={<SalonReviewsPage />} />
          <Route path="/profile" element={<SalonProfilePage />} />
          <Route path="/settings" element={<SalonSettingsPage />} />
        </Routes>
      </main>
    </div>
  );
}
