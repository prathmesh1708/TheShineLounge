import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { uploadToCloudinary } from '../../../common/utils/cloudinaryUpload';
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
  X,
  UserPlus,
  Phone,
  Mail,
  MapPin,
  Car
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
import RegisteredVehicleDetailModal from '../../common/components/RegisteredVehicleDetailModal';
import OfflineSaleModal from '../../common/components/OfflineSaleModal';
import apiClient from '../../../common/utils/apiClient';
import {
  getServicesSync,
  saveService,
  updateServicePrice as apiUpdatePrice,
  deleteService as apiDeleteService,
  getVehicleTypes,
  saveVehicleType,
  deleteVehicleType,
  getBookingsSync
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
    updateBookingStatus,
    addBanner,
    updateBanner,
    deleteBanner,
    toggleBannerStatus,
    addInventoryItem,
    showToast,
    addOfflineSale
  } = useAdmin();

  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') || 'treatments';
  const [activeTab, setActiveTabState] = useState(tabFromUrl);

  // Dynamic Car Detailing Treatments, Staff, Vehicle Types & Bookings State
  const [detailingServices, setDetailingServices] = useState(getServicesSync());
  const [dbStaff, setDbStaff] = useState([]);
  const [adminVehicleTypes, setAdminVehicleTypes] = useState(getVehicleTypes());
  const [localDetailingBookings, setLocalDetailingBookings] = useState(getBookingsSync());
  const [newVehicleTypeInput, setNewVehicleTypeInput] = useState('');
  const [showVehicleTypesSection, setShowVehicleTypesSection] = useState(true);

  const fetchLiveStaff = async () => {
    try {
      const res = await apiClient.get('/users/staff?serviceKey=car-detailing');
      if (res.data && res.data.staff) {
        setDbStaff(res.data.staff);
      }
    } catch (err) {
      console.warn('Could not fetch live car-detailing staff list:', err.message);
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
      setDetailingServices(getServicesSync());
      setAdminVehicleTypes(getVehicleTypes());
      setLocalDetailingBookings(getBookingsSync());
    };
    window.addEventListener('carDetailingDataChanged', syncData);
    window.addEventListener('carDetailingVehicleTypesChanged', syncData);
    return () => {
      window.removeEventListener('carDetailingDataChanged', syncData);
      window.removeEventListener('carDetailingVehicleTypesChanged', syncData);
    };
  }, []);

  const handleAddVehicleTypeSubmit = (e) => {
    e.preventDefault();
    if (!newVehicleTypeInput.trim()) return;
    saveVehicleType(newVehicleTypeInput.trim());
    setNewVehicleTypeInput('');
    if (showToast) showToast('New vehicle type added successfully!', 'success');
  };

  const handleDeleteVehicleTypeItem = (typeName) => {
    deleteVehicleType(typeName);
    if (showToast) showToast(`Vehicle type "${typeName}" removed`, 'info');
  };

  const handleTabChange = (tabId) => {
    setActiveTabState(tabId);
    setSearchParams({ tab: tabId });
  };

  const serviceStats = serviceStatsMap[serviceKey] || serviceStatsMap['car-wash'];
  const serviceMain = services.find(s => s.key === serviceKey || s.slug === serviceKey);

  const mappedLocal = localDetailingBookings.map(b => ({
    id: b.id,
    customerName: b.customerName || 'Car Owner',
    customerEmail: b.customerEmail || b.email || '',
    phone: b.phone || b.mobile || '',
    vehicle: b.vehicle || b.vehicleNo || 'Vehicle',
    vehicleNo: b.vehicleNo || b.vehicle || 'MP-09-AB-1234',
    vehicleType: b.vehicleType || 'Sedan',
    location: b.location || b.address || '',
    plan: b.package || b.service || 'Paint Protection Film (PPF)',
    service: b.package || b.service || 'Paint Protection Film (PPF)',
    serviceKey: 'car-detailing',
    serviceName: 'Car Detailing',
    date: b.date || (b.timeSlot ? b.timeSlot.split('|')[0].trim() : new Date().toISOString().split('T')[0]),
    total: b.price || b.amount || 1490,
    amount: b.price || b.amount || 1490,
    status: b.status || 'Confirmed'
  }));

  const contextBookings = bookings.filter(b => b.serviceKey === 'car-detailing' || (b.serviceName && b.serviceName.toLowerCase().includes('detail')));

  const serviceBookings = [
    ...mappedLocal,
    ...contextBookings.filter(cb => !mappedLocal.some(lb => lb.id === cb.id))
  ];

  // Get active logged in user from localStorage if any, for fallback
  let activeUserEmail = 'mohit1@gmail.com';
  let activeUserName = 'Mohit singh';
  let activeUserPhone = '+91 98200 54321';
  try {
    const stored = localStorage.getItem('tsl_customer_user') || localStorage.getItem('tsl_user');
    if (stored) {
      const u = JSON.parse(stored);
      if (u.email && u.email !== 'admin@gmail.com') activeUserEmail = u.email;
      if (u.fullName || u.name) {
        const parsedName = u.fullName || u.name;
        if (parsedName !== 'Super Admin') activeUserName = parsedName;
      }
      if (u.mobile || u.phone) {
        const parsedPhone = u.mobile || u.phone;
        if (parsedPhone !== '+91 00000 00000') activeUserPhone = parsedPhone;
      }
    }
  } catch (e) {}

  const registeredVehiclesMap = {};
  serviceBookings
    .filter(b => {
      const pkg = (b.plan || b.packageName || b.service || '').toLowerCase();
      if (pkg.includes('wash') && !pkg.includes('detail')) return false;
      return true;
    })
    .forEach((b, idx) => {
      const rawEmail = (b.customerEmail || b.email || '').toLowerCase().trim();
      const email = !rawEmail || rawEmail === 'customer@shinelounge.com' || rawEmail === 'admin@gmail.com' ? activeUserEmail : rawEmail;

      const rawName = b.customerName || '';
      const name = !rawName || rawName === 'Car Owner' || rawName === 'Valued Customer' || rawName === 'Super Admin' ? activeUserName : rawName;

      const rawPhone = b.phone || b.mobile || '';
      const phone = !rawPhone || rawPhone === '+91 00000 00000' || rawPhone === '+91 98200 54321' ? activeUserPhone : rawPhone;

      const plate = (b.vehicleNo || 'MP-09-AB-1234').toUpperCase();
      const model = b.vehicleType || b.vehicle || 'Premium Vehicle';
      const key = `${email || name}_${plate}`.toLowerCase();

      if (!registeredVehiclesMap[key]) {
        registeredVehiclesMap[key] = {
          plate: plate,
          model: model,
          ownerName: name,
          ownerEmail: email,
          ownerPhone: phone,
          packageName: b.plan || b.packageName || b.service || 'Paint Protection Film (PPF)',
          address: b.location || b.address || 'Scheme No. 54, Vijay Nagar, Indore',
          totalBookings: 1,
          lastServiceDate: b.date || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        };
      } else {
        registeredVehiclesMap[key].totalBookings += 1;
        if (b.date && !b.date.includes('July 18')) {
          registeredVehiclesMap[key].lastServiceDate = b.date;
        }
      }
    });


  const registeredVehiclesList = Object.values(registeredVehiclesMap).length > 0
    ? Object.values(registeredVehiclesMap)
    : [
        {
          plate: 'MP-09-AB-1234',
          model: 'Tesla Model 3 (Sedan)',
          ownerName: 'Car Owner',
          ownerEmail: 'owner@shinelounge.com',
          ownerPhone: '+91 98200 54321',
          packageName: 'Paint Protection Film (PPF)',
          address: 'Scheme No. 54, Vijay Nagar, Indore',
          totalBookings: 1,
          lastServiceDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        }
      ];

  const serviceStaff = staffList.filter(s => s.serviceKey === serviceKey);
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
    vehicleNo: '',
    vehicleType: 'Sedan',
    plan: 'Paint Protection Film (PPF)',
    amount: 1499,
    date: new Date().toISOString().split('T')[0]
  });

  const handleCreateBooking = (e) => {
    e.preventDefault();
    if (!newBookingForm.customerName) return;

    addBooking({
      serviceKey: 'car-detailing',
      serviceName: 'Car Detailing',
      customerName: newBookingForm.customerName,
      phone: newBookingForm.phone,
      vehicleNo: newBookingForm.vehicleNo || 'MH-01-AB-1234',
      vehicleType: newBookingForm.vehicleType || 'Sedan',
      plan: newBookingForm.plan,
      amount: Number(newBookingForm.amount),
      date: newBookingForm.date || new Date().toISOString().split('T')[0]
    });

    setAddBookingModal(false);
    setNewBookingForm({
      customerName: '',
      phone: '',
      vehicleNo: '',
      vehicleType: 'Sedan',
      plan: 'Paint Protection Film (PPF)',
      amount: 1499,
      date: new Date().toISOString().split('T')[0]
    });
  };

  // Car Detailing Banner Management State
  const [bannerModalOpen, setBannerModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [bannerForm, setBannerForm] = useState({
    title: '',
    subtitle: '',
    imageUrl: '',
    badge: 'Ceramic Special',
    link: '/car-detailing',
    status: 'active'
  });

  const handleOpenAddBanner = () => {
    setEditingBanner(null);
    setBannerForm({
      title: '',
      subtitle: '',
      imageUrl: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=800&q=80',
      badge: 'Ceramic Special',
      link: '/car-detailing',
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
      badge: ban.badge || 'Ceramic Special',
      link: ban.link || '/car-detailing',
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
        serviceKey: 'car-detailing',
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

  // Add Staff Modal State
  const [addStaffModal, setAddStaffModal] = useState(false);
  const [selectedVehicleDetail, setSelectedVehicleDetail] = useState(null);
  const [isOfflineSaleModalOpen, setIsOfflineSaleModalOpen] = useState(false);
  const [staffForm, setStaffForm] = useState({
    fullName: '',
    email: '',
    password: '',
    mobile: '',
    staffRole: 'Detailing Specialist',
    salary: '₹42,000 / month',
    leaveBalance: 12,
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
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
    staffRole: 'Detailing Specialist',
    salary: '₹42,000 / month',
    leaveBalance: 12,
    photo: '',
    permissions: []
  });
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

  const handleStaffPhotoUpload = async (e, isEdit = false) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      try {
        if (showToast) showToast('Uploading staff photo to Cloudinary...');
        const res = await uploadToCloudinary(file, 'shine-lounge/staff');
        if (isEdit) {
          setEditStaffForm(prev => ({ ...prev, photo: res.url }));
        } else {
          setStaffForm(prev => ({ ...prev, photo: res.url }));
        }
        if (showToast) showToast('Staff photo uploaded successfully!');
      } catch (err) {
        if (showToast) showToast('Photo upload failed: ' + err.message, 'error');
      }
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
        department: 'Car Detailing',
        serviceKey: 'car-detailing',
        staffRole: staffForm.staffRole,
        salary: staffForm.salary,
        leaveBalance: Number(staffForm.leaveBalance),
        photo: staffForm.photo,
        permissions: staffForm.permissions
      });

      if (res.data && res.data.success) {
        alert(`✅ Staff member onboarded successfully!\n\nStaff Email: ${staffForm.email}\nPassword: ${staffForm.password}\n\nStaff can now log in at /staff/login.`);
        fetchLiveStaff();
        setAddStaffModal(false);
        setStaffForm({
          fullName: '',
          email: '',
          password: '',
          mobile: '',
          staffRole: 'Detailing Specialist',
          salary: '₹42,000 / month',
          leaveBalance: 12,
          photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
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
      staffRole: stf.staffRole || stf.role || 'Detailing Specialist',
      salary: stf.salary || '₹42,000 / month',
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

  const handleImageFileChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      try {
        if (showToast) showToast('Uploading image to Cloudinary...');
        const res = await uploadToCloudinary(file, 'shine-lounge/car-detailing');
        setTreatmentForm(prev => ({ ...prev, image: res.url }));
        if (showToast) showToast('Treatment photo uploaded to Cloudinary successfully!');
      } catch (err) {
        if (showToast) showToast('Photo upload failed: ' + err.message, 'error');
      }
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
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-amber-600/80 block leading-none">Starting from</span>
                        <div className="text-lg font-black text-amber-600 leading-tight">
                          ₹{Number(service.price).toLocaleString('en-IN')}
                        </div>
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

      {/* TAB 3: BOOKINGS */}
      {activeTab === 'bookings' && (
        <div className="space-y-5">
          {/* Header & Controls Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white border border-gray-200 rounded-2xl p-4 shadow-sm gap-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Car Detailing Appointments ({serviceBookings.length})</h3>
              <p className="text-xs text-gray-500">Live view and status tracking for ceramic coating, PPF & detailing appointments</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowVehicleTypesSection(!showVehicleTypesSection)}
                className="px-3.5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap"
              >
                <Car className="w-4 h-4 text-amber-600" />
                <span>{showVehicleTypesSection ? 'Hide Vehicle Types' : `Manage Vehicle Types (${adminVehicleTypes.length})`}</span>
              </button>
              <button
                onClick={() => setAddBookingModal(true)}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" /> New Car Detailing Booking
              </button>
            </div>
          </div>

          {/* Integrated Dynamic Vehicle Types Management Section */}
          {showVehicleTypesSection && (
            <div className="bg-white border border-amber-200/80 rounded-2xl p-5 shadow-xs space-y-4 bg-gradient-to-r from-amber-50/20 via-white to-white">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
                    <Car className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider">
                      Dynamic Vehicle Types Registry
                    </h4>
                    <p className="text-[11px] text-gray-500 font-medium">
                      Configure vehicle types for booking step 1. Custom vehicle types entered by users automatically appear here.
                    </p>
                  </div>
                </div>

                {/* Add Vehicle Type Form */}
                <form onSubmit={handleAddVehicleTypeSubmit} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Pickup Truck, EV, Van"
                    value={newVehicleTypeInput}
                    onChange={(e) => setNewVehicleTypeInput(e.target.value)}
                    className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs outline-none focus:border-amber-500 w-44 sm:w-56 bg-white"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-[#FF6B00] hover:bg-[#E66000] text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm transition-all shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Type</span>
                  </button>
                </form>
              </div>

              {/* Vehicle Types List */}
              <div className="flex flex-wrap gap-2.5 pt-1">
                {adminVehicleTypes.map((vType) => {
                  const isDefault = ["Hatchback", "Sedan", "SUV", "Luxury / Sports"].includes(vType);
                  return (
                    <div
                      key={vType}
                      className="px-3 py-1.5 bg-gray-50 border border-gray-200 hover:border-amber-300 rounded-xl flex items-center gap-2 shadow-2xs text-xs font-extrabold text-gray-800 transition-all"
                    >
                      <Car className="w-3.5 h-3.5 text-amber-600" />
                      <span>{vType}</span>
                      <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded ${
                        isDefault ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {isDefault ? 'Standard' : 'Custom'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteVehicleTypeItem(vType)}
                        className="text-gray-400 hover:text-red-600 transition-colors ml-1"
                        title="Delete Vehicle Type"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <DataTable
            columns={[
              { header: 'Booking ID', accessorKey: 'id', cell: (r) => <span className="font-mono font-bold text-gray-900">{r.id}</span> },
              { header: 'Customer & Vehicle', accessorKey: 'customerName', cell: (r) => (
                <div>
                  <p className="font-bold text-gray-900">{r.customerName}</p>
                  <p className="text-[10px] text-gray-500 font-semibold">{r.vehicle || r.vehicleNo || r.phone || 'Detailing Client'}</p>
                </div>
              )},
              { header: 'Vehicle Type', accessorKey: 'vehicleType', cell: (r) => (
                <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-xs font-extrabold border border-amber-200 inline-flex items-center gap-1">
                  <Car className="w-3 h-3 text-amber-600" />
                  <span>{r.vehicleType || 'Sedan'}</span>
                </span>
              )},
              { header: 'Treatment / Package', accessorKey: 'plan', cell: (r) => <span className="font-bold text-amber-700">{r.plan || r.service}</span> },
              { header: 'Booking Date & Time', accessorKey: 'timeSlot', cell: (r) => (
                <span className="text-xs font-bold text-gray-700">
                  {r.timeSlot || r.date}
                </span>
              )},
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
            searchPlaceholder="Search Car Detailing Bookings..."
          />
        </div>
      )}

      {/* TAB 4.5: REGISTERED VEHICLES */}
      {activeTab === 'vehicles' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white border border-gray-200 rounded-2xl p-4 shadow-sm gap-3">
            <div>
              <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                🚗 Registered Detailing Vehicles & Fleet ({registeredVehiclesList.length})
              </h3>
              <p className="text-xs text-gray-500">Live list of customer vehicles registered during detailing sessions</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
                {registeredVehiclesList.length} Registered Cars
              </span>
              <button
                onClick={() => setIsOfflineSaleModalOpen(true)}
                className="px-3 py-1.5 rounded-xl text-[11px] font-bold text-white flex items-center gap-1 shadow-sm transition-all hover:shadow-md"
                style={{ backgroundColor: '#e07b2a' }}
              >
                <Plus className="w-3.5 h-3.5" /> Record Offline Sale
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {registeredVehiclesList.map((v, i) => (
              <div
                key={v.plate || i}
                className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3 hover:border-amber-300 transition-all flex flex-col justify-between cursor-pointer hover:shadow-md"
                onClick={() => {
                  const plate = (v.plate || '').toUpperCase().trim();
                  const vehicleBookings = serviceBookings.filter(b => (b.vehicleNo || b.vehiclePlate || '').toUpperCase().trim() === plate);
                  setSelectedVehicleDetail({ vehicle: v, history: vehicleBookings });
                }}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center justify-center font-black text-lg">
                        🚗
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-gray-900">{v.model}</h4>
                        <span className="text-xs font-black text-amber-600 tracking-wider block">{v.plate}</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-md border border-emerald-200">
                      {v.totalBookings} {v.totalBookings === 1 ? 'Booking' : 'Bookings'}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-gray-100 space-y-1.5 text-xs text-gray-600">
                    <p className="flex justify-between">
                      <span className="text-gray-400">Registered Owner:</span>
                      <strong className="text-gray-800">{v.ownerName}</strong>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-gray-400">Detailing Treatment:</span>
                      <span className="text-amber-700 font-bold text-right truncate max-w-[170px]" title={v.packageName}>{v.packageName}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-gray-400">Contact:</span>
                      <span className="text-gray-700 font-semibold">{v.ownerPhone}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-gray-400">Email:</span>
                      <span className="text-gray-600 truncate max-w-[185px]">{v.ownerEmail}</span>
                    </p>
                    {v.address && (
                      <div className="flex flex-col gap-0.5 border-t border-gray-50 pt-2 mt-1">
                        <span className="text-gray-400 text-[10px] uppercase font-bold">Address Detail:</span>
                        <span className="text-gray-700 font-semibold leading-relaxed break-words">{v.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2.5 border-t border-gray-50 flex justify-between items-center text-xs text-gray-500 mt-2">
                  <span className="text-gray-400">Last Service:</span>
                  <span className="text-amber-700 font-bold">{v.lastServiceDate}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Vehicle Detail Modal */}
          <RegisteredVehicleDetailModal
            isOpen={!!selectedVehicleDetail}
            onClose={() => setSelectedVehicleDetail(null)}
            vehicle={selectedVehicleDetail?.vehicle}
            bookingHistory={selectedVehicleDetail?.history || []}
            onNewOfflineSale={() => {
              setSelectedVehicleDetail(null);
              setIsOfflineSaleModalOpen(true);
            }}
          />

          {/* Offline Sale Modal */}
          <OfflineSaleModal
            isOpen={isOfflineSaleModalOpen}
            onClose={() => setIsOfflineSaleModalOpen(false)}
            onSubmit={async (formData) => {
              if (addOfflineSale) await addOfflineSale({ ...formData, serviceKey: 'car-detailing', serviceName: 'Car Detailing' });
            }}
          />
        </div>
      )}

      {/* TAB 5: STAFF */}

      {activeTab === 'staff' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white border border-gray-200 rounded-2xl p-4 shadow-sm gap-3">
            <div>
              <h3 className="text-base font-black text-gray-900">
                Car Detailing Department Staff ({(dbStaff.length > 0 ? dbStaff : serviceStaff).filter(s => s.serviceKey === 'car-detailing' || (s.department && s.department.toLowerCase().includes('detail'))).length})
              </h3>
              <p className="text-xs text-gray-500">
                Onboard detailing specialists, generate email login credentials & assign module access
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
            {(dbStaff.length > 0 ? dbStaff : serviceStaff)
              .filter(s => s.serviceKey === 'car-detailing' || (s.department && s.department.toLowerCase().includes('detail')))
              .map((stf) => (
                <div 
                  key={stf._id || stf.id} 
                  onClick={() => handleOpenEditStaff(stf)}
                  className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between hover:border-amber-400 cursor-pointer hover:shadow-md transition-all"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={stf.photo || stf.avatar || stf.profileImage || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80"}
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
                      <p className="text-xs font-bold text-amber-700">{stf.staffRole || stf.role || 'Detailing Specialist'}</p>
                      <p className="text-[11px] text-gray-500 flex items-center gap-1 truncate">
                        <Mail className="w-3 h-3 text-gray-400 flex-shrink-0" /> {stf.email || 'staff@theshinelounge.com'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <span className="text-gray-400 font-semibold block text-[9px]">MOBILE NO</span>
                      <span className="font-bold text-gray-800 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-gray-400" /> {stf.mobile || '+91 98210 55555'}
                      </span>
                    </div>
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <span className="text-gray-400 font-semibold block text-[9px]">MONTHLY SALARY</span>
                      <span className="font-bold text-emerald-700">{stf.salary || '₹42,000 / month'}</span>
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

      {/* TAB 6: MARKETING & BANNERS */}
      {activeTab === 'marketing' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white border border-gray-200 rounded-2xl p-4 shadow-sm gap-3">
            <div>
              <h3 className="text-base font-black text-gray-900">
                Car Detailing Promotional Banners ({serviceBanners.length})
              </h3>
              <p className="text-xs text-gray-500">
                Create new banners, edit text & images, toggle visibility (show/hide on customer app), or delete offers.
              </p>
            </div>
            <button
              onClick={handleOpenAddBanner}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" /> Create New Detailing Banner
            </button>
          </div>

          {serviceBanners.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-8 text-center space-y-3">
              <ImageIcon className="w-10 h-10 text-gray-400 mx-auto" />
              <h4 className="font-extrabold text-sm text-gray-800">No Car Detailing Banners Found</h4>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">Create a promotional banner to highlight special ceramic coating offers, PPF packages, or detailing discounts.</p>
              <button
                onClick={handleOpenAddBanner}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl transition-all"
              >
                + Add First Detailing Banner
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
                          <span>Link: <strong className="text-gray-800">{ban.link || '/car-detailing'}</strong></span>
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
              <label className="block font-bold text-gray-700 mb-1">Starting Price (₹) *</label>
              <input
                type="number"
                required
                min="0"
                value={treatmentForm.price}
                onChange={e => setTreatmentForm({ ...treatmentForm, price: e.target.value })}
                placeholder="e.g. 499"
                className="w-full p-2.5 border rounded-xl outline-none focus:border-amber-500 font-bold"
              />
              <span className="text-[10px] text-amber-600 font-semibold mt-0.5 block">Displays as "Starting from ₹{treatmentForm.price || 0}"</span>
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
        title={`Edit Starting Price: ${selectedServiceItem?.name || ''}`}
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-gray-700 mb-1">Starting Treatment Price (₹)</label>
            <input
              type="number"
              min="0"
              value={newPrice}
              onChange={e => setNewPrice(Number(e.target.value))}
              className="w-full p-2.5 border rounded-xl text-base font-bold outline-none focus:border-amber-500 text-amber-600 bg-amber-50/20"
            />
            <p className="text-[11px] text-gray-500 mt-1.5 leading-relaxed">
              💡 This price will be displayed as <strong className="text-gray-700">"Starting from ₹{newPrice || 0}"</strong> across the catalog.
            </p>
          </div>

          <button
            onClick={handleSavePriceSubmit}
            className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-colors uppercase tracking-wider text-xs shadow-xs"
          >
            Save Starting Rate Update
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

      {/* MODAL: ADD CAR DETAILING BOOKING */}
      <AdminModal isOpen={addBookingModal} onClose={() => setAddBookingModal(false)} title="New Car Detailing Booking">
        <form onSubmit={handleCreateBooking} className="space-y-4 text-xs p-1">
          <div>
            <label className="block font-bold text-gray-700 mb-1">Customer Name *</label>
            <input
              type="text"
              required
              value={newBookingForm.customerName}
              onChange={e => setNewBookingForm({ ...newBookingForm, customerName: e.target.value })}
              className="w-full p-2.5 border rounded-xl outline-none focus:border-amber-500"
              placeholder="e.g. Rahul Sharma"
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
                placeholder="+91 98200 12345"
              />
            </div>
            <div>
              <label className="block font-bold text-gray-700 mb-1">Vehicle No / Model</label>
              <input
                type="text"
                value={newBookingForm.vehicleNo}
                onChange={e => setNewBookingForm({ ...newBookingForm, vehicleNo: e.target.value })}
                className="w-full p-2.5 border rounded-xl outline-none focus:border-amber-500"
                placeholder="MH01AB1234 / BMW X5"
              />
            </div>
          </div>
          <div>
            <label className="block font-bold text-gray-700 mb-1">Vehicle Type</label>
            <select
              value={newBookingForm.vehicleType}
              onChange={e => setNewBookingForm({ ...newBookingForm, vehicleType: e.target.value })}
              className="w-full p-2.5 border rounded-xl outline-none focus:border-amber-500 bg-white"
            >
              {adminVehicleTypes.map(vType => (
                <option key={vType} value={vType}>{vType}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-bold text-gray-700 mb-1">Detailing Treatment / Package</label>
            <input
              type="text"
              value={newBookingForm.plan}
              onChange={e => setNewBookingForm({ ...newBookingForm, plan: e.target.value })}
              className="w-full p-2.5 border rounded-xl outline-none focus:border-amber-500"
              placeholder="e.g. Paint Protection Film (PPF)"
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
              <label className="block font-bold text-gray-700 mb-1">Booking Date</label>
              <input
                type="date"
                required
                value={newBookingForm.date}
                onChange={e => setNewBookingForm({ ...newBookingForm, date: e.target.value })}
                className="w-full p-2.5 border rounded-xl outline-none focus:border-amber-500 bg-white"
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
              Create Detailing Booking
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
                placeholder="e.g. Deepak Joshi"
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
                placeholder="Detailing Specialist"
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
                placeholder="deepak@theshinelounge.com"
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
                placeholder="+91 98210 55555"
                className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Monthly Salary</label>
              <input
                type="text"
                value={staffForm.salary}
                onChange={e => setStaffForm({ ...staffForm, salary: e.target.value })}
                placeholder="₹42,000 / month"
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
                src={staffForm.photo || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80"}
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
                    src={editStaffForm.photo || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80"}
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
                            src={log.photoUrl || log.selfie || log.photo || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150"}
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
        title={editingBanner ? "Edit Car Detailing Banner" : "Create New Car Detailing Banner"}
      >
        <form onSubmit={handleSaveBanner} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Banner Title *</label>
            <input
              type="text"
              required
              value={bannerForm.title}
              onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
              placeholder="e.g. CERAMIC SHIELD 9H PACKAGE"
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
              placeholder="e.g. 3 Years Warranty Ceramic Coating + Free Interior Steam Shampoo."
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
                { label: '🛡️ Ceramic 9H', url: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=800&q=80' },
                { label: '✨ Paint Polish', url: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=800&q=80' },
                { label: '🚗 PPF Protection', url: 'https://images.unsplash.com/photo-1552930294-6b595f4c2974?auto=format&fit=crop&w=800&q=80' },
                { label: '🧼 Interior Deep Wash', url: 'https://images.unsplash.com/photo-1507136566006-cfc505b114fc?auto=format&fit=crop&w=800&q=80' }
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
                placeholder="e.g. Ceramic Special or 20% OFF"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Target Link URL</label>
              <input
                type="text"
                value={bannerForm.link}
                onChange={(e) => setBannerForm({ ...bannerForm, link: e.target.value })}
                placeholder="e.g. /car-detailing or /car-detailing/booking"
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
              {editingBanner ? "Save Banner Updates" : "Create Detailing Banner"}
            </button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
