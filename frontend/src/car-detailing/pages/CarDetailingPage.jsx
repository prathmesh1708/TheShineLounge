import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import CarDetailingNavbar from '../components/carDetailingNavbar';

// Sub Pages
import CarDetailingHomePage from './carDetailingHomePage';
import CarDetailingServicesPage from './carDetailingServicesPage';
import CarDetailingServiceDetailsPage from './carDetailingServiceDetailsPage';
import CarDetailingPackagesPage from './carDetailingPackagesPage';
import CarDetailingBookingPage from './carDetailingBookingPage';
import CarDetailingSuccessPage from './carDetailingSuccessPage';
import CarDetailingMyBookingsPage from './carDetailingMyBookingsPage';
import CarDetailingTrackingPage from './carDetailingTrackingPage';
import CarDetailingOffersPage from './carDetailingOffersPage';
import CarDetailingReviewsPage from './carDetailingReviewsPage';
import CarDetailingAboutPage from './carDetailingAboutPage';
import CarDetailingContactPage from './carDetailingContactPage';
import CarDetailingProfilePage from './carDetailingProfilePage';
import CarDetailingSettingsPage from './carDetailingSettingsPage';

export default function CarDetailingPage() {
  // Dynamically hide the global platform footer when inside the detailing portal
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
    <div className="bg-transparent min-h-screen text-zinc-800 flex flex-col justify-between selection:bg-luxury-emerald selection:text-white car-detailing-portal">
      {/* DetailPro Specific Header */}
      <CarDetailingNavbar />

      {/* Main Content Area */}
      <main className="flex-grow w-full py-4 space-y-12">
        <Routes>
          <Route path="/" element={<CarDetailingHomePage />} />
          <Route path="/services" element={<CarDetailingServicesPage />} />
          <Route path="/service/:id" element={<CarDetailingServiceDetailsPage />} />
          <Route path="/packages" element={<CarDetailingPackagesPage />} />
          <Route path="/booking" element={<CarDetailingBookingPage />} />
          <Route path="/success" element={<CarDetailingSuccessPage />} />
          <Route path="/my-bookings" element={<CarDetailingMyBookingsPage />} />
          <Route path="/tracking" element={<CarDetailingTrackingPage />} />
          <Route path="/offers" element={<CarDetailingOffersPage />} />
          <Route path="/reviews" element={<CarDetailingReviewsPage />} />
          <Route path="/about" element={<CarDetailingAboutPage />} />
          <Route path="/contact" element={<CarDetailingContactPage />} />
          <Route path="/profile" element={<CarDetailingProfilePage />} />
          <Route path="/settings" element={<CarDetailingSettingsPage />} />
        </Routes>
      </main>
    </div>
  );
}
