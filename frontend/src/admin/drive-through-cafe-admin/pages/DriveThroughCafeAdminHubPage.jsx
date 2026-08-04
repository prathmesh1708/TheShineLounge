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
  Upload,
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
import serviceApi from '../../../common/services/serviceApi';
import apiClient from '../../../common/utils/apiClient';

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
  const serviceMain = services.find(s => s.key === serviceKey || s.slug === serviceKey);

  const serviceBookings = bookings.filter(b => b.serviceKey === serviceKey);
  const serviceStaff = staffList.filter(s => s.serviceKey === serviceKey);
  const serviceBanners = banners.filter(b => b.serviceKey === serviceKey);
  const serviceInventory = inventory.filter(i => i.serviceKey === serviceKey);

  // Live Backend Database State
  const [dbService, setDbService] = useState(null);
  const [dbStaff, setDbStaff] = useState([]);

  const fetchLiveService = async () => {
    const defaultSections = [
      { _id: 'sec-1', title: 'Commuter Coffee', subtitle: 'Barista brews optimized for cup holders', description: 'Double-filtered, hot or iced, ready in 90 seconds', bgColor: 'linear-gradient(135deg, #C17F19 0%, #8C5810 100%)', image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=400&q=80' },
      { _id: 'sec-2', title: 'Dashboard Breakfast', subtitle: 'Warm wraps and mess-free sandwiches', description: 'Freshly heated, easy to eat while driving', bgColor: 'linear-gradient(135deg, #D49A7F 0%, #A0522D 100%)', image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=400&q=80' },
      { _id: 'sec-3', title: 'Express Sweet Box', subtitle: 'Quick road snacks and baked treats', description: 'Packaged neatly for leak-proof transit', bgColor: 'linear-gradient(135deg, #B7094C 0%, #800E13 100%)', image: 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?auto=format&fit=crop&w=400&q=80' }
    ];

    const defaultPlans = [
      { _id: 'dt-1', name: 'Commuter Cold Brew', price: 4.95, section: 'Commuter Coffee', weight: '16 oz', subcat: 'Iced', image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=600&q=80', description: 'Rich, smooth 16-hour steeped cold brew coffee' },
      { _id: 'dt-2', name: 'Double Shot Americano', price: 3.80, section: 'Commuter Coffee', weight: '12 oz', subcat: 'Hot', image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80', description: 'Bold double espresso with hot filtered water' },
      { _id: 'dt-3', name: 'Roadtrip Caramel Latte', price: 5.45, section: 'Commuter Coffee', weight: '16 oz', subcat: 'Hot', image: 'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?auto=format&fit=crop&w=600&q=80', description: 'Espresso, steamed milk & salted caramel syrup' },
      { _id: 'dt-4', name: 'Nitro Vanilla Sweet Cream', price: 5.75, section: 'Commuter Coffee', weight: '16 oz', subcat: 'Iced', image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=600&q=80', description: 'Nitrogen-infused cold brew topped with sweet cream' },
      { _id: 'dt-5', name: 'Spiced Chai Milk Tea', price: 5.20, section: 'Commuter Coffee', weight: '16 oz', subcat: 'Tea', image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80', description: 'Aromatic spiced black tea with warm milk' },
      { _id: 'dt-6', name: 'Drive-Through Breakfast Burrito', price: 8.50, section: 'Dashboard Breakfast', weight: '300g', subcat: 'Wraps', image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=600&q=80', description: 'Scrambled eggs, bacon, cheese & salsa wrap' },
      { _id: 'dt-7', name: 'Brioche Bacon & Egg Club', price: 9.25, section: 'Dashboard Breakfast', weight: '220g', subcat: 'Sandwiches', image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80', description: 'Crispy bacon, fried egg & cheddar on toasted brioche' },
      { _id: 'dt-8', name: 'Avocado Spinach Wrap', price: 7.95, section: 'Dashboard Breakfast', weight: '280g', subcat: 'Wraps', image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80', description: 'Fresh avocado, baby spinach, feta & pesto wrap' },
      { _id: 'dt-9', name: 'Glazed Morning Cinnamon Roll', price: 4.50, section: 'Dashboard Breakfast', weight: '150g', subcat: 'Sides', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80', description: 'Warm cinnamon roll with vanilla cream glaze' },
      { _id: 'dt-10', name: 'Blueberry Oat Muffin', price: 4.25, section: 'Express Sweet Box', weight: '130g', subcat: 'Muffins', image: 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?auto=format&fit=crop&w=600&q=80', description: 'Baked muffin loaded with fresh wild blueberries' },
      { _id: 'dt-11', name: 'Choco-Chip Cookie Pack', price: 5.50, section: 'Express Sweet Box', weight: '180g', subcat: 'Cookies', image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=600&q=80', description: 'Pack of 3 freshly baked Belgian chocolate chip cookies' },
      { _id: 'dt-12', name: 'Lemon Drizzle Pound Cake', price: 4.75, section: 'Express Sweet Box', weight: '110g', subcat: 'Slices', image: 'https://images.unsplash.com/photo-1519869325930-281384150729?auto=format&fit=crop&w=600&q=80', description: 'Zesty lemon loaf slice with sweet citrus glaze' }
    ];

    try {
      const res = await serviceApi.getServiceBySlug('drive-through-cafe');
      if (res.success && res.service) {
        const hasValidPlans = Array.isArray(res.service.plans) && res.service.plans.some(p => p.section);
        const hasValidSecs = Array.isArray(res.service.menuSections) && res.service.menuSections.length > 0;
        const svc = {
          ...res.service,
          menuSections: hasValidSecs ? res.service.menuSections : defaultSections,
          plans: hasValidPlans ? res.service.plans : defaultPlans
        };
        setDbService(svc);
        localStorage.setItem('tsl_drive_through_cafe_service', JSON.stringify(svc));
        return;
      }
    } catch (err) {
      console.warn('Could not fetch live drive-through-cafe service, checking local storage');
    }

    const cached = localStorage.getItem('tsl_drive_through_cafe_service');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        const hasValidPlans = Array.isArray(parsed.plans) && parsed.plans.some(p => p.section);
        const hasValidSecs = Array.isArray(parsed.menuSections) && parsed.menuSections.length > 0;
        const svc = {
          ...parsed,
          menuSections: hasValidSecs ? parsed.menuSections : defaultSections,
          plans: hasValidPlans ? parsed.plans : defaultPlans
        };
        setDbService(svc);
        return;
      } catch (e) {}
    }

    setDbService({
      _id: serviceMain?.id || 'srv-drive-through-cafe',
      menuSections: defaultSections,
      plans: defaultPlans
    });
  };

  const fetchLiveStaff = async () => {
    try {
      const res = await apiClient.get('/users/staff?serviceKey=drive-through-cafe');
      if (res.data && res.data.staff) {
        setDbStaff(res.data.staff);
      }
    } catch (err) {
      console.warn('Could not fetch live staff list:', err.message);
    }
  };

  const activePricing = dbService?.plans || [];
  const activeMemberships = dbService?.memberships || [];

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
        const found = allRes.services.find(s => s.slug === 'drive-through-cafe' || s.serviceName.toLowerCase().includes('cafe'));
        if (found) return found._id;
      }
    } catch (err) {
      console.warn('Could not resolve target service ID:', err);
    }
    return null;
  };

  const persistDbService = async (newServiceObj) => {
    setDbService(newServiceObj);
    localStorage.setItem('tsl_drive_through_cafe_service', JSON.stringify(newServiceObj));
    window.dispatchEvent(new Event('tsl_drive_through_cafe_updated'));
    try {
      const targetId = await getTargetServiceId();
      if (targetId) {
        await serviceApi.updateService(targetId, newServiceObj);
      }
    } catch (e) {
      console.warn('API sync update notice:', e);
    }
  };

  // Dish / Item Form States
  const [addPlanModal, setAddPlanModal] = useState(false);
  const [editPlanModal, setEditPlanModal] = useState(false);
  const [planForm, setPlanForm] = useState({
    name: '',
    price: '',
    description: '',
    section: 'Commuter Coffee',
    subcat: 'Iced',
    weight: '16 oz',
    image: ''
  });
  const [editPlanForm, setEditPlanForm] = useState({
    _id: '',
    name: '',
    price: '',
    description: '',
    section: 'Commuter Coffee',
    subcat: 'Iced',
    weight: '16 oz',
    image: ''
  });

  // Section Form State
  const [addSectionModal, setAddSectionModal] = useState(false);
  const [sectionForm, setSectionForm] = useState({
    title: '',
    subtitle: '',
    description: '',
    bgColor: 'linear-gradient(135deg, #C17F19 0%, #8C5810 100%)',
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

  const handleSavePlan = (e) => {
    if (e) e.preventDefault();
    if (!planForm.name || !planForm.price) {
      alert('Please fill out item name and price');
      return;
    }
    const newPlan = {
      _id: 'dt-plan-' + Date.now(),
      name: planForm.name,
      price: Number(planForm.price),
      description: planForm.description || '',
      section: planForm.section || (dbService?.menuSections?.[0]?.title || 'Commuter Coffee'),
      subcat: planForm.subcat || 'General',
      weight: planForm.weight || 'Standard',
      image: planForm.image || 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=600&q=80'
    };
    const updatedPlans = [...(dbService?.plans || []), newPlan];
    const updatedService = { ...dbService, plans: updatedPlans };
    persistDbService(updatedService);
    setAddPlanModal(false);
    setPlanForm({
      name: '',
      price: '',
      description: '',
      section: dbService?.menuSections?.[0]?.title || 'Commuter Coffee',
      subcat: 'Iced',
      weight: '16 oz',
      image: ''
    });
    showToast('New Drive-Through Menu Item Created!');
  };

  const handleOpenEditPlan = (plan) => {
    setEditPlanForm({
      _id: plan._id,
      name: plan.name || '',
      price: plan.price || '',
      description: plan.description || '',
      section: plan.section || (dbService?.menuSections?.[0]?.title || 'Commuter Coffee'),
      subcat: plan.subcat || 'General',
      weight: plan.weight || 'Standard',
      image: plan.image || ''
    });
    setEditPlanModal(true);
  };

  const handleUpdatePlan = (e) => {
    if (e) e.preventDefault();
    if (!editPlanForm.name || !editPlanForm.price) {
      alert('Please fill out item name and price');
      return;
    }
    const updatedPlans = (dbService?.plans || []).map(p => {
      if (p._id === editPlanForm._id) {
        return {
          ...p,
          name: editPlanForm.name,
          price: Number(editPlanForm.price),
          description: editPlanForm.description || '',
          section: editPlanForm.section,
          subcat: editPlanForm.subcat,
          weight: editPlanForm.weight,
          image: editPlanForm.image
        };
      }
      return p;
    });
    const updatedService = { ...dbService, plans: updatedPlans };
    persistDbService(updatedService);
    setEditPlanModal(false);
    showToast('Menu Item Updated Successfully!');
  };

  const handleDeletePlan = (planId) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;
    const updatedPlans = (dbService?.plans || []).filter(p => p._id !== planId);
    const updatedService = { ...dbService, plans: updatedPlans };
    persistDbService(updatedService);
    showToast('Menu item removed', 'error');
  };

  const handleSaveSection = (e) => {
    if (e) e.preventDefault();
    if (!sectionForm.title) {
      alert('Please enter a section title');
      return;
    }
    const newSec = {
      _id: 'sec-' + Date.now(),
      title: sectionForm.title,
      subtitle: sectionForm.subtitle || '',
      description: sectionForm.description || '',
      bgColor: sectionForm.bgColor || 'linear-gradient(135deg, #C17F19 0%, #8C5810 100%)',
      image: sectionForm.image || ''
    };
    const updatedSections = [...(dbService?.menuSections || []), newSec];
    const updatedService = { ...dbService, menuSections: updatedSections };
    persistDbService(updatedService);
    setAddSectionModal(false);
    setSectionForm({
      title: '',
      subtitle: '',
      description: '',
      bgColor: 'linear-gradient(135deg, #C17F19 0%, #8C5810 100%)',
      image: ''
    });
    showToast('New Menu Section Added!');
  };

  const handleDeleteSection = (secId) => {
    if (!confirm('Delete this menu category section?')) return;
    const updatedSections = (dbService?.menuSections || []).filter(s => s._id !== secId);
    const updatedService = { ...dbService, menuSections: updatedSections };
    persistDbService(updatedService);
    showToast('Section removed', 'error');
  };

  // Add Staff Modal State
  const [addStaffModal, setAddStaffModal] = useState(false);
  const [staffForm, setStaffForm] = useState({
    fullName: '',
    email: '',
    password: '',
    mobile: '',
    staffRole: 'Express Barista',
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
    staffRole: 'Express Barista',
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
    actionLink: '/drive-through-cafe',
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
        department: 'Drive-Through Café',
        serviceKey: 'drive-through-cafe',
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
          staffRole: 'Express Barista',
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
      staffRole: stf.staffRole || stf.role || 'Express Barista',
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
      actionLink: '/drive-through-cafe',
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
      actionLink: ban.actionLink || '/drive-through-cafe',
      status: ban.status || 'active'
    });
    setEditBannerModal(true);
  };

  const handleSaveNewBanner = (e) => {
    e.preventDefault();
    addBanner({
      ...bannerForm,
      serviceKey: 'drive-through-cafe'
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
      localStorage.setItem('tsl_drive_through_cafe_service', JSON.stringify(newDbService));

      if (showToast) showToast('Cafe item title, price & details updated live!');
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
      localStorage.setItem('tsl_drive_through_cafe_service', JSON.stringify(newDbService));

      if (showToast) showToast('New Cafe menu item created!');
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
            localStorage.setItem('tsl_drive_through_cafe_service', JSON.stringify(res.service));
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
      localStorage.setItem('tsl_drive_through_cafe_service', JSON.stringify(newDbService));

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
          <h1 className="text-3xl sm:text-4xl font-black">Drive-Through Cafe</h1>
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
                <span className="text-gray-500 block font-semibold">Active Menu Items</span>
                <span className="text-xl font-black text-amber-700">{(dbService?.plans || []).length} Items</span>
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
          {/* Menu Sections Header & Cards */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-black text-gray-900">Menu Categories & Sections</h3>
                <p className="text-xs text-gray-500">Create new sections and manage background display for Drive-Through menu</p>
              </div>
              <button
                onClick={() => setAddSectionModal(true)}
                className="px-4 py-2 text-xs font-bold text-white bg-amber-600 rounded-xl hover:bg-amber-700 transition-colors shadow-xs select-none active:scale-[0.98] flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Add Menu Section
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {(dbService?.menuSections || []).map((section) => {
                const count = (dbService?.plans || []).filter(p => p.section === section.title).length;
                return (
                  <div
                    key={section._id}
                    style={{ background: section.bgColor || 'linear-gradient(135deg, #C17F19 0%, #8C5810 100%)' }}
                    className="rounded-2xl p-4 text-white relative shadow-xs flex flex-col justify-between min-h-[120px] group overflow-hidden"
                  >
                    {section.image && (
                      <img src={section.image} alt="" className="absolute right-[-10px] bottom-[-10px] w-20 h-20 rounded-full object-cover opacity-30 pointer-events-none" />
                    )}
                    <div>
                      <h4 className="font-black text-sm drop-shadow-xs">{section.title}</h4>
                      <p className="text-[10px] opacity-90 font-medium leading-normal mt-1">{section.subtitle || section.description}</p>
                    </div>
                    <div className="mt-3 flex justify-between items-center z-10">
                      <span className="text-[9px] bg-white/20 px-2.5 py-0.5 rounded-full font-bold select-none">
                        {count} Items
                      </span>
                      <button
                        onClick={() => handleDeleteSection(section._id)}
                        className="text-white hover:text-red-200 p-1 rounded-lg hover:bg-white/10 transition-colors"
                        title="Delete Section"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dishes & Items Grid */}
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-black text-gray-900">Drive-Through Menu Items & Pricing</h3>
                <p className="text-xs text-gray-500">Add, edit, or delete food, brews, and drinks displayed on /drive-through-cafe</p>
              </div>
              <button
                onClick={() => setAddPlanModal(true)}
                className="px-4 py-2 text-xs font-bold text-white bg-amber-600 rounded-xl hover:bg-amber-700 transition-colors shadow-xs select-none active:scale-[0.98] flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Add Menu Item / Brew
              </button>
            </div>

            {/* List items categorized by sections */}
            {(dbService?.menuSections || []).map((section) => {
              const sectionItems = (dbService?.plans || []).filter(p => p.section === section.title);
              return (
                <div key={section._id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: section.bgColor || '#C17F19' }} />
                      <h4 className="font-black text-sm text-gray-900">{section.title}</h4>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                        {sectionItems.length} items available
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                    {sectionItems.map((plan) => (
                      <div key={plan._id} className="border border-gray-200 rounded-2xl overflow-hidden shadow-xs flex flex-col justify-between bg-gray-50 group hover:border-amber-500/40 transition-all duration-200">
                        <div className="relative aspect-video w-full bg-gray-100 overflow-hidden">
                          {plan.image ? (
                            <img src={plan.image} alt={plan.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">
                              <ImageIcon className="w-8 h-8 opacity-40" />
                            </div>
                          )}
                          <span className="absolute top-2 left-2 text-[9px] bg-black/60 backdrop-blur-xs text-white px-2 py-0.5 rounded-full font-bold">
                            {plan.subcat || 'General'}
                          </span>
                          <span className="absolute top-2 right-2 text-[9px] bg-amber-500/90 text-white px-2 py-0.5 rounded-full font-extrabold">
                            {plan.weight || 'Standard'}
                          </span>
                        </div>
                        <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                          <div>
                            <div className="flex justify-between items-start">
                              <h5 className="font-extrabold text-sm text-gray-900 leading-snug">{plan.name}</h5>
                              <span className="font-black text-sm text-amber-700 ml-2">₹{plan.price}</span>
                            </div>
                            <p className="text-[11px] text-gray-500 leading-relaxed mt-1 line-clamp-2">{plan.description}</p>
                          </div>

                          <div className="pt-2 border-t border-gray-200/60 flex items-center justify-between gap-1.5">
                            <button
                              onClick={() => handleOpenEditPlan(plan)}
                              className="flex-1 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-[11px] font-bold shadow-xs transition-all flex items-center justify-center gap-1"
                            >
                              <Edit2 className="w-3.5 h-3.5" /> Edit Details
                            </button>
                            <button
                              onClick={() => handleDeletePlan(plan._id)}
                              className="p-1.5 text-red-500 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-all"
                              title="Delete Item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {sectionItems.length === 0 && (
                      <div className="col-span-full py-6 text-center text-xs text-gray-400 font-semibold bg-white border border-dashed rounded-xl">
                        No menu items in this category yet. Click "+ Add Menu Item / Brew" to add one!
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DEPARTMENT STAFF TAB */}
      {activeTab === 'staff' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <div>
              <h3 className="text-base font-black text-gray-900">Drive-Through Cafe Staff ({(dbStaff.length > 0 ? dbStaff : serviceStaff).filter(s => s.serviceKey === 'drive-through-cafe' || (s.department && s.department.toLowerCase().includes('drive'))).length})</h3>
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
            {(dbStaff.length > 0 ? dbStaff : serviceStaff)
              .filter(s => s.serviceKey === 'drive-through-cafe' || (s.department && s.department.toLowerCase().includes('drive')))
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
                          {stf.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-amber-700">{stf.staffRole || stf.role || 'Express Barista'}</p>
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

      {/* Modal: Add Menu Section */}
      <AdminModal isOpen={addSectionModal} onClose={() => setAddSectionModal(false)} title="Add New Menu Section">
        <form onSubmit={handleSaveSection} className="space-y-4 text-xs p-1">
          <div>
            <label className="block font-bold text-gray-700 mb-1">Section Title *</label>
            <input 
              type="text" 
              required 
              value={sectionForm.title} 
              onChange={e => setSectionForm({ ...sectionForm, title: e.target.value })} 
              placeholder="e.g. Cold Brews & Frappes" 
              className="w-full p-2.5 border rounded-xl font-bold text-gray-800 focus:ring-2 focus:ring-amber-500 focus:outline-none" 
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Subtitle / Catchphrase</label>
            <input 
              type="text" 
              value={sectionForm.subtitle} 
              onChange={e => setSectionForm({ ...sectionForm, subtitle: e.target.value })} 
              placeholder="e.g. Ice-cold barista specials on the go" 
              className="w-full p-2.5 border rounded-xl text-gray-800 focus:ring-2 focus:ring-amber-500 focus:outline-none" 
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Description</label>
            <textarea 
              value={sectionForm.description} 
              onChange={e => setSectionForm({ ...sectionForm, description: e.target.value })} 
              rows={2} 
              className="w-full p-2.5 border rounded-xl text-gray-700 focus:ring-2 focus:ring-amber-500 focus:outline-none" 
              placeholder="e.g. Double-filtered cold brew steeped for 16 hours..." 
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Background Gradient CSS</label>
            <input 
              type="text" 
              value={sectionForm.bgColor} 
              onChange={e => setSectionForm({ ...sectionForm, bgColor: e.target.value })} 
              placeholder="e.g. linear-gradient(135deg, #C17F19 0%, #8C5810 100%)" 
              className="w-full p-2.5 border rounded-xl font-mono text-[11px] text-gray-800 focus:ring-2 focus:ring-amber-500 focus:outline-none" 
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Section Banner Image URL or Upload</label>
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                value={sectionForm.image} 
                onChange={e => setSectionForm({ ...sectionForm, image: e.target.value })} 
                placeholder="https://..." 
                className="flex-1 p-2.5 border rounded-xl text-gray-800 focus:ring-2 focus:ring-amber-500 focus:outline-none" 
              />
              <label className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 border rounded-xl font-bold cursor-pointer transition-all flex items-center gap-1">
                <Upload className="w-3.5 h-3.5" /> Upload
                <input type="file" accept="image/*" onChange={handleSectionPhotoChange} className="hidden" />
              </label>
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-xs transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Save Menu Section
          </button>
        </form>
      </AdminModal>

      {/* Modal: Add New Menu Item / Brew */}
      <AdminModal isOpen={addPlanModal} onClose={() => setAddPlanModal(false)} title="Add New Drive-Through Menu Item">
        <form onSubmit={handleSavePlan} className="space-y-4 text-xs p-1">
          <div>
            <label className="block font-bold text-gray-700 mb-1">Item Name *</label>
            <input 
              type="text" 
              required 
              value={planForm.name} 
              onChange={e => setPlanForm({ ...planForm, name: e.target.value })} 
              placeholder="e.g. Commuter Cold Brew" 
              className="w-full p-2.5 border rounded-xl font-bold text-gray-800 focus:ring-2 focus:ring-amber-500 focus:outline-none" 
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-700 mb-1">Price (₹ / $) *</label>
              <input 
                type="number" 
                step="0.01"
                required 
                value={planForm.price} 
                onChange={e => setPlanForm({ ...planForm, price: e.target.value })} 
                placeholder="e.g. 4.95 or 350" 
                className="w-full p-2.5 border rounded-xl font-black text-amber-600 focus:ring-2 focus:ring-amber-500 focus:outline-none" 
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Menu Category Section *</label>
              <select 
                value={planForm.section} 
                onChange={e => setPlanForm({ ...planForm, section: e.target.value })} 
                className="w-full p-2.5 border rounded-xl font-semibold text-gray-700 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                {(dbService?.menuSections || []).map(s => (
                  <option key={s._id} value={s.title}>{s.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-700 mb-1">Portion Size / Weight</label>
              <input 
                type="text" 
                value={planForm.weight} 
                onChange={e => setPlanForm({ ...planForm, weight: e.target.value })} 
                placeholder="e.g. 16 oz or 300g" 
                className="w-full p-2.5 border rounded-xl text-gray-800 focus:ring-2 focus:ring-amber-500 focus:outline-none" 
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Subcategory Tag</label>
              <input 
                type="text" 
                value={planForm.subcat} 
                onChange={e => setPlanForm({ ...planForm, subcat: e.target.value })} 
                placeholder="e.g. Iced, Hot, Tea, Wraps" 
                className="w-full p-2.5 border rounded-xl text-gray-800 focus:ring-2 focus:ring-amber-500 focus:outline-none" 
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Image URL or File Upload</label>
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                value={planForm.image} 
                onChange={e => setPlanForm({ ...planForm, image: e.target.value })} 
                placeholder="https://images.unsplash.com/..." 
                className="flex-1 p-2.5 border rounded-xl text-gray-800 focus:ring-2 focus:ring-amber-500 focus:outline-none" 
              />
              <label className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 border rounded-xl font-bold cursor-pointer transition-all flex items-center gap-1">
                <Upload className="w-3.5 h-3.5" /> Upload
                <input type="file" accept="image/*" onChange={handleDishPhotoChange} className="hidden" />
              </label>
            </div>
            {planForm.image && (
              <div className="mt-2 relative w-20 h-20 rounded-xl overflow-hidden border">
                <img src={planForm.image} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Description</label>
            <textarea 
              value={planForm.description} 
              onChange={e => setPlanForm({ ...planForm, description: e.target.value })} 
              rows={2} 
              className="w-full p-2.5 border rounded-xl text-gray-700 focus:ring-2 focus:ring-amber-500 focus:outline-none" 
              placeholder="e.g. Rich, smooth 16-hour steeped cold brew coffee" 
            />
          </div>

          <button 
            type="submit" 
            className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-xs transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Create Menu Item
          </button>
        </form>
      </AdminModal>

      {/* Modal: Edit Existing Menu Item / Brew */}
      <AdminModal isOpen={editPlanModal} onClose={() => setEditPlanModal(false)} title="Edit Drive-Through Menu Item">
        <form onSubmit={handleUpdatePlan} className="space-y-4 text-xs p-1">
          <div>
            <label className="block font-bold text-gray-700 mb-1">Item Name *</label>
            <input 
              type="text" 
              required 
              value={editPlanForm.name} 
              onChange={e => setEditPlanForm({ ...editPlanForm, name: e.target.value })} 
              className="w-full p-2.5 border rounded-xl font-bold text-gray-800 focus:ring-2 focus:ring-amber-500 focus:outline-none" 
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-700 mb-1">Price (₹ / $) *</label>
              <input 
                type="number" 
                step="0.01"
                required 
                value={editPlanForm.price} 
                onChange={e => setEditPlanForm({ ...editPlanForm, price: e.target.value })} 
                className="w-full p-2.5 border rounded-xl font-black text-amber-600 focus:ring-2 focus:ring-amber-500 focus:outline-none" 
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Menu Category Section *</label>
              <select 
                value={editPlanForm.section} 
                onChange={e => setEditPlanForm({ ...editPlanForm, section: e.target.value })} 
                className="w-full p-2.5 border rounded-xl font-semibold text-gray-700 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                {(dbService?.menuSections || []).map(s => (
                  <option key={s._id} value={s.title}>{s.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-700 mb-1">Portion Size / Weight</label>
              <input 
                type="text" 
                value={editPlanForm.weight} 
                onChange={e => setEditPlanForm({ ...editPlanForm, weight: e.target.value })} 
                className="w-full p-2.5 border rounded-xl text-gray-800 focus:ring-2 focus:ring-amber-500 focus:outline-none" 
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Subcategory Tag</label>
              <input 
                type="text" 
                value={editPlanForm.subcat} 
                onChange={e => setEditPlanForm({ ...editPlanForm, subcat: e.target.value })} 
                className="w-full p-2.5 border rounded-xl text-gray-800 focus:ring-2 focus:ring-amber-500 focus:outline-none" 
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Image URL or File Upload</label>
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                value={editPlanForm.image} 
                onChange={e => setEditPlanForm({ ...editPlanForm, image: e.target.value })} 
                className="flex-1 p-2.5 border rounded-xl text-gray-800 focus:ring-2 focus:ring-amber-500 focus:outline-none" 
              />
              <label className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 border rounded-xl font-bold cursor-pointer transition-all flex items-center gap-1">
                <Upload className="w-3.5 h-3.5" /> Upload
                <input type="file" accept="image/*" onChange={handleEditDishPhotoChange} className="hidden" />
              </label>
            </div>
            {editPlanForm.image && (
              <div className="mt-2 relative w-20 h-20 rounded-xl overflow-hidden border">
                <img src={editPlanForm.image} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Description</label>
            <textarea 
              value={editPlanForm.description} 
              onChange={e => setEditPlanForm({ ...editPlanForm, description: e.target.value })} 
              rows={2} 
              className="w-full p-2.5 border rounded-xl text-gray-700 focus:ring-2 focus:ring-amber-500 focus:outline-none" 
            />
          </div>

          <button 
            type="submit" 
            className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-xs transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-1.5"
          >
            <Edit2 className="w-4 h-4" /> Save Changes
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
                placeholder="e.g. Cafe Shift Supervisor"
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
              placeholder="/bookings or /drive-through-cafe"
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
