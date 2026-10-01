import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ClipboardList, Camera, User } from 'lucide-react';
import { useStaff } from '../context/StaffContext';

export default function StaffBottomNav() {
  const location = useLocation();
  const { setIsCameraOpen, setCameraPurpose } = useStaff();

  const handleCenterClick = () => {
    setCameraPurpose('check-in');
    setIsCameraOpen(true);
  };

  const isJobsActive =
    location.pathname === '/staff/dashboard' ||
    location.pathname === '/staff' ||
    location.pathname === '/staff/' ||
    location.pathname === '/staff/bookings';

  const isProfileActive = location.pathname === '/staff/profile';

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 h-16 bg-white border-t border-gray-200 px-6 flex items-center justify-around max-w-md mx-auto shadow-lg">
      {/* Jobs */}
      <NavLink
        to="/staff/dashboard"
        className={`flex flex-col items-center justify-center flex-1 h-12 rounded-xl transition-all ${
          isJobsActive ? 'font-extrabold' : 'text-gray-400 hover:text-gray-600'
        }`}
        style={isJobsActive ? { color: '#e07b2a' } : {}}
      >
        <ClipboardList className={`w-5 h-5 ${isJobsActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
        <span className="text-[10px] mt-0.5">Jobs</span>
      </NavLink>

      {/* Center Camera Button */}
      <div className="flex-1 flex justify-center">
        <button
          key="center-camera"
          onClick={handleCenterClick}
          className="relative -top-4 w-12 h-12 flex-shrink-0 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white transition-transform active:scale-95 cursor-pointer"
          style={{ backgroundColor: '#e07b2a' }}
          title="Selfie Camera Check-In"
        >
          <Camera className="w-6 h-6" />
        </button>
      </div>

      {/* Profile */}
      <NavLink
        to="/staff/profile"
        className={`flex flex-col items-center justify-center flex-1 h-12 rounded-xl transition-all ${
          isProfileActive ? 'font-extrabold' : 'text-gray-400 hover:text-gray-600'
        }`}
        style={isProfileActive ? { color: '#e07b2a' } : {}}
      >
        <User className={`w-5 h-5 ${isProfileActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
        <span className="text-[10px] mt-0.5">Profile</span>
      </NavLink>
    </nav>
  );
}


