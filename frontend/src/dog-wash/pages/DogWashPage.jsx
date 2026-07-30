import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import DogWashHomePage from './dogWashHomePage';
import DogWashConfirmPage from './DogWashConfirmPage';
import DogWashMyBookingsPage from './dogWashMyBookingsPage';

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
    <div className="dog-wash-portal">
      <main className="w-full">
        <Routes>
          <Route path="/" element={<DogWashHomePage />} />
          <Route path="/confirm" element={<DogWashConfirmPage />} />
          <Route path="/my-bookings" element={<DogWashMyBookingsPage />} />
          <Route path="*" element={<Navigate to="/dog-wash" replace />} />
        </Routes>
      </main>
    </div>
  );
}
