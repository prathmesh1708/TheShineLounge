import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminProvider } from '../context/AdminContext';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import ServiceModulePage from '../../pages/ServiceModulePage';

// 12 Page Imports
import AdminDashboardPage from '../../pages/AdminDashboardPage';
import ManageServicesPage from '../../pages/ManageServicesPage';
import ManageBannersPage from '../../pages/ManageBannersPage';
import ManageNotificationsPage from '../../pages/ManageNotificationsPage';
import ManageMembershipsPage from '../../pages/ManageMembershipsPage';
import ManageBookingsPage from '../../pages/ManageBookingsPage';
import ManageStaffPage from '../../pages/ManageStaffPage';
import CustomerDatabasePage from '../../pages/CustomerDatabasePage';
import InventoryManagementPage from '../../pages/InventoryManagementPage';
import RevenueReportsPage from '../../pages/RevenueReportsPage';
import OffersCouponsPage from '../../pages/OffersCouponsPage';
import AdminSettingsPage from '../../pages/AdminSettingsPage';

export default function AdminLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <AdminProvider>
      <div className="min-h-screen bg-white text-gray-900 font-sans antialiased">
        {/* Fixed Left Admin Sidebar */}
        <AdminSidebar
          isCollapsed={isSidebarCollapsed}
          toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        {/* Dynamic Admin Main Content Area */}
        <main
          className={`transition-all duration-300 pt-6 px-6 pb-12 min-h-screen bg-gray-50/50 ${
            isSidebarCollapsed ? 'ml-20' : 'ml-64'
          }`}
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
            <Route path="memberships" element={<ManageMembershipsPage />} />
            <Route path="bookings" element={<ManageBookingsPage />} />
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
