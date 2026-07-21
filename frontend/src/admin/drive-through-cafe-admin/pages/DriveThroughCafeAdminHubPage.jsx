import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  IndianRupee,
  TrendingUp,
  CalendarCheck,
  Package,
  Wrench,
  Users,
  Image as ImageIcon,
  Clock,
  Plus,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Star,
  ArrowUpRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import { useAdmin } from '../../common/context/AdminContext';
import { serviceStatsMap } from '../../common/data/adminMockData';
import StatsCard from '../../common/components/StatsCard';
import DataTable from '../../common/components/DataTable';
import AdminModal from '../../common/components/AdminModal';

export default function DriveThroughCafeAdminHubPage() {
  const serviceKey = 'drive-through-cafe';
  const {
    services,
    bookings,
    staffList,
    banners,
    inventory,
    toggleServiceStatus,
    updateServicePrice,
    addServicePlan,
    deleteServicePlan,
    addBooking,
    updateBookingStatus,
    addStaff,
    toggleStaffStatus,
    addBanner,
    addInventoryItem,
    updateStock
  } = useAdmin();

  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTabState] = useState(tabFromUrl);

  useEffect(() => {
    if (searchParams.get('tab')) {
      setActiveTabState(searchParams.get('tab'));
    }
  }, [searchParams]);

  const handleTabChange = (tabId) => {
    setActiveTabState(tabId);
    setSearchParams({ tab: tabId });
  };

  const serviceStats = serviceStatsMap[serviceKey] || serviceStatsMap['car-wash'];
  const serviceMain = services.find(s => s.key === serviceKey) || services[0];

  const serviceBookings = bookings.filter(b => b.serviceKey === serviceKey);
  const serviceStaff = staffList.filter(s => s.serviceKey === serviceKey);
  const serviceBanners = banners.filter(b => b.serviceKey === serviceKey);
  const serviceInventory = inventory.filter(i => i.serviceKey === serviceKey);

  // Modals state
  const [editingPriceModal, setEditingPriceModal] = useState(false);
  const [newPrice, setNewPrice] = useState(serviceMain?.price || 0);
  const [addPlanModal, setAddPlanModal] = useState(false);
  const [planForm, setPlanForm] = useState({ name: '', price: '', description: '', billing: 'per service' });

  const [addBookingModal, setAddBookingModal] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    customerName: '',
    phone: '',
    plan: serviceMain?.plans?.[0]?.name || 'Standard Package',
    amount: serviceMain?.price || 699,
    timeSlot: '05:00 PM',
    vehicleNo: 'MH01AB1234',
    paymentMode: 'UPI'
  });

  const [addStaffModal, setAddStaffModal] = useState(false);
  const [staffForm, setStaffForm] = useState({
    name: '',
    role: `Express Barista`,
    phone: '',
    email: '',
    salary: '₹35,000 / mo'
  });

  const [addBannerModal, setAddBannerModal] = useState(false);
  const [bannerForm, setBannerForm] = useState({
    title: `DRIVE THROUGH CAFE PROMO`,
    subtitle: `Special discount offer for Drive-Thru Cafe`,
    badge: 'Special Deal',
    imageUrl: serviceStats.heroImage
  });

  const [stockModalItem, setStockModalItem] = useState(null);
  const [stockQty, setStockQty] = useState(5);

  const [addInventoryModal, setAddInventoryModal] = useState(false);
  const [invForm, setInvForm] = useState({
    name: '',
    category: 'Supplies',
    supplier: 'Official Supplier',
    purchasePrice: 1000,
    currentStock: 10,
    minStock: 5,
    unit: 'Units'
  });

  const handleSavePrice = () => {
    updateServicePrice(serviceMain.id, newPrice);
    setEditingPriceModal(false);
  };

  const handleSavePlan = () => {
    if (!planForm.name || !planForm.price) return;
    addServicePlan(serviceMain.id, {
      name: planForm.name,
      price: Number(planForm.price),
      description: planForm.description,
      billing: planForm.billing
    });
    setAddPlanModal(false);
    setPlanForm({ name: '', price: '', description: '', billing: 'per service' });
  };

  const handleCreateBooking = (e) => {
    e.preventDefault();
    addBooking({
      serviceKey,
      service: serviceStats.serviceName,
      customerName: bookingForm.customerName,
      phone: bookingForm.phone,
      plan: bookingForm.plan,
      amount: Number(bookingForm.amount),
      timeSlot: bookingForm.timeSlot,
      vehicleNo: bookingForm.vehicleNo,
      paymentMode: bookingForm.paymentMode
    });
    setAddBookingModal(false);
  };

  const handleAddStaff = (e) => {
    e.preventDefault();
    addStaff({
      name: staffForm.name,
      role: staffForm.role,
      department: serviceStats.serviceName,
      serviceKey,
      phone: staffForm.phone,
      email: staffForm.email,
      salary: staffForm.salary
    });
    setAddStaffModal(false);
  };

  const handleAddBanner = (e) => {
    e.preventDefault();
    addBanner({
      serviceKey,
      title: bannerForm.title,
      subtitle: bannerForm.subtitle,
      badge: bannerForm.badge,
      link: `/${serviceKey}`,
      imageUrl: bannerForm.imageUrl
    });
    setAddBannerModal(false);
  };

  const handleAddInventory = (e) => {
    e.preventDefault();
    addInventoryItem({
      serviceKey,
      department: serviceStats.serviceName,
      name: invForm.name,
      category: invForm.category,
      supplier: invForm.supplier,
      purchasePrice: invForm.purchasePrice,
      sellingPrice: 0,
      currentStock: invForm.currentStock,
      minStock: invForm.minStock,
      unit: invForm.unit
    });
    setAddInventoryModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Hero Header Banner */}
      <div className="relative rounded-2xl overflow-hidden shadow-md text-white">
        <img
          src={serviceStats.heroImage}
          alt={serviceStats.serviceName}
          className="w-full h-52 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-955/95 via-blue-900/80 to-transparent" />
        
        <div className="absolute inset-0 p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500 text-white shadow-xs">
              {serviceStats.category} MODULE
            </span>

            <button
              onClick={() => toggleServiceStatus(serviceMain.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all ${
                serviceMain?.status === 'active' ? 'bg-emerald-500 text-white' : 'bg-gray-700 text-white'
              }`}
            >
              {serviceMain?.status === 'active' ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
              <span>{serviceMain?.status === 'active' ? 'Active' : 'Inactive'}</span>
            </button>
          </div>

          <div>
            <h1 className="text-3xl font-black tracking-tight">{serviceStats.serviceName}</h1>
            <p className="text-xs text-gray-200 mt-1 max-w-xl font-medium">{serviceStats.tagline}</p>
          </div>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatsCard title="Lifetime Revenue" value={serviceStats.totalRevenue} isCurrency={true} growth={14.2} icon={IndianRupee} iconBg="#fff7ed" iconColor="#e07b2a" />
        <StatsCard title="Monthly Sales" value={serviceStats.monthlySales} isCurrency={true} growth={10.8} icon={TrendingUp} iconBg="#eff6ff" iconColor="#1e4a7e" />
        <StatsCard title="Today's Sales" value={serviceStats.todaySales} isCurrency={true} growth={8.5} icon={CalendarCheck} iconBg="#f0fdf4" iconColor="#10b981" />
        <StatsCard title="Active Members" value={serviceStats.activeMembers} isCurrency={false} growth={5.4} icon={Users} iconBg="#faf5ff" iconColor="#8b5cf6" />
      </div>

      {/* Internal Navigation Tabs */}
      <div className="bg-white border border-gray-200 rounded-2xl p-2 shadow-sm flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        {[
          { id: 'overview', label: 'Overview & Revenue', icon: TrendingUp },
          { id: 'packages', label: 'Packages & Pricing', icon: Wrench },
          { id: 'bookings', label: `Service Bookings (${serviceBookings.length})`, icon: CalendarCheck },
          { id: 'staff', label: `Department Staff (${serviceStaff.length})`, icon: Users },
          { id: 'marketing', label: `Promos & Banners (${serviceBanners.length})`, icon: ImageIcon },
          { id: 'inventory', label: `Supplies & Stock (${serviceInventory.length})`, icon: Package }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                isActive ? 'bg-amber-500 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENTS */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-bold text-gray-900">Revenue Growth</h3>
              <p className="text-xs text-gray-400">Monthly breakdown</p>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={serviceStats.trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `₹${v / 1000}k`} />
                  <Tooltip formatter={(v) => `₹${Number(v).toLocaleString('en-IN')}`} />
                  <Line type="monotone" dataKey="revenue" stroke="#e07b2a" strokeWidth={3} dot={{ fill: '#1e4a7e', r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-gray-900">Performance Summary</h3>
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/60">
                <span className="text-gray-500 block font-semibold">Base Rate</span>
                <span className="text-xl font-black text-amber-700">₹{serviceMain?.price}</span>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200/60">
                <span className="text-gray-500 block font-semibold">Average Order Value</span>
                <span className="text-xl font-black text-blue-900">₹{Math.round(serviceStats.todaySales / (serviceStats.completedToday || 1))}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'packages' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Packages</h3>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditingPriceModal(true)} className="px-3.5 py-2 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100">
                Edit Base Price
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {serviceMain?.plans?.map((plan) => (
              <div key={plan.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3">
                <h4 className="text-lg font-black text-gray-900">{plan.name}</h4>
                <p className="text-xs text-gray-500">{plan.description}</p>
                <div className="pt-3 border-t flex items-center justify-between">
                  <span className="text-2xl font-black text-amber-600">₹{plan.price}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'bookings' && (
        <DataTable
          columns={[
            { header: 'ID', accessorKey: 'id' },
            { header: 'Customer', accessorKey: 'customerName' },
            { header: 'Package', accessorKey: 'plan' },
            { header: 'Slot', accessorKey: 'timeSlot' },
            { header: 'Total (₹)', accessorKey: 'total', cell: (r) => <span>₹{r.total}</span> },
            { header: 'Status', accessorKey: 'status' }
          ]}
          data={serviceBookings}
          searchPlaceholder="Search Bookings..."
        />
      )}

      {activeTab === 'staff' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {serviceStaff.map(stf => (
            <div key={stf.id} className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-3">
              <img src={stf.avatar} className="w-12 h-12 rounded-full object-cover" />
              <div>
                <h4 className="font-bold text-xs">{stf.name}</h4>
                <p className="text-[10px] text-gray-500">{stf.role}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'marketing' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {serviceBanners.map(ban => (
            <div key={ban.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
              <img src={ban.imageUrl} className="w-full h-32 object-cover" />
              <div className="p-3">
                <h4 className="font-bold text-xs">{ban.title}</h4>
                <p className="text-[10px] text-gray-500">{ban.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'inventory' && (
        <DataTable
          columns={[
            { header: 'Product Item', accessorKey: 'name' },
            { header: 'Category', accessorKey: 'category' },
            { header: 'Stock Level', accessorKey: 'currentStock' },
            { header: 'Status', accessorKey: 'status' }
          ]}
          data={serviceInventory}
        />
      )}

      {/* Modal: Edit Base Price */}
      <AdminModal isOpen={editingPriceModal} onClose={() => setEditingPriceModal(false)} title="Edit Rate">
        <div className="space-y-4 text-xs">
          <input type="number" value={newPrice} onChange={e => setNewPrice(Number(e.target.value))} className="w-full p-2 border rounded-xl" />
          <button onClick={handleSavePrice} className="w-full py-2 bg-amber-500 text-white rounded-xl">Save</button>
        </div>
      </AdminModal>
    </div>
  );
}
