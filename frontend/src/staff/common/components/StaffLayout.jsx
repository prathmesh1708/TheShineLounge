import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { StaffProvider } from '../context/StaffContext';
import StaffHeader from './StaffHeader';
import StaffBottomNav from './StaffBottomNav';
import CameraCapture from './CameraCapture';

function StaffLayoutInner() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/staff/login';

  if (isLoginPage) {
    return (
      <main className="min-h-screen bg-white max-w-md mx-auto relative shadow-2xl">
        <Outlet />
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-between items-center font-sans antialiased">
      {/* Mobile Device Viewport Frame */}
      <div className="w-full max-w-md bg-white min-h-screen flex flex-col shadow-2xl relative border-x border-gray-200">
        
        {/* Navy Blue Mobile Top Bar */}
        <StaffHeader />

        {/* Scrollable Page Body */}
        <main className="flex-1 pb-20 p-4 bg-white overflow-y-auto">
          <Outlet />
        </main>

        {/* Fixed 5-Tab Bottom Nav */}
        <StaffBottomNav />

        {/* Live Selfie Camera Modal */}
        <CameraCapture />
      </div>
    </div>
  );
}

export default function StaffLayout() {
  return (
    <StaffProvider>
      <StaffLayoutInner />
    </StaffProvider>
  );
}
