import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, ClipboardList, Camera, Calendar, User, Users, ShieldCheck, Receipt } from 'lucide-react';
import { useStaff } from '../context/StaffContext';
import { useAuth } from '../../../common/context/AuthContext';
import { STAFF_ROUTE_PERMISSIONS } from '../../../common/utils/staffPermissions';
import { isCarWashStaff } from '../utils/staffMembershipUtils';

// More than this many links (besides the camera) no longer fit a phone width.
const MAX_LINKS = 6;

export default function StaffBottomNav() {
  const location = useLocation();
  const { setIsCameraOpen, setCameraPurpose, currentStaff } = useStaff();
  const { canAccess } = useAuth();

  // Tabs follow the modules the admin assigned in Manage Staff. Home, the
  // camera and Profile are always there.
  const moduleItems = [
    { label: 'Jobs', path: '/staff/bookings', icon: ClipboardList, permission: STAFF_ROUTE_PERMISSIONS.bookings },
    { label: 'Customers', path: '/staff/customers', icon: Users, permission: STAFF_ROUTE_PERMISSIONS.customers },
    // Membership passes are a Car Wash product; the page refuses other departments.
    { label: 'Passes', path: '/staff/memberships', icon: ShieldCheck, permission: STAFF_ROUTE_PERMISSIONS.memberships, show: isCarWashStaff(currentStaff) },
    { label: 'Billing', path: '/staff/invoicing', icon: Receipt, permission: STAFF_ROUTE_PERMISSIONS.invoicing }
  ].filter((item) => item.show !== false && canAccess(item.permission));

  const links = [
    { label: 'Home', path: '/staff/dashboard', icon: Home },
    ...moduleItems,
    { label: 'Profile', path: '/staff/profile', icon: User }
  ];
  // Schedule takes a slot only when there is room.
  if (links.length < MAX_LINKS) {
    links.splice(links.length - 1, 0, { label: 'Schedule', path: '/staff/schedule', icon: Calendar });
  }

  // Camera sits in the middle of the bar.
  const centerAt = Math.ceil(links.length / 2);
  const navItems = [...links.slice(0, centerAt), { id: 'camera', isCenter: true }, ...links.slice(centerAt)];

  const handleCenterClick = () => {
    setCameraPurpose('check-in');
    setIsCameraOpen(true);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 h-16 bg-white border-t border-gray-200 px-1 flex items-center justify-around max-w-md mx-auto shadow-lg">
      {navItems.map((item) => {
        if (item.isCenter) {
          return (
            <button
              key="center-camera"
              onClick={handleCenterClick}
              className="relative -top-4 w-12 h-12 flex-shrink-0 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white transition-transform active:scale-95"
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
            className={`flex flex-col items-center justify-center flex-1 min-w-0 h-12 rounded-xl transition-all ${
              isActive ? 'font-extrabold' : 'text-gray-400 hover:text-gray-600'
            }`}
            style={isActive ? { color: '#e07b2a' } : {}}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className="text-[10px] mt-0.5 truncate max-w-full">{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
