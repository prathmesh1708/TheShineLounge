import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Search,
  Bell,
  Building2,
  Plus,
  ExternalLink,
  ChevronDown,
  CheckCircle2,
  Calendar,
  Sparkles
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';

export default function AdminHeader({ isSidebarCollapsed }) {
  const location = useLocation();
  const { notifications, stats } = useAdmin();
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState('Mumbai Main Branch (Lower Parel)');

  // Module Name lookup
  const getPageTitle = (path) => {
    if (path === '/admin' || path === '/admin/dashboard') return 'Global Dashboard Overview';
    if (path === '/admin/car-wash') return 'Car Wash Dedicated Module';
    if (path === '/admin/car-detailing') return 'Car Detailing Dedicated Module';
    if (path === '/admin/dog-wash') return 'Dog Wash Dedicated Module';
    if (path === '/admin/cafe') return 'Café Dedicated Module';
    if (path === '/admin/drive-through-cafe') return 'Drive-Through Café Module';
    if (path === '/admin/salon') return 'Men\'s Salon Dedicated Module';
    if (path.startsWith('/admin/services')) return 'Service Management & Pricing';
    if (path.startsWith('/admin/banners')) return 'Promotional Banners';
    if (path.startsWith('/admin/notifications')) return 'Notification Broadcasts';
    if (path.startsWith('/admin/memberships')) return 'Membership Subscriptions';
    if (path.startsWith('/admin/bookings')) return 'Unified Booking Management';
    if (path.startsWith('/admin/staff')) return 'Staff & Employee Operations';
    if (path.startsWith('/admin/customers')) return 'Customer CRM Database';
    if (path.startsWith('/admin/inventory')) return 'Inventory & Stock Control';
    if (path.startsWith('/admin/reports')) return 'Revenue & Financial Reports';
    if (path.startsWith('/admin/coupons')) return 'Offers & Promo Codes';
    if (path.startsWith('/admin/settings')) return 'Business & System Settings';
    return 'Admin Panel';
  };

  const branches = [
    'Mumbai Main Branch (Lower Parel)',
    'Bandra West Lounge Branch',
    'Thane Service Hub',
    'Navi Mumbai Express Branch'
  ];

  return (
    <header
      className={`fixed top-0 right-0 z-30 h-16 bg-white border-b border-gray-200 transition-all duration-300 flex items-center justify-between px-6 ${
        isSidebarCollapsed ? 'left-20' : 'left-64'
      }`}
    >
      {/* Page Title & Breadcrumb */}
      <div className="flex items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
            <span>Admin</span>
            <span>/</span>
            <span className="text-gray-700">{getPageTitle(location.pathname)}</span>
          </div>
          <h2 className="text-lg font-bold text-gray-900 leading-tight">
            {getPageTitle(location.pathname)}
          </h2>
        </div>
      </div>

      {/* Center Search Bar */}
      <div className="hidden md:flex items-center relative w-72 lg:w-96">
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5" />
        <input
          type="text"
          placeholder="Search bookings, customers, services, staff..."
          className="w-full pl-10 pr-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
        />
      </div>

      {/* Right Actions & Utilities */}
      <div className="flex items-center gap-3">
        {/* Branch Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowBranchDropdown(!showBranchDropdown)}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <Building2 className="w-4 h-4 text-amber-500" />
            <span className="max-w-[160px] truncate">{selectedBranch}</span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>

          {showBranchDropdown && (
            <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-50">
              <div className="px-3 py-2 border-b border-gray-100 font-bold text-xs text-gray-500 uppercase tracking-wider">
                Select Branch
              </div>
              {branches.map((b) => (
                <button
                  key={b}
                  onClick={() => {
                    setSelectedBranch(b);
                    setShowBranchDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs font-medium hover:bg-amber-50 flex items-center justify-between ${
                    selectedBranch === b ? 'text-amber-600 font-bold bg-amber-50/50' : 'text-gray-700'
                  }`}
                >
                  <span className="truncate">{b}</span>
                  {selectedBranch === b && <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />}
                </button>
              ))}
            </div>
          )}
        </div>


        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
            className="p-2 text-gray-600 hover:text-gray-900 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors relative"
          >
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-white" />
          </button>

          {showNotifDropdown && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-xl py-2 z-50">
              <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
                <span className="font-bold text-xs text-gray-900">Notifications</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                  {stats.pendingBookings} Pending
                </span>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-gray-50">
                {notifications.map((n) => (
                  <div key={n.id} className="p-3 hover:bg-gray-50 transition-colors">
                    <p className="text-xs font-bold text-gray-900">{n.title}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                    <span className="text-[10px] text-gray-400 mt-1 block">{n.sentAt}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick New Booking CTA */}
        <Link
          to="/admin/bookings"
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white rounded-xl shadow-sm hover:opacity-95 transition-opacity"
          style={{ backgroundColor: '#e07b2a' }}
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Booking</span>
        </Link>
      </div>
    </header>
  );
}
