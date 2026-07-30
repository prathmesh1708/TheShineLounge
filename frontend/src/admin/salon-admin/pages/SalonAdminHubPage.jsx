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
  Scissors,
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
  deleteService as apiDeleteService,
  getCategoriesSync,
  getTimeSlotsSync,
  saveTimeSlot as apiSaveTimeSlot,
  deleteTimeSlot as apiDeleteTimeSlot
} from '../../../salon/services/salonApi';

export default function SalonAdminHubPage() {
  const serviceKey = 'salon';
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
  const tabFromUrl = searchParams.get('tab') || 'services';
  const [activeTab, setActiveTabState] = useState(tabFromUrl);

  // Dynamic Salon Services & Time Slots State
  const [salonServices, setSalonServices] = useState(getServicesSync());
  const [salonTimeSlots, setSalonTimeSlots] = useState(getTimeSlotsSync());
  const categoriesList = getCategoriesSync();

  useEffect(() => {
    if (searchParams.get('tab')) {
      setActiveTabState(searchParams.get('tab'));
    }
  }, [searchParams]);

  useEffect(() => {
    const syncData = () => {
      setSalonServices(getServicesSync());
      setSalonTimeSlots(getTimeSlotsSync());
    };
    window.addEventListener('salonDataChanged', syncData);
    return () => {
      window.removeEventListener('salonDataChanged', syncData);
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

  const [addServiceModal, setAddServiceModal] = useState(false);
  const [serviceForm, setServiceForm] = useState({
    id: '',
    name: '',
    category: 'Hair Cut',
    price: 350,
    duration: '30 mins',
    rating: 4.9,
    tagline: '',
    description: '',
    image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=600',
    features: '',
    inclusions: ''
  });

  const [showUrlInput, setShowUrlInput] = useState(false);
  const [addPlanModal, setAddPlanModal] = useState(false);
  const [planForm, setPlanForm] = useState({ name: '', price: '', description: '', billing: 'per service' });

  // Helper: Shift Detection & Presets for Time Slots
  const getShiftFromTimeString = (timeStr) => {
    if (!timeStr) return 'Morning';
    const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return 'Morning';
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const period = match[3].toUpperCase();

    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;

    const totalMinutes = hours * 60 + minutes;

    if (totalMinutes < 720) return 'Morning';
    if (totalMinutes < 1020) return 'Afternoon';
    return 'Evening';
  };

  const SHIFT_PRESET_TIMES = {
    Morning: ['08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM'],
    Afternoon: ['12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM'],
    Evening: ['05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM', '08:00 PM', '08:30 PM']
  };

  // Dynamic Time Slot Modal & Filter State
  const [slotCategoryFilter, setSlotCategoryFilter] = useState('All');
  const [addSlotModal, setAddSlotModal] = useState(false);
  const [selectedSlotItem, setSelectedSlotItem] = useState(null);
  const [slotForm, setSlotForm] = useState({
    id: '',
    time: '09:00 AM',
    status: 'active',
    category: 'Morning'
  });

  // Time Slot Handlers
  const handleOpenAddSlotModal = () => {
    setSelectedSlotItem(null);
    const defaultShift = slotCategoryFilter !== 'All' ? slotCategoryFilter : 'Morning';
    const defaultTime = SHIFT_PRESET_TIMES[defaultShift] ? SHIFT_PRESET_TIMES[defaultShift][0] : '09:00 AM';
    setSlotForm({
      id: '',
      time: defaultTime,
      status: 'active',
      category: defaultShift
    });
    setAddSlotModal(true);
  };

  const handleOpenEditSlotModal = (slot) => {
    setSelectedSlotItem(slot);
    const shift = slot.category || getShiftFromTimeString(slot.time);
    setSlotForm({
      id: slot.id,
      time: slot.time || '',
      status: slot.status || 'active',
      category: shift
    });
    setAddSlotModal(true);
  };

  const handleShiftChangeInModal = (newShift) => {
    const currentShiftOfTime = getShiftFromTimeString(slotForm.time);
    let newTime = slotForm.time;

    // If current time does not belong to the newly selected shift, change time to first preset of new shift
    if (currentShiftOfTime !== newShift) {
      newTime = SHIFT_PRESET_TIMES[newShift] ? SHIFT_PRESET_TIMES[newShift][0] : '09:00 AM';
    }

    setSlotForm(prev => ({
      ...prev,
      category: newShift,
      time: newTime
    }));
  };

  const handleTimeChangeInModal = (newTimeStr) => {
    const autoShift = getShiftFromTimeString(newTimeStr);
    setSlotForm(prev => ({
      ...prev,
      time: newTimeStr,
      category: autoShift
    }));
  };

  const handleSaveSlot = async (e) => {
    e.preventDefault();
    if (!slotForm.time) return;

    // Final validation: Ensure shift matches time
    const autoShift = getShiftFromTimeString(slotForm.time);

    await apiSaveTimeSlot({
      id: slotForm.id,
      time: slotForm.time,
      status: slotForm.status,
      category: autoShift
    });

    setAddSlotModal(false);
    showToast(selectedSlotItem ? 'Salon time slot updated!' : 'New Salon time slot added!');
  };

  const handleDeleteSlot = async (id) => {
    if (window.confirm('Are you sure you want to delete this time slot?')) {
      await apiDeleteTimeSlot(id);
      showToast('Time slot removed', 'error');
    }
  };

  const handleToggleSlotStatus = async (slot) => {
    const newStatus = slot.status === 'inactive' ? 'active' : 'inactive';
    await apiSaveTimeSlot({ ...slot, status: newStatus });
    showToast(`Time slot status updated to ${newStatus}`);
  };



  // Photo upload handler
  const handleImageFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('Image size should be less than 5MB', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setServiceForm(prev => ({ ...prev, image: reader.result }));
        showToast('Salon service photo loaded successfully!');
      };
      reader.readAsDataURL(file);
    }
  };

  // Handlers for Salon Service CRUD
  const handleOpenAddModal = () => {
    setServiceForm({
      id: '',
      name: '',
      category: 'Hair Cut',
      price: 350,
      duration: '30 mins',
      rating: 4.9,
      tagline: '',
      description: '',
      image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=600',
      features: 'Personalized style consultation\nRelaxing shampoo & scalp massage\nBlow dry & styling',
      inclusions: 'Hair consultation\nShampoo wash\nPrecision styling'
    });
    setSelectedServiceItem(null);
    setAddServiceModal(true);
  };

  const handleOpenEditModal = (item) => {
    setSelectedServiceItem(item);
    setServiceForm({
      id: item.id || item._id,
      name: item.name || '',
      category: item.category || 'Hair Cut',
      price: item.price || 0,
      duration: item.duration || '30 mins',
      rating: item.rating || 4.9,
      tagline: item.tagline || '',
      description: item.description || '',
      image: item.image || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=600',
      features: Array.isArray(item.features) ? item.features.join('\n') : (item.features || ''),
      inclusions: Array.isArray(item.inclusions) ? item.inclusions.join('\n') : (item.inclusions || '')
    });
    setAddServiceModal(true);
  };

  const handleSaveSalonService = async (e) => {
    e.preventDefault();
    if (!serviceForm.name || !serviceForm.price) return;

    await saveService({
      id: serviceForm.id,
      name: serviceForm.name,
      category: serviceForm.category,
      price: Number(serviceForm.price),
      duration: serviceForm.duration,
      rating: Number(serviceForm.rating) || 4.9,
      reviewsCount: selectedServiceItem?.reviewsCount || 18,
      tagline: serviceForm.tagline,
      description: serviceForm.description,
      image: serviceForm.image,
      features: serviceForm.features.split('\n').filter(Boolean),
      inclusions: serviceForm.inclusions.split('\n').filter(Boolean),
      status: selectedServiceItem?.status || 'active'
    });

    if (serviceForm.id === serviceMain?.id) {
      updateServicePrice(serviceMain.id, Number(serviceForm.price));
    }

    setAddServiceModal(false);
    showToast(selectedServiceItem ? 'Salon service updated!' : 'New Salon service published!');
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
    showToast('Salon rate updated successfully!');
  };

  const handleDeleteSalonService = async (id) => {
    if (window.confirm('Are you sure you want to delete this salon service?')) {
      await apiDeleteService(id);
      showToast('Salon service removed', 'error');
    }
  };

  const handleToggleSalonStatus = async (item) => {
    const newStatus = item.status === 'inactive' ? 'active' : 'inactive';
    await saveService({ ...item, status: newStatus });
    showToast(`Service status set to ${newStatus}`);
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
              Manage Salon Grooming Tiers, services, pricing, stylists, bookings & stock in real-time.
            </p>
          </div>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatsCard title="Lifetime Revenue" value={serviceStats.totalRevenue} isCurrency={true} growth={14.2} icon={IndianRupee} iconBg="#fff7ed" iconColor="#e07b2a" />
        <StatsCard title="Monthly Sales" value={serviceStats.monthlySales} isCurrency={true} growth={10.8} icon={TrendingUp} iconBg="#eff6ff" iconColor="#1e4a7e" />
        <StatsCard title="Today's Sales" value={serviceStats.todaySales} isCurrency={true} growth={8.5} icon={CalendarCheck} iconBg="#f0fdf4" iconColor="#10b981" />
        <StatsCard title="Active Salon Services" value={salonServices.length} isCurrency={false} growth={8.4} icon={Scissors} iconBg="#faf5ff" iconColor="#8b5cf6" />
      </div>

      {/* Internal Navigation Tabs */}
      <div className="bg-white border border-gray-200 rounded-2xl p-2 shadow-sm flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        {[
          { id: 'services', label: `Salon Services (${salonServices.length})`, icon: Scissors },
          { id: 'slots', label: `Time Slots (${salonTimeSlots.length})`, icon: Clock },
          { id: 'overview', label: 'Overview & Revenue', icon: TrendingUp },
          { id: 'bookings', label: `Service Bookings (${serviceBookings.length})`, icon: CalendarCheck },
          { id: 'staff', label: `Department Staff (${serviceStaff.length})`, icon: Users },
          { id: 'marketing', label: `Promos & Banners (${serviceBanners.length})`, icon: ImageIcon },
          { id: 'inventory', label: `Supplies & Stock (${serviceInventory.length})`, icon: Package }
        ].map((tab) => {

          const Icon = tab.icon;
          const isActive = activeTab === tab.id || (tab.id === 'services' && activeTab === 'packages');
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

      {/* TAB 1: SALON SERVICES MANAGEMENT */}
      {(activeTab === 'services' || activeTab === 'packages') && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <div>
              <h3 className="text-base font-bold text-gray-900">Manage Salon Services & Grooming Tiers</h3>
              <p className="text-xs text-gray-500">Add, edit rates, upload photos, or update salon services displayed on the frontend.</p>
            </div>
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Salon Service</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {salonServices.map((service) => (
              <div
                key={service.id || service._id}
                className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs flex flex-col justify-between group hover:border-amber-300 transition-all"
              >
                <div>
                  <div className="relative h-44 w-full overflow-hidden">
                    <img
                      src={service.image}
                      alt={service.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 px-2.5 py-1 bg-black/80 backdrop-blur-md text-amber-400 text-[10px] font-bold rounded-full flex items-center gap-1">
                      <span>{service.icon || '💇‍♂️'}</span>
                      <span>{service.category}</span>
                    </div>
                    <button
                      onClick={() => handleToggleSalonStatus(service)}
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
                        <span>{service.rating || 4.9}</span>
                      </div>
                    </div>

                    <p className="text-xs text-gray-500 line-clamp-2">{service.tagline || service.description}</p>

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
                      onClick={() => handleDeleteSalonService(service.id || service._id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Service"
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
              <p className="text-xs text-gray-400">Monthly breakdown for Men's Salon</p>
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
                <span className="text-gray-500 block font-semibold">Average Grooming Rate</span>
                <span className="text-xl font-black text-amber-700">₹{Math.round(salonServices.reduce((acc, s) => acc + s.price, 0) / (salonServices.length || 1))}</span>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200/60">
                <span className="text-gray-500 block font-semibold">Total Salon Services</span>
                <span className="text-xl font-black text-blue-900">{salonServices.length}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BOOKINGS */}
      {activeTab === 'bookings' && (
        <DataTable
          columns={[
            { header: 'ID', accessorKey: 'id' },
            { header: 'Customer', accessorKey: 'customerName' },
            { header: 'Service', accessorKey: 'service' },
            { header: 'Slot', accessorKey: 'timeSlot' },
            { header: 'Total (₹)', accessorKey: 'total', cell: (r) => <span>₹{r.total || r.amount}</span> },
            { header: 'Status', accessorKey: 'status' }
          ]}
          data={serviceBookings}
          searchPlaceholder="Search Bookings..."
        />
      )}

      {/* TAB 4: STAFF */}
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

      {/* TAB 5: MARKETING & BANNERS */}
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

      {/* TAB 6: INVENTORY */}
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

      {/* TAB: TIME SLOTS */}
      {activeTab === 'slots' && (() => {
        // Calculate counts
        const morningCount = salonTimeSlots.filter(s => (s.category || getShiftFromTimeString(s.time)) === 'Morning').length;
        const afternoonCount = salonTimeSlots.filter(s => (s.category || getShiftFromTimeString(s.time)) === 'Afternoon').length;
        const eveningCount = salonTimeSlots.filter(s => (s.category || getShiftFromTimeString(s.time)) === 'Evening').length;

        // Filtered list
        const filteredSlots = salonTimeSlots.filter(slot => {
          if (slotCategoryFilter === 'All') return true;
          const shift = slot.category || getShiftFromTimeString(slot.time);
          return shift === slotCategoryFilter;
        });

        return (
          <div className="space-y-6">
            {/* Top Bar with Header & Actions */}
            <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-500" />
                    <h3 className="text-lg font-black text-gray-900 tracking-tight">Manage Salon Time Slots</h3>
                  </div>
                  <p className="text-xs text-gray-500 font-medium mt-1">
                    Configure available timing slots by shift (Morning ☀️, Afternoon 🌤️, Evening 🌙). Smart shift validation ensures times are categorized accurately.
                  </p>
                </div>
                <button
                  onClick={handleOpenAddSlotModal}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Time Slot</span>
                </button>
              </div>

              <div className="pt-2 border-t border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
                {/* Filter Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 md:pb-0">
                  {[
                    { id: 'All', label: 'All Slots', count: salonTimeSlots.length, icon: '⚡' },
                    { id: 'Morning', label: 'Morning', count: morningCount, icon: '☀️' },
                    { id: 'Afternoon', label: 'Afternoon', count: afternoonCount, icon: '🌤️' },
                    { id: 'Evening', label: 'Evening', count: eveningCount, icon: '🌙' }
                  ].map((filter) => {
                    const isActive = slotCategoryFilter === filter.id;
                    return (
                      <button
                        key={filter.id}
                        onClick={() => setSlotCategoryFilter(filter.id)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                          isActive
                            ? 'bg-amber-500 text-white shadow-xs'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <span>{filter.icon}</span>
                        <span>{filter.label}</span>
                        <span className={`px-1.5 py-0.2 text-[10px] rounded-md font-extrabold ${
                          isActive ? 'bg-white/25 text-white' : 'bg-gray-200 text-gray-700'
                        }`}>
                          {filter.count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Quick Status Stats */}
                <div className="flex items-center gap-2 text-[11px] font-bold text-gray-500 self-end md:self-auto">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                    <span>{salonTimeSlots.filter(s => s.status !== 'inactive').length} Active</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-gray-400 inline-block" />
                    <span>{salonTimeSlots.filter(s => s.status === 'inactive').length} Inactive</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Time Slot Cards Grid */}
            {filteredSlots.length === 0 ? (
              <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-10 text-center space-y-3">
                <Clock className="w-8 h-8 text-gray-400 mx-auto" />
                <h4 className="font-bold text-gray-700 text-sm">No Time Slots Found</h4>
                <p className="text-xs text-gray-400">There are no slots under the selected shift filter ({slotCategoryFilter}).</p>
                <button
                  onClick={handleOpenAddSlotModal}
                  className="px-4 py-2 bg-amber-500 text-white text-xs font-bold rounded-xl inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create {slotCategoryFilter !== 'All' ? slotCategoryFilter : ''} Slot</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
                {filteredSlots.map((slot) => {
                  const shift = slot.category || getShiftFromTimeString(slot.time);
                  const isMorning = shift === 'Morning';
                  const isAfternoon = shift === 'Afternoon';
                  const isEvening = shift === 'Evening';

                  const shiftBadgeStyle = isMorning
                    ? 'bg-amber-50 text-amber-700 border-amber-200/70'
                    : isAfternoon
                    ? 'bg-sky-50 text-sky-700 border-sky-200/70'
                    : 'bg-indigo-50 text-indigo-700 border-indigo-200/70';

                  const shiftIcon = isMorning ? '☀️' : isAfternoon ? '🌤️' : '🌙';

                  return (
                    <div
                      key={slot.id || slot.time}
                      className={`bg-white border rounded-2xl p-3.5 shadow-xs flex flex-col justify-between transition-all duration-200 hover:shadow-md group ${
                        slot.status === 'inactive' ? 'opacity-60 border-gray-200 bg-gray-50/50' : 'border-gray-200/90 hover:border-amber-400'
                      }`}
                    >
                      <div className="space-y-2.5">
                        {/* Header Badge & Status Toggle */}
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border flex items-center gap-1 ${shiftBadgeStyle}`}>
                            <span>{shiftIcon}</span>
                            <span>{shift}</span>
                          </span>

                          <button
                            onClick={() => handleToggleSlotStatus(slot)}
                            className={`w-2.5 h-2.5 rounded-full transition-transform active:scale-125 ${
                              slot.status !== 'inactive' ? 'bg-emerald-500 ring-2 ring-emerald-100' : 'bg-gray-300'
                            }`}
                            title={slot.status !== 'inactive' ? 'Active (Click to disable)' : 'Inactive (Click to enable)'}
                          />
                        </div>

                        {/* Large Time Display */}
                        <div className="py-1">
                          <span className="text-base font-black tracking-tight text-gray-900 block group-hover:text-amber-600 transition-colors">
                            {slot.time}
                          </span>
                        </div>
                      </div>

                      {/* Bottom Action Bar */}
                      <div className="pt-2 mt-2 border-t border-gray-100 flex items-center justify-between">
                        <button
                          onClick={() => handleToggleSlotStatus(slot)}
                          className={`text-[10px] font-bold transition-colors ${
                            slot.status !== 'inactive' ? 'text-emerald-600 hover:text-emerald-700' : 'text-gray-400 hover:text-gray-600'
                          }`}
                        >
                          {slot.status !== 'inactive' ? 'Active' : 'Disabled'}
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditSlotModal(slot)}
                            className="p-1 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Edit Time Slot"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteSlot(slot.id || slot.time)}
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Time Slot"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}


      {/* MODAL: ADD / EDIT SALON SERVICE */}
      <AdminModal
        isOpen={addServiceModal}
        onClose={() => setAddServiceModal(false)}
        title={selectedServiceItem ? "Edit Salon Service" : "Add New Salon Service"}
      >
        <form onSubmit={handleSaveSalonService} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-gray-700 mb-1">Service Title / Name *</label>
            <input
              type="text"
              required
              value={serviceForm.name}
              onChange={e => setServiceForm({ ...serviceForm, name: e.target.value })}
              placeholder="e.g. Premium Hair Cut & Style"
              className="w-full p-2.5 border rounded-xl outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-700 mb-1">Grooming Category *</label>
              <select
                value={serviceForm.category}
                onChange={e => setServiceForm({ ...serviceForm, category: e.target.value })}
                className="w-full p-2.5 border rounded-xl outline-none focus:border-amber-500 bg-white"
              >
                {categoriesList.map(cat => (
                  <option key={cat.id || cat.name} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Price (₹) *</label>
              <input
                type="number"
                required
                min="0"
                value={serviceForm.price}
                onChange={e => setServiceForm({ ...serviceForm, price: e.target.value })}
                className="w-full p-2.5 border rounded-xl outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-700 mb-1">Duration</label>
              <input
                type="text"
                value={serviceForm.duration}
                onChange={e => setServiceForm({ ...serviceForm, duration: e.target.value })}
                placeholder="e.g. 45 mins"
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
                value={serviceForm.rating}
                onChange={e => setServiceForm({ ...serviceForm, rating: e.target.value })}
                className="w-full p-2.5 border rounded-xl outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Tagline (Short Summary)</label>
            <input
              type="text"
              value={serviceForm.tagline}
              onChange={e => setServiceForm({ ...serviceForm, tagline: e.target.value })}
              placeholder="e.g. Precision scissor cut, scalp wash, and luxury blowout styling."
              className="w-full p-2.5 border rounded-xl outline-none focus:border-amber-500"
            />
          </div>

          {/* Photo Upload Component */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block font-bold text-gray-700">Salon Service Photo *</label>
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
                value={serviceForm.image}
                onChange={e => setServiceForm({ ...serviceForm, image: e.target.value })}
                placeholder="https://images.unsplash.com/..."
                className="w-full p-2.5 border rounded-xl outline-none focus:border-amber-500"
              />
            ) : (
              <div className="space-y-2">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 hover:border-amber-500 rounded-xl cursor-pointer bg-gray-50 hover:bg-amber-50/40 transition-all p-3 text-center group">
                  <Upload className="w-6 h-6 text-gray-400 group-hover:text-amber-500 mb-1" />
                  <span className="font-bold text-gray-700 group-hover:text-amber-600 text-xs">
                    Click to Upload Service Photo
                  </span>
                  <span className="text-[10px] text-gray-400 mt-0.5">PNG, JPG, WEBP up to 5MB</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />
                </label>

                {serviceForm.image && (
                  <div className="relative w-full h-32 rounded-xl overflow-hidden border border-gray-200 group/img bg-gray-100 shadow-inner">
                    <img
                      src={serviceForm.image}
                      alt="Service Preview"
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
                        onClick={() => setServiceForm({ ...serviceForm, image: '' })}
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
              value={serviceForm.description}
              onChange={e => setServiceForm({ ...serviceForm, description: e.target.value })}
              placeholder="Detailed description of the grooming service..."
              className="w-full p-2.5 border rounded-xl outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Key Features (One per line)</label>
            <textarea
              rows={3}
              value={serviceForm.features}
              onChange={e => setServiceForm({ ...serviceForm, features: e.target.value })}
              placeholder="Personalized style consult&#10;Scalp massage wash"
              className="w-full p-2.5 border rounded-xl outline-none focus:border-amber-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-colors shadow-sm"
          >
            {selectedServiceItem ? "Update Salon Service" : "Save & Publish Salon Service"}
          </button>
        </form>
      </AdminModal>

      {/* MODAL: EDIT PRICE */}
      <AdminModal
        isOpen={editingPriceModal}
        onClose={() => setEditingPriceModal(false)}
        title={`Edit Rate: ${selectedServiceItem?.name || ''}`}
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-gray-700 mb-1">New Service Price (₹)</label>
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

      {/* MODAL: ADD / EDIT TIME SLOT */}
      <AdminModal
        isOpen={addSlotModal}
        onClose={() => setAddSlotModal(false)}
        title={selectedSlotItem ? "Edit Salon Time Slot" : "Add New Salon Time Slot"}
      >
        <form onSubmit={handleSaveSlot} className="space-y-5 text-xs">
          {/* 1. Select Shift / Category */}
          <div className="space-y-1.5">
            <label className="block font-bold text-gray-800 text-xs">1. Select Shift / Period *</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'Morning', label: 'Morning', timeRange: '5 AM - 12 PM', icon: '☀️' },
                { id: 'Afternoon', label: 'Afternoon', timeRange: '12 PM - 5 PM', icon: '🌤️' },
                { id: 'Evening', label: 'Evening', timeRange: '5 PM - 10 PM', icon: '🌙' }
              ].map((shift) => {
                const isSelected = slotForm.category === shift.id;
                return (
                  <button
                    type="button"
                    key={shift.id}
                    onClick={() => handleShiftChangeInModal(shift.id)}
                    className={`py-2.5 px-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-amber-500 border-amber-500 text-white shadow-xs'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-extrabold text-xs">{shift.label}</span>
                      <span className="text-sm">{shift.icon}</span>
                    </div>
                    <span className={`text-[9px] font-medium mt-1 ${isSelected ? 'text-amber-100' : 'text-gray-400'}`}>
                      {shift.timeRange}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Preset Time Chips for selected Shift */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="block font-bold text-gray-800 text-xs">
                2. Quick Presets for {slotForm.category} Shift
              </label>
              <span className="text-[10px] text-gray-400 font-semibold">Click to select time</span>
            </div>

            <div className="grid grid-cols-4 gap-1.5 bg-gray-50 p-2.5 rounded-xl border border-gray-200/80 max-h-36 overflow-y-auto">
              {(SHIFT_PRESET_TIMES[slotForm.category] || []).map((presetTime) => {
                const isSelected = slotForm.time === presetTime;
                return (
                  <button
                    type="button"
                    key={presetTime}
                    onClick={() => handleTimeChangeInModal(presetTime)}
                    className={`py-2 text-[11px] font-black rounded-lg transition-all text-center ${
                      isSelected
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-white border border-gray-200/90 text-gray-800 hover:border-amber-400 hover:text-amber-600'
                    }`}
                  >
                    {presetTime}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Manual Time Entry & Auto-Validation Note */}
          <div className="space-y-1.5 pt-1">
            <label className="block font-bold text-gray-800 text-xs">Or Enter Custom Time *</label>
            <input
              type="text"
              required
              value={slotForm.time}
              onChange={e => handleTimeChangeInModal(e.target.value)}
              placeholder="e.g. 09:30 AM or 05:30 PM"
              className="w-full p-3 border border-gray-200 focus:border-amber-500 rounded-xl text-sm font-black outline-none transition-colors bg-white"
            />

            {/* Smart Auto-Detected Shift Info Badge */}
            {slotForm.time && (
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200/60 mt-1">
                <span>✓</span>
                <span>Valid Time. Auto-categorized under <strong>{getShiftFromTimeString(slotForm.time)} Shift</strong></span>
              </div>
            )}
          </div>

          {/* 4. Availability Status */}
          <div className="space-y-1.5 pt-1">
            <label className="block font-bold text-gray-800 text-xs">Slot Availability Status</label>
            <select
              value={slotForm.status}
              onChange={e => setSlotForm({ ...slotForm, status: e.target.value })}
              className="w-full p-3 border border-gray-200 focus:border-amber-500 rounded-xl outline-none bg-white text-xs font-bold"
            >
              <option value="active">Active (Visible & Bookable by Customers)</option>
              <option value="inactive">Inactive (Disabled / Hidden)</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-black rounded-xl transition-all shadow-sm text-xs uppercase tracking-wider mt-2"
          >
            {selectedSlotItem ? "Update Time Slot" : "Save & Add Time Slot"}
          </button>
        </form>
      </AdminModal>
    </div>
  );
}


