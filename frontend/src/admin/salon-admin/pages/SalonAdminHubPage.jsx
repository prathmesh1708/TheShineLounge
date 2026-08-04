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
  X,
  UserPlus,
  Phone,
  Mail,
  MapPin
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
import apiClient from '../../../common/utils/apiClient';
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
    updateBookingStatus,
    addStaff,
    updateStaff,
    addBanner,
    updateBanner,
    deleteBanner,
    toggleBannerStatus,
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

  // Dynamic Staff State
  const [dbStaff, setDbStaff] = useState([]);

  const fetchLiveStaff = async () => {
    try {
      const res = await apiClient.get('/users/staff?serviceKey=salon');
      if (res.data && res.data.staff) {
        setDbStaff(res.data.staff);
      }
    } catch (err) {
      console.warn('Could not fetch live salon staff list:', err.message);
    }
  };

  useEffect(() => {
    if (searchParams.get('tab')) {
      setActiveTabState(searchParams.get('tab'));
    }
  }, [searchParams]);

  useEffect(() => {
    fetchLiveStaff();
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
  const serviceMain = services.find(s => s.key === serviceKey || s.slug === serviceKey);

  const serviceBookings = bookings.filter(b => b.serviceKey === 'salon' || (b.serviceName && b.serviceName.toLowerCase().includes('salon')));
  const serviceStaff = staffList.filter(s => s.serviceKey === serviceKey);

  const allSalonStaffMap = new Map();
  dbStaff.forEach(s => {
    const isSalon = s.serviceKey === 'salon' || (s.department && s.department.toLowerCase().includes('salon')) || (s.staffRole && (s.staffRole.toLowerCase().includes('salon') || s.staffRole.toLowerCase().includes('barber') || s.staffRole.toLowerCase().includes('stylist')));
    if (isSalon) {
      allSalonStaffMap.set(s.email || s._id || s.id, s);
    }
  });
  serviceStaff.forEach(s => {
    const key = s.email || s.id || s._id;
    const isSalon = s.serviceKey === 'salon' || (s.department && s.department.toLowerCase().includes('salon')) || (s.staffRole && (s.staffRole.toLowerCase().includes('salon') || s.staffRole.toLowerCase().includes('barber') || s.staffRole.toLowerCase().includes('stylist')));
    if (key && isSalon && !allSalonStaffMap.has(key)) {
      allSalonStaffMap.set(key, s);
    }
  });
  const mergedSalonStaff = Array.from(allSalonStaffMap.values());

  const serviceBanners = banners.filter(b => b.serviceKey === serviceKey);
  const serviceInventory = inventory.filter(i => i.serviceKey === serviceKey);

  // Modals state
  const [editingPriceModal, setEditingPriceModal] = useState(false);
  const [selectedServiceItem, setSelectedServiceItem] = useState(null);
  const [newPrice, setNewPrice] = useState(0);

  const [addBookingModal, setAddBookingModal] = useState(false);
  const [newBookingForm, setNewBookingForm] = useState({
    customerName: '',
    phone: '',
    stylist: 'Tahir Khan',
    plan: 'Executive Haircut',
    amount: 499,
    timeSlot: 'Today 03:00 PM'
  });

  const handleCreateBooking = (e) => {
    e.preventDefault();
    if (!newBookingForm.customerName) return;

    addBooking({
      serviceKey: 'salon',
      serviceName: 'Men\'s Salon',
      customerName: newBookingForm.customerName,
      phone: newBookingForm.phone,
      vehicleNo: `Stylist: ${newBookingForm.stylist || 'Any Specialist'}`,
      plan: newBookingForm.plan,
      amount: Number(newBookingForm.amount),
      timeSlot: newBookingForm.timeSlot
    });

    setAddBookingModal(false);
    setNewBookingForm({
      customerName: '',
      phone: '',
      stylist: 'Tahir Khan',
      plan: 'Executive Haircut',
      amount: 499,
      timeSlot: 'Today 03:00 PM'
    });
  };

  // Add Staff Modal State
  const [addStaffModal, setAddStaffModal] = useState(false);
  const [staffForm, setStaffForm] = useState({
    fullName: '',
    email: '',
    password: '',
    mobile: '',
    staffRole: 'Salon Styling Master',
    salary: '₹45,000 / month',
    leaveBalance: 12,
    photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80',
    permissions: ['bookings', 'orders']
  });

  // Edit Staff Modal States
  const [editStaffModal, setEditStaffModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [editStaffForm, setEditStaffForm] = useState({
    fullName: '',
    email: '',
    password: '',
    mobile: '',
    staffRole: 'Salon Styling Master',
    salary: '₹45,000 / month',
    leaveBalance: 12,
    photo: '',
    permissions: []
  });

  // Salon Banner Management State
  const [bannerModalOpen, setBannerModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [bannerForm, setBannerForm] = useState({
    title: '',
    subtitle: '',
    imageUrl: '',
    badge: 'Grooming Special',
    link: '/salon',
    status: 'active'
  });

  const handleOpenAddBanner = () => {
    setEditingBanner(null);
    setBannerForm({
      title: '',
      subtitle: '',
      imageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80',
      badge: 'Grooming Special',
      link: '/salon',
      status: 'active'
    });
    setBannerModalOpen(true);
  };

  const handleOpenEditBanner = (ban) => {
    setEditingBanner(ban);
    setBannerForm({
      title: ban.title || '',
      subtitle: ban.subtitle || '',
      imageUrl: ban.imageUrl || ban.image || '',
      badge: ban.badge || 'Grooming Special',
      link: ban.link || '/salon',
      status: ban.status || 'active'
    });
    setBannerModalOpen(true);
  };

  const handleSaveBanner = (e) => {
    e.preventDefault();
    if (!bannerForm.title.trim()) return;

    if (editingBanner) {
      updateBanner(editingBanner.id, {
        title: bannerForm.title,
        subtitle: bannerForm.subtitle,
        imageUrl: bannerForm.imageUrl,
        badge: bannerForm.badge,
        link: bannerForm.link,
        status: bannerForm.status
      });
    } else {
      addBanner({
        serviceKey: 'salon',
        title: bannerForm.title,
        subtitle: bannerForm.subtitle,
        imageUrl: bannerForm.imageUrl,
        badge: bannerForm.badge,
        link: bannerForm.link,
        status: bannerForm.status
      });
    }

    setBannerModalOpen(false);
  };

  const handleToggleBanner = (id) => {
    toggleBannerStatus(id);
  };

  const handleDeleteBanner = (id) => {
    if (window.confirm('Are you sure you want to delete this promotional banner?')) {
      deleteBanner(id);
    }
  };
  const [staffAttendanceLogs, setStaffAttendanceLogs] = useState([]);
  const [activeStaffModalTab, setActiveStaffModalTab] = useState('details');

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#';
    let pwd = '';
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setStaffForm(prev => ({ ...prev, password: pwd }));
  };

  const handleStaffPhotoUpload = (e, isEdit = false) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        if (showToast) showToast('Image size should be less than 5MB', 'error');
        else alert('Image size should be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (isEdit) {
          setEditStaffForm(prev => ({ ...prev, photo: reader.result }));
        } else {
          setStaffForm(prev => ({ ...prev, photo: reader.result }));
        }
      };
      reader.readAsDataURL(file);
    }
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
        department: 'Men\'s Salon',
        serviceKey: 'salon',
        staffRole: staffForm.staffRole,
        salary: staffForm.salary,
        leaveBalance: Number(staffForm.leaveBalance),
        photo: staffForm.photo,
        permissions: staffForm.permissions
      });

      if (res.data && res.data.success) {
        alert(`✅ Staff member onboarded successfully!\n\nStaff Email: ${staffForm.email}\nPassword: ${staffForm.password}\n\nStaff can now log in at /staff/login.`);
        
        // Sync with global AdminContext & localStorage
        addStaff({
          fullName: staffForm.fullName,
          name: staffForm.fullName,
          email: staffForm.email,
          mobile: staffForm.mobile,
          serviceKey: 'salon',
          department: 'Men\'s Salon',
          staffRole: staffForm.staffRole,
          role: staffForm.staffRole,
          salary: staffForm.salary,
          photo: staffForm.photo,
          permissions: staffForm.permissions
        });

        fetchLiveStaff();
        setAddStaffModal(false);
        setStaffForm({
          fullName: '',
          email: '',
          password: '',
          mobile: '',
          staffRole: 'Salon Styling Master',
          salary: '₹45,000 / month',
          leaveBalance: 12,
          photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80',
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

  const handleOpenEditStaff = async (stf) => {
    setSelectedStaff(stf);
    setEditStaffForm({
      fullName: stf.fullName || stf.name || '',
      email: stf.email || '',
      password: '',
      mobile: stf.mobile || '',
      staffRole: stf.staffRole || stf.role || 'Salon Styling Master',
      salary: stf.salary || '₹45,000 / month',
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
    if (!selectedStaff) return;

    const payload = {
      fullName: editStaffForm.fullName,
      name: editStaffForm.fullName,
      email: editStaffForm.email,
      mobile: editStaffForm.mobile,
      staffRole: editStaffForm.staffRole,
      role: editStaffForm.staffRole,
      salary: editStaffForm.salary,
      leaveBalance: Number(editStaffForm.leaveBalance),
      photo: editStaffForm.photo,
      permissions: editStaffForm.permissions
    };
    if (editStaffForm.password) {
      payload.password = editStaffForm.password;
    }

    // 1. Update local AdminContext & LocalStorage
    if (updateStaff) {
      updateStaff(sId, payload);
    }

    // Update local dbStaff state so UI reflects changes immediately
    setDbStaff(prev => prev.map(st => (st._id === sId || st.id === sId || (st.email && st.email.toLowerCase() === editStaffForm.email.toLowerCase())) ? { ...st, ...payload } : st));

    // 2. Try updating backend database if valid ID
    try {
      if (sId && String(sId).length === 24) {
        const res = await apiClient.put(`/users/staff/${sId}`, payload);
        if (res.data && res.data.success) {
          fetchLiveStaff();
        }
      }
    } catch (err) {
      console.warn('Backend update failed, using local update fallback:', err.message);
    }

    if (showToast) showToast(`✅ Staff member updated successfully!`);
    else alert('✅ Staff member updated successfully!');
    setEditStaffModal(false);
  };

  const handleDeleteStaff = async () => {
    const sId = selectedStaff?._id || selectedStaff?.id;
    if (!selectedStaff) return;

    const confirmDel = window.confirm(`Are you sure you want to delete "${editStaffForm.fullName || selectedStaff.fullName || selectedStaff.name}"?`);
    if (!confirmDel) return;

    // 1. Remove from local AdminContext & LocalStorage
    if (deleteStaff) {
      deleteStaff(sId, editStaffForm.email);
    }

    // Update local dbStaff state immediately
    setDbStaff(prev => prev.filter(st => st._id !== sId && st.id !== sId && st.email?.toLowerCase() !== editStaffForm.email?.toLowerCase()));

    // 2. Try deleting from backend if valid ID
    try {
      if (sId && String(sId).length === 24) {
        await apiClient.delete(`/users/staff/${sId}`);
        fetchLiveStaff();
      }
    } catch (err) {
      console.warn('Backend delete failed, using local delete fallback:', err.message);
    }

    if (showToast) showToast(`✅ Staff member deleted successfully!`, 'error');
    else alert('✅ Staff member deleted successfully!');
    setEditStaffModal(false);
  };

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
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white border border-gray-200 rounded-2xl p-4 shadow-sm gap-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Salon Appointments ({serviceBookings.length})</h3>
              <p className="text-xs text-gray-500">Live view and status tracking for hair, beard & grooming appointments</p>
            </div>
            <button
              onClick={() => setAddBookingModal(true)}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" /> New Salon Booking
            </button>
          </div>

          <DataTable
            columns={[
              { header: 'Booking ID', accessorKey: 'id', cell: (r) => <span className="font-mono font-bold text-gray-900">{r.id}</span> },
              { header: 'Customer & Stylist', accessorKey: 'customerName', cell: (r) => (
                <div>
                  <p className="font-bold text-gray-900">{r.customerName}</p>
                  <p className="text-[10px] text-gray-400 font-semibold">{r.vehicleNo || r.phone || 'Salon Client'}</p>
                </div>
              )},
              { header: 'Treatment / Service', accessorKey: 'plan', cell: (r) => <span className="font-bold text-amber-700">{r.plan || r.service}</span> },
              { header: 'Date & Slot', accessorKey: 'timeSlot', cell: (r) => <span className="text-xs font-medium text-gray-600">{r.date || r.timeSlot || 'Today'}</span> },
              { header: 'Total (₹)', accessorKey: 'total', cell: (r) => <span className="font-black text-emerald-700">₹{r.total || r.amount}</span> },
              { header: 'Status', accessorKey: 'status', cell: (r) => (
                <select
                  value={r.status || 'Confirmed'}
                  onChange={(e) => updateBookingStatus(r.id, e.target.value)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-extrabold cursor-pointer border-0 shadow-xs focus:ring-2 focus:ring-amber-500 ${
                    r.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                    r.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                    r.status === 'Confirmed' ? 'bg-amber-100 text-amber-800' :
                    r.status === 'Cancelled' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  <option value="Pending">Pending</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              )}
            ]}
            data={serviceBookings}
            searchPlaceholder="Search Salon Bookings..."
          />
        </div>
      )}

      {/* TAB 4: STAFF */}
      {activeTab === 'staff' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white border border-gray-200 rounded-2xl p-4 shadow-sm gap-3">
            <div>
              <h3 className="text-base font-black text-gray-900">
                Men's Salon Department Staff ({mergedSalonStaff.length})
              </h3>
              <p className="text-xs text-gray-500">
                Onboard styling specialists & barbers, generate email login credentials & assign module access
              </p>
            </div>
            <button
              onClick={() => setAddStaffModal(true)}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 whitespace-nowrap"
            >
              <UserPlus className="w-4 h-4" /> Onboard New Staff Member
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {mergedSalonStaff.map((stf) => (
              <div 
                key={stf._id || stf.id} 
                onClick={() => handleOpenEditStaff(stf)}
                className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between hover:border-amber-400 cursor-pointer hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={stf.photo || stf.avatar || stf.profileImage || "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80"}
                    alt={stf.fullName || stf.name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-amber-500/30 flex-shrink-0"
                  />
                  <div className="space-y-1 overflow-hidden">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-extrabold text-sm text-gray-900 truncate">{stf.fullName || stf.name}</h4>
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${stf.isActive !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'}`}>
                        {stf.isActive !== false ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-amber-700">{stf.staffRole || stf.role || 'Salon Styling Master'}</p>
                    <p className="text-[11px] text-gray-500 flex items-center gap-1 truncate">
                      <Mail className="w-3 h-3 text-gray-400 flex-shrink-0" /> {stf.email || 'staff@theshinelounge.com'}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 bg-gray-50 rounded-lg">
                    <span className="text-gray-400 font-semibold block text-[9px]">MOBILE NO</span>
                    <span className="font-bold text-gray-800 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-gray-400" /> {stf.mobile || '+91 98210 77777'}
                    </span>
                  </div>
                  <div className="p-2 bg-gray-50 rounded-lg">
                    <span className="text-gray-400 font-semibold block text-[9px]">MONTHLY SALARY</span>
                    <span className="font-bold text-emerald-700">{stf.salary || '₹45,000 / month'}</span>
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

      {/* TAB 5: MARKETING & BANNERS */}
      {activeTab === 'marketing' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white border border-gray-200 rounded-2xl p-4 shadow-sm gap-3">
            <div>
              <h3 className="text-base font-black text-gray-900">
                Salon Promotional Banners ({serviceBanners.length})
              </h3>
              <p className="text-xs text-gray-500">
                Create new banners, edit text & images, toggle visibility (show/hide on customer app), or delete offers.
              </p>
            </div>
            <button
              onClick={handleOpenAddBanner}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" /> Create New Salon Banner
            </button>
          </div>

          {serviceBanners.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-8 text-center space-y-3">
              <ImageIcon className="w-10 h-10 text-gray-400 mx-auto" />
              <h4 className="font-extrabold text-sm text-gray-800">No Salon Banners Found</h4>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">Create a promotional banner to highlight special salon combo offers, grooming deals, or discounts.</p>
              <button
                onClick={handleOpenAddBanner}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl transition-all"
              >
                + Add First Salon Banner
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {serviceBanners.map(ban => {
                const isActive = ban.status !== 'inactive';

                return (
                  <div key={ban.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                    <div>
                      <div className="relative h-44 w-full bg-gray-900">
                        <img src={ban.imageUrl || ban.image} alt={ban.title} className={`w-full h-full object-cover ${!isActive ? 'opacity-40 grayscale' : ''}`} />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        
                        <div className="absolute top-3 left-3 flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${isActive ? 'bg-emerald-500 text-white shadow-xs' : 'bg-gray-700 text-gray-200'}`}>
                            {isActive ? '● VISIBLE ON APP' : '○ HIDDEN'}
                          </span>
                        </div>

                        {ban.badge && (
                          <span className="absolute top-3 right-3 px-2.5 py-1 rounded-md text-[10px] font-black bg-amber-500 text-gray-950 uppercase tracking-wider">
                            {ban.badge}
                          </span>
                        )}

                        <div className="absolute bottom-3 left-3 right-3 text-white">
                          <h4 className="font-extrabold text-sm leading-tight text-white">{ban.title}</h4>
                          <p className="text-xs text-gray-300 line-clamp-1 mt-0.5">{ban.subtitle}</p>
                        </div>
                      </div>

                      <div className="p-3.5 space-y-1 text-xs text-gray-600 border-b border-gray-100">
                        <div className="flex items-center gap-1.5 font-medium text-gray-500 text-[11px]">
                          <LinkIcon className="w-3.5 h-3.5 text-amber-600" />
                          <span>Link: <strong className="text-gray-800">{ban.link || '/salon'}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-gray-50 flex items-center justify-between gap-2 border-t border-gray-100">
                      <button
                        onClick={() => handleToggleBanner(ban.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                          isActive ? 'bg-amber-100 text-amber-900 hover:bg-amber-200' : 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200'
                        }`}
                      >
                        {isActive ? <ToggleRight className="w-4 h-4 text-amber-700" /> : <ToggleLeft className="w-4 h-4 text-emerald-700" />}
                        <span>{isActive ? 'Hide Banner' : 'Show Banner'}</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenEditBanner(ban)}
                          className="p-2 text-gray-600 hover:text-amber-700 hover:bg-white rounded-lg border border-gray-200 transition-all"
                          title="Edit Banner"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteBanner(ban.id)}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-white rounded-lg border border-gray-200 transition-all"
                          title="Delete Banner"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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

      {/* MODAL: ADD SALON BOOKING */}
      <AdminModal isOpen={addBookingModal} onClose={() => setAddBookingModal(false)} title="New Salon Booking">
        <form onSubmit={handleCreateBooking} className="space-y-4 text-xs p-1">
          <div>
            <label className="block font-bold text-gray-700 mb-1">Customer Name *</label>
            <input
              type="text"
              required
              value={newBookingForm.customerName}
              onChange={e => setNewBookingForm({ ...newBookingForm, customerName: e.target.value })}
              className="w-full p-2.5 border rounded-xl outline-none focus:border-amber-500"
              placeholder="e.g. Sanjay Dutt"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={newBookingForm.phone}
                onChange={e => setNewBookingForm({ ...newBookingForm, phone: e.target.value })}
                className="w-full p-2.5 border rounded-xl outline-none focus:border-amber-500"
                placeholder="+91 99300 44556"
              />
            </div>
            <div>
              <label className="block font-bold text-gray-700 mb-1">Stylist / Specialist</label>
              <input
                type="text"
                value={newBookingForm.stylist}
                onChange={e => setNewBookingForm({ ...newBookingForm, stylist: e.target.value })}
                className="w-full p-2.5 border rounded-xl outline-none focus:border-amber-500"
                placeholder="Tahir Khan"
              />
            </div>
          </div>
          <div>
            <label className="block font-bold text-gray-700 mb-1">Treatment / Service</label>
            <input
              type="text"
              value={newBookingForm.plan}
              onChange={e => setNewBookingForm({ ...newBookingForm, plan: e.target.value })}
              className="w-full p-2.5 border rounded-xl outline-none focus:border-amber-500"
              placeholder="e.g. Executive Haircut"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-700 mb-1">Total Amount (₹)</label>
              <input
                type="number"
                required
                value={newBookingForm.amount}
                onChange={e => setNewBookingForm({ ...newBookingForm, amount: e.target.value })}
                className="w-full p-2.5 border rounded-xl outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block font-bold text-gray-700 mb-1">Time Slot / Schedule</label>
              <input
                type="text"
                value={newBookingForm.timeSlot}
                onChange={e => setNewBookingForm({ ...newBookingForm, timeSlot: e.target.value })}
                className="w-full p-2.5 border rounded-xl outline-none focus:border-amber-500"
                placeholder="Today 03:00 PM"
              />
            </div>
          </div>
          <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setAddBookingModal(false)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-xs"
            >
              Create Salon Booking
            </button>
          </div>
        </form>
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
                placeholder="e.g. Tahir Khan"
                className="w-full p-2.5 border rounded-xl font-bold text-gray-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Staff Title / Role *</label>
              <input
                type="text"
                required
                value={staffForm.staffRole}
                onChange={e => setStaffForm({ ...staffForm, staffRole: e.target.value })}
                placeholder="Salon Styling Master"
                className="w-full p-2.5 border rounded-xl font-bold text-gray-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
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
                placeholder="tahir@theshinelounge.com"
                className="w-full p-2.5 border rounded-xl text-gray-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
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
                placeholder="+91 98210 77777"
                className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Monthly Salary</label>
              <input
                type="text"
                value={staffForm.salary}
                onChange={e => setStaffForm({ ...staffForm, salary: e.target.value })}
                placeholder="₹45,000 / month"
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
            <label className="block font-bold text-gray-700 mb-1">Staff Profile Photo</label>
            <div className="flex items-center gap-3 p-2 bg-gray-50 border rounded-xl">
              <img
                src={staffForm.photo || "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80"}
                alt="Staff Preview"
                className="w-12 h-12 rounded-full object-cover border border-amber-500/40 shrink-0"
              />
              <div className="flex-1 space-y-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleStaffPhotoUpload(e, false)}
                  className="w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-amber-500 file:text-white hover:file:bg-amber-600 cursor-pointer"
                />
                <p className="text-[10px] text-gray-400">Upload JPG, PNG or WEBP (Max 5MB)</p>
              </div>
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

      {/* Modal: Edit Existing Staff Member & Shift Attendance Logs */}
      <AdminModal 
        isOpen={editStaffModal} 
        onClose={() => setEditStaffModal(false)} 
        title={`Manage Staff: ${editStaffForm.fullName || 'Member'}`}
      >
        <div className="space-y-4 text-xs p-1">
          {/* Modal Sub-Tabs */}
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
                    <label className="font-bold text-gray-700">Update Password</label>
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
                <label className="block font-bold text-gray-700 mb-1">Staff Profile Photo</label>
                <div className="flex items-center gap-3 p-2 bg-gray-50 border rounded-xl">
                  <img
                    src={editStaffForm.photo || "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80"}
                    alt="Staff Preview"
                    className="w-12 h-12 rounded-full object-cover border border-amber-500/40 shrink-0"
                  />
                  <div className="flex-1 space-y-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleStaffPhotoUpload(e, true)}
                      className="w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-amber-500 file:text-white hover:file:bg-amber-600 cursor-pointer"
                    />
                    <p className="text-[10px] text-gray-400">Upload JPG, PNG or WEBP (Max 5MB)</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <button
                  type="button"
                  onClick={handleDeleteStaff}
                  className="px-4 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-bold transition-all text-xs flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" /> Delete Staff Member
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-500 text-white hover:bg-amber-600 rounded-xl font-bold transition-all text-xs uppercase shadow-xs"
                >
                  Save Staff Details
                </button>
              </div>
            </form>
          )}

          {activeStaffModalTab === 'attendance' && (
            <div className="space-y-3">
              {staffAttendanceLogs.length > 0 ? (
                <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
                  {staffAttendanceLogs.map((log) => {
                    const formatTime = (timeVal) => {
                      if (!timeVal) return 'In Progress';
                      if (typeof timeVal === 'string') {
                        const trimmed = timeVal.trim();
                        if (trimmed.includes('AM') || trimmed.includes('PM') || trimmed.toLowerCase().includes('progress')) {
                          return trimmed;
                        }
                      }
                      const parsed = new Date(timeVal);
                      if (!isNaN(parsed.getTime())) {
                        return parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      }
                      return String(timeVal);
                    };

                    const checkIn = formatTime(log.checkInTime);
                    const checkOut = formatTime(log.checkOutTime);
                    const isActive = !log.checkOutTime || log.checkOutTime === 'In Progress' || log.status === 'Active Shift';

                    return (
                      <div key={log._id || log.id} className="p-3.5 bg-gray-50/80 border border-gray-200/80 rounded-2xl flex justify-between items-center shadow-xs">
                        <div className="space-y-1.5 flex-1 pr-2">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-gray-900">{log.date || '2026-07-30'}</span>
                            <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                              isActive ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {isActive ? 'Active Shift' : 'Shift Completed'}
                            </span>
                          </div>

                          <div className="text-xs text-gray-600 font-semibold flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                            <span>
                              check-in: <strong className="text-gray-900">{checkIn}</strong> | checkout: <strong className="text-gray-900">{checkOut}</strong>
                            </span>
                          </div>

                          <div className="text-[11px] text-gray-500 font-medium flex items-center gap-1.5 italic">
                            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            <span>{log.location || '19.0760° N, 72.8777° E (Main Branch)'}</span>
                          </div>
                        </div>

                        <div className="flex flex-col items-center gap-1 shrink-0">
                          <span className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wider">Selfie</span>
                          <img
                            src={log.photoUrl || log.selfie || log.photo || "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150"}
                            alt="Staff Selfie"
                            className="w-11 h-11 rounded-xl object-cover border border-gray-200 shadow-xs"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center bg-gray-50 rounded-2xl border text-gray-400">
                  No shift attendance records logged yet for this staff member.
                </div>
              )}
            </div>
          )}
        </div>
      </AdminModal>

      {/* Banner Creation & Edit Modal */}
      <AdminModal
        isOpen={bannerModalOpen}
        onClose={() => setBannerModalOpen(false)}
        title={editingBanner ? "Edit Salon Banner" : "Create New Salon Banner"}
      >
        <form onSubmit={handleSaveBanner} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Banner Title *</label>
            <input
              type="text"
              required
              value={bannerForm.title}
              onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
              placeholder="e.g. ROYAL BEARD & HAIR SPA"
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Subtitle / Offer Description *</label>
            <textarea
              rows={2}
              required
              value={bannerForm.subtitle}
              onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })}
              placeholder="e.g. Hot towel head massage + executive hair styling combo offer."
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Banner Image URL *</label>
            <input
              type="url"
              required
              value={bannerForm.imageUrl}
              onChange={(e) => setBannerForm({ ...bannerForm, imageUrl: e.target.value })}
              placeholder="https://..."
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500"
            />
            {/* Quick image samples */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="text-[10px] text-gray-500 font-bold self-center">Quick Samples:</span>
              {[
                { label: '💇‍♂️ Haircut', url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80' },
                { label: '🧔 Beard', url: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=800&q=80' },
                { label: '💆 Facial', url: 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&w=800&q=80' },
                { label: '🛁 Spa', url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80' }
              ].map(sample => (
                <button
                  key={sample.label}
                  type="button"
                  onClick={() => setBannerForm({ ...bannerForm, imageUrl: sample.url })}
                  className="px-2 py-0.5 bg-gray-100 hover:bg-amber-100 text-gray-700 hover:text-amber-800 rounded text-[10px] font-bold border border-gray-200"
                >
                  {sample.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Badge Tag</label>
              <input
                type="text"
                value={bannerForm.badge}
                onChange={(e) => setBannerForm({ ...bannerForm, badge: e.target.value })}
                placeholder="e.g. 20% OFF or Grooming Special"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Target Link URL</label>
              <input
                type="text"
                value={bannerForm.link}
                onChange={(e) => setBannerForm({ ...bannerForm, link: e.target.value })}
                placeholder="e.g. /salon or /salon/booking"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Visibility Status</label>
            <select
              value={bannerForm.status}
              onChange={(e) => setBannerForm({ ...bannerForm, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 font-bold"
            >
              <option value="active">Active (Show on App)</option>
              <option value="inactive">Inactive (Hide from App)</option>
            </select>
          </div>

          <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setBannerModalOpen(false)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold shadow-xs"
            >
              {editingBanner ? "Save Banner Updates" : "Create Salon Banner"}
            </button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}


