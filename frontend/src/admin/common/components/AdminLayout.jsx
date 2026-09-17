import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { AdminProvider } from '../context/AdminContext';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import TSLLogo from '../../../common/components/TSLLogo';

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

        {/* Desktop Header */}
        <div className="hidden lg:block">
          <AdminHeader isSidebarCollapsed={isSidebarCollapsed} />
        </div>

        {/* Responsive Admin Sidebar (Drawer on mobile, fixed column on desktop) */}
        <AdminSidebar
          isCollapsed={isSidebarCollapsed}
          toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          mobileOpen={isMobileSidebarOpen}
          closeMobileSidebar={() => setIsMobileSidebarOpen(false)}
        />

        {/* Dynamic Admin Main Content Area */}
        <main
          className={`transition-all duration-300 p-3 sm:p-6 lg:pt-20 pb-12 min-h-screen bg-gray-50/50 ${
            isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
          } ml-0`}
        >
          <Outlet />
        </main>
      </div>
    </AdminProvider>
  );
}
