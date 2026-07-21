import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Home, ClipboardList, Camera, Calendar, User } from 'lucide-react';
import { useStaff } from '../context/StaffContext';

export default function StaffBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setIsCameraOpen, setCameraPurpose } = useStaff();

  const navItems = [
    { label: 'Home', path: '/staff/dashboard', icon: Home },
    { label: 'Jobs', path: '/staff/bookings', icon: ClipboardList },
    { id: 'camera', label: 'Camera', icon: Camera, isCenter: true },
    { label: 'Schedule', path: '/staff/schedule', icon: Calendar },
    { label: 'Profile', path: '/staff/profile', icon: User }
  ];

  const handleCenterClick = () => {
    setCameraPurpose('check-in');
    setIsCameraOpen(true);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 h-16 bg-white border-t border-gray-200 px-2 flex items-center justify-around max-w-md mx-auto shadow-lg">
      {navItems.map((item) => {
        if (item.isCenter) {
          return (
            <button
              key="center-camera"
              onClick={handleCenterClick}
              className="relative -top-4 w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white transition-transform active:scale-95"
              style={{ backgroundColor: '#e07b2a' }}
              title="Selfie Camera Check-In"
            >
              <Camera className="w-6 h-6" />
            </button>
          );
        }

        const Icon = item.icon;
        const isActive = location.pathname === item.path || (item.path === '/staff/dashboard' && location.pathname === '/staff');

        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center justify-center w-14 h-12 rounded-xl transition-all ${
              isActive ? 'font-extrabold' : 'text-gray-400 hover:text-gray-600'
            }`}
            style={isActive ? { color: '#e07b2a' } : {}}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className="text-[10px] mt-0.5">{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
