import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { ThemeProvider } from './common/context/ThemeContext';
import { AuthProvider } from './common/context/AuthContext';
import { NotificationProvider } from './common/context/NotificationContext';
import { AdminRoute, StaffRoute } from './common/components/ProtectedRoute';
import { initializePushNotifications, setupForegroundNotificationHandler } from './common/services/pushNotificationService';

// Common Components & Layout
import Navbar from './common/components/Navbar';
import BottomNavbar from './common/components/BottomNavbar';

// Admin Panel Layout & Pages
import {
  AdminLayout,
  AdminLoginPage,
  AdminDashboardPage,
  ManageServicesPage,
  ManageBannersPage,
  ManageNotificationsPage,
  AdminFeedbackPage,
  ManageMembershipsPage,
  ManageBookingsPage,
  ManageStaffPage,
  CustomerDatabasePage,
  InventoryManagementPage,
  RevenueReportsPage,
  OffersCouponsPage,
  AdminSettingsPage,
  ManageOfflineSalesPage,
  AdminCalculationSettingsPage,
  ServiceModulePage
} from './admin';

// Staff Application Mobile Layout & Pages
import {
  StaffLayout,
  StaffLoginPage,
  StaffDashboardPage,
  StaffAttendancePage,
  StaffBookingsPage,
  StaffCustomersPage,
  StaffMembershipsPage,
  StaffInvoicingPage,
  StaffSchedulePage,
  StaffNotificationsPage,
  StaffProfilePage
} from './staff';

// Customer Pages
import Home from './pages/Home';
import CafePage from './cafe/pages/CafePage';
import DriveThroughCafePage from './drive-through-cafe/pages/DriveThroughCafePage';
import CarWashPage from './car-wash/pages/CarWashPage';
import CarWashConfirmPage from './car-wash/pages/CarWashConfirmPage';
import CarDetailingPage from './car-detailing/pages/CarDetailingPage';
import DogWashPage from './dog-wash/pages/DogWashPage';
import SalonPage from './salon/pages/SalonPage';
import SearchPage from './pages/SearchPage';
import BookingsPage from './pages/BookingsPage';
import ProfilePage from './pages/ProfilePage';
import CustomerAuthPage from './pages/CustomerAuthPage';
import CustomerReceiptPage from './pages/CustomerReceiptPage';

import ErrorBoundary from './common/components/ErrorBoundary';

// Premium Framer Motion Page transition wrapper
function PageTransition({ children }) {
  const location = useLocation();
  const sectionKey = location.pathname.split('/')[1] || 'root';

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={sectionKey}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

function MainAppContent() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isStaffRoute = location.pathname.startsWith('/staff');
  const isAuthRoute = location.pathname === '/login' || location.pathname === '/signup' || location.pathname === '/admin/login' || location.pathname === '/staff/login';
  const isReceiptRoute = location.pathname.startsWith('/receipt');
  const isCleanLayout = isAuthRoute || isReceiptRoute || isAdminRoute || isStaffRoute;

  React.useEffect(() => {
    initializePushNotifications();
    setupForegroundNotificationHandler((payload) => {
      console.log('Foreground FCM notification received:', payload);
    });
  }, []);

  return (
    <div className="app-container">
      {!isCleanLayout && <Navbar />}
      
      <main className={isCleanLayout ? "w-full min-h-screen p-0 m-0" : "main-content"}>
        <ErrorBoundary>
          <Routes>
            {/* Admin Panel Routes */}
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route
              path="/admin/*"
              element={
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              }
            >
              <Route index element={<AdminDashboardPage />} />
              <Route path="dashboard" element={<AdminDashboardPage />} />
              <Route path="car-wash" element={<ServiceModulePage />} />
              <Route path="car-detailing" element={<ServiceModulePage />} />
              <Route path="dog-wash" element={<ServiceModulePage />} />
              <Route path="cafe" element={<ServiceModulePage />} />
              <Route path="drive-through-cafe" element={<ServiceModulePage />} />
              <Route path="salon" element={<ServiceModulePage />} />
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
              <Route path="calculations" element={<AdminCalculationSettingsPage />} />
              <Route path="coupons" element={<OffersCouponsPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
            </Route>

            {/* Staff Application Routes */}
            <Route path="/staff/login" element={<StaffLoginPage />} />
            <Route
              path="/staff/*"
              element={
                <StaffRoute>
                  <StaffLayout />
                </StaffRoute>
              }
            >
              <Route index element={<StaffDashboardPage />} />
              <Route path="dashboard" element={<StaffDashboardPage />} />
              <Route path="attendance" element={<StaffAttendancePage />} />
              <Route path="bookings" element={<StaffBookingsPage />} />
              <Route path="customers" element={<StaffCustomersPage />} />
              <Route path="memberships" element={<StaffMembershipsPage />} />
              <Route path="invoicing" element={<StaffInvoicingPage />} />
              <Route path="schedule" element={<StaffSchedulePage />} />
              <Route path="notifications" element={<StaffNotificationsPage />} />
              <Route path="profile" element={<StaffProfilePage />} />
            </Route>

            {/* Customer Platform Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/receipt/:id" element={<CustomerReceiptPage />} />
            <Route path="/cafe" element={<CafePage />} />
            <Route path="/drive-through-cafe" element={<DriveThroughCafePage />} />
            <Route path="/car-wash" element={<CarWashPage />} />
            <Route path="/car-wash/confirm" element={<CarWashConfirmPage />} />
            <Route path="/car-detailing/*" element={<CarDetailingPage />} />
            <Route path="/dog-wash/*" element={<DogWashPage />} />
            <Route path="/salon/*" element={<SalonPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/bookings" element={<BookingsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/login" element={<CustomerAuthPage />} />
            <Route path="/signup" element={<CustomerAuthPage />} />
          </Routes>
        </ErrorBoundary>
      </main>

      {!isCleanLayout && (
        <footer className="footer">
          <p className="footer-text">
            &copy; {new Date().getFullYear()} The Shine Lounge. All rights reserved. Premium multi-service booking platform.
          </p>
        </footer>
      )}

      {!isCleanLayout && <BottomNavbar />}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <NotificationProvider>
            <MainAppContent />
          </NotificationProvider>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}
