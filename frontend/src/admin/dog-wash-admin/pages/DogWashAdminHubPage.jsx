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
  Calendar,
  MapPin,
  Video,
  UploadCloud,
  FileVideo,
  CheckCircle2,
  Cpu
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
import { getMachineConfig, saveMachineConfig } from '../../../dog-wash/services/dogWashApi';
import { cacheService } from '../../../common/utils/serviceCache';

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
  const serviceMain = services.find(s => s.key === serviceKey || s.slug === serviceKey);

  const serviceBookings = bookings.filter(b => b.serviceKey === 'dog-wash' || (b.serviceName && b.serviceName.toLowerCase().includes('dog')));
  const serviceStaff = staffList.filter(s => s.serviceKey === serviceKey);
  const serviceBanners = banners.filter(b => b.serviceKey === serviceKey);
  const serviceInventory = inventory.filter(i => i.serviceKey === serviceKey);

  // Live Backend Database State
  const [dbService, setDbService] = useState(null);
  const [dbStaff, setDbStaff] = useState([]);

  const fetchLiveService = async () => {
    try {
      const res = await serviceApi.getServiceBySlug('dog-wash');
      if (res.success && res.service) {
        setDbService(res.service);
        try {
          cacheService('tsl_dog_wash_service', res.service);
        } catch (storageErr) {
          console.warn('Could not cache dog wash service to localStorage:', storageErr);
        }
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
          { _id: '12-min', title: '12 Minutes Wash', price: 500, description: 'Extended 12 minutes deluxe warm hydrobath session' }
        ],
        memberships: [
          { _id: 'mem-1', name: 'Monthly Dog Spa Pass', price: 999, benefits: ['4 Self-Serve Hydrobath washes per month', 'Free Treat Bag', '10% Off Pet Grooming Toys'], badge: 'PET PARENT FAVORITE' }
        ]
      });
    }
  };

  const fetchLiveStaff = async () => {
    try {
      const res = await apiClient.get('/users/staff?serviceKey=dog-wash');
      if (res.data && res.data.staff) {
        setDbStaff(res.data.staff);
      }
    } catch (err) {
      console.warn('Could not fetch live dog-wash staff list:', err.message);
    }
  };

  // Dynamic Machine & Kiosk Configuration State
  const [machineConfigForm, setMachineConfigForm] = useState(getMachineConfig());

  useEffect(() => {
    fetchLiveService();
    fetchLiveStaff();
    const syncMachine = () => setMachineConfigForm(getMachineConfig());
    window.addEventListener('dogWashMachineConfigChanged', syncMachine);
    return () => window.removeEventListener('dogWashMachineConfigChanged', syncMachine);
  }, []);

  const handleSaveMachineConfigSubmit = (e) => {
    e.preventDefault();
    saveMachineConfig(machineConfigForm);
    if (showToast) showToast('Machine & Kiosk configuration updated & published dynamically!', 'success');
  };

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

  // Hero Video Management State
  const [heroVideoUrl, setHeroVideoUrl] = useState('/src/assets/images/dog-wash-banner.mp4');
  const [isSavingVideo, setIsSavingVideo] = useState(false);
  const [uploadedVideoFile, setUploadedVideoFile] = useState(null);
  const [videoUploadProgress, setVideoUploadProgress] = useState(false);
  const [videoInputMode, setVideoInputMode] = useState('upload'); // 'upload' | 'url'
  const fileInputRef = React.useRef(null);

  useEffect(() => {
    if (dbService?.heroVideo || dbService?.bannerVideo) {
      setHeroVideoUrl(dbService.heroVideo || dbService.bannerVideo);
    }
  }, [dbService]);

  const handleVideoFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      alert('Please select a valid video file (MP4, WebM, etc.)');
      return;
    }

    setVideoUploadProgress(true);
    setUploadedVideoFile({
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
      type: file.type
    });

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      setHeroVideoUrl(dataUrl);
      setVideoUploadProgress(false);
      if (showToast) showToast(`Video "${file.name}" selected! Click "Save & Publish" to activate.`);
    };
    reader.onerror = () => {
      setVideoUploadProgress(false);
      alert('Error reading video file.');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveHeroVideo = async (urlToSave) => {
    const targetVideoUrl = urlToSave || heroVideoUrl;
    if (!targetVideoUrl) {
      alert('Please enter or select a video URL');
      return;
    }
    setIsSavingVideo(true);
    try {
      const targetId = await getTargetServiceId();
      if (targetId) {
        try {
          const res = await serviceApi.updateService(targetId, {
            heroVideo: targetVideoUrl,
            bannerVideo: targetVideoUrl
          });
          if (res.success && res.service) {
            setDbService(res.service);
          }
        } catch (apiErr) {
          console.warn('API video update warning:', apiErr.message);
        }
      }

      const updatedDb = {
        ...(dbService || serviceMain),
        _id: targetId || dbService?._id || 'srv-3',
        heroVideo: targetVideoUrl,
        bannerVideo: targetVideoUrl
      };

      setDbService(updatedDb);
      try {
        cacheService('tsl_dog_wash_service', updatedDb);
      } catch (storageErr) {
        console.warn('LocalStorage quota exceeded when storing video; updated state live in-memory:', storageErr);
      }
      window.dispatchEvent(new Event('dogWashDataChanged'));

      if (showToast) showToast('Dog Wash hero video updated live across frontend!');
    } catch (err) {
      console.error('Failed to update hero video:', err);
      alert('Error updating video: ' + err.message);
    } finally {
      setIsSavingVideo(false);
    }
  };

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

  // Add Booking Modal States
  const [addBookingModal, setAddBookingModal] = useState(false);
  const [newBookingForm, setNewBookingForm] = useState({
    customerName: '',
    phone: '',
    plan: '5 Minutes Wash',
    amount: 200,
    timeSlot: 'Today 4:30 PM',
    vehicleNo: 'Max (Golden Retriever)'
  });

  const handleCreateDogBooking = async (e) => {
    e.preventDefault();
    if (!newBookingForm.customerName) return;
    await addBooking({
      serviceKey: 'dog-wash',
      serviceName: 'Dog Wash',
      customerName: newBookingForm.customerName,
      customerEmail: newBookingForm.phone ? `${newBookingForm.phone.replace(/[^0-9]/g, '')}@customer.com` : '',
      plan: newBookingForm.plan,
      amount: Number(newBookingForm.amount),
      timeSlot: newBookingForm.timeSlot,
      vehicleNo: newBookingForm.vehicleNo,
      vehicleType: 'Dog'
    });
    setAddBookingModal(false);
    setNewBookingForm({
      customerName: '',
      phone: '',
      plan: '5 Minutes Wash',
      amount: 200,
      timeSlot: 'Today 4:30 PM',
      vehicleNo: 'Max (Golden Retriever)'
    });
  };

  // Add Staff Modal State
  const [addStaffModal, setAddStaffModal] = useState(false);
  const [staffForm, setStaffForm] = useState({
    fullName: '',
    email: '',
    password: '',
    mobile: '',
    staffRole: 'Pet Spa Specialist',
    salary: '₹35,000 / month',
    leaveBalance: 12,
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
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
    staffRole: 'Pet Spa Specialist',
    salary: '₹35,000 / month',
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
        department: 'Dog Wash',
        serviceKey: 'dog-wash',
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
          staffRole: 'Pet Spa Specialist',
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

  const handleOpenEditStaff = async (stf) => {
    setSelectedStaff(stf);
    setEditStaffForm({
      fullName: stf.fullName || stf.name || '',
      email: stf.email || '',
      password: '',
      mobile: stf.mobile || '',
      staffRole: stf.staffRole || stf.role || 'Pet Spa Specialist',
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
      cacheService('tsl_dog_wash_service', newDbService);

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
      cacheService('tsl_dog_wash_service', newDbService);

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
            cacheService('tsl_dog_wash_service', res.service);
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
      cacheService('tsl_dog_wash_service', newDbService);

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
          { id: 'machine', label: 'Machine & Kiosk', icon: Cpu },
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
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white border border-gray-200 rounded-2xl p-4 shadow-sm gap-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Dog Wash Appointments ({serviceBookings.length})</h3>
              <p className="text-xs text-gray-500">Live view and status tracking for hydrobath & pet grooming appointments</p>
            </div>
            <button
              onClick={() => setAddBookingModal(true)}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" /> New Dog Wash Booking
            </button>
          </div>

          <DataTable
            columns={[
              { header: 'Booking ID', accessorKey: 'id', cell: (r) => <span className="font-mono font-bold text-gray-900">{r.id}</span> },
              { header: 'Customer & Pet', accessorKey: 'customerName', cell: (r) => (
                <div>
                  <p className="font-bold text-gray-900">{r.customerName}</p>
                  <p className="text-[10px] text-gray-400 font-semibold">{r.vehicleNo || r.phone || 'Pet Spa Client'}</p>
                </div>
              )},
              { header: 'Treatment / Package', accessorKey: 'plan', cell: (r) => <span className="font-bold text-amber-700">{r.plan}</span> },
              { header: 'Date', accessorKey: 'timeSlot', cell: (r) => <span className="text-xs font-medium text-gray-600">{r.date || r.timeSlot || 'Today'}</span> },
              { header: 'Total (₹)', accessorKey: 'total', cell: (r) => <span className="font-black text-emerald-700">₹{r.total}</span> },
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
            searchPlaceholder="Search Dog Wash Bookings..."
          />
        </div>
      )}

      {activeTab === 'staff' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white border border-gray-200 rounded-2xl p-4 shadow-sm gap-3">
            <div>
              <h3 className="text-base font-black text-gray-900">
                Dog Wash Department Staff ({(dbStaff.length > 0 ? dbStaff : serviceStaff).filter(s => s.serviceKey === 'dog-wash' || (s.department && s.department.toLowerCase().includes('dog')) || (s.staffRole && s.staffRole.toLowerCase().includes('groomer'))).length})
              </h3>
              <p className="text-xs text-gray-500">
                Onboard staff members, generate email login credentials & assign module access
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
              .filter(s => s.serviceKey === 'dog-wash' || (s.department && s.department.toLowerCase().includes('dog')) || (s.staffRole && s.staffRole.toLowerCase().includes('groomer')))
              .map((stf) => (
                <div 
                  key={stf._id || stf.id} 
                  onClick={() => handleOpenEditStaff(stf)}
                  className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between hover:border-amber-400 cursor-pointer hover:shadow-md transition-all"
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
                          {stf.isActive !== false ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-amber-700">{stf.staffRole || stf.role || 'Dog Wash Specialist'}</p>
                      <p className="text-[11px] text-gray-500 flex items-center gap-1 truncate">
                        <Mail className="w-3 h-3 text-gray-400 flex-shrink-0" /> {stf.email || 'staff@theshinelounge.com'}
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
                      <span className="font-bold text-emerald-700">{stf.salary || '₹35,000 / month'}</span>
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

      {activeTab === 'marketing' && (
        <div className="space-y-6">
          {/* Hero Banner Video Manager Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                  <Video className="w-5 h-5 text-amber-500" /> Dog Wash Hero Banner Video
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Update the live video playing in the Dog Wash customer portal header hero background
                </p>
              </div>
              <span className="px-3 py-1 bg-amber-100 text-amber-800 text-[10px] font-black uppercase rounded-full tracking-wider">
                LIVE FRONTEND MEDIA
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Left: Direct File Upload & Input Options */}
              <div className="space-y-4">
                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleVideoFileChange}
                  accept="video/mp4,video/webm,video/ogg,video/*"
                  className="hidden"
                />

                {/* Mode Selector */}
                <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                  <button
                    type="button"
                    onClick={() => setVideoInputMode('upload')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      videoInputMode === 'upload'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <UploadCloud className="w-4 h-4" /> Direct File Upload
                  </button>
                  <button
                    type="button"
                    onClick={() => setVideoInputMode('url')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      videoInputMode === 'url'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Video className="w-4 h-4" /> Video URL Link
                  </button>
                </div>

                {videoInputMode === 'upload' ? (
                  <div className="space-y-3">
                    {/* Drag & Drop File Upload Box */}
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-amber-300 hover:border-amber-500 bg-amber-50/50 hover:bg-amber-50 rounded-2xl p-6 text-center cursor-pointer transition-all space-y-2 group"
                    >
                      <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 group-hover:scale-110 transition-transform flex items-center justify-center mx-auto">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-gray-900">
                          Click here to Upload Video from Computer
                        </p>
                        <p className="text-[11px] text-gray-500 mt-0.5 font-medium">
                          Supports MP4, WebM, MOV video files
                        </p>
                      </div>
                      <button
                        type="button"
                        className="px-4 py-2 bg-amber-500 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-amber-600 transition-all inline-flex items-center gap-1.5"
                      >
                        <FileVideo className="w-4 h-4" /> Choose Video File
                      </button>
                    </div>

                    {/* Active Upload File Info Badge */}
                    {uploadedVideoFile && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <div className="truncate">
                            <p className="font-bold text-gray-900 truncate">{uploadedVideoFile.name}</p>
                            <p className="text-[10px] text-emerald-700 font-semibold">{uploadedVideoFile.size} · Ready to publish</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-[11px] font-bold text-amber-700 hover:underline flex-shrink-0 ml-2"
                        >
                          Change File
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Video File URL / Path *
                      </label>
                      <input
                        type="text"
                        value={heroVideoUrl}
                        onChange={(e) => setHeroVideoUrl(e.target.value)}
                        placeholder="e.g. /src/assets/images/dog-wash-banner.mp4 or https://..."
                        className="w-full p-3 border border-gray-200 rounded-xl font-mono text-xs text-gray-800 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none shadow-xs"
                      />
                    </div>
                  </div>
                )}

                {/* Quick Presets */}
                <div className="space-y-1.5 pt-1 border-t border-gray-100">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block">
                    Quick Presets
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const sample = '/src/assets/images/dog-wash-banner.mp4';
                        setHeroVideoUrl(sample);
                        setUploadedVideoFile({ name: 'Default Dog Wash Video', size: 'Asset File', type: 'video/mp4' });
                        handleSaveHeroVideo(sample);
                      }}
                      className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold transition-all"
                    >
                      Default Dog Wash Asset MP4
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const sample = 'https://assets.mixkit.co/videos/preview/mixkit-happy-dog-getting-a-bath-42354-large.mp4';
                        setHeroVideoUrl(sample);
                        setUploadedVideoFile({ name: 'Sample Hydrobath Video', size: 'Mixkit Cloud', type: 'video/mp4' });
                        handleSaveHeroVideo(sample);
                      }}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-xl text-xs font-bold transition-all"
                    >
                      Sample Pet Hydrobath MP4
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleSaveHeroVideo()}
                  disabled={isSavingVideo || videoUploadProgress}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 uppercase tracking-wider disabled:opacity-50"
                >
                  <Video className="w-4 h-4" />
                  {isSavingVideo || videoUploadProgress ? 'Saving & Uploading...' : 'Save & Publish Hero Video'}
                </button>
              </div>

              {/* Right: Live Preview Player */}
              <div className="space-y-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block">
                  Live Admin Preview
                </span>
                <div className="relative w-full h-48 bg-zinc-900 rounded-2xl overflow-hidden border border-gray-200 shadow-inner flex items-center justify-center">
                  {heroVideoUrl ? (
                    <video
                      key={heroVideoUrl}
                      src={heroVideoUrl}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-xs text-gray-400 font-medium">
                      No Video URL Specified
                    </div>
                  )}
                  <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[9px] font-bold text-white uppercase tracking-widest">
                    PREVIEW
                  </div>
                </div>
              </div>
            </div>
          </div>

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

      {/* TAB: MACHINE & KIOSK SETUP */}
      {activeTab === 'machine' && (
        <form onSubmit={handleSaveMachineConfigSubmit} className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-teal-600" />
                  <span>Dog Wash Machine & Self-Serve Kiosk Setup</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Configure real-time machine location, operating hours, machine usage instructions, and safety guidelines. Changes instantly reflect on the Dog Wash Customer App.
                </p>
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all shrink-0"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save & Publish Machine Setup</span>
              </button>
            </div>

            {/* 1. Location & Operating Hours */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Station / Kiosk Name</label>
                <input
                  type="text"
                  value={machineConfigForm.kioskName || ''}
                  onChange={(e) => setMachineConfigForm({ ...machineConfigForm, kioskName: e.target.value })}
                  className="w-full p-2.5 border border-gray-200 rounded-xl text-xs outline-none focus:border-teal-500 bg-gray-50/40"
                  placeholder="e.g. Indore Self-Serve Hydrobath Station #04"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Machine / Kiosk Address Location</label>
                <input
                  type="text"
                  value={machineConfigForm.location || ''}
                  onChange={(e) => setMachineConfigForm({ ...machineConfigForm, location: e.target.value })}
                  className="w-full p-2.5 border border-gray-200 rounded-xl text-xs outline-none focus:border-teal-500 bg-gray-50/40"
                  placeholder="e.g. Palasia Main Rd, Scheme 54, Indore (Kiosk #04)"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Kiosk Operating Hours</label>
                <input
                  type="text"
                  value={machineConfigForm.workingHours || ''}
                  onChange={(e) => setMachineConfigForm({ ...machineConfigForm, workingHours: e.target.value })}
                  className="w-full p-2.5 border border-gray-200 rounded-xl text-xs outline-none focus:border-teal-500 bg-gray-50/40"
                  placeholder="e.g. 08:00 AM - 10:00 PM IST (Mon - Sun)"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Station Operational Status</label>
                <select
                  value={machineConfigForm.status || 'Online & Fully Operational'}
                  onChange={(e) => setMachineConfigForm({ ...machineConfigForm, status: e.target.value })}
                  className="w-full p-2.5 border border-gray-200 rounded-xl text-xs outline-none focus:border-teal-500 bg-white"
                >
                  <option value="Online & Fully Operational">Online & Fully Operational</option>
                  <option value="Under Maintenance">Under Scheduled Maintenance</option>
                  <option value="Offline / Out of Service">Offline / Out of Service</option>
                </select>
              </div>
            </div>

            {/* 2. Instructions for Using the Machine */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider">
                    Instructions for Using the Machine
                  </h4>
                  <p className="text-[11px] text-gray-500">Step-by-step user guide displayed on customer application</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const currentInst = machineConfigForm.instructions || [];
                    const newInst = [...currentInst, { step: `${currentInst.length + 1}`, title: 'New Step', desc: 'Description of step...' }];
                    setMachineConfigForm({ ...machineConfigForm, instructions: newInst });
                  }}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Step
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(machineConfigForm.instructions || []).map((inst, idx) => (
                  <div key={idx} className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-2 relative group">
                    <div className="flex justify-between items-center">
                      <span className="w-6 h-6 rounded-lg bg-teal-600 text-white font-bold text-xs flex items-center justify-center">
                        {inst.step || idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = (machineConfigForm.instructions || []).filter((_, i) => i !== idx);
                          setMachineConfigForm({ ...machineConfigForm, instructions: updated });
                        }}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div>
                      <input
                        type="text"
                        value={inst.title || ''}
                        onChange={(e) => {
                          const updated = [...(machineConfigForm.instructions || [])];
                          updated[idx].title = e.target.value;
                          setMachineConfigForm({ ...machineConfigForm, instructions: updated });
                        }}
                        className="w-full p-2 border border-gray-200 rounded-lg text-xs font-bold bg-white"
                        placeholder="Step Title"
                      />
                    </div>
                    <div>
                      <textarea
                        rows={2}
                        value={inst.desc || ''}
                        onChange={(e) => {
                          const updated = [...(machineConfigForm.instructions || [])];
                          updated[idx].desc = e.target.value;
                          setMachineConfigForm({ ...machineConfigForm, instructions: updated });
                        }}
                        className="w-full p-2 border border-gray-200 rounded-lg text-xs bg-white resize-none"
                        placeholder="Step Description"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Safety Instructions */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center gap-1">
                    <span>🛡️</span> Safety Instructions & Guidelines
                  </h4>
                  <p className="text-[11px] text-gray-500">Safety rules and pet protection guidelines shown on customer app</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const currentRules = machineConfigForm.safetyGuidelines || [];
                    const newRules = [...currentRules, "New safety guideline rule..."];
                    setMachineConfigForm({ ...machineConfigForm, safetyGuidelines: newRules });
                  }}
                  className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Safety Rule
                </button>
              </div>

              <div className="space-y-2">
                {(machineConfigForm.safetyGuidelines || []).map((rule, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-amber-50/50 p-2.5 border border-amber-200/70 rounded-xl">
                    <span className="text-amber-700 font-bold text-xs shrink-0">•</span>
                    <input
                      type="text"
                      value={rule || ''}
                      onChange={(e) => {
                        const updated = [...(machineConfigForm.safetyGuidelines || [])];
                        updated[idx] = e.target.value;
                        setMachineConfigForm({ ...machineConfigForm, safetyGuidelines: updated });
                      }}
                      className="w-full p-2 border border-amber-200 rounded-lg text-xs font-semibold bg-white text-amber-900 outline-none focus:border-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const updated = (machineConfigForm.safetyGuidelines || []).filter((_, i) => i !== idx);
                        setMachineConfigForm({ ...machineConfigForm, safetyGuidelines: updated });
                      }}
                      className="text-gray-400 hover:text-red-600 transition-colors p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </form>
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

      {/* Modal: Create Manual Dog Wash Booking */}
      <AdminModal isOpen={addBookingModal} onClose={() => setAddBookingModal(false)} title="Create Manual Dog Wash Booking">
        <form onSubmit={handleCreateDogBooking} className="space-y-4 text-xs p-1">
          <div>
            <label className="block font-bold text-gray-700 mb-1">Customer Name *</label>
            <input
              type="text"
              required
              value={newBookingForm.customerName}
              onChange={e => setNewBookingForm({ ...newBookingForm, customerName: e.target.value })}
              placeholder="e.g. Ramesh Patel"
              className="w-full p-2.5 border rounded-xl font-bold text-gray-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={newBookingForm.phone}
                onChange={e => setNewBookingForm({ ...newBookingForm, phone: e.target.value })}
                placeholder="+91 98200 12345"
                className="w-full p-2.5 border rounded-xl text-gray-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-gray-700 mb-1">Pet Name & Breed</label>
              <input
                type="text"
                value={newBookingForm.vehicleNo}
                onChange={e => setNewBookingForm({ ...newBookingForm, vehicleNo: e.target.value })}
                placeholder="e.g. Max (Golden Retriever)"
                className="w-full p-2.5 border rounded-xl text-gray-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-700 mb-1">Selected Package</label>
              <input
                type="text"
                value={newBookingForm.plan}
                onChange={e => setNewBookingForm({ ...newBookingForm, plan: e.target.value })}
                placeholder="5 Minutes Wash"
                className="w-full p-2.5 border rounded-xl text-gray-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-gray-700 mb-1">Price (₹)</label>
              <input
                type="number"
                value={newBookingForm.amount}
                onChange={e => setNewBookingForm({ ...newBookingForm, amount: e.target.value })}
                placeholder="200"
                className="w-full p-2.5 border rounded-xl font-bold text-amber-600 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Booking Date</label>
            <input
              type="text"
              value={newBookingForm.timeSlot}
              onChange={e => setNewBookingForm({ ...newBookingForm, timeSlot: e.target.value })}
              placeholder="Today"
              className="w-full p-2.5 border rounded-xl text-gray-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-xs transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Save Dog Wash Booking
          </button>
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
                placeholder="e.g. Rohan Deshmukh"
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
                placeholder="Pet Spa Specialist"
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
                placeholder="rohan@theshinelounge.com"
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
            <label className="block font-bold text-gray-700 mb-1">Staff Profile Photo</label>
            <div className="flex items-center gap-3 p-2 bg-gray-50 border rounded-xl">
              <img
                src={staffForm.photo || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"}
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
                    src={editStaffForm.photo || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"}
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
                            src={log.photoUrl || log.selfie || log.photo || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150"}
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
    </div>
  );
}
