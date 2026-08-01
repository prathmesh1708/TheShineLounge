import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { ThemeProvider } from './common/context/ThemeContext';
import { AuthProvider } from './common/context/AuthContext';
import { AdminRoute, StaffRoute } from './common/components/ProtectedRoute';

// Common Components & Layout
import Navbar from './common/components/Navbar';
import BottomNavbar from './common/components/BottomNavbar';

// Admin Panel Layout & Login
import { AdminLayout, AdminLoginPage } from './admin';

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

// Pages
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

import ErrorBoundary from './common/components/ErrorBoundary';

// Premium Framer Motion Page transition wrapper
function PageTransition({ children }) {
  const location = useLocation();
  // Group by primary route section so sub-navigation doesn't trigger parent-child AnimatePresence DOM collisions
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

  if (isAdminRoute) {
    const isAdminLogin = location.pathname === '/admin/login';

    if (isAdminLogin) {
      return (
        <Routes>
          <Route path="/admin/login" element={<AdminLoginPage />} />
        </Routes>
      );
    }

    return (
      <AdminRoute>
        <Routes>
          <Route path="/admin/*" element={<AdminLayout />} />
        </Routes>
      </AdminRoute>
    );
  }

  if (isStaffRoute) {
    // Allow /staff/login without auth, protect everything else
    const isStaffLogin = location.pathname === '/staff/login';

    if (isStaffLogin) {
      return (
        <Routes>
          <Route path="/staff/login" element={<StaffLoginPage />} />
        </Routes>
      );
    }

    return (
      <StaffRoute>
        <Routes>
          <Route path="/staff" element={<StaffLayout />}>
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
        </Routes>
      </StaffRoute>
    );
  }

  return (
    <div className="app-container">
      <Navbar />
      
      <main className="main-content">
        <ErrorBoundary>
          <PageTransition>
            <Routes>
              <Route path="/" element={<Home />} />
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
          </PageTransition>
        </ErrorBoundary>
      </main>

      <footer className="footer">
        <p className="footer-text">
          &copy; {new Date().getFullYear()} The Shine Lounge. All rights reserved. Premium multi-service booking platform.
        </p>
      </footer>

      <BottomNavbar />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <MainAppContent />
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}
