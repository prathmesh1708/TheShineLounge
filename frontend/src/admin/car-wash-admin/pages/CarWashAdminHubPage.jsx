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
    toggleBannerStatus,
    updateBanner,
    deleteBanner,
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
        localStorage.setItem('tsl_car_wash_service', JSON.stringify(res.service));
        return;
      }
    } catch (err) {
      console.warn('Could not fetch live car-wash service, checking local storage');
    }
    const cached = localStorage.getItem('tsl_car_wash_service');
    if (cached) {
      setDbService(JSON.parse(cached));
    } else {
      setDbService({
        _id: serviceMain?.id || 'srv-1',
        pricing: [
          { _id: 'pw-1', title: 'Express Foam Wash', price: 699, description: 'High-pressure foam wash, wheel cleaning & tire shine' },
          { _id: 'pw-2', title: 'Deluxe Interior & Exterior', price: 1299, description: 'Foam wash + interior vacuum, dashboard polish & steam' },
          { _id: 'pw-3', title: 'Ultimate Ceramic Wash', price: 2499, description: 'Full wash + ceramic spray coating, hydrophobic glass treatment' }
        ],
        plans: [
          { _id: 'pw-1', name: 'Express Foam Wash', price: 699, description: 'High-pressure foam wash, wheel cleaning & tire shine' },
          { _id: 'pw-2', name: 'Deluxe Interior & Exterior', price: 1299, description: 'Foam wash + interior vacuum, dashboard polish & steam' },
          { _id: 'pw-3', name: 'Ultimate Ceramic Wash', price: 2499, description: 'Full wash + ceramic spray coating, hydrophobic glass treatment' }
        ],
        memberships: [
          { _id: 'cw-mem-1', name: 'Unlimited Monthly Wash Pass', price: 2499, benefits: ['Unlimited Express Hydrobath Washes', 'Free Interior Steam once a month', 'Priority Tunnel Lane Access'], badge: 'MOST POPULAR' }
        ]
      });
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

  // Helper to reliably resolve MongoDB target _id
  const getTargetServiceId = async () => {
    if (dbService?._id) return dbService._id;
    try {
      const allRes = await serviceApi.getServices();
      if (allRes.success && allRes.services) {
        const found = allRes.services.find(s => s.slug === 'car-wash' || s.serviceName.toLowerCase().includes('car'));
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
          { _id: 'pw-1', title: 'Express Foam Wash', price: 699, description: 'High-pressure foam wash, wheel cleaning & tire shine' },
          { _id: 'pw-2', title: 'Deluxe Interior & Exterior', price: 1299, description: 'Foam wash + interior vacuum, dashboard polish & steam' },
          { _id: 'pw-3', title: 'Ultimate Ceramic Wash', price: 2499, description: 'Full wash + ceramic spray coating, hydrophobic glass treatment' }
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
        { _id: 'cw-mem-1', name: 'Unlimited Monthly Wash Pass', price: 2499, benefits: ['Unlimited Express Hydrobath Washes', 'Free Interior Steam once a month', 'Priority Tunnel Lane Access'], badge: 'MOST POPULAR' }
      ]);

  // Modal Editing States
  const [editingPriceModal, setEditingPriceModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // { type: 'pricing'|'membership', id, title }
  const [editTitle, setEditTitle] = useState('');
  const [editPrice, setEditPrice] = useState(699);
  const [editDescription, setEditDescription] = useState('');

  // Add Package Modal States
  const [addPackageModal, setAddPackageModal] = useState(false);
  const [newPkgForm, setNewPkgForm] = useState({
    title: '',
    price: '',
    description: '',
    type: 'pricing'
  });

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

  // Edit Staff Modal States
  const [editStaffModal, setEditStaffModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [editStaffForm, setEditStaffForm] = useState({
    fullName: '',
    email: '',
    password: '',
    mobile: '',
    staffRole: 'Car Wash Specialist',
    salary: '₹35,000 / month',
    leaveBalance: 12,
    photo: '',
    permissions: []
  });
  const [staffAttendanceLogs, setStaffAttendanceLogs] = useState([]);
  const [activeStaffModalTab, setActiveStaffModalTab] = useState('details'); // 'details' | 'attendance'

  // Marketing Banner CRUD States
  const [addBannerModal, setAddBannerModal] = useState(false);
  const [editBannerModal, setEditBannerModal] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState(null);
  const [bannerForm, setBannerForm] = useState({
    title: '',
    subtitle: '',
    imageUrl: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=600&q=80',
    actionLink: '/car-wash',
    status: 'active'
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

  const handleOpenEditStaff = async (stf) => {
    setSelectedStaff(stf);
    setEditStaffForm({
      fullName: stf.fullName || stf.name || '',
      email: stf.email || '',
      password: '',
      mobile: stf.mobile || '',
      staffRole: stf.staffRole || stf.role || 'Car Wash Specialist',
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

  // Banner CRUD Handlers
  const handleOpenAddBanner = () => {
    setBannerForm({
      title: '',
      subtitle: '',
      imageUrl: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=600&q=80',
      actionLink: '/car-wash',
      status: 'active'
    });
    setAddBannerModal(true);
  };

  const handleOpenEditBanner = (ban) => {
    setSelectedBanner(ban);
    setBannerForm({
      title: ban.title || '',
      subtitle: ban.subtitle || '',
      imageUrl: ban.imageUrl || '',
      actionLink: ban.actionLink || '/car-wash',
      status: ban.status || 'active'
    });
    setEditBannerModal(true);
  };

  const handleSaveNewBanner = (e) => {
    e.preventDefault();
    addBanner({
      ...bannerForm,
      serviceKey: 'car-wash'
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
        _id: targetId || dbService?._id || 'srv-1',
        pricing: payloadPricing,
        plans: payloadPlans,
        memberships: payloadMemberships
      };

      setDbService(newDbService);
      localStorage.setItem('tsl_car_wash_service', JSON.stringify(newDbService));

      if (showToast) showToast('Car Wash package title, price & details updated live!');
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
        _id: targetId || dbService?._id || 'srv-1',
        pricing: payloadPricing,
        plans: payloadPlans,
        memberships: payloadMemberships
      };

      setDbService(newDbService);
      localStorage.setItem('tsl_car_wash_service', JSON.stringify(newDbService));

      if (showToast) showToast('New Car Wash service package created!');
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
            localStorage.setItem('tsl_car_wash_service', JSON.stringify(res.service));
          }
        } catch (apiErr) {
          console.warn('API delete package error:', apiErr.message);
        }
      }

      const newDbService = {
        ...(dbService || serviceMain),
        _id: targetId || dbService?._id || 'srv-1',
        pricing: payloadPricing,
        plans: payloadPlans,
        memberships: payloadMemberships
      };

      setDbService(newDbService);
      localStorage.setItem('tsl_car_wash_service', JSON.stringify(newDbService));

      if (showToast) showToast(`Package "${itemTitle}" deleted successfully`, 'error');
    } catch (err) {
      console.error('Failed to delete package:', err);
      alert('Error deleting package: ' + err.message);
    }
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
                <span className="text-xl font-black text-amber-700">₹{activePricing[0]?.price || 699}</span>
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
              <p className="text-xs text-gray-500">Click "Edit Price" on any plan to update live title, price and description, or create/delete packages</p>
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
                      Single Service
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
                        Pass
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
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <div>
              <h3 className="text-base font-black text-gray-900">Promotional Banners & Deals ({serviceBanners.length})</h3>
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
                  <img src={ban.imageUrl || 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=600&q=80'} className="w-full h-36 object-cover" alt="Promo Banner" />
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
              placeholder="e.g. Express Foam Wash"
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
              placeholder="e.g. Complimentary – vacuum, polish, mat cleaning" 
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
      <AdminModal isOpen={addPackageModal} onClose={() => setAddPackageModal(false)} title="Add New Car Wash Package">
        <form onSubmit={handleCreatePackage} className="space-y-4 text-xs p-1">
          <div>
            <label className="block font-bold text-gray-700 mb-1">Package Title *</label>
            <input 
              type="text" 
              required 
              value={newPkgForm.title} 
              onChange={e => setNewPkgForm({ ...newPkgForm, title: e.target.value })} 
              placeholder="e.g. Super Ceramic Shine Wash" 
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
                placeholder="e.g. 1499" 
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
              placeholder="e.g. High-pressure foam bath, underbody wash & ceramic shield protection" 
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
                <label className="block font-bold text-gray-700 mb-1">Profile Photo URL</label>
                <input
                  type="text"
                  value={editStaffForm.photo}
                  onChange={e => setEditStaffForm({ ...editStaffForm, photo: e.target.value })}
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
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-sm transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2"
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
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${log.checkOutTime === 'In Progress' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                            {log.checkOutTime === 'In Progress' ? 'Active Shift' : 'Shift Completed'}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-500">
                          ⏱️ check-in: <strong className="text-gray-700">{log.checkInTime}</strong> | checkout: <strong className="text-gray-700">{log.checkOutTime}</strong>
                        </p>
                        <p className="text-[10px] text-gray-400 italic">
                          📍 {log.location || 'Main Branch'}
                        </p>
                      </div>
                      {log.photoUrl && (
                        <div className="flex flex-col items-center">
                          <span className="text-[8px] text-gray-400 font-extrabold mb-1">Selfie</span>
                          <img
                            src={log.photoUrl}
                            alt="Check-in Selfie"
                            className="w-10 h-10 rounded-lg object-cover border shadow-xs"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </AdminModal>

      {/* Modal: Add New Banner */}
      <AdminModal isOpen={addBannerModal} onClose={() => setAddBannerModal(false)} title="Add New Promo Banner">
        <form onSubmit={handleSaveNewBanner} className="space-y-4 text-xs p-1">
          <div>
            <label className="block font-bold text-gray-700 mb-1">Banner Title *</label>
            <input
              type="text"
              required
              value={bannerForm.title}
              onChange={e => setBannerForm({ ...bannerForm, title: e.target.value })}
              placeholder="e.g. Monsoon Hydro-Fest"
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
              placeholder="e.g. Get 20% off on all packages"
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
              placeholder="/bookings or /car-wash"
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
      <AdminModal isOpen={editBannerModal} onClose={() => setEditBannerModal(false)} title="Edit Promo Banner">
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
              <Trash2 className="w-4 h-4" /> Delete
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
