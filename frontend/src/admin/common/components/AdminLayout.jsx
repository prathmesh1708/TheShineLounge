import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { AdminProvider } from '../context/AdminContext';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import ServiceModulePage from '../../pages/ServiceModulePage';
import TSLLogo from '../../../common/components/TSLLogo';

// 12 Page Imports
import AdminDashboardPage from '../../pages/AdminDashboardPage';
import ManageServicesPage from '../../pages/ManageServicesPage';
import ManageBannersPage from '../../pages/ManageBannersPage';
import ManageNotificationsPage from '../../pages/ManageNotificationsPage';
import AdminFeedbackPage from '../../pages/AdminFeedbackPage';
import ManageMembershipsPage from '../../pages/ManageMembershipsPage';
import ManageBookingsPage from '../../pages/ManageBookingsPage';
import ManageStaffPage from '../../pages/ManageStaffPage';
import CustomerDatabasePage from '../../pages/CustomerDatabasePage';
import InventoryManagementPage from '../../pages/InventoryManagementPage';
import RevenueReportsPage from '../../pages/RevenueReportsPage';
import OffersCouponsPage from '../../pages/OffersCouponsPage';
import AdminSettingsPage from '../../pages/AdminSettingsPage';
import ManageOfflineSalesPage from '../../pages/ManageOfflineSalesPage';

export default function AdminLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <AdminProvider>
      <div className="min-h-screen bg-white text-gray-900 font-sans antialiased">
        {/* Mobile Header Bar (< lg) */}
        <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-[#1e4a7e] text-white shadow-md">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-1.5 -ml-1.5 rounded-xl text-blue-100 hover:text-white hover:bg-blue-800/80 transition-colors"
              title="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <TSLLogo className="w-7 h-7" />
              <div>
                <h1 className="font-extrabold text-xs tracking-wider uppercase leading-none">THE SHINE LOUNGE</h1>
                <span className="text-[9px] text-amber-400 font-bold tracking-wide">ADMIN PORTAL</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Admin
            </span>
          </div>
        </header>

        {/* Responsive Admin Sidebar (Drawer on mobile, fixed column on desktop) */}
        <AdminSidebar
          isCollapsed={isSidebarCollapsed}
          toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          mobileOpen={isMobileSidebarOpen}
          closeMobileSidebar={() => setIsMobileSidebarOpen(false)}
        />

        {/* Dynamic Admin Main Content Area */}
        <main
          className={`transition-all duration-300 p-3 sm:p-6 pb-12 min-h-screen bg-gray-50/50 ${
            isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
          } ml-0`}
        >
          <Routes>
            {/* Global Dashboard */}
            <Route index element={<AdminDashboardPage />} />
            <Route path="dashboard" element={<AdminDashboardPage />} />

            {/* Dedicated Service Modules (Car Wash, Car Detailing, Dog Wash, Cafe, Drive-Thru, Salon) */}
            <Route path="car-wash" element={<ServiceModulePage />} />
            <Route path="car-detailing" element={<ServiceModulePage />} />
            <Route path="dog-wash" element={<ServiceModulePage />} />
            <Route path="cafe" element={<ServiceModulePage />} />
            <Route path="drive-through-cafe" element={<ServiceModulePage />} />
            <Route path="salon" element={<ServiceModulePage />} />

            {/* Global Operations */}
            <Route path="services" element={<ManageServicesPage />} />
            <Route path="banners" element={<ManageBannersPage />} />
            <Route path="notifications" element={<ManageNotificationsPage />} />
            <Route path="feedback" element={<AdminFeedbackPage />} />
            <Route path="memberships" element={<ManageMembershipsPage />} />
            <Route path="bookings" element={<ManageBookingsPage />} />
            <Route path="offline-sales" element={<ManageOfflineSalesPage />} />
            <Route path="staff" element={<ManageStaffPage />} />
            <Route path="customers" element={<CustomerDatabasePage />} />
            <Route path="inventory" element={<InventoryManagementPage />} />
            <Route path="reports" element={<RevenueReportsPage />} />
            <Route path="coupons" element={<OffersCouponsPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </main>
      </div>
    </AdminProvider>
  );
}

