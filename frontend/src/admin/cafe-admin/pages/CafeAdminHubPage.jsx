import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  IndianRupee,
  TrendingUp,
  CalendarCheck,
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
  Upload,
  X,
  UserPlus
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
import AdminModal from '../../common/components/AdminModal';
import apiClient from '../../../common/utils/apiClient';

export default function CafeAdminHubPage() {
  const serviceKey = 'cafe';
  const {
    services,
    bookings,
    staffList,
    banners,
    toggleServiceStatus,
    updateServicePrice,
    addServicePlan,
    updateServicePlan,
    deleteServicePlan,
    addServiceSection,
    deleteServiceSection,
    addBooking,
    updateBookingStatus,
    addStaff,
    toggleStaffStatus,
    addBanner,
    addInventoryItem,
    updateStock
  } = useAdmin();

  const [searchParams, setSearchParams] = useSearchParams();
  // Bookings, vehicles and stock aren't part of the café hub, so a stale link
  // or a hand-typed ?tab= for those lands on the overview, not a blank page.
  const CAFE_TABS = ['overview', 'packages', 'staff', 'marketing'];
  const normalizeTab = (tab) => (CAFE_TABS.includes(tab) ? tab : 'overview');
  const tabFromUrl = normalizeTab(searchParams.get('tab'));
  const [activeTab, setActiveTabState] = useState(tabFromUrl);

  useEffect(() => {
    if (searchParams.get('tab')) {
      setActiveTabState(normalizeTab(searchParams.get('tab')));
    }
  }, [searchParams]);

  const handleTabChange = (tabId) => {
    setActiveTabState(tabId);
    setSearchParams({ tab: tabId });
  };

  const serviceStats = serviceStatsMap[serviceKey] || serviceStatsMap['car-wash'];
  const serviceMain = services.find(s => s.key === serviceKey || s.slug === serviceKey);

  const serviceBookings = bookings.filter(b => b.serviceKey === serviceKey);
  const serviceStaff = staffList.filter(s => s.serviceKey === serviceKey);
  const serviceBanners = banners.filter(b => b.serviceKey === serviceKey);

  const [editingPriceModal, setEditingPriceModal] = useState(false);
  const [newPrice, setNewPrice] = useState(serviceMain?.price || 0);
  
  // Dish Form state
  const [addPlanModal, setAddPlanModal] = useState(false);
  const [planForm, setPlanForm] = useState({
    name: '',
    price: '',
    description: '',
    duration: '15 mins',
    section: 'Main Menu',
    subcat: 'Brunch',
    weight: '220g',
    image: ''
  });

  // Edit Dish Form state
  const [editPlanModal, setEditPlanModal] = useState(false);
  const [editPlanForm, setEditPlanForm] = useState({
    _id: '',
    name: '',
    price: '',
    description: '',
    duration: '15 mins',
    section: 'Main Menu',
    subcat: 'Brunch',
    weight: '220g',
    image: ''
  });

  // Section Form state
  const [addSectionModal, setAddSectionModal] = useState(false);
  const [sectionForm, setSectionForm] = useState({
    title: '',
    subtitle: '',
    description: '',
    bgColor: 'linear-gradient(135deg, #F5A623 0%, #D48806 100%)',
    image: ''
  });

  const handleDishPhotoChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPlanForm(prev => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditDishPhotoChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditPlanForm(prev => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenEditPlan = (plan) => {
    setEditPlanForm({
      _id: plan._id || plan.id,
      name: plan.name || '',
      price: plan.price !== undefined ? plan.price : '',
      description: plan.description || '',
      duration: plan.duration || '15 mins',
      section: plan.section || serviceMain?.menuSections?.[0]?.title || 'Main Menu',
      subcat: plan.subcat || 'General',
      weight: plan.weight || '',
      image: plan.image || ''
    });
    setEditPlanModal(true);
  };

  const handleUpdatePlan = () => {
    if (!editPlanForm.name || editPlanForm.price === '') {
      alert('Please fill out dish name and price');
      return;
    }
    updateServicePlan(serviceMain?._id || serviceMain?.id, editPlanForm._id, {
      name: editPlanForm.name,
      price: Number(editPlanForm.price),
      description: editPlanForm.description,
      duration: editPlanForm.duration,
      section: editPlanForm.section,
      subcat: editPlanForm.subcat,
      weight: editPlanForm.weight,
      image: editPlanForm.image
    });
    setEditPlanModal(false);
  };

  const handleSectionPhotoChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSectionForm(prev => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

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
    fullName: '',
    email: '',
    password: '',
    mobile: '',
    staffRole: 'Cafe Barista',
    salary: '₹35,000 / month',
    leaveBalance: 12,
    photo: '',
    permissions: ['bookings', 'orders']
  });

  const [dbStaff, setDbStaff] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [editStaffModal, setEditStaffModal] = useState(false);
  const [activeStaffModalTab, setActiveStaffModalTab] = useState('details');
  const [staffAttendanceLogs, setStaffAttendanceLogs] = useState([]);

  const [editStaffForm, setEditStaffForm] = useState({
    fullName: '',
    email: '',
    password: '',
    mobile: '',
    staffRole: 'Cafe Barista',
    salary: '₹35,000 / month',
    leaveBalance: 12,
    photo: '',
    permissions: []
  });

  const fetchLiveStaff = async () => {
    try {
      const res = await apiClient.get('/users/staff?serviceKey=cafe');
      if (res.data && res.data.staff) {
        setDbStaff(res.data.staff);
      }
    } catch (err) {
      console.warn('Could not fetch live staff list:', err.message);
    }
  };

  useEffect(() => {
    fetchLiveStaff();
  }, []);

  const [addBannerModal, setAddBannerModal] = useState(false);
  const [editBannerModal, setEditBannerModal] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState(null);
  const [bannerForm, setBannerForm] = useState({
    title: '',
    subtitle: '',
    badge: 'Special Deal',
    imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=600&q=80',
    actionLink: '/cafe',
    status: 'active'
  });

  const handleOpenAddBanner = () => {
    setBannerForm({
      title: '',
      subtitle: '',
      badge: 'Special Deal',
      imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=600&q=80',
      actionLink: '/cafe',
      status: 'active'
    });
    setAddBannerModal(true);
  };

  const handleOpenEditBanner = (ban) => {
    setSelectedBanner(ban);
    setBannerForm({
      title: ban.title || '',
      subtitle: ban.subtitle || '',
      badge: ban.badge || 'Special Deal',
      imageUrl: ban.imageUrl || '',
      actionLink: ban.actionLink || '/cafe',
      status: ban.status || 'active'
    });
    setEditBannerModal(true);
  };

  const handleSaveNewBanner = (e) => {
    e.preventDefault();
    addBanner({
      ...bannerForm,
      serviceKey: 'cafe'
    });
    setAddBannerModal(false);
  };

  const handleSaveEditBanner = (e) => {
    e.preventDefault();
    if (!selectedBanner) return;
    updateBanner(selectedBanner.id, bannerForm);
    setEditBannerModal(false);
  };

  const handleDeleteBanner = (id) => {
    if (window.confirm('Are you sure you want to delete this promo banner?')) {
      deleteBanner(id);
      setEditBannerModal(false);
    }
  };

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
    addServicePlan(serviceMain?._id || serviceMain?.id, {
      name: planForm.name,
      price: Number(planForm.price),
      description: planForm.description,
      duration: planForm.duration,
      section: planForm.section,
      subcat: planForm.subcat,
      weight: planForm.weight,
      image: planForm.image
    });
    setAddPlanModal(false);
    setPlanForm({
      name: '',
      price: '',
      description: '',
      duration: '15 mins',
      section: serviceMain?.menuSections?.[0]?.title || 'Main Menu',
      subcat: 'Brunch',
      weight: '220g',
      image: ''
    });
  };

  const handleSaveSection = () => {
    if (!sectionForm.title) return;
    addServiceSection(serviceMain?._id || serviceMain?.id, {
      title: sectionForm.title,
      subtitle: sectionForm.subtitle,
      description: sectionForm.description,
      bgColor: sectionForm.bgColor,
      image: sectionForm.image
    });
    setAddSectionModal(false);
    setSectionForm({
      title: '',
      subtitle: '',
      description: '',
      bgColor: 'linear-gradient(135deg, #F5A623 0%, #D48806 100%)',
      image: ''
    });
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

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#';
    let pwd = '';
    for (let i = 0; i < 10; i++) pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    setStaffForm(prev => ({ ...prev, password: pwd }));
  };

  const handleStaffPhotoChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setStaffForm(prev => ({ ...prev, photo: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditStaffPhotoChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditStaffForm(prev => ({ ...prev, photo: reader.result }));
      };
      reader.readAsDataURL(file);
    }
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
        department: 'Cafe',
        serviceKey: 'cafe',
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
          staffRole: 'Cafe Barista',
          salary: '₹35,000 / month',
          leaveBalance: 12,
          photo: '',
          permissions: ['bookings', 'orders']
        });
      } else {
        alert('Error creating staff: ' + (res.data?.message || 'Server error'));
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Could not create staff';
      alert(`Error: ${errMsg}`);
    }
  };

  const handleOpenEditStaff = async (stf) => {
    setSelectedStaff(stf);
    setEditStaffForm({
      fullName: stf.fullName || stf.name || '',
      email: stf.email || '',
      password: '',
      mobile: stf.mobile || '',
      staffRole: stf.staffRole || stf.role || 'Cafe Barista',
      salary: stf.salary || '₹35,000 / month',
      leaveBalance: stf.leaveBalance !== undefined ? stf.leaveBalance : 12,
      photo: stf.photo || stf.avatar || stf.profileImage || '',
      permissions: stf.permissions || []
    });
    setStaffAttendanceLogs([]);
    setActiveStaffModalTab('details');
    setEditStaffModal(true);

    const sId = stf._id || stf.id;
    if (sId && !sId.toString().startsWith('STF-')) {
      try {
        const res = await apiClient.get(`/attendance/staff/${sId}`);
        if (res.data && res.data.attendance) {
          setStaffAttendanceLogs(res.data.attendance);
        }
      } catch (err) {
        console.warn('Could not fetch staff attendance history:', err.message);
      }
    }
  };

  const handleUpdateStaff = async (e) => {
    e.preventDefault();
    const sId = selectedStaff?._id || selectedStaff?.id;
    if (!sId) return;

    try {
      const payload = {
        fullName: editStaffForm.fullName,
        email: editStaffForm.email,
        mobile: editStaffForm.mobile,
        staffRole: editStaffForm.staffRole,
        salary: editStaffForm.salary,
        leaveBalance: Number(editStaffForm.leaveBalance),
        photo: editStaffForm.photo,
        permissions: editStaffForm.permissions
      };
      if (editStaffForm.password) {
        payload.password = editStaffForm.password;
      }

      const res = await apiClient.put(`/users/staff/${sId}`, payload);
      if (res.data && res.data.success) {
        alert('✅ Staff member updated successfully!');
        fetchLiveStaff();
        setEditStaffModal(false);
      } else {
        alert('Error updating staff: ' + (res.data?.message || 'Server error'));
      }
    } catch (err) {
      alert('Error updating staff: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteStaff = async () => {
    const sId = selectedStaff?._id || selectedStaff?.id;
    if (!sId) return;

    const confirmDel = window.confirm(`Are you sure you want to delete "${editStaffForm.fullName}"?`);
    if (!confirmDel) return;

    try {
      const res = await apiClient.delete(`/users/staff/${sId}`);
      if (res.data && res.data.success) {
        alert('✅ Staff member deleted successfully!');
        fetchLiveStaff();
        setEditStaffModal(false);
      } else {
        alert('Error deleting staff: ' + (res.data?.message || 'Server error'));
      }
    } catch (err) {
      alert('Error deleting staff: ' + (err.response?.data?.message || err.message));
    }
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
          { id: 'staff', label: `Department Staff (${serviceStaff.length})`, icon: Users },
          { id: 'marketing', label: `Promos & Banners (${serviceBanners.length})`, icon: ImageIcon }
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
        <div className="space-y-8">
          {/* Menu Sections Header */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-black text-gray-900">Menu Categories & Sections</h3>
                <p className="text-xs text-gray-500">Create new sections and manage background configurations for menu displays</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setAddSectionModal(true)}
                  className="px-4 py-2 text-xs font-bold text-white bg-amber-600 rounded-xl hover:bg-amber-700 transition-colors shadow-xs select-none active:scale-[0.98]"
                >
                  + Add Menu Section
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {serviceMain?.menuSections?.map((section) => (
                <div
                  key={section._id}
                  style={{ background: section.bgColor || 'linear-gradient(135deg, #A06A42 0%, #704224 100%)' }}
                  className="rounded-2xl p-4 text-white relative shadow-xs flex flex-col justify-between min-h-[120px] group overflow-hidden"
                >
                  {section.image && (
                    <img src={section.image} alt="" className="absolute right-[-10px] bottom-[-10px] w-20 h-20 rounded-full object-cover opacity-20 pointer-events-none" />
                  )}
                  <div>
                    <h4 className="font-black text-sm drop-shadow-xs">{section.title}</h4>
                    <p className="text-[10px] opacity-90 font-medium leading-normal mt-1">{section.subtitle || section.description}</p>
                  </div>
                  <div className="mt-2 flex justify-between items-center z-10">
                    <span className="text-[9px] bg-white/20 px-2 py-0.5 rounded-full font-bold select-none">
                      {(serviceMain?.plans || []).filter(p => p.section === section.title).length} Items
                    </span>
                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete the "${section.title}" section?`)) {
                          deleteServiceSection(serviceMain._id || serviceMain.id, section._id);
                        }
                      }}
                      className="text-white hover:text-red-200 p-1 rounded-lg hover:bg-white/10 transition-colors"
                      title="Delete Section"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {(!serviceMain?.menuSections || serviceMain.menuSections.length === 0) && (
                <div className="col-span-full py-8 text-center text-xs text-gray-400 font-medium bg-gray-50 border border-dashed rounded-2xl">
                  No custom menu sections created yet. Add one to start organizing your dishes!
                </div>
              )}
            </div>
          </div>

          {/* Dishes & Items Grid */}
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-black text-gray-900">Cafe Menu Dishes & Pricing</h3>
                <p className="text-xs text-gray-500">Manage pricing, portion weights, and display categories for all dishes</p>
              </div>
              <button
                onClick={() => {
                  if (!serviceMain?.menuSections || serviceMain.menuSections.length === 0) {
                    alert('Please create at least one menu section first!');
                    return;
                  }
                  setAddPlanModal(true);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-amber-600 rounded-xl hover:bg-amber-700 transition-colors shadow-xs select-none active:scale-[0.98]"
              >
                + Add Dish / Drink
              </button>
            </div>

            {/* List items categorized by sections */}
            {(serviceMain?.menuSections || []).map((section) => {
              const sectionItems = (serviceMain?.plans || []).filter(p => p.section === section.title);
              return (
                <div key={section._id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: section.bgColor }} />
                      <h4 className="font-black text-sm text-gray-900">{section.title}</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                        {sectionItems.length} available
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                    {sectionItems.map((plan) => (
                      <div key={plan._id || plan.id} className="border border-gray-200 rounded-2xl overflow-hidden shadow-xs flex flex-col justify-between bg-gray-50 group hover:border-amber-500/30 transition-all duration-200">
                        <div className="relative aspect-video w-full bg-gray-100 overflow-hidden">
                          {plan.image ? (
                            <img src={plan.image} alt={plan.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 animate-fade-in" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">
                              <ImageIcon className="w-8 h-8 opacity-40" />
                            </div>
                          )}
                          <span className="absolute top-2 left-2 text-[9px] bg-black/60 backdrop-blur-xs text-white px-2 py-0.5 rounded-full font-bold">
                            {plan.subcat || 'General'}
                          </span>
                        </div>
                        <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                          <div>
                            <div className="flex justify-between items-start gap-1">
                              <h5 className="font-black text-xs text-gray-900 leading-snug">{plan.name}</h5>
                              {plan.weight && (
                                <span className="text-[9px] text-gray-400 font-bold shrink-0">{plan.weight}</span>
                              )}
                            </div>
                            <p className="text-[10px] text-gray-500 mt-1 line-clamp-2 leading-relaxed">{plan.description || 'Premium chef-crafted item.'}</p>
                          </div>
                          <div className="flex justify-between items-center pt-3 border-t">
                            <button
                              type="button"
                              onClick={() => handleOpenEditPlan(plan)}
                              className="flex items-center gap-1.5 hover:opacity-80 transition-opacity text-left group/price"
                              title="Click to Edit Price & Details"
                            >
                              <span className="text-base font-black text-amber-600">₹{plan.price}</span>
                              <Edit2 className="w-3.5 h-3.5 text-amber-500 opacity-70 group-hover/price:opacity-100 transition-opacity" />
                            </button>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleOpenEditPlan(plan)}
                                className="text-gray-400 hover:text-amber-600 p-1.5 rounded-xl hover:bg-amber-50 transition-colors"
                                title="Edit Dish & Price"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Are you sure you want to delete "${plan.name}"?`)) {
                                    deleteServicePlan(serviceMain._id || serviceMain.id, plan._id || plan.id);
                                  }
                                }}
                                className="text-gray-400 hover:text-red-500 p-1.5 rounded-xl hover:bg-red-50 transition-colors"
                                title="Delete Dish"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {sectionItems.length === 0 && (
                      <div className="col-span-full py-8 text-center text-[11px] text-gray-400 bg-gray-50 border border-dashed rounded-xl">
                        No dishes added to this section yet.
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'staff' && (() => {
        const rawStaff = dbStaff.length > 0 ? dbStaff : serviceStaff;
        const displayStaff = rawStaff.filter(s => {
          const isKeyMatch = s.serviceKey === 'cafe';
          const isDeptMatch = s.department === 'Café' || s.department === 'Cafe';
          const roleLower = (s.staffRole || s.role || '').toLowerCase();
          const isCafeRole = roleLower.includes('cafe') || roleLower.includes('barista') || roleLower.includes('chef') || roleLower.includes('pastry');
          return isKeyMatch || isDeptMatch || isCafeRole;
        });

        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
              <div>
                <h3 className="text-base font-black text-gray-900">Café Department Staff ({displayStaff.length})</h3>
                <p className="text-xs text-gray-500">Onboard café staff members, manage roles, salaries, and assign system access permissions</p>
              </div>
              <button
                onClick={() => setAddStaffModal(true)}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 select-none active:scale-[0.98]"
              >
                <UserPlus className="w-4 h-4" /> Onboard New Staff Member
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {displayStaff.map((stf) => (
                <div
                  key={stf._id || stf.id}
                  onClick={() => handleOpenEditStaff(stf)}
                  className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4 flex flex-col justify-between hover:border-amber-400 cursor-pointer hover:shadow-md transition-all duration-200"
                >
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
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{stf.staffRole || stf.role}</p>
                      <p className="text-[10px] text-gray-500 truncate">{stf.email}</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t flex items-center justify-between text-[11px] text-gray-500 font-semibold">
                    <span>{stf.mobile || 'No Mobile Phone'}</span>
                    <span className="text-emerald-700 font-bold">{stf.salary || 'Salary Not Configured'}</span>
                  </div>
                </div>
              ))}
              {displayStaff.length === 0 && (
                <div className="col-span-full py-12 text-center text-xs text-gray-400 font-medium bg-gray-50 border border-dashed rounded-2xl">
                  No staff members onboarded for the Café Hub yet.
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {activeTab === 'marketing' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <div>
              <h3 className="text-base font-black text-gray-900">Café Promotional Banners & Deals ({serviceBanners.length})</h3>
              <p className="text-xs text-gray-500">Configure visual promo banners and active discount banners displayed on the customer frontend</p>
            </div>
            <button
              onClick={handleOpenAddBanner}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add New Banner
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {serviceBanners.map((ban) => (
              <div key={ban.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                <div className="relative">
                  <img src={ban.imageUrl || 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=600&q=80'} className="w-full h-36 object-cover" alt="Promo Banner" />
                  <span className={`absolute top-3 right-3 px-2 py-0.5 rounded-md text-[9px] font-black uppercase shadow-xs ${ban.status !== 'inactive' ? 'bg-emerald-500 text-white' : 'bg-gray-500 text-white'}`}>
                    {ban.status !== 'inactive' ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-sm text-gray-900">{ban.title}</h4>
                    <p className="text-[11px] text-gray-500 leading-relaxed">{ban.subtitle}</p>
                    {ban.actionLink && (
                      <span className="inline-block mt-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                        CTA Link: {ban.actionLink}
                      </span>
                    )}
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => toggleBannerStatus(ban.id)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all flex items-center gap-1 ${
                        ban.status !== 'inactive' ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {ban.status !== 'inactive' ? 'Hide Banner' : 'Show Banner'}
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEditBanner(ban)}
                        className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-[10px] font-bold hover:bg-amber-600 transition-all flex items-center gap-1"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Edit Details
                      </button>
                      <button
                        onClick={() => handleDeleteBanner(ban.id)}
                        className="p-1.5 text-red-500 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-all"
                        title="Delete Banner"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Edit Base Price */}
      <AdminModal isOpen={editingPriceModal} onClose={() => setEditingPriceModal(false)} title="Edit Rate">
        <div className="space-y-4 text-xs">
          <input type="number" value={newPrice} onChange={e => setNewPrice(Number(e.target.value))} className="w-full p-2 border rounded-xl" />
          <button onClick={handleSavePrice} className="w-full py-2 bg-amber-500 text-white rounded-xl">Save</button>
        </div>
      </AdminModal>

      {/* Modal: Add Dish / Drink */}
      <AdminModal isOpen={addPlanModal} onClose={() => setAddPlanModal(false)} title="Add New Dish / Drink">
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-gray-700 mb-1">Dish / Drink Name</label>
            <input
              type="text"
              value={planForm.name}
              onChange={e => setPlanForm({ ...planForm, name: e.target.value })}
              placeholder="e.g. Ceremonial Matcha Latte"
              className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-gray-700 mb-1">Price (₹)</label>
              <input
                type="number"
                value={planForm.price}
                onChange={e => setPlanForm({ ...planForm, price: e.target.value })}
                placeholder="e.g. 240"
                className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-gray-700 mb-1">Menu Category Section</label>
              <select
                value={planForm.section}
                onChange={e => setPlanForm({ ...planForm, section: e.target.value })}
                className="w-full p-2.5 border rounded-xl bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                {serviceMain?.menuSections?.map(sec => (
                  <option key={sec._id} value={sec.title}>{sec.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-gray-700 mb-1">Sub-Category</label>
              <input
                type="text"
                value={planForm.subcat}
                onChange={e => setPlanForm({ ...planForm, subcat: e.target.value })}
                placeholder="e.g. Coffee"
                className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-gray-700 mb-1">Weight/Size</label>
              <input
                type="text"
                value={planForm.weight}
                onChange={e => setPlanForm({ ...planForm, weight: e.target.value })}
                placeholder="e.g. 220g"
                className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-gray-700 mb-1">Prep Duration</label>
              <input
                type="text"
                value={planForm.duration}
                onChange={e => setPlanForm({ ...planForm, duration: e.target.value })}
                placeholder="e.g. 15 mins"
                className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Dish Image</label>
            <div className="flex items-center gap-4">
              <label className="flex items-center justify-center px-4 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-300 rounded-xl cursor-pointer text-gray-700 font-bold text-xs gap-2 select-none active:scale-[0.98] transition-all">
                <Upload className="w-4 h-4 text-gray-500" />
                <span>Upload Dish Image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleDishPhotoChange}
                  className="hidden"
                />
              </label>

              {planForm.image && (
                <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-gray-300 shadow-sm bg-gray-100 group">
                  <img
                    src={planForm.image}
                    alt="Dish Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setPlanForm({ ...planForm, image: '' })}
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity duration-200"
                    title="Remove Photo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Description</label>
            <textarea
              value={planForm.description}
              onChange={e => setPlanForm({ ...planForm, description: e.target.value })}
              placeholder="Enter dish ingredients or brief description..."
              className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none min-h-[60px]"
            />
          </div>

          <button
            onClick={handleSavePlan}
            className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-xs select-none active:scale-[0.98] transition-all"
          >
            Save Item
          </button>
        </div>
      </AdminModal>

      {/* Modal: Edit Dish / Drink & Pricing */}
      <AdminModal isOpen={editPlanModal} onClose={() => setEditPlanModal(false)} title="Edit Dish & Pricing">
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-gray-700 mb-1">Dish / Drink Name</label>
            <input
              type="text"
              value={editPlanForm.name}
              onChange={e => setEditPlanForm({ ...editPlanForm, name: e.target.value })}
              placeholder="e.g. Ceremonial Matcha Latte"
              className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-gray-700 mb-1">Price (₹)</label>
              <input
                type="number"
                value={editPlanForm.price}
                onChange={e => setEditPlanForm({ ...editPlanForm, price: e.target.value })}
                placeholder="e.g. 240"
                className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none font-bold text-amber-600"
              />
            </div>
            <div>
              <label className="block font-bold text-gray-700 mb-1">Menu Category Section</label>
              <select
                value={editPlanForm.section}
                onChange={e => setEditPlanForm({ ...editPlanForm, section: e.target.value })}
                className="w-full p-2.5 border rounded-xl bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                {serviceMain?.menuSections?.map(sec => (
                  <option key={sec._id} value={sec.title}>{sec.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-gray-700 mb-1">Sub-Category</label>
              <input
                type="text"
                value={editPlanForm.subcat}
                onChange={e => setEditPlanForm({ ...editPlanForm, subcat: e.target.value })}
                placeholder="e.g. Coffee"
                className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-gray-700 mb-1">Weight/Size</label>
              <input
                type="text"
                value={editPlanForm.weight}
                onChange={e => setEditPlanForm({ ...editPlanForm, weight: e.target.value })}
                placeholder="e.g. 220g"
                className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-gray-700 mb-1">Prep Duration</label>
              <input
                type="text"
                value={editPlanForm.duration}
                onChange={e => setEditPlanForm({ ...editPlanForm, duration: e.target.value })}
                placeholder="e.g. 15 mins"
                className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Dish Image</label>
            <div className="flex items-center gap-4">
              <label className="flex items-center justify-center px-4 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-300 rounded-xl cursor-pointer text-gray-700 font-bold text-xs gap-2 select-none active:scale-[0.98] transition-all">
                <Upload className="w-4 h-4 text-gray-500" />
                <span>Change Dish Image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleEditDishPhotoChange}
                  className="hidden"
                />
              </label>

              {editPlanForm.image && (
                <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-gray-300 shadow-sm bg-gray-100 group">
                  <img
                    src={editPlanForm.image}
                    alt="Dish Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setEditPlanForm({ ...editPlanForm, image: '' })}
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity duration-200"
                    title="Remove Photo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Description</label>
            <textarea
              value={editPlanForm.description}
              onChange={e => setEditPlanForm({ ...editPlanForm, description: e.target.value })}
              placeholder="Enter dish ingredients or brief description..."
              className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none min-h-[60px]"
            />
          </div>

          <button
            onClick={handleUpdatePlan}
            className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-xs select-none active:scale-[0.98] transition-all"
          >
            Update Dish & Save Changes
          </button>
        </div>
      </AdminModal>

      {/* Modal: Add Menu Section */}
      <AdminModal isOpen={addSectionModal} onClose={() => setAddSectionModal(false)} title="Create Custom Menu Section">
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-gray-700 mb-1">Section Title</label>
            <input
              type="text"
              value={sectionForm.title}
              onChange={e => setSectionForm({ ...sectionForm, title: e.target.value })}
              placeholder="e.g. Cakes & Sweet Tarts"
              className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Subtitle / Tagline</label>
            <input
              type="text"
              value={sectionForm.subtitle}
              onChange={e => setSectionForm({ ...sectionForm, subtitle: e.target.value })}
              placeholder="e.g. Chef-crafted premium desserts"
              className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-gray-700 mb-1">Background Gradient Color</label>
              <select
                value={sectionForm.bgColor}
                onChange={e => setSectionForm({ ...sectionForm, bgColor: e.target.value })}
                className="w-full p-2.5 border rounded-xl bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value="linear-gradient(135deg, #F5A623 0%, #D48806 100%)">Warm Honey (Yellow-Orange)</option>
                <option value="linear-gradient(135deg, #FA541C 0%, #D4380D 100%)">Fiery Copper (Orange-Red)</option>
                <option value="linear-gradient(135deg, #B7094C 0%, #800E13 100%)">Royal Plum (Crimson-Purple)</option>
                <option value="linear-gradient(135deg, #A06A42 0%, #704224 100%)">Artisan Oak (Tan-Brown)</option>
                <option value="linear-gradient(135deg, #00C6FF 0%, #0072FF 100%)">Deep Ocean (Cyan-Blue)</option>
                <option value="linear-gradient(135deg, #11998e 0%, #38ef7d 100%)">Green Forest (Teal-Emerald)</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-gray-700 mb-1">Cover Image</label>
              <div className="flex items-center gap-4">
                <label className="flex items-center justify-center px-4 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-300 rounded-xl cursor-pointer text-gray-700 font-bold text-xs gap-2 select-none active:scale-[0.98] transition-all">
                  <Upload className="w-4 h-4 text-gray-500" />
                  <span>Upload Icon/Cover</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleSectionPhotoChange}
                    className="hidden"
                  />
                </label>

                {sectionForm.image && (
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-gray-300 shadow-sm bg-gray-100 group">
                    <img
                      src={sectionForm.image}
                      alt="Section Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setSectionForm({ ...sectionForm, image: '' })}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity duration-200"
                      title="Remove Photo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Description</label>
            <textarea
              value={sectionForm.description}
              onChange={e => setSectionForm({ ...sectionForm, description: e.target.value })}
              placeholder="e.g. Prepared and decorated within 12 minutes"
              className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none min-h-[60px]"
            />
          </div>

          <button
            onClick={handleSaveSection}
            className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-xs select-none active:scale-[0.98] transition-all"
          >
            Create Section
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
                placeholder="e.g. Kabir Mehta"
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
                placeholder="e.g. Senior Barista"
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
                placeholder="kabir@theshinelounge.com"
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
            <label className="block font-bold text-gray-700 mb-1">Profile Photo</label>
            <div className="flex items-center gap-4">
              <label className="flex items-center justify-center px-4 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-300 rounded-xl cursor-pointer text-gray-700 font-bold text-xs gap-2 select-none active:scale-[0.98] transition-all">
                <Upload className="w-4 h-4 text-gray-500" />
                <span>Upload Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleStaffPhotoChange}
                  className="hidden"
                />
              </label>

              {staffForm.photo && (
                <div className="relative w-12 h-12 rounded-full overflow-hidden border border-gray-300 shadow-sm bg-gray-100 group">
                  <img
                    src={staffForm.photo}
                    alt="Staff Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setStaffForm({ ...staffForm, photo: '' })}
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity duration-200"
                    title="Remove Photo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
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
                    onChange={() => {
                      const current = staffForm.permissions;
                      if (current.includes(perm.id)) {
                        setStaffForm({ ...staffForm, permissions: current.filter(p => p !== perm.id) });
                      } else {
                        setStaffForm({ ...staffForm, permissions: [...current, perm.id] });
                      }
                    }}
                    className="rounded text-amber-500 focus:ring-amber-500 w-4 h-4"
                  />
                  <span>{perm.label}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-xs transition-all text-xs uppercase tracking-wider select-none active:scale-[0.98]"
          >
            Create Staff Profile
          </button>
        </form>
      </AdminModal>

      {/* Modal: Edit / Details Staff Member */}
      <AdminModal isOpen={editStaffModal} onClose={() => setEditStaffModal(false)} title="Manage Staff Profile">
        <div className="space-y-4 p-1 text-xs">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 gap-4 pb-2 mb-2">
            <button
              type="button"
              onClick={() => setActiveStaffModalTab('details')}
              className={`pb-1.5 font-bold border-b-2 transition-all ${
                activeStaffModalTab === 'details' ? 'border-amber-500 text-amber-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Staff Profile Details
            </button>
            <button
              type="button"
              onClick={() => setActiveStaffModalTab('attendance')}
              className={`pb-1.5 font-bold border-b-2 transition-all ${
                activeStaffModalTab === 'attendance' ? 'border-amber-500 text-amber-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Shift Attendance Logs ({staffAttendanceLogs.length})
            </button>
          </div>

          {activeStaffModalTab === 'details' && (
            <form onSubmit={handleUpdateStaff} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editStaffForm.fullName}
                    onChange={e => setEditStaffForm({ ...editStaffForm, fullName: e.target.value })}
                    className="w-full p-2.5 border rounded-xl font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Staff Title / Role *</label>
                  <input
                    type="text"
                    required
                    value={editStaffForm.staffRole}
                    onChange={e => setEditStaffForm({ ...editStaffForm, staffRole: e.target.value })}
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
                    value={editStaffForm.email}
                    onChange={e => setEditStaffForm({ ...editStaffForm, email: e.target.value })}
                    className="w-full p-2.5 border rounded-xl font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-bold text-gray-700">Update Password (Leave blank to keep same)</label>
                    <button
                      type="button"
                      onClick={() => {
                        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#';
                        let pwd = '';
                        for (let i = 0; i < 10; i++) pwd += chars.charAt(Math.floor(Math.random() * chars.length));
                        setEditStaffForm(prev => ({ ...prev, password: pwd }));
                      }}
                      className="text-[10px] text-amber-600 font-extrabold hover:underline"
                    >
                      ⚡ Auto Generate
                    </button>
                  </div>
                  <input
                    type="text"
                    value={editStaffForm.password}
                    onChange={e => setEditStaffForm({ ...editStaffForm, password: e.target.value })}
                    placeholder="Enter new password if resetting"
                    className="w-full p-2.5 border rounded-xl font-mono font-bold text-amber-700 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Mobile Number</label>
                  <input
                    type="text"
                    value={editStaffForm.mobile}
                    onChange={e => setEditStaffForm({ ...editStaffForm, mobile: e.target.value })}
                    className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Monthly Salary</label>
                  <input
                    type="text"
                    value={editStaffForm.salary}
                    onChange={e => setEditStaffForm({ ...editStaffForm, salary: e.target.value })}
                    className="w-full p-2.5 border rounded-xl font-semibold text-emerald-700 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Annual Leave (Days)</label>
                  <input
                    type="number"
                    value={editStaffForm.leaveBalance}
                    onChange={e => setEditStaffForm({ ...editStaffForm, leaveBalance: e.target.value })}
                    className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Profile Photo</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center justify-center px-4 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-300 rounded-xl cursor-pointer text-gray-700 font-bold text-xs gap-2 select-none active:scale-[0.98] transition-all">
                    <Upload className="w-4 h-4 text-gray-500" />
                    <span>Upload Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleEditStaffPhotoChange}
                      className="hidden"
                    />
                  </label>

                  {editStaffForm.photo && (
                    <div className="relative w-12 h-12 rounded-full overflow-hidden border border-gray-300 shadow-sm bg-gray-100 group">
                      <img
                        src={editStaffForm.photo}
                        alt="Staff Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setEditStaffForm({ ...editStaffForm, photo: '' })}
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity duration-200"
                        title="Remove Photo"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
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
                        checked={editStaffForm.permissions.includes(perm.id)}
                        onChange={() => {
                          const current = editStaffForm.permissions;
                          if (current.includes(perm.id)) {
                            setEditStaffForm({ ...editStaffForm, permissions: current.filter(p => p !== perm.id) });
                          } else {
                            setEditStaffForm({ ...editStaffForm, permissions: [...current, perm.id] });
                          }
                        }}
                        className="rounded text-amber-500 focus:ring-amber-500 w-4 h-4"
                      />
                      <span>{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={handleDeleteStaff}
                  className="px-4 py-3 bg-red-100 hover:bg-red-200 text-red-700 font-bold rounded-xl transition-all flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" /> Delete Staff
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-xs transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2 select-none active:scale-[0.98]"
                >
                  Save Profile Changes
                </button>
              </div>
            </form>
          )}

          {activeStaffModalTab === 'attendance' && (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {staffAttendanceLogs.length === 0 ? (
                <div className="text-center py-6 text-gray-400 font-medium">
                  No shift attendance records found for this staff member.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {staffAttendanceLogs.map((log) => (
                    <div key={log._id || log.id} className="bg-gray-50 border border-gray-100 p-3 rounded-xl flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-800">{log.date}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            log.status === 'Present' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {log.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-500 font-medium">
                          Shift Check-in: <strong className="text-gray-700">{log.clockIn || '--:--'}</strong> | Check-out: <strong className="text-gray-700">{log.clockOut || '--:--'}</strong>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </AdminModal>

      {/* Modal: Add New Banner */}
      <AdminModal isOpen={addBannerModal} onClose={() => setAddBannerModal(false)} title="Add New Café Promo Banner">
        <form onSubmit={handleSaveNewBanner} className="space-y-4 text-xs p-1">
          <div>
            <label className="block font-bold text-gray-700 mb-1">Banner Title *</label>
            <input
              type="text"
              required
              value={bannerForm.title}
              onChange={e => setBannerForm({ ...bannerForm, title: e.target.value })}
              placeholder="e.g. Artisanal Brunch & Matcha Offer"
              className="w-full p-2.5 border rounded-xl font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Subtitle / Offer Text *</label>
            <input
              type="text"
              required
              value={bannerForm.subtitle}
              onChange={e => setBannerForm({ ...bannerForm, subtitle: e.target.value })}
              placeholder="e.g. Get 20% off on all espresso brews & avocado toasts"
              className="w-full p-2.5 border rounded-xl font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Banner Image URL *</label>
            <input
              type="text"
              required
              value={bannerForm.imageUrl}
              onChange={e => setBannerForm({ ...bannerForm, imageUrl: e.target.value })}
              placeholder="https://..."
              className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Call-To-Action Link (CTA)</label>
            <input
              type="text"
              value={bannerForm.actionLink}
              onChange={e => setBannerForm({ ...bannerForm, actionLink: e.target.value })}
              placeholder="/cafe"
              className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-sm transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2"
          >
            Save Promotional Banner
          </button>
        </form>
      </AdminModal>

      {/* Modal: Edit Existing Banner */}
      <AdminModal isOpen={editBannerModal} onClose={() => setEditBannerModal(false)} title="Edit Café Promo Banner">
        <form onSubmit={handleSaveEditBanner} className="space-y-4 text-xs p-1">
          <div>
            <label className="block font-bold text-gray-700 mb-1">Banner Title *</label>
            <input
              type="text"
              required
              value={bannerForm.title}
              onChange={e => setBannerForm({ ...bannerForm, title: e.target.value })}
              className="w-full p-2.5 border rounded-xl font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Subtitle / Offer Text *</label>
            <input
              type="text"
              required
              value={bannerForm.subtitle}
              onChange={e => setBannerForm({ ...bannerForm, subtitle: e.target.value })}
              className="w-full p-2.5 border rounded-xl font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Banner Image URL *</label>
            <input
              type="text"
              required
              value={bannerForm.imageUrl}
              onChange={e => setBannerForm({ ...bannerForm, imageUrl: e.target.value })}
              className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Call-To-Action Link (CTA)</label>
            <input
              type="text"
              value={bannerForm.actionLink}
              onChange={e => setBannerForm({ ...bannerForm, actionLink: e.target.value })}
              className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => handleDeleteBanner(selectedBanner?.id)}
              className="px-4 py-3 bg-red-100 hover:bg-red-200 text-red-700 font-bold rounded-xl transition-all flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" /> Delete Banner
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-sm transition-all text-xs uppercase tracking-wider"
            >
              Save Details
            </button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
