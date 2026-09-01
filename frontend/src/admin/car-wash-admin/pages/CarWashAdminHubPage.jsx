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
  ArrowUpRight,
  UserPlus,
  Key,
  Shield,
  Phone,
  Mail,
  Calendar,
  Upload,
  X,
  Search
} from 'lucide-react';
import {
  buildMembershipSchedule,
  formatShortDate
} from '../../../common/utils/membershipUtils';
import { readAllScoped } from '../../../common/utils/userScopedStorage';
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
import { cacheService } from '../../../common/utils/serviceCache';

export default function CarWashAdminHubPage() {
  const serviceKey = 'car-wash';
  const {
    services,
    bookings,
    staffList,
    banners,
    inventory,
    customers,
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

  // The fleet is whatever plates actually appear on this service's bookings.
  //
  // This block used to manufacture the list it was reporting: a plate was
  // generated from the row index when a booking had none (MH-01-TS-###), one
  // named customer's plate was rewritten to a fixed value, and an empty result
  // was replaced wholesale by a fictional owner. Operators read this panel as
  // the register of cars entitled to enter, so every one of those was a car
  // that would be waved through on the strength of a display bug.
  const registeredVehiclesMap = {};
  serviceBookings.forEach((b) => {
    const email = (b.customerEmail || '').toLowerCase().trim();
    const name = b.customerName || 'Valued Customer';

    const plate = (b.vehicleNo || b.vehiclePlate || '').toUpperCase().trim();
    // A booking with no plate on it contributes no vehicle.
    if (!plate) return;

    const key = `${email || name}_${plate}`.toLowerCase();

    if (!registeredVehiclesMap[key]) {
      registeredVehiclesMap[key] = {
        plate,
        model: b.vehicleType || b.vehicleModel || '',
        ownerName: name,
        ownerEmail: email,
        ownerPhone: b.phone || b.mobile || '',
        packageName: b.packageName || '',
        totalWashes: 1,
        lastWashDate: b.date || ''
      };
    } else {
      registeredVehiclesMap[key].totalWashes += 1;
      if (b.date && !b.date.includes('July 18')) {
        registeredVehiclesMap[key].lastWashDate = b.date;
      }
    }
  });

  const registeredVehiclesList = Object.values(registeredVehiclesMap);

  // Live Backend Database State
  const [dbService, setDbService] = useState(null);
  const [dbStaff, setDbStaff] = useState([]);
  const [isLiveConnection, setIsLiveConnection] = useState(true);

  const fetchLiveService = async () => {
    try {
      const res = await serviceApi.getServiceBySlug('car-wash');
      if (res.success && res.service) {
        setDbService(res.service);
        setIsLiveConnection(true);
        cacheService('tsl_car_wash_service', res.service);
        return;
      }
    } catch (err) {
      console.warn('Could not fetch live car-wash service, checking local storage');
    }
    setIsLiveConnection(false);
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
    fetchMembershipSubscribers();
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
        badge: m.badge || 'PASS',
        duration: Number(m.duration) || 30,
        visitLimit: m.visitLimit !== undefined ? Number(m.visitLimit) : (m.washes ? Number(m.washes) : 4),
        isPopular: !!m.isPopular,
        renewable: m.renewable !== false
      }))
    : (serviceMain?.memberships || [
        { _id: 'cw-mem-1', name: 'Unlimited Monthly Wash Pass', price: 2499, benefits: ['Unlimited Express Hydrobath Washes', 'Free Interior Steam once a month', 'Priority Tunnel Lane Access'], badge: 'MOST POPULAR', duration: 30, visitLimit: 999 }
      ]);

  // Per Car Discount as it is currently stored on the service. Read from
  // dbService rather than the modal's form state so the packages tab shows the
  // saved policy even before the modal has ever been opened.
  const savedDiscount = {
    active: !!dbService?.perCarDiscountActive,
    amount: Number(dbService?.perCarDiscountAmount) || 0,
    type: dbService?.perCarDiscountType || 'fixed'
  };
  savedDiscount.label = savedDiscount.type === 'percent'
    ? `${savedDiscount.amount}%`
    : `₹${savedDiscount.amount}`;

  // Mirrors the checkout math in CarWashConfirmPage so the preview matches
  // what the customer is actually charged.
  const applyPerCarDiscount = (price) => {
    if (!savedDiscount.active) return price;
    const off = savedDiscount.type === 'percent'
      ? Math.round(price * (savedDiscount.amount / 100))
      : savedDiscount.amount;
    return Math.max(0, price - off);
  };

  // Modal Editing States
  const [editingPriceModal, setEditingPriceModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // { type: 'pricing'|'membership', id, title }
  const [editTitle, setEditTitle] = useState('');
  const [editPrice, setEditPrice] = useState(699);
  const [editDescription, setEditDescription] = useState('');
  // Rich membership edit fields
  const [editBadge, setEditBadge] = useState('');
  const [editDuration, setEditDuration] = useState(30);
  const [editVisitLimit, setEditVisitLimit] = useState(4);
  const [editBenefits, setEditBenefits] = useState(['']);
  const [editIsPopular, setEditIsPopular] = useState(false);
  const [editRenewable, setEditRenewable] = useState(true);

  // Add Package Modal States
  const [addPackageModal, setAddPackageModal] = useState(false);
  const [newPkgForm, setNewPkgForm] = useState({
    title: '',
    price: '',
    description: '',
    type: 'pricing',
    badge: '',
    duration: 30,
    visitLimit: 4,
    benefits: [''],
    isPopular: false,
    renewable: true
  });

  // Membership subscribers (from bookings)
  const [membershipSubscribers, setMembershipSubscribers] = useState([]);
  const [subscriberModal, setSubscriberModal] = useState(false);
  const [selectedMembershipForSubscribers, setSelectedMembershipForSubscribers] = useState(null);
  const [subscriberSearchQuery, setSubscriberSearchQuery] = useState('');

  const handleOpenSubscriberModal = (membership) => {
    setSelectedMembershipForSubscribers(membership);
    setSubscriberSearchQuery('');
    setSubscriberModal(true);
  };

  // Every purchased pass laid out on its real period: a pass bought while an
  // earlier one is still running is queued to start the day that one expires,
  // so no two passes on the same car ever claim the same dates.
  const subscriberSchedule = React.useMemo(
    () => buildMembershipSchedule(membershipSubscribers, { catalog: dbService?.memberships }),
    [membershipSubscribers, dbService]
  );

  const subscribersForPlan = (plan) => {
    const planName = (plan?.name || '').toLowerCase();
    return subscriberSchedule.filter(record => {
      const passName = record.packageName.toLowerCase();
      const yearlyPass = passName.includes('yearly') || passName.includes('annual');
      if (planName.includes('monthly')) {
        if (yearlyPass) return false;
        return passName.includes('monthly') || passName.includes('membership') || passName.includes('pass');
      }
      if (planName.includes('yearly')) return yearlyPass;
      return passName.includes(planName) || planName.includes(passName);
    });
  };

  // Passes bought in this browser that the API has not returned (yet).
  const mergeLocalPasses = (list) => {
    const merged = [...list];
    const knownIds = new Set(merged.map(s => s.bookingId || s.id).filter(Boolean));

    const addPass = (pass) => {
      if (!pass || !pass.packageName) return;
      const passId = pass.bookingId || pass.id;
      if (passId && knownIds.has(passId)) return;
      if (passId) knownIds.add(passId);
      merged.push({
        _id: passId,
        id: passId,
        bookingId: passId,
        customerName: pass.customerName || 'Valued Passholder',
        customerEmail: (pass.customerEmail || '').toLowerCase().trim(),
        mobile: pass.mobile || pass.phone || '',
        phone: pass.phone || pass.mobile || '',
        packageName: pass.packageName,
        serviceKey: pass.serviceKey || 'car-wash',
        serviceName: pass.serviceName || 'Car Wash',
        vehicleNo: pass.vehicleNo || '',
        vehicleType: pass.vehicleType || '',
        price: pass.price,
        date: pass.date,
        purchasedAt: pass.purchasedAt,
        status: 'Active'
      });
    };

    // Local passes are stored per customer, so sweep every scope in this browser.
    readAllScoped('tsl_membership_passes').forEach(({ value }) => {
      if (Array.isArray(value)) value.forEach(addPass);
    });
    readAllScoped('tsl_active_membership').forEach(({ value }) => addPass(value));

    return merged;
  };

  const fetchMembershipSubscribers = async () => {
    try {
      const res = await apiClient.get('/bookings');
      if (res.data && res.data.bookings) {
        const memberBookings = res.data.bookings.filter(
          b => b.packageName && (
            b.packageName.toLowerCase().includes('membership') ||
            b.packageName.toLowerCase().includes('pass') ||
            b.packageName.toLowerCase().includes('monthly') ||
            b.packageName.toLowerCase().includes('yearly')
          )
        );

        const mappedSubs = memberBookings.map(b => {
          const userMobile = b.mobile || b.phone || (customers.find(c => (c.email || '').toLowerCase() === (b.customerEmail || '').toLowerCase())?.mobile) || '+91 98200 54321';
          return {
            _id: b._id,
            id: b.bookingId,
            bookingId: b.bookingId,
            customerName: b.customerName || 'prabhat',
            customerEmail: (b.customerEmail || 'prabhat@gmail.com').toLowerCase().trim(),
            mobile: userMobile,
            phone: userMobile,
            packageName: b.packageName,
            serviceKey: b.serviceKey || 'car-wash',
            serviceName: b.serviceName || 'Car Wash',
            vehicleNo: b.vehicleNo || 'MP09WC4444',
            vehicleType: b.vehicleType || 'Hyundai Elite i20',
            price: b.price,
            // Purchase date — the pass period itself is derived from it, since a
            // pass bought during a running one starts when that one expires.
            date: b.date || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
            createdAt: b.createdAt,
            status: b.status || 'Active'
          };
        });

        if (mappedSubs.length > 0) {
          setMembershipSubscribers(mergeLocalPasses(mappedSubs));
        } else {
          setMembershipSubscribers(mergeLocalPasses([
            {
              _id: 'sub-1',
              id: 'B-2026-9028',
              customerName: 'prabhat',
              customerEmail: 'prabhat@gmail.com',
              mobile: '+91 98200 54321',
              phone: '+91 98200 54321',
              packageName: 'Monthly Membership',
              vehicleNo: 'MP09WC4444',
              vehicleType: 'Hyundai Elite i20',
              price: 2499,
              date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
              status: 'Active'
            }
          ]));
        }
      }
    } catch (err) {
      console.warn('Could not fetch membership subscribers:', err.message);
      setMembershipSubscribers(mergeLocalPasses([
        {
          _id: 'sub-1',
          id: 'B-2026-9028',
          customerName: 'prabhat',
          customerEmail: 'prabhat@gmail.com',
          mobile: '+91 98200 54321',
          phone: '+91 98200 54321',
          packageName: 'Monthly Membership',
          vehicleNo: 'MP09WC4444',
          vehicleType: 'Hyundai Elite i20',
          price: 2499,
          date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
          status: 'Active'
        }
      ]));
    }
  };

  // Hero Tunnel Video & Media Configuration States
  const [heroVideoUrl, setHeroVideoUrl] = useState('/videos/car-tunnel.mp4');
  const [heroPosterUrl, setHeroPosterUrl] = useState('https://images.unsplash.com/photo-1552930294-6b595f4c2974?auto=format&fit=crop&w=800&q=80');

  // Per Car Discount configuration states
  const [discountModal, setDiscountModal] = useState(false);
  const [discountActive, setDiscountActive] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountType, setDiscountType] = useState('fixed');

  useEffect(() => {
    if (dbService) {
      if (dbService.heroVideo) setHeroVideoUrl(dbService.heroVideo);
      if (dbService.bannerImage) setHeroPosterUrl(dbService.bannerImage);
      setDiscountActive(!!dbService.perCarDiscountActive);
      setDiscountAmount(dbService.perCarDiscountAmount || 0);
      setDiscountType(dbService.perCarDiscountType || 'fixed');
    }
  }, [dbService]);

  // Always open the modal on the saved policy, so an abandoned edit from a
  // previous open doesn't linger in the form.
  const openDiscountModal = () => {
    setDiscountActive(!!dbService?.perCarDiscountActive);
    setDiscountAmount(Number(dbService?.perCarDiscountAmount) || 0);
    setDiscountType(dbService?.perCarDiscountType || 'fixed');
    setDiscountModal(true);
  };

  const handleSaveDiscount = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    try {
      const targetId = await getTargetServiceId();
      const payload = {
        perCarDiscountActive: discountActive,
        perCarDiscountAmount: Number(discountAmount) || 0,
        perCarDiscountType: discountType
      };

      if (targetId) {
        const res = await serviceApi.updateService(targetId, payload);
        if (res.success && res.service) {
          setDbService(res.service);
          cacheService('tsl_car_wash_service', res.service);
          window.dispatchEvent(new CustomEvent('tsl_service_updated', { detail: { ...res.service, slug: 'car-wash' } }));
        }
      }

      if (showToast) showToast('✅ Per Car Discount settings saved successfully!');
      setDiscountModal(false);
    } catch (err) {
      alert('Error updating discount settings: ' + err.message);
    }
  };

  const handleSaveHeroMedia = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    try {
      const targetId = await getTargetServiceId();
      const payload = {
        heroVideo: heroVideoUrl.trim(),
        bannerImage: heroPosterUrl.trim()
      };

      if (targetId) {
        try {
          const res = await serviceApi.updateService(targetId, payload);
          if (res.success && res.service) {
            setDbService(res.service);
          }
        } catch (apiErr) {
          console.warn('API hero media update error:', apiErr.message);
        }
      }

      const updated = {
        ...(dbService || {}),
        heroVideo: heroVideoUrl.trim(),
        bannerImage: heroPosterUrl.trim()
      };
      setDbService(updated);
      cacheService('tsl_car_wash_service', updated);

      if (showToast) showToast('✅ Hero Video & Poster updated live for /car-wash!');
      alert('✅ Hero Tunnel Video configuration saved successfully! The /car-wash page video is now updated live.');
    } catch (err) {
      alert('Error updating hero media: ' + err.message);
    }
  };

  // Upload Handlers — upload to Cloudinary via backend service
  const uploadFileToServer = async (file, folder = 'shine-lounge/car-wash') => {
    const res = await uploadToCloudinary(file, folder);
    return res.url;
  };

  const handleHeroVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      if (showToast) showToast('⏳ Uploading video... please wait');
      const url = await uploadFileToServer(file);
      setHeroVideoUrl(url);
      if (showToast) showToast('📁 Video uploaded successfully!');
    } catch (err) {
      alert('Video upload failed: ' + err.message);
    }
  };

  const handleHeroPosterUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      if (showToast) showToast('⏳ Uploading image... please wait');
      const url = await uploadFileToServer(file);
      setHeroPosterUrl(url);
      if (showToast) showToast('🖼️ Poster image uploaded!');
    } catch (err) {
      alert('Image upload failed: ' + err.message);
    }
  };

  const handleBannerImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      if (showToast) showToast('⏳ Uploading banner image...');
      const url = await uploadFileToServer(file);
      setBannerForm(prev => ({ ...prev, imageUrl: url }));
      if (showToast) showToast('🖼️ Banner image uploaded!');
    } catch (err) {
      alert('Banner image upload failed: ' + err.message);
    }
  };

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
    // Populate rich membership fields
    if (type === 'membership') {
      setEditBadge(item.badge || '');
      setEditDuration(item.duration || 30);
      setEditVisitLimit(item.visitLimit !== undefined ? item.visitLimit : 4);
      setEditBenefits(Array.isArray(item.benefits) && item.benefits.length > 0 ? [...item.benefits] : ['']);
      setEditIsPopular(!!item.isPopular);
      setEditRenewable(item.renewable !== false);
    }
    setEditingPriceModal(true);
  };

  const handleSavePrice = async () => {
    const numPrice = Number(editPrice);
    if (!numPrice || numPrice <= 0 || !editingItem || !editTitle.trim()) return;

    const newTitle = editTitle.trim();
    const itemType = editingItem.type;
    const editId = editingItem.id;
    const editTitleVal = editingItem.title;

    try {
      let currentPricing = activePricing.map(p => {
        if (itemType === 'pricing') {
          const pId = p._id || p.id;
          const pTitle = p.title || p.name;
          const isMatch = (editId && pId && String(pId) === String(editId)) ||
            (editTitleVal && pTitle && String(pTitle).toLowerCase().trim() === String(editTitleVal).toLowerCase().trim());
          if (isMatch) {
            return { ...p, title: newTitle, price: numPrice, description: editDescription.trim() };
          }
        }
        return p;
      });

      // Reset Single Wash if it was mistakenly set to 25000 by previous bug
      currentPricing = currentPricing.map(p => {
        const title = (p.title || p.name || '').toLowerCase();
        if ((title.includes('single') || title.includes('express')) && p.price >= 20000) {
          return { ...p, price: 699 };
        }
        return p;
      });

      let currentMemberships = activeMemberships.map(m => {
        if (itemType === 'membership') {
          const mId = m._id || m.id;
          const mName = m.name || m.title;
          const isMatch = (editId && mId && String(mId) === String(editId)) ||
            (editTitleVal && mName && String(mName).toLowerCase().trim() === String(editTitleVal).toLowerCase().trim());
          if (isMatch) {
            return {
              ...m,
              name: newTitle,
              price: numPrice,
              benefits: editBenefits.filter(b => b.trim()),
              badge: editBadge.trim() || m.badge || '',
              duration: Number(editDuration) || 30,
              visitLimit: editVisitLimit !== undefined ? Number(editVisitLimit) : 4,
              isPopular: editIsPopular,
              renewable: editRenewable,
              upgradeAvailable: editRenewable
            };
          }
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
        benefits: Array.isArray(m.benefits) ? m.benefits.filter(b => b) : [String(m.benefits || '').trim()],
        badge: String(m.badge || '').trim(),
        duration: Number(m.duration) || 30,
        visitLimit: m.visitLimit !== undefined ? Number(m.visitLimit) : 4,
        isPopular: !!m.isPopular,
        renewable: m.renewable !== false,
        upgradeAvailable: m.upgradeAvailable !== false,
        isActive: m.isActive !== false
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
      cacheService('tsl_car_wash_service', newDbService);
      window.dispatchEvent(new CustomEvent('tsl_service_updated', { detail: { ...newDbService, slug: 'car-wash' } }));

      if (showToast) showToast('Car Wash package title, price & details updated live!');
      
      if (itemType === 'pricing') {
        updateServicePrice(serviceMain.id, numPrice);
      }
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
          benefits: newPkgForm.benefits.filter(b => b.trim()),
          badge: newPkgForm.badge.trim() || 'NEW PASS',
          duration: Number(newPkgForm.duration) || 30,
          visitLimit: Number(newPkgForm.visitLimit) || 4,
          isPopular: !!newPkgForm.isPopular,
          renewable: newPkgForm.renewable !== false,
          upgradeAvailable: newPkgForm.renewable !== false
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
        benefits: Array.isArray(m.benefits) ? m.benefits.filter(b => b) : [String(m.benefits || '').trim()],
        badge: String(m.badge || '').trim(),
        duration: Number(m.duration) || 30,
        visitLimit: Number(m.visitLimit) || 4,
        isPopular: !!m.isPopular,
        renewable: m.renewable !== false,
        upgradeAvailable: m.upgradeAvailable !== false,
        isActive: m.isActive !== false
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
      cacheService('tsl_car_wash_service', newDbService);
      window.dispatchEvent(new CustomEvent('tsl_service_updated', { detail: { ...newDbService, slug: 'car-wash' } }));

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
        benefits: Array.isArray(m.benefits) ? m.benefits.filter(b => b) : [String(m.benefits || '').trim()],
        badge: String(m.badge || '').trim(),
        duration: Number(m.duration) || 30,
        visitLimit: Number(m.visitLimit) || 4,
        isPopular: !!m.isPopular,
        renewable: m.renewable !== false,
        upgradeAvailable: m.upgradeAvailable !== false,
        isActive: m.isActive !== false
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
            cacheService('tsl_car_wash_service', res.service);
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
      cacheService('tsl_car_wash_service', newDbService);
      window.dispatchEvent(new CustomEvent('tsl_service_updated', { detail: { ...newDbService, slug: 'car-wash' } }));

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
          { id: 'vehicles', label: `Registered Vehicles (${registeredVehiclesList.length})`, icon: Shield },
          { id: 'staff', label: `Department Staff (${dbStaff.length || serviceStaff.length})`, icon: Users },
          { id: 'marketing', label: `Promos & Media (${serviceBanners.length})`, icon: ImageIcon },
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
            <div className="flex items-center gap-2.5">
              <button
                onClick={openDiscountModal}
                className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 whitespace-nowrap"
              >
                <span>🏷️ Per Car Discount</span>
                <span className={`px-1.5 py-0.5 rounded-md text-[9px] uppercase tracking-wider font-black ${
                  savedDiscount.active ? 'bg-emerald-400 text-emerald-950' : 'bg-zinc-700 text-zinc-300'
                }`}>
                  {savedDiscount.active ? 'On' : 'Off'}
                </span>
              </button>
              <button
                onClick={() => setAddPackageModal(true)}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" /> Add New Package
              </button>
            </div>
          </div>

          {/* Saved Per Car Discount policy — reflects what is stored on the
              service right now, so it survives a re-login and is visible
              without having to open the configuration modal. */}
          <div className={`rounded-2xl border p-4 shadow-sm ${
            savedDiscount.active ? 'bg-emerald-50/60 border-emerald-200' : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="text-lg">🏷️</span>
                <div>
                  <h4 className="text-xs font-black text-gray-900 flex items-center gap-2">
                    Per Car Discount Policy
                    <span className={`px-2 py-0.5 rounded-md text-[9px] uppercase tracking-wider font-black ${
                      savedDiscount.active
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-300 text-gray-700'
                    }`}>
                      {savedDiscount.active ? 'Enabled' : 'Disabled'}
                    </span>
                  </h4>
                  <p className="text-[11px] text-gray-600 mt-0.5">
                    {savedDiscount.active ? (
                      <>
                        <strong>{savedDiscount.label}</strong> off per car — applied at checkout on
                        membership bookings covering more than one car.
                      </>
                    ) : (
                      <>No discount is being applied at checkout right now.</>
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={openDiscountModal}
                className="px-3 py-2 bg-white border border-gray-300 hover:border-amber-400 text-gray-800 text-[11px] font-bold rounded-xl transition-all"
              >
                Change Policy
              </button>
            </div>

            {savedDiscount.active && activeMemberships.length > 0 && (
              <div className="mt-3 pt-3 border-t border-emerald-200/70 flex flex-wrap gap-2">
                {activeMemberships.map((m) => {
                  const original = Number(m.price) || 0;
                  const effective = applyPerCarDiscount(original);
                  return (
                    <div
                      key={`disc-${m._id || m.id || m.name}`}
                      className="bg-white border border-emerald-200 rounded-xl px-3 py-2 text-[11px]"
                    >
                      <span className="block font-bold text-gray-700">{m.name}</span>
                      <span className="text-gray-400 line-through mr-1.5">₹{original}</span>
                      <span className="font-black text-emerald-700">₹{effective}</span>
                      <span className="text-gray-500"> / car</span>
                    </div>
                  );
                })}
              </div>
            )}
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
            {activeMemberships.map((m) => {
              const planSubs = subscribersForPlan(m);
              const subCount = planSubs.filter(s => s.isActive).length;
              const queuedCount = planSubs.filter(s => s.isQueued).length;
              return (
                <div key={m._id || m.id || m.name} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between hover:border-amber-300 transition-all">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start flex-wrap gap-1">
                      <h4 className="text-lg font-black text-gray-900">{m.name}</h4>
                      <div className="flex items-center gap-1">
                        {m.badge ? (
                          <span className="text-[10px] uppercase tracking-wider font-extrabold text-white bg-amber-500 px-2 py-0.5 rounded-md">
                            {m.badge}
                          </span>
                        ) : (
                          <span className="text-[10px] uppercase tracking-wider font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                            Pass
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenSubscriberModal(m);
                          }}
                          title="Click to view full active subscriber list and profiles"
                          className="text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 hover:scale-105 active:scale-95 px-2 py-0.5 rounded-md border border-emerald-200 cursor-pointer transition-all flex items-center gap-1 shadow-2xs"
                        >
                          <Users className="w-3 h-3 text-emerald-600" />
                          {subCount} Active {subCount === 1 ? 'Subscriber' : 'Subscribers'}
                        </button>
                        {queuedCount > 0 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenSubscriberModal(m);
                            }}
                            title="Upgrades already paid for that start when the current pass expires"
                            className="text-[10px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 hover:scale-105 active:scale-95 px-2 py-0.5 rounded-md border border-blue-200 cursor-pointer transition-all flex items-center gap-1 shadow-2xs"
                          >
                            <Clock className="w-3 h-3 text-blue-600" />
                            {queuedCount} Queued
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-gray-500 font-semibold">
                      <span>⏱️ {m.duration || ((m.name || '').toLowerCase().includes('yearly') ? 365 : 30)} Days</span>
                      <span>•</span>
                      <span>🚿 {Number(m.visitLimit) === 999 ? 'Unlimited Washes' : `${m.visitLimit !== undefined ? m.visitLimit : 4} Washes`}</span>
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
              <h3 className="text-base font-black text-gray-900">Car Wash Department Staff ({(dbStaff.length > 0 ? dbStaff : serviceStaff).filter(s => (s.serviceKey === 'car-wash' || s.department === 'Car Wash') && !/cafe|barista|chef|pastry|groomer|salon|barber/i.test(s.staffRole || s.role || '')).length})</h3>
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
              .filter(s => (s.serviceKey === 'car-wash' || s.department === 'Car Wash') && !/cafe|barista|chef|pastry|groomer|salon|barber/i.test(s.staffRole || s.role || ''))
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
            { header: 'Booking Date & Time', accessorKey: 'timeSlot' },
            { header: 'Total (₹)', accessorKey: 'total', cell: (r) => <span>₹{r.total}</span> },

            {
              header: 'Status',
              accessorKey: 'status',
              cell: (r) => {
                const currentStatus = r.status || 'Pending';
                // Normalize to handle case sensitivity differences if any
                const normalizedStatus = currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1).toLowerCase();
                
                return (
                  <select
                    value={normalizedStatus}
                    onChange={(e) => updateBookingStatus(r.id, e.target.value)}
                    className={`px-3 py-1.5 rounded-xl border text-[11px] font-black transition-all outline-none focus:ring-2 focus:ring-amber-500/20 cursor-pointer ${
                      normalizedStatus === 'Pending' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                      normalizedStatus === 'Confirmed' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                      normalizedStatus === 'In progress' || normalizedStatus === 'In Progress' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' :
                      normalizedStatus === 'Completed' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                      normalizedStatus === 'Cancelled' ? 'bg-rose-50 border-rose-200 text-rose-700' :
                      'bg-gray-50 border-gray-200 text-gray-700'
                    }`}
                  >
                    <option value="Pending" className="bg-white text-gray-800 font-bold">Pending</option>
                    <option value="Confirmed" className="bg-white text-gray-800 font-bold">Confirmed</option>
                    <option value="In Progress" className="bg-white text-gray-800 font-bold">In Progress</option>
                    <option value="Completed" className="bg-white text-gray-800 font-bold">Completed</option>
                    <option value="Cancelled" className="bg-white text-gray-800 font-bold">Cancelled</option>
                  </select>
                );
              }
            }
          ]}
          data={serviceBookings}
          searchPlaceholder="Search Bookings..."
        />
      )}

      {activeTab === 'vehicles' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white border border-gray-200 rounded-2xl p-4 shadow-sm gap-3">
            <div>
              <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                🚗 Registered Customer Vehicles & Fleet ({registeredVehiclesList.length})
              </h3>
              <p className="text-xs text-gray-500">Live list of customer vehicles registered during bookings and membership passes</p>
            </div>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
              {registeredVehiclesList.length} Active Fleet Cars
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {registeredVehiclesList.map((v, i) => (
              <div key={v.plate || i} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3 hover:border-amber-300 transition-all">
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
                    {v.totalWashes} {v.totalWashes === 1 ? 'Wash' : 'Washes'} Done
                  </span>
                </div>

                <div className="pt-3 border-t border-gray-100 space-y-1 text-xs text-gray-600">
                  <p className="flex justify-between">
                    <span className="text-gray-400">Registered Owner:</span>
                    <strong className="text-gray-800">{v.ownerName}</strong>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-gray-400">Active Membership:</span>
                    <span className="text-amber-700 font-bold">{v.packageName}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-gray-400">Contact:</span>
                    <span className="text-gray-700 font-semibold">{v.ownerPhone}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-gray-400">Email:</span>
                    <span className="text-gray-600 truncate max-w-[180px]">{v.ownerEmail}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-gray-400">Last Service Date:</span>
                    <span className="text-amber-700 font-bold">{v.lastWashDate}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'marketing' && (
        <div className="space-y-6">
          {/* Hero Tunnel Video & Media Configuration Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-100 pb-3 gap-2">
              <div>
                <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  Customer Page Hero Tunnel Video & Media Configuration
                </h3>
                <p className="text-xs text-gray-500">
                  Update the live video loop and fallback poster image displayed on <code className="bg-gray-100 px-1.5 py-0.5 rounded text-amber-700 font-bold">http://localhost:3000/car-wash</code>
                </p>
              </div>
              <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                ⚡ Live Frontend Sync
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Video Player Live Preview */}
              <div className="space-y-2">
                <label className="block font-bold text-xs text-gray-700">Live Video Preview</label>
                <div className="relative rounded-xl overflow-hidden border border-gray-300 shadow-sm aspect-video bg-black flex items-center justify-center">
                  <video
                    key={heroVideoUrl}
                    src={heroVideoUrl}
                    poster={heroPosterUrl}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 backdrop-blur-xs text-white rounded text-[9px] font-bold">
                    Active Video Loop
                  </span>
                </div>
              </div>

              {/* Form Controls */}
              <form onSubmit={handleSaveHeroMedia} className="lg:col-span-2 space-y-3 text-xs flex flex-col justify-between">
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block font-bold text-gray-700">Hero Tunnel Video URL / Local Path *</label>
                      <label className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold rounded-lg cursor-pointer shadow-2xs transition-all flex items-center gap-1">
                        <Upload className="w-3 h-3" />
                        <span>📁 Upload Video File</span>
                        <input type="file" accept="video/*" onChange={handleHeroVideoUpload} className="hidden" />
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        value={heroVideoUrl}
                        onChange={e => setHeroVideoUrl(e.target.value)}
                        placeholder="/videos/car-tunnel.mp4 or https://..."
                        className="flex-1 p-2.5 border rounded-xl font-mono text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setHeroVideoUrl('/videos/car-tunnel.mp4')}
                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] font-bold rounded-xl whitespace-nowrap transition-all"
                      >
                        Reset Default
                      </button>
                    </div>
                    <span className="text-[10px] text-gray-400 block mt-1">
                      Option 1: Paste URL or local path above • Option 2: Click "📁 Upload Video File" to choose an MP4/WEBM video file.
                    </span>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block font-bold text-gray-700">Fallback Poster Image URL *</label>
                      <label className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold rounded-lg cursor-pointer shadow-2xs transition-all flex items-center gap-1">
                        <ImageIcon className="w-3 h-3" />
                        <span>🖼️ Upload Image File</span>
                        <input type="file" accept="image/*" onChange={handleHeroPosterUpload} className="hidden" />
                      </label>
                    </div>
                    <input
                      type="text"
                      required
                      value={heroPosterUrl}
                      onChange={e => setHeroPosterUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/... or upload image"
                      className="w-full p-2.5 border rounded-xl font-mono text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                    <span className="text-[10px] text-gray-400 block mt-1">
                      Option 1: Paste image URL above • Option 2: Click "🖼️ Upload Image File" to select an image from your computer.
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-extrabold rounded-xl shadow-xs transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                  >
                    Save & Update Customer Hero Media
                  </button>
                </div>
              </form>
            </div>
          </div>

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

      {/* Modal: Edit Package Title, Price & Details */}
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

          <div className="grid grid-cols-2 gap-3">
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
            {editingItem?.type === 'membership' && (
              <div>
                <label className="block font-bold text-gray-700 mb-1">Badge Tag</label>
                <input 
                  type="text" 
                  value={editBadge} 
                  onChange={e => setEditBadge(e.target.value)} 
                  placeholder="e.g. MOST POPULAR" 
                  className="w-full p-2.5 border rounded-xl font-bold text-amber-700 focus:ring-2 focus:ring-amber-500 focus:outline-none" 
                />
              </div>
            )}
          </div>

          {editingItem?.type === 'membership' && (
            <div className="grid grid-cols-2 gap-3 bg-amber-50/50 p-3 rounded-xl border border-amber-200/60">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Pass Duration (Days)</label>
                <select 
                  value={editDuration} 
                  onChange={e => setEditDuration(Number(e.target.value))} 
                  className="w-full p-2.5 border rounded-xl font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value={30}>30 Days (Monthly)</option>
                  <option value={90}>90 Days (Quarterly)</option>
                  <option value={365}>365 Days (Yearly)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Visit Limit (Washes)</label>
                <input 
                  type="number" 
                  value={editVisitLimit} 
                  onChange={e => setEditVisitLimit(Number(e.target.value))} 
                  placeholder="4 (or 999 for unlimited)" 
                  className="w-full p-2.5 border rounded-xl font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none" 
                />
                <span className="text-[10px] text-gray-400">Set 999 for unlimited washes</span>
              </div>
            </div>
          )}

          <div>
            <label className="block font-bold text-gray-700 mb-1">Description / Benefits Details</label>
            <textarea 
              value={editDescription} 
              onChange={e => {
                setEditDescription(e.target.value);
                if (editingItem?.type === 'membership') {
                  setEditBenefits(e.target.value.split(',').map(s => s.trim()));
                }
              }} 
              rows={3} 
              className="w-full p-2.5 border rounded-xl text-gray-700 focus:ring-2 focus:ring-amber-500 focus:outline-none" 
              placeholder="e.g. Unlimited Express Washes, Free Interior Steam once a month" 
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

          {newPkgForm.type === 'membership' && (
            <div className="grid grid-cols-3 gap-3 bg-amber-50/50 p-3 rounded-xl border border-amber-200/60">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Badge Tag</label>
                <input 
                  type="text" 
                  value={newPkgForm.badge} 
                  onChange={e => setNewPkgForm({ ...newPkgForm, badge: e.target.value })} 
                  placeholder="e.g. BEST VALUE" 
                  className="w-full p-2.5 border rounded-xl font-bold text-amber-700 focus:ring-2 focus:ring-amber-500 focus:outline-none" 
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Duration (Days)</label>
                <select 
                  value={newPkgForm.duration} 
                  onChange={e => setNewPkgForm({ ...newPkgForm, duration: Number(e.target.value) })} 
                  className="w-full p-2.5 border rounded-xl font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value={30}>30 Days (Monthly)</option>
                  <option value={90}>90 Days (Quarterly)</option>
                  <option value={365}>365 Days (Yearly)</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Visit Limit</label>
                <input 
                  type="number" 
                  value={newPkgForm.visitLimit} 
                  onChange={e => setNewPkgForm({ ...newPkgForm, visitLimit: Number(e.target.value) })} 
                  placeholder="4" 
                  className="w-full p-2.5 border rounded-xl font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none" 
                />
              </div>
            </div>
          )}

          <div>
            <label className="block font-bold text-gray-700 mb-1">Description / Details *</label>
            <textarea 
              required 
              value={newPkgForm.description} 
              onChange={e => {
                const val = e.target.value;
                setNewPkgForm({
                  ...newPkgForm,
                  description: val,
                  benefits: val.split(',').map(s => s.trim())
                });
              }} 
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

      {/* Modal: Active Subscribers List */}
      <AdminModal
        isOpen={subscriberModal}
        onClose={() => setSubscriberModal(false)}
        title={`Subscribers – ${selectedMembershipForSubscribers?.name || 'Membership Pass'}`}
      >
        <div className="space-y-4 text-xs p-1">
          {/* Header Card Summary */}
          {selectedMembershipForSubscribers && (
            <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-white/20 text-white rounded text-[10px] font-extrabold uppercase tracking-wider">
                    {selectedMembershipForSubscribers.badge || 'MEMBERSHIP PASS'}
                  </span>
                  <span className="text-[11px] font-bold text-amber-100">
                    ⏱️ {selectedMembershipForSubscribers.duration || ((selectedMembershipForSubscribers.name || '').toLowerCase().includes('yearly') ? 365 : 30)} Days • 🚿 {Number(selectedMembershipForSubscribers.visitLimit) === 999 ? 'Unlimited Washes' : `${selectedMembershipForSubscribers.visitLimit !== undefined ? selectedMembershipForSubscribers.visitLimit : 4} Washes`}
                  </span>
                </div>
                <h4 className="text-lg font-black">{selectedMembershipForSubscribers.name}</h4>
                <p className="text-[11px] text-amber-100 opacity-90">
                  Active Now: <strong className="text-white font-extrabold">
                    {subscribersForPlan(selectedMembershipForSubscribers).filter(s => s.isActive).length} Users
                  </strong>
                  {' • '}
                  Queued Upgrades: <strong className="text-white font-extrabold">
                    {subscribersForPlan(selectedMembershipForSubscribers).filter(s => s.isQueued).length}
                  </strong>
                </p>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-2xl font-black text-white">₹{selectedMembershipForSubscribers.price?.toLocaleString()}</span>
                <span className="text-[10px] text-amber-100 block font-semibold">+ GST / pass</span>
              </div>
            </div>
          )}

          {/* Search Filter */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              value={subscriberSearchQuery}
              onChange={e => setSubscriberSearchQuery(e.target.value)}
              placeholder="Search subscribers by name, email, phone, vehicle plate..."
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
            {subscriberSearchQuery && (
              <button
                type="button"
                onClick={() => setSubscriberSearchQuery('')}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Subscribers Cards List — split so a queued upgrade is never counted
              as a running pass, and each row shows its own date range */}
          {(() => {
            const rawSubs = selectedMembershipForSubscribers
              ? subscribersForPlan(selectedMembershipForSubscribers)
              : [];

            const filteredSubs = rawSubs.filter(s => {
              if (!subscriberSearchQuery) return true;
              const q = subscriberSearchQuery.toLowerCase();
              return (
                (s.customerName || '').toLowerCase().includes(q) ||
                (s.customerEmail || '').toLowerCase().includes(q) ||
                (s.phone || '').toLowerCase().includes(q) ||
                (s.vehicleNo || '').toLowerCase().includes(q) ||
                (s.vehicleType || '').toLowerCase().includes(q) ||
                (s.bookingId || '').toLowerCase().includes(q)
              );
            });

            if (rawSubs.length === 0) {
              return (
                <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200 space-y-2">
                  <Users className="w-8 h-8 text-gray-300 mx-auto" />
                  <p className="font-bold text-gray-700">No Active Subscribers Found</p>
                  <p className="text-[11px] text-gray-400 max-w-sm mx-auto">
                    When customers purchase the <strong>{selectedMembershipForSubscribers?.name}</strong> pass online or at the counter, their profiles will appear here automatically.
                  </p>
                </div>
              );
            }

            if (filteredSubs.length === 0) {
              return (
                <div className="text-center py-8 text-gray-400 font-medium">
                  No subscribers match search "{subscriberSearchQuery}".
                </div>
              );
            }

            const renderSubscriberCard = (sub, idx) => (
              <div
                key={sub.bookingId || `${sub.chainKey}-${sub.startISO}-${idx}`}
                className={`bg-white border rounded-2xl p-4 shadow-2xs space-y-3 transition-all ${
                  sub.isQueued ? 'border-blue-200 hover:border-blue-300' : 'border-gray-200 hover:border-amber-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full font-black flex items-center justify-center text-sm shrink-0 border ${
                      sub.isQueued
                        ? 'bg-blue-500/10 text-blue-700 border-blue-500/20'
                        : 'bg-amber-500/10 text-amber-700 border-amber-500/20'
                    }`}>
                      {(sub.customerName || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h5 className="font-extrabold text-sm text-gray-900">{sub.customerName || 'Vally Guest'}</h5>
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${
                          sub.isQueued ? 'bg-blue-100 text-blue-800' :
                          sub.isExpired ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {sub.isQueued ? 'Queued Upgrade' : sub.isExpired ? 'Expired' : 'Active Subscription'}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-gray-400" /> {sub.customerEmail || 'customer@shinelounge.com'}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-semibold text-gray-700">
                          <Phone className="w-3 h-3 text-gray-400" /> {sub.phone || (customers.find(c => (c.email || '').toLowerCase() === (sub.customerEmail || '').toLowerCase())?.mobile) || '+91 98200 54321'}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-black text-amber-600 block">₹{Number(sub.price || 0).toLocaleString()}</span>
                    <span className="text-[9px] text-gray-400 font-semibold block">ID: {sub.bookingId || 'B-9028'}</span>
                  </div>
                </div>

                {sub.isStacked && (
                  <p className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-100 rounded-lg px-2 py-1.5">
                    Stacked upgrade — starts the day this customer's previous pass expires.
                  </p>
                )}

                <div className="pt-2 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                  <div className="p-2 bg-gray-50 rounded-xl">
                    <span className="text-gray-400 font-semibold block text-[9px]">VEHICLE INFO</span>
                    <span className="font-bold text-gray-800 truncate block">
                      🚗 {sub.vehicleType || 'Tesla Model 3'}
                    </span>
                    <span className="text-[10px] text-amber-700 font-black block">
                      {sub.vehicleNo || 'MH-01-AB-1234'}
                    </span>
                  </div>

                  <div className="p-2 bg-gray-50 rounded-xl">
                    <span className="text-gray-400 font-semibold block text-[9px]">
                      {sub.isQueued ? 'STARTS ON' : 'START DATE'}
                    </span>
                    <span className="font-bold text-gray-800 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      {formatShortDate(sub.startDate)}
                    </span>
                  </div>

                  <div className={`p-2 rounded-xl border col-span-2 sm:col-span-1 ${
                    sub.isQueued ? 'bg-blue-50/60 border-blue-100' : 'bg-emerald-50/60 border-emerald-100'
                  }`}>
                    <span className={`font-semibold block text-[9px] ${sub.isQueued ? 'text-blue-700' : 'text-emerald-700'}`}>
                      VALID UNTIL
                    </span>
                    <span className={`font-extrabold flex items-center gap-1 ${sub.isQueued ? 'text-blue-800' : 'text-emerald-800'}`}>
                      📅 {formatShortDate(sub.expiryDate)}
                    </span>
                  </div>
                </div>
              </div>
            );

            const activeNow = filteredSubs.filter(s => s.isActive);
            const upcoming = filteredSubs.filter(s => s.isQueued);
            const lapsed = filteredSubs.filter(s => s.isExpired);

            const section = (label, tone, rows) => rows.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${tone}`}>
                    {label}
                  </span>
                  <span className="text-[10px] font-bold text-gray-400">{rows.length}</span>
                </div>
                {rows.map(renderSubscriberCard)}
              </div>
            );

            return (
              <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
                {section('Active Now', 'bg-emerald-100 text-emerald-800', activeNow)}
                {section('Upcoming / Queued Upgrades', 'bg-blue-100 text-blue-800', upcoming)}
                {section('Expired', 'bg-rose-100 text-rose-800', lapsed)}
              </div>
            );
          })()}
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
            <div className="flex justify-between items-center mb-1">
              <label className="block font-bold text-gray-700">Banner Image URL *</label>
              <label className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold rounded-lg cursor-pointer shadow-2xs transition-all flex items-center gap-1">
                <ImageIcon className="w-3 h-3" />
                <span>🖼️ Upload Image</span>
                <input type="file" accept="image/*" onChange={handleBannerImageUpload} className="hidden" />
              </label>
            </div>
            <input
              type="text"
              required
              value={bannerForm.imageUrl}
              onChange={e => setBannerForm({ ...bannerForm, imageUrl: e.target.value })}
              placeholder="https://... or click Upload Image button"
              className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono text-xs"
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
            <div className="flex justify-between items-center mb-1">
              <label className="block font-bold text-gray-700">Banner Image URL *</label>
              <label className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold rounded-lg cursor-pointer shadow-2xs transition-all flex items-center gap-1">
                <ImageIcon className="w-3 h-3" />
                <span>🖼️ Upload Image</span>
                <input type="file" accept="image/*" onChange={handleBannerImageUpload} className="hidden" />
              </label>
            </div>
            <input
              type="text"
              required
              value={bannerForm.imageUrl}
              onChange={e => setBannerForm({ ...bannerForm, imageUrl: e.target.value })}
              className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono text-xs"
              placeholder="https://... or click Upload Image button"
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

      {/* Modal: Per Car Discount Configuration */}
      <AdminModal isOpen={discountModal} onClose={() => setDiscountModal(false)} title="Configure Per Car Discount">
        <form onSubmit={handleSaveDiscount} className="space-y-4 text-xs p-1">
          <div className="bg-amber-50/50 border border-amber-200/60 p-3 rounded-xl">
            <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
              ℹ️ <strong>What is Per Car Discount?</strong><br />
              This discount applies dynamically in the checkout page when a customer registers and schedules a wash session.
            </p>
          </div>

          <div className="flex items-center gap-2.5 bg-gray-50 border rounded-xl p-3">
            <input 
              type="checkbox" 
              id="perCarDiscountActive"
              checked={discountActive} 
              onChange={(e) => setDiscountActive(e.target.checked)}
              className="rounded text-amber-500 focus:ring-amber-500 w-4 h-4 cursor-pointer" 
            />
            <label htmlFor="perCarDiscountActive" className="cursor-pointer">
              <span className="font-bold text-gray-800 block text-xs">Enable Discount Policy</span>
              <span className="text-[10px] text-gray-500">Enable or disable this discount globally</span>
            </label>
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Discount Type</label>
            <select
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value)}
              className="w-full p-2.5 border rounded-xl font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
            >
              <option value="fixed">Flat Amount (₹)</option>
              <option value="percent">Percentage (%)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">
              Discount Value {discountType === 'percent' ? '(%)' : '(₹)'} *
            </label>
            <input
              type="number"
              min="0"
              required
              value={discountAmount}
              onChange={(e) => setDiscountAmount(Number(e.target.value))}
              placeholder={discountType === 'percent' ? 'e.g. 10' : 'e.g. 100'}
              className="w-full p-2.5 border rounded-xl font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-sm transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2"
          >
            Save Discount Configuration
          </button>
        </form>
      </AdminModal>
    </div>
  );
}
