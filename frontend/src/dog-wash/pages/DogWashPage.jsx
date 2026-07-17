import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import DogWashNavbar from '../components/dogWashNavbar';

// Sub Pages
import DogWashHomePage from './dogWashHomePage';
import DogWashServicesPage from './dogWashServicesPage';
import DogWashServiceDetailsPage from './dogWashServiceDetailsPage';
import DogWashBookingPage from './dogWashBookingPage';
import DogWashSuccessPage from './dogWashSuccessPage';
import DogWashMyBookingsPage from './dogWashMyBookingsPage';
import DogWashTrackingPage from './dogWashTrackingPage';
import DogWashOffersPage from './dogWashOffersPage';
import DogWashProfilePage from './dogWashProfilePage';
import DogWashSettingsPage from './dogWashSettingsPage';
import DogWashPackagesPage from './dogWashPackagesPage';

export default function DogWashPage() {
  // Dynamically hide the global platform footer when inside the dog wash portal
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
    <div className="bg-transparent min-h-screen text-zinc-800 flex flex-col justify-between selection:bg-grooming-primary selection:text-white dog-wash-portal">
      {/* Friendly Brand Header */}
      <DogWashNavbar />

      {/* Main Content Area */}
      <main className="flex-grow w-full py-4 space-y-12">
        <Routes>
          <Route path="/" element={<DogWashHomePage />} />
          <Route path="/services" element={<DogWashServicesPage />} />
          <Route path="/service/:id" element={<DogWashServiceDetailsPage />} />
          <Route path="/packages" element={<DogWashPackagesPage />} />
          <Route path="/booking" element={<DogWashBookingPage />} />
          <Route path="/success" element={<DogWashSuccessPage />} />
          <Route path="/my-bookings" element={<DogWashMyBookingsPage />} />
          <Route path="/tracking" element={<DogWashTrackingPage />} />
          <Route path="/offers" element={<DogWashOffersPage />} />
          <Route path="/profile" element={<DogWashProfilePage />} />
          <Route path="/settings" element={<DogWashSettingsPage />} />
        </Routes>
      </main>
    </div>
  );
}
