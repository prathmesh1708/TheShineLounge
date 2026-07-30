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
  ArrowUpRight,
  UserPlus,
  Key,
  Shield,
  Phone,
  Mail,
  Calendar
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
import serviceApi from '../../../common/services/serviceApi';
import apiClient from '../../../common/utils/apiClient';

export default function CarWashAdminHubPage() {
  const serviceKey = 'car-wash';
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
    updateStock,
    showToast
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

  // Live Backend Database State
  const [dbService, setDbService] = useState(null);
  const [dbStaff, setDbStaff] = useState([]);

  const fetchLiveService = async () => {
    try {
      const res = await serviceApi.getServiceBySlug('car-wash');
      if (res.success && res.service) {
        setDbService(res.service);
      }
    } catch (err) {
      console.warn('Could not fetch live car-wash service');
    }
  };

  const fetchLiveStaff = async () => {
    try {
      const res = await apiClient.get('/users/staff?serviceKey=car-wash');
      if (res.data && res.data.staff) {
        setDbStaff(res.data.staff);
      }
    } catch (err) {
      console.warn('Could not fetch live staff list:', err.message);
    }
  };

  useEffect(() => {
    fetchLiveService();
    fetchLiveStaff();
  }, []);

  // Modal Editing States
  const [editingPriceModal, setEditingPriceModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // { type: 'pricing'|'membership', id, title }
  const [editPrice, setEditPrice] = useState(699);
  const [editDescription, setEditDescription] = useState('');

  // Add Staff Modal State
  const [addStaffModal, setAddStaffModal] = useState(false);
  const [staffForm, setStaffForm] = useState({
    fullName: '',
    email: '',
    password: '',
    mobile: '',
    staffRole: 'Car Wash Specialist',
    salary: '₹35,000 / month',
    leaveBalance: 12,
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    permissions: ['bookings', 'orders']
  });

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#';
    let pwd = '';
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setStaffForm(prev => ({ ...prev, password: pwd }));
  };

  const handlePermissionToggle = (perm) => {
    setStaffForm(prev => {
      const current = prev.permissions;
      if (current.includes(perm)) {
        return { ...prev, permissions: current.filter(p => p !== perm) };
      } else {
        return { ...prev, permissions: [...current, perm] };
      }
    });
  };

  const handleSaveNewStaff = async (e) => {
    e.preventDefault();
    if (!staffForm.fullName || !staffForm.email || !staffForm.password) {
      alert('Please fill out Name, Email ID, and Password');
      return;
    }

    try {
      const res = await apiClient.post('/users/staff', {
        fullName: staffForm.fullName,
        email: staffForm.email,
        password: staffForm.password,
        mobile: staffForm.mobile,
        department: 'Car Wash',
        serviceKey: 'car-wash',
        staffRole: staffForm.staffRole,
        salary: staffForm.salary,
        leaveBalance: Number(staffForm.leaveBalance),
        photo: staffForm.photo,
        permissions: staffForm.permissions
      });

      if (res.data && res.data.success) {
        alert(`✅ Staff member created successfully!\n\nStaff Email: ${staffForm.email}\nPassword: ${staffForm.password}\n\nStaff can now log in at /staff/login.`);
        fetchLiveStaff();
        setAddStaffModal(false);
        setStaffForm({
          fullName: '',
          email: '',
          password: '',
          mobile: '',
          staffRole: 'Car Wash Specialist',
          salary: '₹35,000 / month',
          leaveBalance: 12,
          photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
          permissions: ['bookings', 'orders']
        });
      } else {
        alert(`Error: ${res.data?.message || 'Could not create staff'}`);
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Could not create staff';
      alert(`Error: ${errMsg}`);
    }
  };

  const handleOpenEdit = (type, item) => {
    setEditingItem({
      type,
      id: item._id,
      title: type === 'pricing' ? item.title : item.name
    });
    setEditPrice(item.price);
    setEditDescription(
      type === 'pricing'
        ? (item.description || '')
        : (Array.isArray(item.benefits) ? item.benefits.join(', ') : (item.benefits || ''))
    );
    setEditingPriceModal(true);
  };

  const handleSavePrice = async () => {
    const numPrice = Number(editPrice);
    if (!numPrice || numPrice <= 0 || !editingItem) return;

    try {
      if (dbService && dbService._id) {
        if (editingItem.type === 'pricing') {
          const updatedPricing = (dbService.pricing || []).map(p => {
            if (p._id === editingItem.id || p.title === editingItem.title) {
              return { ...p, price: numPrice, description: editDescription };
            }
            return p;
          });
          await serviceApi.updateService(dbService._id, { pricing: updatedPricing });
        } else if (editingItem.type === 'membership') {
          const updatedMemberships = (dbService.memberships || []).map(m => {
            if (m._id === editingItem.id || m.name === editingItem.title) {
              return { ...m, price: numPrice, benefits: [editDescription] };
            }
            return m;
          });
          await serviceApi.updateService(dbService._id, { memberships: updatedMemberships });
        }
        await fetchLiveService();
      }
    } catch (err) {
      console.error('Failed to update price & description:', err);
    }
    setEditingPriceModal(false);
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER & SUMMARY */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-xs font-bold uppercase tracking-wider">
              Automotive Module
            </span>
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Active
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black">Tunnel Car Wash</h1>
          <p className="text-xs sm:text-sm text-blue-200/80 max-w-xl">
            Manage pricing tiers, membership passes, daily bookings, staff rosters, and wash inventory stock.
          </p>
        </div>
      </div>

      {/* TABS HEADER */}
      <div className="flex gap-2 border-b border-gray-200 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: 'overview', label: 'Overview & Revenue', icon: TrendingUp },
          { id: 'packages', label: 'Packages & Pricing', icon: Wrench },
          { id: 'bookings', label: `Service Bookings (${serviceBookings.length})`, icon: CalendarCheck },
          { id: 'staff', label: `Department Staff (${dbStaff.length || serviceStaff.length})`, icon: Users },
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
                <span className="text-gray-500 block font-semibold">Single Wash Rate</span>
                <span className="text-xl font-black text-amber-700">₹{dbService?.pricing?.[0]?.price || 699}</span>
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
              <h3 className="text-sm font-bold text-gray-900">Active Packages & Memberships</h3>
              <p className="text-xs text-gray-400">Click "Edit Price" on any plan to update live price and description</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Pricing Cards */}
            {dbService?.pricing?.map((p) => (
              <div key={p._id || p.title} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <h4 className="text-lg font-black text-gray-900">{p.title}</h4>
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                      Single Service
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{p.description}</p>
                </div>
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-2xl font-black text-amber-600">₹{p.price}</span>
                  <button 
                    onClick={() => handleOpenEdit('pricing', p)}
                    className="px-3.5 py-1.5 bg-amber-500 text-white rounded-xl text-xs font-bold hover:bg-amber-600 shadow-xs transition-all flex items-center gap-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit Price & Details
                  </button>
                </div>
              </div>
            ))}

            {/* Membership Cards */}
            {dbService?.memberships?.map((m) => (
              <div key={m._id || m.name} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <h4 className="text-lg font-black text-gray-900">{m.name}</h4>
                    {m.badge ? (
                      <span className="text-[10px] uppercase tracking-wider font-extrabold text-white bg-amber-500 px-2 py-0.5 rounded-md">
                        {m.badge}
                      </span>
                    ) : (
                      <span className="text-[10px] uppercase tracking-wider font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                        Pass
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{Array.isArray(m.benefits) ? m.benefits.join(', ') : m.benefits}</p>
                </div>
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-2xl font-black text-amber-600">₹{m.price.toLocaleString()}</span>
                  <button 
                    onClick={() => handleOpenEdit('membership', m)}
                    className="px-3.5 py-1.5 bg-amber-500 text-white rounded-xl text-xs font-bold hover:bg-amber-600 shadow-xs transition-all flex items-center gap-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit Price & Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DEPARTMENT STAFF TAB */}
      {activeTab === 'staff' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <div>
              <h3 className="text-base font-black text-gray-900">Car Wash Department Staff ({dbStaff.length || serviceStaff.length})</h3>
              <p className="text-xs text-gray-500">Onboard staff members, generate email login credentials & assign module access</p>
            </div>
            <button
              onClick={() => setAddStaffModal(true)}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" /> Onboard New Staff Member
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {(dbStaff.length > 0 ? dbStaff : serviceStaff).map((stf) => (
              <div key={stf._id || stf.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between hover:border-amber-400 transition-all">
                <div className="flex items-start gap-3">
                  <img
                    src={stf.photo || stf.avatar || stf.profileImage || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"}
                    alt={stf.fullName || stf.name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-amber-500/30 flex-shrink-0"
                  />
                  <div className="space-y-1 overflow-hidden">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-extrabold text-sm text-gray-900 truncate">{stf.fullName || stf.name}</h4>
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${stf.isActive !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'}`}>
                        {stf.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-amber-700">{stf.staffRole || stf.role || 'Car Wash Specialist'}</p>
                    <p className="text-[11px] text-gray-500 flex items-center gap-1 truncate">
                      <Mail className="w-3 h-3 text-gray-400 flex-shrink-0" /> {stf.email || 'rohan@theshinelounge.com'}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 bg-gray-50 rounded-lg">
                    <span className="text-gray-400 font-semibold block text-[9px]">MOBILE NO</span>
                    <span className="font-bold text-gray-800 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-gray-400" /> {stf.mobile || '+91 98200 11223'}
                    </span>
                  </div>
                  <div className="p-2 bg-gray-50 rounded-lg">
                    <span className="text-gray-400 font-semibold block text-[9px]">MONTHLY SALARY</span>
                    <span className="font-bold text-emerald-700">{stf.salary || '₹35,000 / mo'}</span>
                  </div>
                </div>

                {stf.permissions && stf.permissions.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {stf.permissions.map(p => (
                      <span key={p} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[9px] font-bold uppercase">
                        {p}
                      </span>
                    ))}
                  </div>
                )}
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

      {/* Modal: Edit Price & Description */}
      <AdminModal isOpen={editingPriceModal} onClose={() => setEditingPriceModal(false)} title={`Edit ${editingItem?.title || 'Package'}`}>
        <div className="space-y-4 text-xs p-1">
          <div>
            <label className="block font-bold text-gray-700 mb-1">Package Title</label>
            <input type="text" value={editingItem?.title || ''} disabled className="w-full p-2.5 border rounded-xl bg-gray-100 font-bold text-gray-800" />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Price (₹)</label>
            <input 
              type="number" 
              value={editPrice} 
              onChange={e => setEditPrice(Number(e.target.value))} 
              className="w-full p-2.5 border rounded-xl font-black text-amber-600 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none" 
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Description / Included Benefits</label>
            <textarea 
              value={editDescription} 
              onChange={e => setEditDescription(e.target.value)} 
              rows={3} 
              className="w-full p-2.5 border rounded-xl text-gray-700 focus:ring-2 focus:ring-amber-500 focus:outline-none" 
              placeholder="e.g. Complimentary – vacuum, polish, mat cleaning" 
            />
          </div>

          <button 
            onClick={handleSavePrice} 
            className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-xs transition-all text-xs uppercase tracking-wider"
          >
            Save Price & Description
          </button>
        </div>
      </AdminModal>

      {/* Modal: Onboard New Staff Member */}
      <AdminModal isOpen={addStaffModal} onClose={() => setAddStaffModal(false)} title="Onboard New Staff Member">
        <form onSubmit={handleSaveNewStaff} className="space-y-4 text-xs p-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={staffForm.fullName}
                onChange={e => setStaffForm({ ...staffForm, fullName: e.target.value })}
                placeholder="e.g. Rohan Deshmukh"
                className="w-full p-2.5 border rounded-xl font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Staff Title / Role *</label>
              <input
                type="text"
                required
                value={staffForm.staffRole}
                onChange={e => setStaffForm({ ...staffForm, staffRole: e.target.value })}
                placeholder="e.g. Car Wash Supervisor"
                className="w-full p-2.5 border rounded-xl font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-700 mb-1">Email ID (Login Username) *</label>
              <input
                type="email"
                required
                value={staffForm.email}
                onChange={e => setStaffForm({ ...staffForm, email: e.target.value })}
                placeholder="rohan@theshinelounge.com"
                className="w-full p-2.5 border rounded-xl font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-bold text-gray-700">Login Password *</label>
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="text-[10px] text-amber-600 font-extrabold hover:underline"
                >
                  ⚡ Auto Generate
                </button>
              </div>
              <input
                type="text"
                required
                value={staffForm.password}
                onChange={e => setStaffForm({ ...staffForm, password: e.target.value })}
                placeholder="Staff!@#123"
                className="w-full p-2.5 border rounded-xl font-mono font-bold text-amber-700 focus:ring-2 focus:ring-amber-500 focus:outline-none bg-amber-50/40"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-gray-700 mb-1">Mobile Number</label>
              <input
                type="text"
                value={staffForm.mobile}
                onChange={e => setStaffForm({ ...staffForm, mobile: e.target.value })}
                placeholder="+91 98200 11223"
                className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Monthly Salary</label>
              <input
                type="text"
                value={staffForm.salary}
                onChange={e => setStaffForm({ ...staffForm, salary: e.target.value })}
                placeholder="₹35,000 / month"
                className="w-full p-2.5 border rounded-xl font-semibold text-emerald-700 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Annual Leave (Days)</label>
              <input
                type="number"
                value={staffForm.leaveBalance}
                onChange={e => setStaffForm({ ...staffForm, leaveBalance: e.target.value })}
                className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Profile Photo URL</label>
            <input
              type="text"
              value={staffForm.photo}
              onChange={e => setStaffForm({ ...staffForm, photo: e.target.value })}
              placeholder="https://..."
              className="w-full p-2.5 border rounded-xl text-gray-600 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1.5">Module Permissions (Sidebar Navigation Access)</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-gray-50 p-3 rounded-xl border">
              {[
                { id: 'bookings', label: 'Service Bookings' },
                { id: 'orders', label: 'Live Orders' },
                { id: 'inventory', label: 'Inventory Stock' },
                { id: 'customers', label: 'Customer CRM' }
              ].map(perm => (
                <label key={perm.id} className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700">
                  <input
                    type="checkbox"
                    checked={staffForm.permissions.includes(perm.id)}
                    onChange={() => handlePermissionToggle(perm.id)}
                    className="rounded text-amber-500 focus:ring-amber-500 w-4 h-4"
                  />
                  <span>{perm.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-sm transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" /> Generate Credentials & Onboard Staff Member
            </button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
