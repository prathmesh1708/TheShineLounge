import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Common Components & Layout
import Navbar from './common/components/Navbar';
import BottomNavbar from './common/components/BottomNavbar';

// Admin Panel Layout
import { AdminLayout } from './admin';

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

// Premium Framer Motion Page transition wrapper
function PageTransition({ children }) {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
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
    return (
      <Routes>
        <Route path="/admin/*" element={<AdminLayout />} />
      </Routes>
    );
  }

  if (isStaffRoute) {
    return (
      <Routes>
        <Route path="/staff" element={<StaffLayout />}>
          <Route index element={<StaffDashboardPage />} />
          <Route path="dashboard" element={<StaffDashboardPage />} />
          <Route path="login" element={<StaffLoginPage />} />
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
    );
  }

  return (
    <div className="app-container">
      <Navbar />
      
      <main className="main-content">
        <PageTransition>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/cafe" element={<CafePage />} />
            <Route path="/drive-through-cafe" element={<DriveThroughCafePage />} />
            <Route path="/car-wash" element={<CarWashPage />} />
            <Route path="/car-wash/confirm" element={<CarWashConfirmPage />} />
            <Route path="/car-detailing/*" element={<CarDetailingPage />} />
            <Route path="/car-detailing" element={<CarDetailingPage />} />
            <Route path="/dog-wash/*" element={<DogWashPage />} />
            <Route path="/dog-wash" element={<DogWashPage />} />
            <Route path="/salon/*" element={<SalonPage />} />
            <Route path="/salon" element={<SalonPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/bookings" element={<BookingsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
        </PageTransition>
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
      <MainAppContent />
    </Router>
  );
}
