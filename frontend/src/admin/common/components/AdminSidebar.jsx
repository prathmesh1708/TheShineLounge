import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Wrench,
  Image as ImageIcon,
  Bell,
  CreditCard,
  CalendarCheck,
  Users,
  UserCheck,
  Package,
  BarChart3,
  Ticket,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ShieldCheck,
  Sparkles,
  Car,
  CarFront,
  Dog,
  Coffee,
  CupSoda,
  Scissors,
  TrendingUp
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import TSLLogo from '../../../common/components/TSLLogo';

export default function AdminSidebar({ isCollapsed, toggleSidebar }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { stats, bookings, staffList, banners, inventory } = useAdmin();

  // Determine current active service key from URL path
  const currentServiceKey = location.pathname.startsWith('/admin/') && 
    !['dashboard', 'bookings', 'memberships', 'customers', 'staff', 'inventory', 'reports', 'coupons', 'settings', 'services', 'banners', 'notifications'].includes(location.pathname.replace('/admin/', ''))
      ? location.pathname.replace('/admin/', '')
      : null;

  // Active tab from URL query params
  const queryParams = new URLSearchParams(location.search);
  const activeTabQuery = queryParams.get('tab') || 'overview';

  // State to track expanded service module dropdown
  const [openDropdownKey, setOpenDropdownKey] = useState(currentServiceKey || 'car-wash');

  useEffect(() => {
    if (currentServiceKey) {
      setOpenDropdownKey(currentServiceKey);
    }
  }, [currentServiceKey]);

  const globalNavItems = [
    { label: 'All Bookings', path: '/admin/bookings', icon: CalendarCheck, badge: stats.pendingBookings },
    { label: 'Memberships', path: '/admin/memberships', icon: CreditCard },
    { label: 'Customer CRM', path: '/admin/customers', icon: Users },
    { label: 'All Staff Roster', path: '/admin/staff', icon: UserCheck },
    { label: 'Global Inventory', path: '/admin/inventory', icon: Package, badge: stats.lowStockItems, badgeColor: 'bg-amber-500' },
    { label: 'Revenue & Reports', path: '/admin/reports', icon: BarChart3 },
    { label: 'Offers & Coupons', path: '/admin/coupons', icon: Ticket },
    { label: 'Settings', path: '/admin/settings', icon: Settings }
  ];

  const serviceModules = [
    { label: 'Car Wash Hub', path: '/admin/car-wash', icon: Car, key: 'car-wash', serviceName: 'Car Wash' },
    { label: 'Car Detailing Hub', path: '/admin/car-detailing', icon: CarFront, key: 'car-detailing', serviceName: 'Car Detailing' },
    { label: 'Dog Wash Hub', path: '/admin/dog-wash', icon: Dog, key: 'dog-wash', serviceName: 'Dog Bath' },
    { label: 'Café Hub', path: '/admin/cafe', icon: Coffee, key: 'cafe', serviceName: 'Café' },
    { label: 'Drive-Thru Café Hub', path: '/admin/drive-through-cafe', icon: CupSoda, key: 'drive-through-cafe', serviceName: 'Drive-Through Café' },
    { label: 'Men\'s Salon Hub', path: '/admin/salon', icon: Scissors, key: 'salon', serviceName: 'Men\'s Salon' }
  ];

  // Sub-navigation options inside each service dropdown
  const getSubNavItems = (key, serviceName) => {
    const bCount = bookings.filter(b => b.serviceKey === key || b.service?.toLowerCase().includes(serviceName.toLowerCase())).length;
    const sCount = staffList.filter(s => s.serviceKey === key || s.department === serviceName).length;
    const banCount = banners.filter(b => b.serviceKey === key || b.link?.includes(key)).length;
    const iCount = inventory.filter(i => i.serviceKey === key || i.department === serviceName).length;

    return [
      { id: 'overview', label: 'Overview & Revenue', icon: TrendingUp },
      { id: 'packages', label: 'Packages & Pricing', icon: Wrench },
      { id: 'bookings', label: `Service Bookings (${bCount})`, icon: CalendarCheck },
      { id: 'staff', label: `Department Staff (${sCount})`, icon: Users },
      { id: 'marketing', label: `Promos & Banners (${banCount})`, icon: ImageIcon },
      { id: 'inventory', label: `Supplies & Stock (${iCount})`, icon: Package }
    ];
  };

  const handleToggleDropdown = (key, defaultPath) => {
    if (openDropdownKey === key) {
      // Toggle accordion or keep open
      setOpenDropdownKey(null);
    } else {
      setOpenDropdownKey(key);
      if (location.pathname !== defaultPath) {
        navigate(`${defaultPath}?tab=overview`);
      }
    }
  };

  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-40 transition-all duration-300 flex flex-col justify-between ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
      style={{ backgroundColor: '#1e4a7e' }}
    >
      {/* Top Branding Section */}
      <div>
        <div className="h-16 px-4 flex items-center justify-between border-b border-blue-800/60">
          {!isCollapsed && (
            <div className="flex items-center gap-2.5">
              <div className="w-11 h-11 flex items-center justify-center">
                <TSLLogo className="w-11 h-11" />
              </div>
              <div>
                <h1 className="font-extrabold text-sm text-white tracking-wide uppercase">THE SHINE LOUNGE</h1>
                <span className="text-[10px] text-blue-200 font-semibold tracking-wider uppercase flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-amber-400" /> Admin Executive
                </span>
              </div>
            </div>
          )}

          {isCollapsed && (
            <div className="w-10 h-10 mx-auto rounded-xl flex items-center justify-center font-bold text-white shadow-sm" style={{ backgroundColor: '#e07b2a' }}>
              TSL
            </div>
          )}

          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg text-blue-200 hover:text-white hover:bg-blue-800/80 transition-colors"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation Items List */}
        <div className="p-3 space-y-1.5 overflow-y-auto max-h-[calc(100vh-140px)] custom-scrollbar">
          
          {/* Global Dashboard */}
          {(() => {
            const isActive = location.pathname === '/admin' || location.pathname === '/admin/dashboard';
            return (
              <NavLink
                to="/admin"
                className={`flex items-center justify-between px-3 py-2 rounded-xl font-medium text-xs transition-all duration-200 group ${
                  isActive
                    ? 'text-white font-bold shadow-md'
                    : 'text-blue-100 hover:bg-blue-800/60 hover:text-white'
                }`}
                style={isActive ? { backgroundColor: '#e07b2a' } : {}}
                title={isCollapsed ? 'Global Dashboard' : undefined}
              >
                <div className="flex items-center gap-2.5">
                  <LayoutDashboard className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-white' : 'text-blue-200'}`} />
                  {!isCollapsed && <span>Global Dashboard</span>}
                </div>
              </NavLink>
            );
          })()}

          {/* Service Modules */}
          {serviceModules.map((item) => {
            const Icon = item.icon;
            const isCurrentService = currentServiceKey === item.key;
            const isExpanded = openDropdownKey === item.key && !isCollapsed;

            return (
              <div key={item.key} className="rounded-xl overflow-hidden">
                {/* Main Service Header Link / Button */}
                <button
                  onClick={() => handleToggleDropdown(item.key, item.path)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-bold text-xs transition-all duration-200 group ${
                    isCurrentService
                      ? 'bg-blue-900/80 text-amber-300 border border-blue-700/60 shadow-xs'
                      : 'text-blue-100 hover:bg-blue-800/60 hover:text-white'
                  }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${isCurrentService ? 'text-amber-400' : 'text-amber-400'}`} />
                    {!isCollapsed && <span className="font-extrabold">{item.label}</span>}
                  </div>

                  {!isCollapsed && (
                    <div className="p-0.5 rounded text-blue-300 group-hover:text-white">
                      {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </div>
                  )}
                </button>

                {/* Service Sub-Menu Dropdown Items */}
                {isExpanded && (
                  <div className="mt-1 ml-3 pl-2.5 border-l-2 border-amber-500/40 space-y-1 py-1">
                    {getSubNavItems(item.key, item.serviceName).map((sub) => {
                      const SubIcon = sub.icon;
                      const isSubActive = isCurrentService && activeTabQuery === sub.id;

                      return (
                        <NavLink
                          key={sub.id}
                          to={`${item.path}?tab=${sub.id}`}
                          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                            isSubActive
                              ? 'text-white font-black shadow-xs'
                              : 'text-blue-200 hover:bg-blue-800/70 hover:text-white'
                          }`}
                          style={isSubActive ? { backgroundColor: '#e07b2a' } : {}}
                        >
                          <SubIcon className={`w-3.5 h-3.5 flex-shrink-0 ${isSubActive ? 'text-white' : 'text-amber-300'}`} />
                          <span className="truncate">{sub.label}</span>
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Remaining Global Items */}
          {globalNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact
              ? location.pathname === item.path || location.pathname === '/admin/dashboard'
              : location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-3 py-2 rounded-xl font-medium text-xs transition-all duration-200 group ${
                  isActive
                    ? 'text-white font-bold shadow-md'
                    : 'text-blue-100 hover:bg-blue-800/60 hover:text-white'
                }`}
                style={isActive ? { backgroundColor: '#e07b2a' } : {}}
                title={isCollapsed ? item.label : undefined}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-white' : 'text-blue-200'}`} />
                  {!isCollapsed && <span>{item.label}</span>}
                </div>

                {!isCollapsed && item.badge > 0 && (
                  <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full text-white bg-amber-500">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* Bottom User Info Footer */}
      <div className="p-3 border-t border-blue-800/60">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-2 py-1.5'}`}>
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
            alt="Admin Avatar"
            className="w-8 h-8 rounded-full object-cover border-2 border-amber-500"
          />
          {!isCollapsed && (
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">Amitabh Verma</p>
              <p className="text-[10px] text-blue-200 font-semibold truncate">Super Admin</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
