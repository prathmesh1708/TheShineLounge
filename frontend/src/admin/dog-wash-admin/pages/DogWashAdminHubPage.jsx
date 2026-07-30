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
import serviceApi from '../../../common/services/serviceApi';

export default function DogWashAdminHubPage() {
  const serviceKey = 'dog-wash';
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

  const fetchLiveService = async () => {
    try {
      const res = await serviceApi.getServiceBySlug('dog-wash');
      if (res.success && res.service) {
        setDbService(res.service);
        localStorage.setItem('tsl_dog_wash_service', JSON.stringify(res.service));
        return;
      }
    } catch (err) {
      console.warn('Could not fetch live dog-wash service, checking local storage');
    }
    const cached = localStorage.getItem('tsl_dog_wash_service');
    if (cached) {
      setDbService(JSON.parse(cached));
    } else {
      setDbService({
        _id: serviceMain?.id || 'srv-3',
        pricing: [
          { _id: '2-min', title: '2 Minutes Wash', price: 100, description: 'Quick 2 minutes warm hydrobath session' },
          { _id: '5-min', title: '5 Minutes Wash', price: 200, description: 'Standard 5 minutes warm hydrobath session' },
          { _id: '12-min', title: '12 Minutes Wash', price: 500, description: 'Extended 12 minutes deluxe warm hydrobath session' }
        ],
        plans: [
          { _id: '2-min', name: '2 Minutes Wash', price: 100, description: 'Quick 2 minutes warm hydrobath session' },
          { _id: '5-min', name: '5 Minutes Wash', price: 200, description: 'Standard 5 minutes warm hydrobath session' },
          { _id: '12-min', name: '12 Minutes Wash', price: 500, description: 'Extended 12 minutes deluxe warm hydrobath session' }
        ],
        memberships: [
          { _id: 'mem-1', name: 'Monthly Dog Spa Pass', price: 999, benefits: ['4 Self-Serve Hydrobath washes per month', 'Free Treat Bag', '10% Off Pet Grooming Toys'], badge: 'PET PARENT FAVORITE' }
        ]
      });
    }
  };

  useEffect(() => {
    fetchLiveService();
  }, []);

  // Helper to reliably resolve MongoDB target _id
  const getTargetServiceId = async () => {
    if (dbService?._id) return dbService._id;
    try {
      const allRes = await serviceApi.getServices();
      if (allRes.success && allRes.services) {
        const found = allRes.services.find(s => s.slug === 'dog-wash' || s.serviceName.toLowerCase().includes('dog'));
        if (found) return found._id;
      }
    } catch (err) {
      console.warn('Could not resolve target service ID:', err);
    }
    return null;
  };

  // Compute active pricing and memberships from dbService directly
  const activePricing = (dbService?.pricing !== undefined)
    ? dbService.pricing.map(p => ({
        _id: p._id || p.id || p.title,
        title: p.title || p.name,
        price: Number(p.price) || 0,
        description: p.description || ''
      }))
    : ((dbService?.plans !== undefined)
      ? dbService.plans.map(p => ({
          _id: p._id || p.id || p.name,
          title: p.name || p.title,
          price: Number(p.price) || 0,
          description: p.description || (p.features && p.features.join(', ')) || ''
        }))
      : (serviceMain?.pricing || [
          { _id: '2-min', title: '2 Minutes Wash', price: 100, description: 'Quick 2 minutes warm hydrobath session' },
          { _id: '5-min', title: '5 Minutes Wash', price: 200, description: 'Standard 5 minutes warm hydrobath session' },
          { _id: '12-min', title: '12 Minutes Wash', price: 500, description: 'Extended 12 minutes deluxe warm hydrobath session' }
        ]));

  const activeMemberships = (dbService?.memberships !== undefined)
    ? dbService.memberships.map(m => ({
        _id: m._id || m.id || m.name,
        name: m.name || m.title,
        price: Number(m.price) || 0,
        benefits: Array.isArray(m.benefits) ? m.benefits : [m.benefits || m.description || ''],
        badge: m.badge || 'PASS'
      }))
    : (serviceMain?.memberships || [
        { _id: 'mem-1', name: 'Monthly Dog Spa Pass', price: 999, benefits: ['4 Self-Serve Hydrobath washes per month', 'Free Treat Bag', '10% Off Pet Grooming Toys'], badge: 'PET PARENT FAVORITE' }
      ]);

  // Modal Editing States
  const [editingPriceModal, setEditingPriceModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // { type: 'pricing'|'plan'|'membership', id, title }
  const [editTitle, setEditTitle] = useState('');
  const [editPrice, setEditPrice] = useState(100);
  const [editDescription, setEditDescription] = useState('');

  // Add Package Modal States
  const [addPackageModal, setAddPackageModal] = useState(false);
  const [newPkgForm, setNewPkgForm] = useState({
    title: '',
    price: '',
    description: '',
    type: 'pricing'
  });

  const handleOpenEdit = (type, item) => {
    setEditingItem({
      type,
      id: item._id || item.id,
      title: item.title || item.name
    });
    setEditTitle(item.title || item.name || '');
    setEditPrice(item.price);
    setEditDescription(
      type === 'membership'
        ? (Array.isArray(item.benefits) ? item.benefits.join(', ') : (item.benefits || ''))
        : (item.description || (item.features ? item.features.join(', ') : ''))
    );
    setEditingPriceModal(true);
  };

  const handleSavePrice = async () => {
    const numPrice = Number(editPrice);
    if (!numPrice || numPrice <= 0 || !editingItem || !editTitle.trim()) return;

    const newTitle = editTitle.trim();

    try {
      let currentPricing = activePricing.map(p => {
        if ((p._id && p._id === editingItem.id) || (p.id && p.id === editingItem.id) || p.title === editingItem.title) {
          return { ...p, title: newTitle, price: numPrice, description: editDescription.trim() };
        }
        return p;
      });

      let currentMemberships = activeMemberships.map(m => {
        if ((m._id && m._id === editingItem.id) || (m.id && m.id === editingItem.id) || m.name === editingItem.title) {
          return { ...m, name: newTitle, price: numPrice, benefits: [editDescription.trim()] };
        }
        return m;
      });

      const payloadPricing = currentPricing.map(p => ({
        title: String(p.title || p.name).trim(),
        price: Number(p.price) || 0,
        description: String(p.description || '').trim(),
        gst: true
      }));

      const payloadPlans = currentPricing.map(p => ({
        name: String(p.title || p.name).trim(),
        price: Number(p.price) || 0,
        description: String(p.description || '').trim(),
        features: [String(p.description || '').trim()]
      }));

      const payloadMemberships = currentMemberships.map(m => ({
        name: String(m.name || m.title).trim(),
        price: Number(m.price) || 0,
        benefits: Array.isArray(m.benefits) ? m.benefits : [String(m.benefits || '').trim()],
        badge: String(m.badge || 'PASS').trim()
      }));

      const targetId = await getTargetServiceId();
      if (targetId) {
        try {
          const res = await serviceApi.updateService(targetId, {
            pricing: payloadPricing,
            plans: payloadPlans,
            memberships: payloadMemberships
          });
          if (res.success && res.service) {
            setDbService(res.service);
          }
        } catch (apiErr) {
          console.warn('API update failed, updating local state:', apiErr.message);
        }
      }

      const newDbService = {
        ...(dbService || serviceMain),
        _id: targetId || dbService?._id || 'srv-3',
        pricing: payloadPricing,
        plans: payloadPlans,
        memberships: payloadMemberships
      };

      setDbService(newDbService);
      localStorage.setItem('tsl_dog_wash_service', JSON.stringify(newDbService));

      if (showToast) showToast('Dog Wash package title, price & details updated live!');
      updateServicePrice(serviceMain.id, numPrice);
    } catch (err) {
      console.error('Failed to update package details:', err);
    }
    setEditingPriceModal(false);
  };

  const handleCreatePackage = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!newPkgForm.title || !newPkgForm.price) {
      alert('Please fill out Package Title and Price');
      return;
    }
    const numPrice = Number(newPkgForm.price);
    const newId = `pkg-${Date.now()}`;

    try {
      let currentPricing = [...activePricing];
      let currentMemberships = [...activeMemberships];

      if (newPkgForm.type === 'membership') {
        currentMemberships.push({
          _id: newId,
          name: newPkgForm.title.trim(),
          price: numPrice,
          benefits: [newPkgForm.description.trim()],
          badge: 'NEW PASS'
        });
      } else {
        currentPricing.push({
          _id: newId,
          title: newPkgForm.title.trim(),
          price: numPrice,
          description: newPkgForm.description.trim()
        });
      }

      const payloadPricing = currentPricing.map(p => ({
        title: String(p.title || p.name).trim(),
        price: Number(p.price) || 0,
        description: String(p.description || '').trim(),
        gst: true
      }));

      const payloadPlans = currentPricing.map(p => ({
        name: String(p.title || p.name).trim(),
        price: Number(p.price) || 0,
        description: String(p.description || '').trim(),
        features: [String(p.description || '').trim()]
      }));

      const payloadMemberships = currentMemberships.map(m => ({
        name: String(m.name || m.title).trim(),
        price: Number(m.price) || 0,
        benefits: Array.isArray(m.benefits) ? m.benefits : [String(m.benefits || '').trim()],
        badge: String(m.badge || 'PASS').trim()
      }));

      const targetId = await getTargetServiceId();
      if (targetId) {
        try {
          const res = await serviceApi.updateService(targetId, {
            pricing: payloadPricing,
            plans: payloadPlans,
            memberships: payloadMemberships
          });
          if (res.success && res.service) {
            setDbService(res.service);
          }
        } catch (apiErr) {
          console.warn('API create package sync error:', apiErr.message);
        }
      }

      const newDbService = {
        ...(dbService || serviceMain),
        _id: targetId || dbService?._id || 'srv-3',
        pricing: payloadPricing,
        plans: payloadPlans,
        memberships: payloadMemberships
      };

      setDbService(newDbService);
      localStorage.setItem('tsl_dog_wash_service', JSON.stringify(newDbService));

      if (showToast) showToast('New Dog Wash service package created!');
      setAddPackageModal(false);
      setNewPkgForm({ title: '', price: '', description: '', type: 'pricing' });
    } catch (err) {
      console.error('Failed to create new package:', err);
      alert('Failed to create package: ' + err.message);
    }
  };

  const handleDeletePackage = async (type, item) => {
    const itemTitle = String(item.title || item.name || '').trim();
    const itemId = item._id || item.id;
    const confirmDelete = window.confirm(`Are you sure you want to delete "${itemTitle}"?`);
    if (!confirmDelete) return;

    try {
      let currentPricing = activePricing.filter(p => {
        const pId = p._id || p.id;
        const pTitle = String(p.title || p.name || '').trim();
        if (itemId && pId && String(pId) === String(itemId)) return false;
        if (itemTitle && pTitle && pTitle.toLowerCase() === itemTitle.toLowerCase()) return false;
        return true;
      });

      let currentMemberships = activeMemberships.filter(m => {
        const mId = m._id || m.id;
        const mName = String(m.name || m.title || '').trim();
        if (itemId && mId && String(mId) === String(itemId)) return false;
        if (itemTitle && mName && mName.toLowerCase() === itemTitle.toLowerCase()) return false;
        return true;
      });

      const payloadPricing = currentPricing.map(p => ({
        title: String(p.title || p.name).trim(),
        price: Number(p.price) || 0,
        description: String(p.description || '').trim(),
        gst: true
      }));

      const payloadPlans = currentPricing.map(p => ({
        name: String(p.title || p.name).trim(),
        price: Number(p.price) || 0,
        description: String(p.description || '').trim(),
        features: [String(p.description || '').trim()]
      }));

      const payloadMemberships = currentMemberships.map(m => ({
        name: String(m.name || m.title).trim(),
        price: Number(m.price) || 0,
        benefits: Array.isArray(m.benefits) ? m.benefits : [String(m.benefits || '').trim()],
        badge: String(m.badge || 'PASS').trim()
      }));

      const targetId = await getTargetServiceId();
      if (targetId) {
        try {
          const res = await serviceApi.updateService(targetId, {
            pricing: payloadPricing,
            plans: payloadPlans,
            memberships: payloadMemberships
          });
          if (res.success && res.service) {
            setDbService(res.service);
            localStorage.setItem('tsl_dog_wash_service', JSON.stringify(res.service));
          }
        } catch (apiErr) {
          console.warn('API delete package error:', apiErr.message);
        }
      }

      const newDbService = {
        ...(dbService || serviceMain),
        _id: targetId || dbService?._id || 'srv-3',
        pricing: payloadPricing,
        plans: payloadPlans,
        memberships: payloadMemberships
      };

      setDbService(newDbService);
      localStorage.setItem('tsl_dog_wash_service', JSON.stringify(newDbService));

      if (showToast) showToast(`Package "${itemTitle}" deleted successfully`, 'error');
    } catch (err) {
      console.error('Failed to delete package:', err);
      alert('Error deleting package: ' + err.message);
    }
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
        <div className="absolute inset-0 bg-gradient-to-r from-purple-950/95 via-purple-900/80 to-transparent" />
        
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
                <span className="text-xl font-black text-amber-700">₹{activePricing[0]?.price || 100}</span>
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white border border-gray-200 rounded-2xl p-4 shadow-sm gap-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Active Packages & Memberships</h3>
              <p className="text-xs text-gray-500">Click "Edit Price" on any plan to update live price and description, or create/delete packages</p>
            </div>
            <button
              onClick={() => setAddPackageModal(true)}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" /> Add New Package
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Pricing Cards */}
            {activePricing.map((p) => (
              <div key={p._id || p.id || p.title} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <h4 className="text-lg font-black text-gray-900">{p.title || p.name}</h4>
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                      SINGLE SERVICE
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{p.description}</p>
                </div>
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                  <span className="text-2xl font-black text-amber-600">₹{p.price}</span>
                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={() => handleOpenEdit('pricing', p)}
                      className="px-3 py-1.5 bg-amber-500 text-white rounded-xl text-xs font-bold hover:bg-amber-600 shadow-xs transition-all flex items-center gap-1"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Edit Price & Details
                    </button>
                    <button
                      onClick={() => handleDeletePackage('pricing', p)}
                      className="p-1.5 text-red-500 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-all"
                      title="Delete Package"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Membership Cards */}
            {activeMemberships.map((m) => (
              <div key={m._id || m.id || m.name} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <h4 className="text-lg font-black text-gray-900">{m.name}</h4>
                    {m.badge ? (
                      <span className="text-[10px] uppercase tracking-wider font-extrabold text-white bg-amber-500 px-2 py-0.5 rounded-md">
                        {m.badge}
                      </span>
                    ) : (
                      <span className="text-[10px] uppercase tracking-wider font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                        PASS
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{Array.isArray(m.benefits) ? m.benefits.join(', ') : m.benefits}</p>
                </div>
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                  <span className="text-2xl font-black text-amber-600">₹{m.price.toLocaleString()}</span>
                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={() => handleOpenEdit('membership', m)}
                      className="px-3 py-1.5 bg-amber-500 text-white rounded-xl text-xs font-bold hover:bg-amber-600 shadow-xs transition-all flex items-center gap-1"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Edit Price & Details
                    </button>
                    <button
                      onClick={() => handleDeletePackage('membership', m)}
                      className="p-1.5 text-red-500 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-all"
                      title="Delete Membership Pass"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
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

      {/* Modal: Edit Package Title, Price & Description */}
      <AdminModal isOpen={editingPriceModal} onClose={() => setEditingPriceModal(false)} title={`Edit ${editingItem?.title || 'Package'}`}>
        <div className="space-y-4 text-xs p-1">
          <div>
            <label className="block font-bold text-gray-700 mb-1">Package Title *</label>
            <input 
              type="text" 
              required
              value={editTitle} 
              onChange={e => setEditTitle(e.target.value)} 
              className="w-full p-2.5 border rounded-xl font-bold text-gray-800 focus:ring-2 focus:ring-amber-500 focus:outline-none" 
              placeholder="e.g. Full-Service Grooming Package"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Price (₹) *</label>
            <input 
              type="number" 
              required
              value={editPrice} 
              onChange={e => setEditPrice(Number(e.target.value))} 
              className="w-full p-2.5 border rounded-xl font-black text-amber-600 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none" 
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Description / Included Details</label>
            <textarea 
              value={editDescription} 
              onChange={e => setEditDescription(e.target.value)} 
              rows={3} 
              className="w-full p-2.5 border rounded-xl text-gray-700 focus:ring-2 focus:ring-amber-500 focus:outline-none" 
              placeholder="e.g. Quick 2 minutes warm hydrobath session" 
            />
          </div>

          <button 
            onClick={handleSavePrice} 
            className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-xs transition-all text-xs uppercase tracking-wider"
          >
            Save Package Details
          </button>
        </div>
      </AdminModal>

      {/* Modal: Add New Package */}
      <AdminModal isOpen={addPackageModal} onClose={() => setAddPackageModal(false)} title="Add New Dog Wash Package">
        <form onSubmit={handleCreatePackage} className="space-y-4 text-xs p-1">
          <div>
            <label className="block font-bold text-gray-700 mb-1">Package Title *</label>
            <input 
              type="text" 
              required 
              value={newPkgForm.title} 
              onChange={e => setNewPkgForm({ ...newPkgForm, title: e.target.value })} 
              placeholder="e.g. 15 Minutes Full Deluxe Wash" 
              className="w-full p-2.5 border rounded-xl font-bold text-gray-800 focus:ring-2 focus:ring-amber-500 focus:outline-none" 
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-700 mb-1">Price (₹) *</label>
              <input 
                type="number" 
                required 
                value={newPkgForm.price} 
                onChange={e => setNewPkgForm({ ...newPkgForm, price: e.target.value })} 
                placeholder="e.g. 600" 
                className="w-full p-2.5 border rounded-xl font-black text-amber-600 focus:ring-2 focus:ring-amber-500 focus:outline-none" 
              />
            </div>
            <div>
              <label className="block font-bold text-gray-700 mb-1">Package Category</label>
              <select 
                value={newPkgForm.type} 
                onChange={e => setNewPkgForm({ ...newPkgForm, type: e.target.value })} 
                className="w-full p-2.5 border rounded-xl font-semibold text-gray-700 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value="pricing">Single Wash Service</option>
                <option value="membership">Membership Pass</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Description / Details *</label>
            <textarea 
              required 
              value={newPkgForm.description} 
              onChange={e => setNewPkgForm({ ...newPkgForm, description: e.target.value })} 
              rows={3} 
              className="w-full p-2.5 border rounded-xl text-gray-700 focus:ring-2 focus:ring-amber-500 focus:outline-none" 
              placeholder="e.g. 15 minutes luxury warm bath with conditioner & blow dry" 
            />
          </div>

          <button 
            type="submit" 
            className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-xs transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Create Service Package
          </button>
        </form>
      </AdminModal>
    </div>
  );
}
