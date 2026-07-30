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
  Layers,
  Upload,
  Link as LinkIcon,
  X
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
import {
  getServicesSync,
  saveService,
  updateServicePrice as apiUpdatePrice,
  deleteService as apiDeleteService
} from '../../../car-detailing/services/carDetailingApi';

const CATEGORY_OPTIONS = [
  "Paint Protection",
  "Ceramic Coating",
  "Paint Correction",
  "Full Detailing",
  "Engine Bay Detailing",
  "Steam Detailing",
  "Headlight Restoration",
  "Leather Restoration"
];

export default function CarDetailingAdminHubPage() {
  const serviceKey = 'car-detailing';
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
    addStaff,
    addBanner,
    addInventoryItem,
    showToast
  } = useAdmin();

  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') || 'treatments';
  const [activeTab, setActiveTabState] = useState(tabFromUrl);

  // Dynamic Car Detailing Treatments state
  const [detailingServices, setDetailingServices] = useState(getServicesSync());

  useEffect(() => {
    if (searchParams.get('tab')) {
      setActiveTabState(searchParams.get('tab'));
    }
  }, [searchParams]);

  useEffect(() => {
    const syncData = () => {
      setDetailingServices(getServicesSync());
    };
    window.addEventListener('carDetailingDataChanged', syncData);
    return () => {
      window.removeEventListener('carDetailingDataChanged', syncData);
    };
  }, []);

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
  const [selectedServiceItem, setSelectedServiceItem] = useState(null);
  const [newPrice, setNewPrice] = useState(0);

  const [addTreatmentModal, setAddTreatmentModal] = useState(false);
  const [treatmentForm, setTreatmentForm] = useState({
    id: '',
    name: '',
    category: 'Paint Protection',
    price: 499,
    duration: '180 mins',
    rating: 5.0,
    tagline: '',
    description: '',
    image: 'https://images.unsplash.com/photo-1507136566006-cfc505b114fc?auto=format&fit=crop&q=80&w=800',
    features: '',
    inclusions: ''
  });

  const [addPlanModal, setAddPlanModal] = useState(false);
  const [planForm, setPlanForm] = useState({ name: '', price: '', description: '', billing: 'per service' });

  // Photo upload helper state and handler
  const [showUrlInput, setShowUrlInput] = useState(false);

  const handleImageFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('Image size should be less than 5MB', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setTreatmentForm(prev => ({ ...prev, image: reader.result }));
        showToast('Treatment photo loaded successfully!');
      };
      reader.readAsDataURL(file);
    }
  };

  // --- Handlers for Treatment CRUD ---
  const handleOpenAddModal = () => {
    setTreatmentForm({
      id: '',
      name: '',
      category: 'Paint Protection',
      price: 499,
      duration: '180 mins',
      rating: 5.0,
      tagline: '',
      description: '',
      image: 'https://images.unsplash.com/photo-1507136566006-cfc505b114fc?auto=format&fit=crop&q=80&w=800',
      features: 'Computer-cut precision wrap\nSelf-healing surface technology\nHigh-clarity adhesive formula',
      inclusions: 'Pre-install multi-stage clay bar clean\nMicro-fiber care kit'
    });
    setSelectedServiceItem(null);
    setAddTreatmentModal(true);
  };

  const handleOpenEditModal = (item) => {
    setSelectedServiceItem(item);
    setTreatmentForm({
      id: item.id || item._id,
      name: item.name || '',
      category: item.category || 'Paint Protection',
      price: item.price || 0,
      duration: item.duration || '60 mins',
      rating: item.rating || 5.0,
      tagline: item.tagline || '',
      description: item.description || '',
      image: item.image || 'https://images.unsplash.com/photo-1507136566006-cfc505b114fc?auto=format&fit=crop&q=80&w=800',
      features: Array.isArray(item.features) ? item.features.join('\n') : (item.features || ''),
      inclusions: Array.isArray(item.inclusions) ? item.inclusions.join('\n') : (item.inclusions || '')
    });
    setAddTreatmentModal(true);
  };

  const handleSaveTreatment = async (e) => {
    e.preventDefault();
    if (!treatmentForm.name || !treatmentForm.price) return;

    await saveService({
      id: treatmentForm.id,
      name: treatmentForm.name,
      category: treatmentForm.category,
      price: Number(treatmentForm.price),
      duration: treatmentForm.duration,
      rating: Number(treatmentForm.rating) || 5.0,
      reviewsCount: selectedServiceItem?.reviewsCount || 24,
      tagline: treatmentForm.tagline,
      description: treatmentForm.description,
      image: treatmentForm.image,
      features: treatmentForm.features.split('\n').filter(Boolean),
      inclusions: treatmentForm.inclusions.split('\n').filter(Boolean),
      status: selectedServiceItem?.status || 'active'
    });

    // Also update price in global admin context if main service item
    if (treatmentForm.id === serviceMain?.id) {
      updateServicePrice(serviceMain.id, Number(treatmentForm.price));
    }

    setAddTreatmentModal(false);
    showToast(selectedServiceItem ? 'Detailing Treatment updated!' : 'New Detailing Treatment added!');
  };

  const handleOpenPriceModal = (item) => {
    setSelectedServiceItem(item);
    setNewPrice(item.price || 0);
    setEditingPriceModal(true);
  };

  const handleSavePriceSubmit = async () => {
    if (!selectedServiceItem) return;
    await apiUpdatePrice(selectedServiceItem.id || selectedServiceItem._id, newPrice);
    if (selectedServiceItem.id === serviceMain?.id || selectedServiceItem.key === serviceKey) {
      updateServicePrice(serviceMain.id, newPrice);
    }
    setEditingPriceModal(false);
    showToast('Treatment rate updated successfully!');
  };

  const handleDeleteTreatment = async (id) => {
    if (window.confirm('Are you sure you want to delete this detailing treatment from the menu?')) {
      await apiDeleteService(id);
      showToast('Treatment removed from menu', 'error');
    }
  };

  const handleToggleTreatmentStatus = async (item) => {
    const newStatus = item.status === 'inactive' ? 'active' : 'inactive';
    await saveService({ ...item, status: newStatus });
    showToast(`Treatment status set to ${newStatus}`);
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
            <h1 className="text-3xl font-black tracking-tight">{serviceStats.serviceName} Admin Portal</h1>
            <p className="text-xs text-gray-200 mt-1 max-w-xl font-medium">
              Manage Car Detailing Menu, pricing, treatments, packages, bookings & staff in real-time.
            </p>
          </div>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatsCard title="Lifetime Revenue" value={serviceStats.totalRevenue} isCurrency={true} growth={14.2} icon={IndianRupee} iconBg="#fff7ed" iconColor="#e07b2a" />
        <StatsCard title="Monthly Sales" value={serviceStats.monthlySales} isCurrency={true} growth={10.8} icon={TrendingUp} iconBg="#eff6ff" iconColor="#1e4a7e" />
        <StatsCard title="Today's Sales" value={serviceStats.todaySales} isCurrency={true} growth={8.5} icon={CalendarCheck} iconBg="#f0fdf4" iconColor="#10b981" />
        <StatsCard title="Active Treatments" value={detailingServices.length} isCurrency={false} growth={12.0} icon={Layers} iconBg="#faf5ff" iconColor="#8b5cf6" />
      </div>

      {/* Internal Navigation Tabs */}
      <div className="bg-white border border-gray-200 rounded-2xl p-2 shadow-sm flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        {[
          { id: 'treatments', label: `Car Detailing (${detailingServices.length})`, icon: Wrench },
          { id: 'overview', label: 'Overview & Revenue', icon: TrendingUp },
          { id: 'bookings', label: `Service Bookings (${serviceBookings.length})`, icon: CalendarCheck },
          { id: 'staff', label: `Department Staff (${serviceStaff.length})`, icon: Users },
          { id: 'marketing', label: `Promos & Banners (${serviceBanners.length})`, icon: ImageIcon },
          { id: 'inventory', label: `Supplies & Stock (${serviceInventory.length})`, icon: Package }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id || (tab.id === 'treatments' && activeTab === 'packages');
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

      {/* TAB 1: CAR DETAILING MENU MANAGEMENT */}
      {(activeTab === 'treatments' || activeTab === 'packages') && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <div>
              <h3 className="text-base font-bold text-gray-900">Manage Car Detailing Menu</h3>
              <p className="text-xs text-gray-500">Add, edit pricing, or remove car detailing treatments displayed on the user application.</p>
            </div>
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2.5 bg-[#FF6B00] hover:bg-[#E66000] text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Detailing Treatment</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {detailingServices.map((service) => (
              <div
                key={service.id || service._id}
                className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs flex flex-col justify-between group hover:border-amber-300 transition-all"
              >
                <div>
                  <div className="relative h-40 w-full overflow-hidden">
                    <img
                      src={service.image}
                      alt={service.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 px-2.5 py-1 bg-black/80 backdrop-blur-md text-[#FF6B00] text-[10px] font-bold rounded-full">
                      {service.category}
                    </div>
                    <button
                      onClick={() => handleToggleTreatmentStatus(service)}
                      className={`absolute top-3 right-3 px-2.5 py-1 text-[10px] font-bold rounded-full text-white ${
                        service.status !== 'inactive' ? 'bg-emerald-500' : 'bg-gray-600'
                      }`}
                    >
                      {service.status !== 'inactive' ? 'Active' : 'Inactive'}
                    </button>
                  </div>

                  <div className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-sm text-gray-900 leading-snug">{service.name}</h4>
                      <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/50 shrink-0">
                        <Star className="w-3 h-3 fill-current" />
                        <span>{service.rating}</span>
                      </div>
                    </div>

                    <p className="text-xs text-gray-500 line-clamp-2">{service.tagline}</p>

                    <div className="pt-2 flex items-center justify-between text-xs text-gray-400">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{service.duration}</span>
                      </div>
                      <div className="text-lg font-black text-amber-600">
                        ₹{Number(service.price).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleOpenPriceModal(service)}
                    className="px-3 py-1.5 text-xs font-bold text-amber-700 bg-amber-100/70 hover:bg-amber-200 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <IndianRupee className="w-3.5 h-3.5" />
                    <span>Edit Price</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(service)}
                      className="p-2 text-gray-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                      title="Edit Details"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTreatment(service.id || service._id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Treatment"
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

      {/* TAB 2: OVERVIEW & REVENUE */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-bold text-gray-900">Revenue Growth</h3>
              <p className="text-xs text-gray-400">Monthly breakdown for Car Detailing</p>
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
                <span className="text-gray-500 block font-semibold">Average Treatment Price</span>
                <span className="text-xl font-black text-amber-700">₹{Math.round(detailingServices.reduce((acc, s) => acc + s.price, 0) / (detailingServices.length || 1))}</span>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200/60">
                <span className="text-gray-500 block font-semibold">Total Menu Treatments</span>
                <span className="text-xl font-black text-blue-900">{detailingServices.length}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PACKAGES & PRICING */}
      {activeTab === 'packages' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Sub-Service Packages</h3>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setAddPlanModal(true)} className="px-3.5 py-2 text-xs font-bold text-white bg-amber-500 rounded-xl hover:bg-amber-600">
                + Add New Package
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {serviceMain?.plans?.map((plan) => (
              <div key={plan.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3 relative group">
                <h4 className="text-lg font-black text-gray-900">{plan.name}</h4>
                <p className="text-xs text-gray-500">{plan.description}</p>
                <div className="pt-3 border-t flex items-center justify-between">
                  <span className="text-2xl font-black text-amber-600">₹{plan.price}</span>
                  <button
                    onClick={() => deleteServicePlan(serviceMain.id, plan.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: BOOKINGS */}
      {activeTab === 'bookings' && (
        <DataTable
          columns={[
            { header: 'ID', accessorKey: 'id' },
            { header: 'Customer', accessorKey: 'customerName' },
            { header: 'Package / Treatment', accessorKey: 'plan' },
            { header: 'Slot', accessorKey: 'timeSlot' },
            { header: 'Total (₹)', accessorKey: 'total', cell: (r) => <span>₹{r.total}</span> },
            { header: 'Status', accessorKey: 'status' }
          ]}
          data={serviceBookings}
          searchPlaceholder="Search Bookings..."
        />
      )}

      {/* TAB 5: STAFF */}
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

      {/* TAB 6: MARKETING & BANNERS */}
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

      {/* TAB 7: INVENTORY */}
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

      {/* MODAL: ADD / EDIT DETAILING TREATMENT */}
      <AdminModal
        isOpen={addTreatmentModal}
        onClose={() => setAddTreatmentModal(false)}
        title={selectedServiceItem ? "Edit Detailing Treatment" : "Add New Detailing Treatment"}
      >
        <form onSubmit={handleSaveTreatment} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-gray-700 mb-1">Treatment Title / Name *</label>
            <input
              type="text"
              required
              value={treatmentForm.name}
              onChange={e => setTreatmentForm({ ...treatmentForm, name: e.target.value })}
              placeholder="e.g. Paint Protection Film (PPF)"
              className="w-full p-2.5 border rounded-xl outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-700 mb-1">Category *</label>
              <select
                value={treatmentForm.category}
                onChange={e => setTreatmentForm({ ...treatmentForm, category: e.target.value })}
                className="w-full p-2.5 border rounded-xl outline-none focus:border-amber-500 bg-white"
              >
                {CATEGORY_OPTIONS.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Price (₹) *</label>
              <input
                type="number"
                required
                min="0"
                value={treatmentForm.price}
                onChange={e => setTreatmentForm({ ...treatmentForm, price: e.target.value })}
                className="w-full p-2.5 border rounded-xl outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-700 mb-1">Duration</label>
              <input
                type="text"
                value={treatmentForm.duration}
                onChange={e => setTreatmentForm({ ...treatmentForm, duration: e.target.value })}
                placeholder="e.g. 180 mins"
                className="w-full p-2.5 border rounded-xl outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Rating</label>
              <input
                type="number"
                step="0.1"
                min="1"
                max="5"
                value={treatmentForm.rating}
                onChange={e => setTreatmentForm({ ...treatmentForm, rating: e.target.value })}
                className="w-full p-2.5 border rounded-xl outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Tagline (Short Summary)</label>
            <input
              type="text"
              value={treatmentForm.tagline}
              onChange={e => setTreatmentForm({ ...treatmentForm, tagline: e.target.value })}
              placeholder="e.g. Self-healing thermoplastic urethane shield against rock chips."
              className="w-full p-2.5 border rounded-xl outline-none focus:border-amber-500"
            />
          </div>

          {/* Photo Upload Component */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block font-bold text-gray-700">Treatment Photo *</label>
              <button
                type="button"
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="text-[11px] font-bold text-amber-600 hover:text-amber-700 underline flex items-center gap-1 cursor-pointer"
              >
                <LinkIcon className="w-3 h-3" />
                <span>{showUrlInput ? 'Use Photo File Upload' : 'Paste Image URL Instead'}</span>
              </button>
            </div>

            {showUrlInput ? (
              <input
                type="text"
                value={treatmentForm.image}
                onChange={e => setTreatmentForm({ ...treatmentForm, image: e.target.value })}
                placeholder="https://images.unsplash.com/..."
                className="w-full p-2.5 border rounded-xl outline-none focus:border-amber-500"
              />
            ) : (
              <div className="space-y-2">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 hover:border-amber-500 rounded-xl cursor-pointer bg-gray-50 hover:bg-amber-50/40 transition-all p-3 text-center group">
                  <Upload className="w-6 h-6 text-gray-400 group-hover:text-amber-500 mb-1" />
                  <span className="font-bold text-gray-700 group-hover:text-amber-600 text-xs">
                    Click to Upload Treatment Photo
                  </span>
                  <span className="text-[10px] text-gray-400 mt-0.5">PNG, JPG, WEBP, GIF up to 5MB</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />
                </label>

                {treatmentForm.image && (
                  <div className="relative w-full h-32 rounded-xl overflow-hidden border border-gray-200 group/img bg-gray-100 shadow-inner">
                    <img
                      src={treatmentForm.image}
                      alt="Treatment Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <label className="px-3 py-1.5 bg-white text-gray-800 text-xs font-bold rounded-lg cursor-pointer hover:bg-gray-100 shadow-sm flex items-center gap-1">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Change Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageFileChange}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => setTreatmentForm({ ...treatmentForm, image: '' })}
                        className="p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-sm"
                        title="Remove Photo"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Full Description</label>
            <textarea
              rows={3}
              value={treatmentForm.description}
              onChange={e => setTreatmentForm({ ...treatmentForm, description: e.target.value })}
              placeholder="Detailed information about this treatment..."
              className="w-full p-2.5 border rounded-xl outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Features (One per line)</label>
            <textarea
              rows={3}
              value={treatmentForm.features}
              onChange={e => setTreatmentForm({ ...treatmentForm, features: e.target.value })}
              placeholder="Computer-cut wrap&#10;Self-healing technology"
              className="w-full p-2.5 border rounded-xl outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Inclusions (One per line)</label>
            <textarea
              rows={2}
              value={treatmentForm.inclusions}
              onChange={e => setTreatmentForm({ ...treatmentForm, inclusions: e.target.value })}
              placeholder="Clay bar clean&#10;Microfiber kit"
              className="w-full p-2.5 border rounded-xl outline-none focus:border-amber-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-[#FF6B00] hover:bg-[#E66000] text-white font-bold rounded-xl transition-colors shadow-sm"
          >
            {selectedServiceItem ? "Update Detailing Treatment" : "Save & Publish Treatment"}
          </button>
        </form>
      </AdminModal>

      {/* MODAL: EDIT PRICE */}
      <AdminModal
        isOpen={editingPriceModal}
        onClose={() => setEditingPriceModal(false)}
        title={`Edit Price: ${selectedServiceItem?.name || ''}`}
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-gray-700 mb-1">New Treatment Price (₹)</label>
            <input
              type="number"
              min="0"
              value={newPrice}
              onChange={e => setNewPrice(Number(e.target.value))}
              className="w-full p-2.5 border rounded-xl text-base font-bold outline-none focus:border-amber-500"
            />
          </div>

          <button
            onClick={handleSavePriceSubmit}
            className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-colors"
          >
            Save Rate Update
          </button>
        </div>
      </AdminModal>

      {/* MODAL: ADD PACKAGE */}
      <AdminModal
        isOpen={addPlanModal}
        onClose={() => setAddPlanModal(false)}
        title="Add Sub-Service Package"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-gray-700 mb-1">Package Name</label>
            <input
              type="text"
              value={planForm.name}
              onChange={e => setPlanForm({ ...planForm, name: e.target.value })}
              className="w-full p-2 border rounded-xl"
              placeholder="e.g. Express Detail"
            />
          </div>
          <div>
            <label className="block font-bold text-gray-700 mb-1">Price (₹)</label>
            <input
              type="number"
              value={planForm.price}
              onChange={e => setPlanForm({ ...planForm, price: e.target.value })}
              className="w-full p-2 border rounded-xl"
              placeholder="799"
            />
          </div>
          <div>
            <label className="block font-bold text-gray-700 mb-1">Description</label>
            <input
              type="text"
              value={planForm.description}
              onChange={e => setPlanForm({ ...planForm, description: e.target.value })}
              className="w-full p-2 border rounded-xl"
              placeholder="Package description"
            />
          </div>
          <button
            onClick={handleSavePlan}
            className="w-full py-2 bg-amber-500 text-white font-bold rounded-xl"
          >
            Save Package
          </button>
        </div>
      </AdminModal>
    </div>
  );
}
