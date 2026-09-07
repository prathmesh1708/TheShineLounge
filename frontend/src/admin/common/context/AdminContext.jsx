import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import serviceApi from '../../../common/services/serviceApi';
import apiClient from '../../../common/utils/apiClient';
import {
  initialDashboardStats,
  revenueTrendData,
  serviceRevenueData,
  paymentModeData,
  initialServices,
  initialBanners,
  initialMemberships,
  initialStaff,
  initialBookings,
  initialCustomers,
  initialInventory,
  initialCoupons,
  initialNotifications
} from '../data/adminMockData';
import {
  isMembershipPackage,
  buildMembershipSchedule,
  findMembershipMeta,
  parseFlexibleDate,
  addPassDuration,
  startOfDay,
  formatLongDate,
  toISODateString
} from '../../../common/utils/membershipUtils';
import { readAllScoped } from '../../../common/utils/userScopedStorage';

const formatBookingDateTime = (rawSlot, rawDate) => {
  if (!rawSlot && !rawDate) return 'N/A';
  let text = String(rawSlot || '').trim();

  // Strip leading 'Today ' prefix if present
  if (text.startsWith('Today ')) {
    text = text.replace(/^Today\s+/, '');
  }

  // If text has range with '-', extract start time
  // Example: "August 10, 2026 | 02:01 PM - 02:31 PM" => "August 10, 2026 | 02:01 PM"
  // Example: "02:01 PM - 02:31 PM" => "02:01 PM"
  if (text.includes('-')) {
    const parts = text.split('-');
    const firstPart = parts[0].trim();
    if (firstPart.match(/(AM|PM)/i) || firstPart.includes('|') || firstPart.length > 5) {
      text = firstPart;
    }
  }

  // If date is provided and not already included in text
  if (rawDate && !text.includes(rawDate) && !text.includes('|') && !text.match(/^[A-Za-z]+\s+\d{1,2}/)) {
    return `${rawDate} | ${text}`;
  }

  return text;
};

const AdminContext = createContext();

export const AdminProvider = ({ children }) => {

  // Global State
  const [stats, setStats] = useState(initialDashboardStats);
  const [services, setServices] = useState([]);
  const [banners, setBanners] = useState(() => {
    try {
      const saved = localStorage.getItem('tsl_admin_banners');
      return saved ? JSON.parse(saved) : initialBanners;
    } catch (e) {
      return initialBanners;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('tsl_admin_banners', JSON.stringify(banners));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('salonDataChanged'));
        window.dispatchEvent(new CustomEvent('carDetailingDataChanged'));
      }
    } catch (e) {
      console.warn('Could not save banners to localStorage:', e);
    }
  }, [banners]);
  const [memberships, setMemberships] = useState(initialMemberships);
  const [staffList, setStaffList] = useState(() => {
    try {
      const saved = localStorage.getItem('tsl_admin_staff_list');
      return saved ? JSON.parse(saved) : initialStaff;
    } catch (e) {
      return initialStaff;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('tsl_admin_staff_list', JSON.stringify(staffList));
    } catch (e) {
      console.warn('Could not save staffList to localStorage:', e);
    }
  }, [staffList]);

  const [bookings, setBookings] = useState(() => {
    try {
      const cachedOffline = JSON.parse(localStorage.getItem('tsl_offline_sales') || '[]');
      if (Array.isArray(cachedOffline) && cachedOffline.length > 0) {
        const offlineIds = new Set(cachedOffline.map(o => o.id || o.bookingId).filter(Boolean));
        const filteredInitial = initialBookings.filter(b => !offlineIds.has(b.id) && !offlineIds.has(b.bookingId));
        return [...cachedOffline, ...filteredInitial];
      }
    } catch (e) {}
    return initialBookings;
  });
  const [customers, setCustomers] = useState(initialCustomers);
  const [inventory, setInventory] = useState(initialInventory);
  const [coupons, setCoupons] = useState(initialCoupons);
  const [notifications, setNotifications] = useState(initialNotifications);

  const bookingsRef = useRef(bookings);
  useEffect(() => {
    bookingsRef.current = bookings;
  }, [bookings]);

  const servicesRef = useRef(services);
  useEffect(() => {
    servicesRef.current = services;
  }, [services]);

  // Business Settings State
  const [settings, setSettings] = useState({
    businessName: 'The Shine Lounge',
    tagline: 'Premium Multi-Service Automotive & Lifestyle Lounge',
    address: 'Plot 42, Senapati Bapat Marg, Lower Parel, Mumbai 400013',
    contactPhone: '+91 98200 99999',
    contactEmail: 'admin@theshinelounge.com',
    workingHours: '08:00 AM - 10:00 PM (Mon - Sun)',
    gstRate: 18,
    currency: 'INR (₹)',
    invoicePrefix: 'TSL-INV-2026-',
    backupFrequency: 'Daily (02:00 AM IST)'
  });

  // Simple Toast System
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  /**
   * Turns membership purchases into subscription rows. Passes bought while an
   * earlier one is still running are queued behind it rather than replacing it,
   * so a customer who upgrades shows two rows on back-to-back date ranges.
   */
  const deriveMembershipsFromBookings = (allBookings, servicesList) => {
    const bookingList = allBookings || [];
    const membershipBookings = bookingList.filter(b => isMembershipPackage(b.plan || b.packageName));

    // Purchases made offline (or before the API call landed) live in localStorage.
    const knownIds = new Set(membershipBookings.map(b => b.bookingId || b.id).filter(Boolean));
    const localPasses = [];
    const addLocalPass = (pass) => {
      if (!pass || !pass.packageName) return;
      const passId = pass.bookingId || pass.id;
      if (passId && knownIds.has(passId)) return;
      if (passId) knownIds.add(passId);
      localPasses.push({
        id: passId,
        bookingId: passId,
        customerName: pass.customerName || 'Valued Passholder',
        customerEmail: pass.customerEmail || '',
        phone: pass.phone || pass.mobile || '',
        vehicleNo: pass.vehicleNo || '',
        vehicleType: pass.vehicleType || '',
        serviceKey: pass.serviceKey || 'car-wash',
        serviceName: pass.serviceName || 'Car Wash',
        plan: pass.packageName,
        packageName: pass.packageName,
        price: pass.price,
        total: pass.price,
        date: pass.date,
        purchasedAt: pass.purchasedAt
      });
    };

    // Local passes are stored per customer, so sweep every scope in this browser.
    readAllScoped('tsl_membership_passes').forEach(({ value }) => {
      if (Array.isArray(value)) value.forEach(addLocalPass);
    });
    readAllScoped('tsl_active_membership').forEach(({ value }) => addLocalPass(value));

    // Plan durations and wash allowances configured by the admin across all services
    const catalogMap = new Map();
    const addCatalogItem = (m) => {
      if (!m) return;
      const key = String(m.name || m.title || '').toLowerCase().trim();
      if (key) catalogMap.set(key, m);
    };

    const serviceListSource = servicesList || servicesRef.current || services || [];
    serviceListSource.forEach(s => {
      if (Array.isArray(s?.memberships)) {
        s.memberships.forEach(addCatalogItem);
      }
    });

    const serviceCacheKeys = [
      'tsl_car_wash_service',
      'tsl_car_detailing_service',
      'tsl_dog_wash_service',
      'tsl_salon_service',
      'tsl_cafe_service',
      'tsl_drive_through_cafe_service'
    ];
    serviceCacheKeys.forEach(k => {
      try {
        const item = JSON.parse(localStorage.getItem(k) || 'null');
        if (Array.isArray(item?.memberships)) {
          item.memberships.forEach(addCatalogItem);
        }
      } catch (e) {}
    });

    const catalog = Array.from(catalogMap.values());

    const schedule = buildMembershipSchedule([...membershipBookings, ...localPasses], { catalog });

    const normalizePlate = (value) => String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    const soonCutoff = new Date();
    soonCutoff.setDate(soonCutoff.getDate() + 7);

    const derived = schedule.map((record, idx) => {
      const meta = findMembershipMeta(record.packageName, catalog);
      const configuredLimit = meta?.visitLimit !== undefined && meta?.visitLimit !== null
        ? (Number(meta.visitLimit) === 999 ? 999 : Number(meta.visitLimit))
        : null;

      const isUnlimited = record.packageName.toLowerCase().includes('unlimited') || configuredLimit === 999 || record.visitLimit === 'Unlimited';
      const maxWashes = (configuredLimit !== null && !isNaN(configuredLimit) && configuredLimit > 0)
        ? configuredLimit
        : (typeof record.visitLimit === 'number'
            ? record.visitLimit
            : (isUnlimited ? 999 : (record.isYearly ? 48 : 4)));

      // Washes taken inside this pass's own window, so a queued pass shows 0.
      const washesUsed = record.isQueued ? 0 : bookingList.filter(b => {
        const name = b.plan || b.packageName;
        if (isMembershipPackage(name)) return false;
        if ((b.serviceKey || 'car-wash') !== record.serviceKey) return false;

        const passPlate = normalizePlate(record.vehicleNo);
        const washPlate = normalizePlate(b.vehicleNo);
        const passEmail = (record.customerEmail || '').toLowerCase().trim();
        const washEmail = (b.customerEmail || '').toLowerCase().trim();
        const passPhone = String(record.phone || '').replace(/\D/g, '').slice(-10);
        const washPhone = String(b.phone || b.mobile || '').replace(/\D/g, '').slice(-10);

        let isMatch = false;
        if (passPlate) {
          // If membership is registered to a plate, the wash MUST match this plate
          isMatch = Boolean(washPlate && washPlate === passPlate);
        } else if (passEmail) {
          isMatch = Boolean(washEmail && washEmail === passEmail);
        } else if (passPhone) {
          isMatch = Boolean(washPhone && washPhone === passPhone);
        }

        if (!isMatch) return false;

        const washedOn = parseFlexibleDate(b.date);
        if (!washedOn) return false;
        return washedOn >= record.startDate && washedOn < record.expiryDate;
      }).length;

      let status = record.status;
      if (record.isActive && record.expiryDate <= soonCutoff) status = 'Expiring Soon';

      const rawId = record.bookingId || '';
      return {
        id: rawId
          ? (rawId.startsWith('MEM-') ? rawId : `MEM-${rawId.replace('B-2026-', '')}`)
          : `MEM-${1005 + idx}`,
        customerName: record.customerName,
        phone: record.phone || record.customerEmail || '+91 98200 99887',
        email: record.customerEmail,
        // Empty, not a sample plate. This row is a membership card an operator
        // checks a car against at the gate.
        vehicleNo: record.vehicleNo || '',
        vehicleModel: record.vehicleType || 'Car',
        planName: record.packageName,
        serviceKey: record.serviceKey,
        washesUsed,
        maxWashes,
        startDate: record.startISO,
        expiryDate: record.expiryISO,
        startDateLabel: record.startLabel,
        expiryDateLabel: record.expiryLabel,
        status,
        statusLabel: record.statusLabel,
        isQueued: record.isQueued,
        isStacked: record.isStacked,
        amount: record.price || 2499
      };
    });

    // Newest purchases first, then the seeded demo records.
    derived.reverse();
    const derivedIds = new Set(derived.map(d => d.id));
    const uniqueMocks = initialMemberships.filter(m => !derivedIds.has(m.id)).map(mock => {
      const meta = findMembershipMeta(mock.planName || mock.name, catalog);
      if (meta) {
        const configuredLimit = meta.visitLimit !== undefined && meta.visitLimit !== null
          ? (Number(meta.visitLimit) === 999 ? 999 : Number(meta.visitLimit))
          : null;
        const configuredPrice = Number(meta.price);
        return {
          ...mock,
          maxWashes: (configuredLimit !== null && !isNaN(configuredLimit) && configuredLimit > 0)
            ? configuredLimit
            : mock.maxWashes,
          amount: (!isNaN(configuredPrice) && configuredPrice > 0) ? configuredPrice : mock.amount
        };
      }
      return mock;
    });
    return [...derived, ...uniqueMocks];
  };

  const fetchBookingsList = async () => {
    try {
      let mapped = [];
      const res = await apiClient.get('/bookings');
      if (res.data && res.data.bookings) {
        const liveDateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        const now = new Date();
        const liveTimeStart = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        const liveTimeEnd = new Date(now.getTime() + 30 * 60000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        const defaultSlot = `${liveTimeStart} - ${liveTimeEnd}`;

        mapped = res.data.bookings.map(b => {
          const rawDate = b.date || '';
          const isLegacyDate = !rawDate || rawDate.includes('July 18') || rawDate.includes('2026-07-18');
          const displayDate = isLegacyDate ? liveDateStr : rawDate;

          const rawTime = b.timeSlot || '';
          const isLegacyTime = !rawTime || rawTime === '02:00 PM - 02:30 PM';
          const displayTime = isLegacyTime ? defaultSlot : rawTime;

          return {
            _id: b._id,
            id: b.bookingId,
            bookingId: b.bookingId,
            customerName: b.customerName || b.userName || b.name || (b.customerEmail ? b.customerEmail.split('@')[0] : 'Valued Customer'),
            customerEmail: b.customerEmail || b.email || '',
            vehicleNo: b.vehicleNo || b.vehiclePlate || '',
            vehicleType: b.vehicleType || b.vehicleModel || '',
            location: b.location || 'Main Branch',
            phone: b.phone || b.mobile || b.customerPhone || '',
            serviceKey: b.serviceKey,
            serviceName: b.serviceName || b.service || 'Service',
            service: b.serviceName || b.service || 'Service',
            plan: b.packageName || b.plan || 'Standard',
            packageName: b.packageName || b.plan || 'Standard',
            // Ordering key for two passes bought on the same day (buy, upgrade).
            date: displayDate,
            timeSlot: formatBookingDateTime(displayTime, displayDate),
            total: typeof b.price === 'number' ? b.price : (Number(b.price || b.total || b.amount) || 0),
            price: typeof b.price === 'number' ? b.price : (Number(b.price || b.total || b.amount) || 0),
            status: b.status || 'Pending',
            staffAssigned: b.assignedStaffName || 'Not Assigned',
            assignedStaffId: b.assignedStaffId,
            assignedStaffName: b.assignedStaffName || '',
            stepIndex: b.stepIndex !== undefined ? b.stepIndex : 0,
            notes: b.notes || '',
            photos: b.photos || [],
            paymentMode: b.paymentMode || 'UPI',
            isOfflineSale: b.isOfflineSale !== undefined ? b.isOfflineSale : (b.bookingId && String(b.bookingId).startsWith('OFS-')),
            saleType: b.saleType || (b.membershipName ? 'membership' : 'service'),
            vehicleModel: b.vehicleModel || b.vehicleType || '',
            membershipName: b.membershipName || '',
            membershipValidity: b.membershipValidity || '',
            membershipExpiry: b.membershipExpiry || '',
            createdAt: b.createdAt || b.bookedAt || b.date,
            bookedAt: b.bookedAt || b.createdAt
          };
        });

        // Bi-directional sync of offline sales between backend and localStorage
        const backendOfflineSales = mapped.filter(b => b.isOfflineSale || (b.bookingId && String(b.bookingId).startsWith('OFS-')));
        try {
          const cachedOffline = JSON.parse(localStorage.getItem('tsl_offline_sales') || '[]');
          const combinedOfflineMap = new Map();
          // Include backend offline sales
          backendOfflineSales.forEach(s => combinedOfflineMap.set(s.id || s.bookingId, s));
          // Include locally cached offline sales if not already from backend
          cachedOffline.forEach(s => {
            const key = s.id || s.bookingId;
            if (!combinedOfflineMap.has(key)) combinedOfflineMap.set(key, s);
          });
          const allOffline = Array.from(combinedOfflineMap.values());
          localStorage.setItem('tsl_offline_sales', JSON.stringify(allOffline));

          // Ensure all offline sales are in mapped list
          allOffline.forEach(ofs => {
            if (!mapped.some(m => m.id === ofs.id || m.bookingId === ofs.bookingId)) {
              mapped.unshift(ofs);
            }
          });
        } catch (e) {}

        setMemberships(deriveMembershipsFromBookings(mapped));
      } else {
        setMemberships(deriveMembershipsFromBookings([]));
      }

      // Merge client-side salon bookings from localStorage if available
      let localSalonBookings = [];
      try {
        const storedSalon = localStorage.getItem('salon_bookings') || localStorage.getItem('shine_salon_bookings');
        if (storedSalon) {
          const parsedSalon = JSON.parse(storedSalon);
          if (Array.isArray(parsedSalon)) {
            localSalonBookings = parsedSalon.map((b, idx) => {
              const bDate = b.date || new Date().toISOString().split('T')[0];
              const bTime = b.timeSlot || b.time || '01:30 PM';
              const formattedSlot = formatBookingDateTime(bTime, bDate);
              return {
                _id: b.id || b.bookingId || `BK-SAL-${idx}`,
                id: b.bookingId || b.id || `BK-${7000 + idx}`,
                customerName: b.customerName || b.user || 'Salon Client',
                customerEmail: b.customerEmail || b.email || '',
                vehicleNo: b.vehicleNo || (b.stylist ? `Stylist: ${b.stylist}` : 'Any Specialist'),
                vehicleType: b.vehicleType || 'Salon Client',
                location: b.location || 'Shine Lounge Salon',
                phone: b.phone || b.mobile || '',
                serviceKey: 'salon',
                serviceName: b.serviceName || 'Men\'s Salon',
                plan: b.packageName || b.package || b.service || 'Executive Haircut',
                date: bDate,
                timeSlot: formattedSlot,
                total: b.price || b.total || b.amount || 0,
                status: b.status === 'Upcoming' ? 'Confirmed' : (b.status || 'Confirmed'),
                staffAssigned: b.stylist || b.staffAssigned || 'Not Assigned',
                notes: b.notes || '',
                createdAt: b.createdAt || b.bookedAt || bDate,
                bookedAt: b.bookedAt || b.createdAt
              };
            });
          }
        }
      } catch (e) {}

      const apiIds = new Set(mapped.flatMap(b => [b.id, b._id, b.bookingId].filter(Boolean)));
      const notAlreadyLive = (b) => !apiIds.has(b.id) && !apiIds.has(b._id) && !apiIds.has(b.bookingId);

      const combinedBookings = [
        ...mapped,
        ...localSalonBookings.filter(notAlreadyLive),
        ...initialBookings.filter(notAlreadyLive)
      ];

      const finalBookings = combinedBookings.length > 0 ? combinedBookings : initialBookings;
      setBookings(finalBookings);
      setMemberships(deriveMembershipsFromBookings(finalBookings));
    } catch (err) {
      console.warn('Could not fetch bookings list, preserving local offline sales:', err.message);
      try {
        const cachedOffline = JSON.parse(localStorage.getItem('tsl_offline_sales') || '[]');
        if (Array.isArray(cachedOffline) && cachedOffline.length > 0) {
          const offlineIds = new Set(cachedOffline.map(o => o.id || o.bookingId).filter(Boolean));
          const filteredInitial = initialBookings.filter(b => !offlineIds.has(b.id) && !offlineIds.has(b.bookingId));
          const fallback = [...cachedOffline, ...filteredInitial];
          setBookings(fallback);
          setMemberships(deriveMembershipsFromBookings(fallback));
          return;
        }
      } catch (e) {}
      setBookings(initialBookings);
      setMemberships(deriveMembershipsFromBookings(initialBookings));
    }
  };

  const fetchStaffList = async () => {
    try {
      const res = await apiClient.get('/users/staff');
      if (res.data && res.data.staff) {
        const mapped = res.data.staff.map(s => ({
          _id: s._id,
          id: s.email,
          name: s.fullName,
          fullName: s.fullName,
          email: s.email,
          mobile: s.mobile || '',
          department: s.department || 'Car Wash',
          staffRole: s.staffRole || 'Specialist',
          serviceKey: s.serviceKey || '',
          salary: s.salary || '',
          leaveBalance: s.leaveBalance || 12,
          photo: s.photo || '',
          permissions: s.permissions || [],
          isActive: s.isActive
        }));
        setStaffList(mapped);
      }
    } catch (err) {
      console.warn('Could not fetch staff list:', err.message);
    }
  };

  const fetchCustomersList = async () => {
    try {
      const res = await apiClient.get('/users/customers');
      if (res.data && res.data.customers) {
        const mapped = res.data.customers.map(c => ({
          _id: c._id,
          id: c.email || c._id,
          name: c.fullName || c.name || 'Customer',
          fullName: c.fullName || c.name || 'Customer',
          email: c.email,
          phone: c.phone || c.mobile || '',
          mobile: c.mobile || c.phone || '',
          city: c.city || '',
          segment: c.segment || 'Regular Customer',
          totalSpent: c.totalSpent !== undefined ? c.totalSpent : 0,
          loyaltyPoints: c.loyaltyPoints !== undefined ? c.loyaltyPoints : 0,
          vehicles: c.vehicles || [],
          rawVehicles: c.rawVehicles || [],
          membership: c.membership || null,
          lastVisit: c.lastVisit || null,
          role: c.role,
          createdAt: c.createdAt
        }));
        setCustomers(mapped);
      }
    } catch (err) {
      console.warn('Could not fetch customers list:', err.message);
    }
  };

  const fetchServicesList = async () => {
    try {
      const res = await serviceApi.getServices();
      if (res && res.services) {
        setServices(res.services);
        setMemberships(deriveMembershipsFromBookings(bookingsRef.current, res.services));
      }
    } catch (err) {
      console.warn('Could not fetch services list:', err.message);
    }
  };

  useEffect(() => {
    fetchBookingsList();
    fetchStaffList();
    fetchCustomersList();
    fetchServicesList();

    // Poll for live booking updates from staff every 5 seconds
    const interval = setInterval(fetchBookingsList, 5000);
    const handleLiveBooking = () => fetchBookingsList();

    // Listen for live service/package updates from any admin hub
    const handleServiceUpdated = (e) => {
      const updated = e?.detail;
      if (updated) {
        setServices(prev => {
          const list = Array.isArray(prev) ? prev : [];
          const idx = list.findIndex(s => (s._id && updated._id && s._id === updated._id) || (s.slug && updated.slug && s.slug === updated.slug));
          if (idx >= 0) {
            const next = [...list];
            next[idx] = { ...next[idx], ...updated };
            return next;
          }
          return [...list, updated];
        });
      }
      setMemberships(deriveMembershipsFromBookings(bookingsRef.current));
    };

    const handleStorageChange = (e) => {
      handleLiveBooking();
      if (!e || !e.key || e.key.startsWith('tsl_')) {
        setMemberships(deriveMembershipsFromBookings(bookingsRef.current));
      }
    };

    const handleExternalWashOrSale = (e) => {
      const record = e?.detail;
      if (record && !record.deleted) {
        setBookings(prev => {
          const key = record.id || record.bookingId;
          if (prev.some(b => (b.id === key || b.bookingId === key))) return prev;
          const next = [record, ...prev];
          setMemberships(deriveMembershipsFromBookings(next));
          return next;
        });
      } else {
        handleLiveBooking();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('tsl_booking_created', handleLiveBooking);
    window.addEventListener('salonDataChanged', handleLiveBooking);
    window.addEventListener('bookingAdded', handleLiveBooking);
    window.addEventListener('tsl_service_updated', handleServiceUpdated);
    window.addEventListener('tsl_wash_logged', handleExternalWashOrSale);
    window.addEventListener('tsl_wash_used', handleExternalWashOrSale);
    window.addEventListener('tsl_offline_sales_updated', handleExternalWashOrSale);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('tsl_booking_created', handleLiveBooking);
      window.removeEventListener('salonDataChanged', handleLiveBooking);
      window.removeEventListener('bookingAdded', handleLiveBooking);
      window.removeEventListener('tsl_service_updated', handleServiceUpdated);
      window.removeEventListener('tsl_wash_logged', handleExternalWashOrSale);
      window.removeEventListener('tsl_wash_used', handleExternalWashOrSale);
      window.removeEventListener('tsl_offline_sales_updated', handleExternalWashOrSale);
    };
  }, []);

  // Compute dynamic stats based on database records
  useEffect(() => {
    const pending = bookings.filter(b => b.status === 'Pending' || b.status === 'Confirmed' || b.status === 'In Progress').length;
    const lowStock = inventory.filter(i => {
      const qty = parseInt(i.quantity) || 0;
      const min = parseInt(i.minStock) || 5;
      return qty <= min;
    }).length;

    // Calculate dynamic revenue stats
    const totalRev = bookings.reduce((sum, b) => b.status === 'Completed' ? sum + b.total : sum, 0);

    setStats(prev => ({
      ...prev,
      pendingBookings: pending,
      lowStockItems: lowStock,
      totalRevenue: totalRev,
      activeCustomers: customers.length,
      activeStaff: staffList.filter(s => s.isActive).length
    }));
  }, [bookings, inventory, customers, staffList]);

  // --- CRUD ACTIONS ---

  // 1. Services & Plans
  const toggleServiceStatus = async (id) => {
    setServices(prev => prev.map(s => (s.id === id || s.key === id || s._id === id) ? { ...s, status: s.status === 'active' ? 'inactive' : 'active' } : s));
    showToast('Service status updated');

    try {
      const res = await serviceApi.getServices();
      if (res.success && res.services) {
        const target = res.services.find(s => s._id === id || s.slug === id || s.serviceName.toLowerCase().includes(String(id).toLowerCase()));
        if (target) {
          await serviceApi.toggleServiceStatus(target._id);
        }
      }
    } catch (err) {
      console.warn('API sync status error:', err.message);
    }
  };

  const updateServicePrice = async (id, newPrice) => {
    const numPrice = Number(newPrice);
    setServices(prev => prev.map(s => (s.id === id || s.key === id || s._id === id) ? { ...s, price: numPrice } : s));
    showToast('Service price updated successfully');

    try {
      const res = await serviceApi.getServices();
      if (res.success && res.services) {
        const target = res.services.find(s => s._id === id || s.slug === id || s.serviceName.toLowerCase().includes(String(id).toLowerCase()));
        if (target && target.pricing && target.pricing.length > 0) {
          const updatedPricing = target.pricing.map((p, idx) => idx === 0 ? { ...p, price: numPrice } : p);
          await serviceApi.updateService(target._id, { pricing: updatedPricing });
        }
      }
    } catch (err) {
      console.warn('API sync price error:', err.message);
    }
  };

  const addServicePlan = async (serviceId, newPlan) => {
    try {
      const res = await serviceApi.getServices();
      if (res.success && res.services) {
        const target = res.services.find(s => s._id === serviceId || s.slug === serviceId || s.key === serviceId || s.serviceName.toLowerCase().includes(String(serviceId).toLowerCase()));
        if (target) {
          await serviceApi.addPlan(target._id, {
            name: newPlan.name,
            price: Number(newPlan.price),
            description: newPlan.description || '',
            duration: newPlan.duration || '30 mins',
            features: newPlan.features || [],
            recommended: newPlan.recommended || false,
            // Extended fields
            section: newPlan.section || 'Main Menu',
            weight: newPlan.weight || '',
            subcat: newPlan.subcat || '',
            image: newPlan.image || ''
          });
          showToast('New sub-service plan added!');
          await fetchServicesList();
        }
      }
    } catch (err) {
      console.warn('API sync add plan error:', err.message);
      showToast('Error adding item', 'error');
    }
  };

  const deleteServicePlan = async (serviceId, planId) => {
    try {
      const res = await serviceApi.getServices();
      if (res.success && res.services) {
        const target = res.services.find(s => s._id === serviceId || s.slug === serviceId || s.key === serviceId || s.serviceName.toLowerCase().includes(String(serviceId).toLowerCase()));
        if (target) {
          await serviceApi.deletePlan(target._id, planId);
          showToast('Plan removed', 'error');
          await fetchServicesList();
        }
      }
    } catch (err) {
      console.warn('API sync delete plan error:', err.message);
      showToast('Error removing item', 'error');
    }
  };

  const updateServicePlan = async (serviceId, planId, updatedPlan) => {
    try {
      const res = await serviceApi.getServices();
      if (res.success && res.services) {
        const target = res.services.find(s => s._id === serviceId || s.slug === serviceId || s.key === serviceId || s.serviceName.toLowerCase().includes(String(serviceId).toLowerCase()));
        if (target) {
          await serviceApi.updatePlan(target._id, planId, {
            name: updatedPlan.name,
            price: Number(updatedPlan.price),
            description: updatedPlan.description || '',
            duration: updatedPlan.duration || '30 mins',
            features: updatedPlan.features || [],
            recommended: updatedPlan.recommended || false,
            section: updatedPlan.section || 'Main Menu',
            weight: updatedPlan.weight || '',
            subcat: updatedPlan.subcat || '',
            image: updatedPlan.image || ''
          });
          showToast('Sub-service plan updated successfully!');
          await fetchServicesList();
        }
      }
    } catch (err) {
      console.warn('API sync update plan error:', err.message);
      showToast('Error updating item', 'error');
    }
  };

  const addServiceSection = async (serviceId, newSection) => {
    try {
      const res = await serviceApi.getServices();
      if (res.success && res.services) {
        const target = res.services.find(s => s._id === serviceId || s.slug === serviceId || s.key === serviceId || s.serviceName.toLowerCase().includes(String(serviceId).toLowerCase()));
        if (target) {
          await apiClient.post(`/services/${target._id}/sections`, {
            title: newSection.title,
            subtitle: newSection.subtitle || '',
            description: newSection.description || '',
            bgColor: newSection.bgColor || 'linear-gradient(135deg, #F5A623 0%, #D48806 100%)',
            image: newSection.image || ''
          });
          showToast('New menu section added!');
          await fetchServicesList();
        }
      }
    } catch (err) {
      console.warn('API sync add section error:', err.message);
      showToast('Error adding section', 'error');
    }
  };

  const deleteServiceSection = async (serviceId, sectionId) => {
    try {
      const res = await serviceApi.getServices();
      if (res.success && res.services) {
        const target = res.services.find(s => s._id === serviceId || s.slug === serviceId || s.key === serviceId || s.serviceName.toLowerCase().includes(String(serviceId).toLowerCase()));
        if (target) {
          await apiClient.delete(`/services/${target._id}/sections/${sectionId}`);
          showToast('Menu section removed', 'error');
          await fetchServicesList();
        }
      }
    } catch (err) {
      console.warn('API sync delete section error:', err.message);
      showToast('Error removing section', 'error');
    }
  };

  // 2. Banners
  const addBanner = (newBanner) => {
    setBanners(prev => [
      ...prev,
      { id: `ban-${Date.now()}`, ...newBanner, status: 'active', order: prev.length + 1 }
    ]);
    showToast('Promotional banner added successfully!');
  };

  const toggleBannerStatus = (id) => {
    setBanners(prev => prev.map(b => b.id === id ? { ...b, status: b.status === 'active' ? 'inactive' : 'active' } : b));
    showToast('Banner visibility toggled');
  };

  const updateBanner = (id, updatedFields) => {
    setBanners(prev => prev.map(b => b.id === id ? { ...b, ...updatedFields } : b));
    showToast('Promotional banner updated successfully!');
  };

  const deleteBanner = (id) => {
    setBanners(prev => prev.filter(b => b.id !== id));
    showToast('Banner deleted', 'error');
  };

  // 3. Notifications
  const composeNotification = (newNotif) => {
    setNotifications(prev => [
      {
        id: `NOTIF-${Date.now().toString().slice(-4)}`,
        ...newNotif,
        sentAt: newNotif.scheduleLater ? `Scheduled (${newNotif.scheduledDate})` : 'Just now',
        readRate: newNotif.scheduleLater ? '0%' : '100%',
        status: newNotif.scheduleLater ? 'Scheduled' : 'Sent'
      },
      ...prev
    ]);
    showToast(newNotif.scheduleLater ? 'Notification scheduled successfully!' : 'Broadcast notification sent!');
  };

  // 4. Memberships
  const updateMembershipStatus = (id, newStatus) => {
    setMemberships(prev => prev.map(m => m.id === id ? { ...m, status: newStatus } : m));
    showToast(`Membership status changed to ${newStatus}`);
  };

  const renewMembership = (id) => {
    let renewedFrom = null;
    let renewedTo = null;

    setMemberships(prev => prev.map(m => {
      if (m.id !== id) return m;

      // Renewing a pass that is still running extends it from its expiry date,
      // so the customer keeps the days already paid for.
      const now = new Date();
      const currentExpiry = parseFlexibleDate(m.expiryDate);
      const start = currentExpiry && currentExpiry > now ? currentExpiry : startOfDay(now);
      const expiry = addPassDuration(start, m.planName);

      renewedFrom = formatLongDate(start);
      renewedTo = formatLongDate(expiry);

      return {
        ...m,
        status: start > now ? 'Queued' : 'Active',
        statusLabel: start > now ? 'Upgraded (Scheduled)' : 'Active',
        isQueued: start > now,
        washesUsed: 0,
        startDate: toISODateString(start),
        expiryDate: toISODateString(expiry),
        startDateLabel: renewedFrom,
        expiryDateLabel: renewedTo
      };
    }));

    showToast(renewedFrom ? `Membership renewed: ${renewedFrom} – ${renewedTo}` : 'Membership renewed!');
  };

  // 5. Bookings
  const updateBookingStatus = async (id, newStatus) => {
    // 1. Optimistically update local state
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));
    showToast(`Booking ${id} status updated to ${newStatus}`);

    // 2. Call PUT /bookings/:id in the backend
    try {
      const match = bookings.find(b => b.id === id);
      if (match && match._id) {
        await apiClient.put(`/bookings/${match._id}`, { status: newStatus });
        fetchBookingsList();
      }
    } catch (err) {
      console.warn('Error updating booking status in backend:', err.message);
    }
  };

  const assignStaffToBooking = async (id, staffName) => {
    // Find the staff user object from the staffList to get their ID
    const staffUser = staffList.find(s => s.fullName === staffName || s.name === staffName || s.employeeId === staffName);
    const staffId = staffUser?.id || staffUser?._id || null;

    // 1. Optimistically update local state
    setBookings(prev => prev.map(b => b.id === id ? { ...b, staffAssigned: staffName, assignedStaffId: staffId } : b));
    showToast(`Assigned ${staffName} to booking ${id}`);

    // 2. Call PUT /bookings/:id in the backend
    try {
      const match = bookings.find(b => b.id === id);
      if (match && match._id) {
        await apiClient.put(`/bookings/${match._id}`, { 
          assignedStaffId: staffId, 
          assignedStaffName: staffName 
        });
        fetchBookingsList();
      }
    } catch (err) {
      console.warn('Error assigning staff in backend:', err.message);
    }
  };

  const addBooking = async (bookingData) => {
    const newId = `B-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const gstVal = Number((bookingData.amount * 0.18).toFixed(2));
    const totalVal = Number((bookingData.amount + gstVal).toFixed(2));
    
    // Save to backend DB
    try {
      const payload = {
        bookingId: newId,
        serviceKey: bookingData.serviceKey || 'car-wash',
        serviceName: bookingData.serviceName || 'Car Wash',
        packageName: bookingData.plan || 'Executive Wash',
        price: totalVal,
        date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        timeSlot: bookingData.timeSlot || `${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })} - ${new Date(Date.now() + 30*60000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`,
        customerName: bookingData.customerName,
        customerEmail: bookingData.customerEmail || 'customer@example.com',
        vehicleNo: bookingData.vehicleNo || 'MH-01-AB-1234',
        vehicleType: bookingData.vehicleType || 'SUV'
      };

      await apiClient.post('/bookings', payload);
      fetchBookingsList();
      showToast(`New booking ${newId} created!`);
    } catch (err) {
      console.warn('Error creating booking in backend, using local fallback:', err.message);
      // Fallback local update
      setBookings(prev => [
        {
          id: newId,
          ...bookingData,
          serviceKey: bookingData.serviceKey || 'car-wash',
          serviceName: bookingData.serviceName || 'Car Wash',
          gst: gstVal,
          total: totalVal,
          status: 'Pending',
          date: new Date().toISOString().split('T')[0],
          createdAt: new Date().toISOString(),
          bookedAt: new Date().toISOString()
        },
        ...prev
      ]);
      showToast(`New booking ${newId} created (local fallback)!`);
    }
  };

  // 5b. Offline Sales (manual counter POS)
  const addOfflineSale = async (formData) => {
    const newId = `OFS-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date();
    const saleDateObj = formData.saleDate ? new Date(formData.saleDate + 'T12:00:00') : now;
    const dateStr = !isNaN(saleDateObj.getTime())
      ? saleDateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      : now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const timeStart = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const timeEnd = new Date(now.getTime() + 30 * 60000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    // Compute membership expiry if applicable
    let membershipExpiry = '';
    let membershipValidity = '';
    if (formData.saleType === 'membership') {
      const baseDate = !isNaN(saleDateObj.getTime()) ? saleDateObj : now;
      const days = formData.validityDays === 'custom'
        ? Math.ceil((new Date(formData.customExpiryDate) - baseDate) / (1000 * 60 * 60 * 24))
        : Number(formData.validityDays) || 30;
      const expiryDate = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);
      membershipExpiry = expiryDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      membershipValidity = `${days} Days`;
    }

    const bookingPayload = {
      bookingId: newId,
      serviceKey: formData.serviceKey || 'car-wash',
      serviceName: formData.serviceName || 'Car Wash',
      packageName: formData.saleType === 'membership' ? formData.membershipName : formData.packageName,
      price: Number(formData.price) || 0,
      date: dateStr,
      saleDate: formData.saleDate || now.toISOString().split('T')[0],
      timeSlot: `${timeStart} - ${timeEnd}`,
      customerName: formData.customerName,
      customerEmail: (formData.customerEmail || '').toLowerCase().trim(),
      vehicleNo: (formData.vehicleNo || '').toUpperCase().trim(),
      vehicleType: formData.vehicleModel || '',
      phone: formData.phone || '',
      status: 'Completed',
      isOfflineSale: true,
      saleType: formData.saleType,
      vehicleModel: formData.vehicleModel || '',
      membershipName: formData.saleType === 'membership' ? formData.membershipName : '',
      membershipValidity,
      membershipExpiry,
      paymentMode: formData.paymentMode || 'Cash',
      notes: formData.notes || ''
    };

    // Try saving to backend
    try {
      await apiClient.post('/bookings', bookingPayload);
      fetchBookingsList();
    } catch (err) {
      console.warn('Offline sale backend save error, using local fallback:', err.message);
    }

    // Always update local state and localStorage cache
    const localRecord = {
      id: newId,
      ...bookingPayload,
      createdAt: now.toISOString(),
      bookedAt: now.toISOString()
    };

    try {
      const cached = JSON.parse(localStorage.getItem('tsl_offline_sales') || '[]');
      localStorage.setItem('tsl_offline_sales', JSON.stringify([localRecord, ...cached]));
    } catch (e) {}

    setBookings(prev => {
      const next = [localRecord, ...prev];
      setMemberships(deriveMembershipsFromBookings(next));
      return next;
    });

    try {
      window.dispatchEvent(new CustomEvent('tsl_offline_sales_updated', { detail: localRecord }));
      window.dispatchEvent(new CustomEvent('tsl_wash_logged', { detail: localRecord }));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {}

    showToast(`✅ Offline sale ${newId} recorded successfully!`);
    return localRecord;
  };

  const deleteOfflineSale = async (saleId) => {
    try {
      await apiClient.delete(`/bookings/${saleId}`);
    } catch (e) {
      console.warn('Backend delete offline sale error:', e.message);
    }

    setBookings(prev => {
      const next = prev.filter(b => b.id !== saleId && b.bookingId !== saleId && b._id !== saleId);
      setMemberships(deriveMembershipsFromBookings(next));
      return next;
    });

    try {
      const cached = JSON.parse(localStorage.getItem('tsl_offline_sales') || '[]');
      const filtered = cached.filter(s => s.id !== saleId && s.bookingId !== saleId && s._id !== saleId);
      localStorage.setItem('tsl_offline_sales', JSON.stringify(filtered));
    } catch (e) {}

    try {
      window.dispatchEvent(new CustomEvent('tsl_offline_sales_updated', { detail: { id: saleId, deleted: true } }));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {}

    showToast('Offline sale removed');
  };

  // 5c. Log Completed Wash under Membership (re-calculates washesUsed in real time)
  const logMembershipWash = async ({
    vehicleNo,
    customerName,
    customerEmail,
    phone,
    vehicleModel,
    membershipName,
    serviceKey = 'car-wash'
  }) => {
    const newId = `WASH-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const timeStart = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const timeEnd = new Date(now.getTime() + 30 * 60000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    const bookingPayload = {
      bookingId: newId,
      serviceKey: serviceKey || 'car-wash',
      serviceName: 'Car Wash',
      packageName: 'Express Wash (Redeemed)',
      plan: 'Express Wash (Redeemed)',
      price: 0,
      date: dateStr,
      saleDate: now.toISOString().split('T')[0],
      timeSlot: `${timeStart} - ${timeEnd}`,
      customerName: customerName || 'Valued Customer',
      customerEmail: (customerEmail || '').toLowerCase().trim(),
      vehicleNo: (vehicleNo || '').toUpperCase().trim(),
      vehicleType: vehicleModel || 'Car',
      vehicleModel: vehicleModel || 'Car',
      phone: phone || '',
      status: 'Completed',
      isOfflineSale: true,
      saleType: 'service',
      paymentMode: 'Membership',
      notes: `Wash completed and redeemed under active membership: ${membershipName || 'Pass'}`
    };

    // Try saving to backend
    try {
      await apiClient.post('/bookings', bookingPayload);
      fetchBookingsList();
    } catch (err) {
      console.warn('Backend save error for membership wash, using local fallback:', err.message);
    }

    const localRecord = {
      id: newId,
      ...bookingPayload,
      createdAt: now.toISOString(),
      bookedAt: now.toISOString()
    };

    try {
      const cached = JSON.parse(localStorage.getItem('tsl_offline_sales') || '[]');
      localStorage.setItem('tsl_offline_sales', JSON.stringify([localRecord, ...cached]));
    } catch (e) {}

    setBookings(prev => {
      const next = [localRecord, ...prev];
      setMemberships(deriveMembershipsFromBookings(next));
      return next;
    });

    try {
      window.dispatchEvent(new CustomEvent('tsl_wash_logged', { detail: localRecord }));
      window.dispatchEvent(new CustomEvent('tsl_wash_used', { detail: localRecord }));
      window.dispatchEvent(new CustomEvent('tsl_offline_sales_updated', { detail: localRecord }));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {}

    showToast(`🚿 Wash logged for ${bookingPayload.vehicleNo || 'vehicle'}! Membership updated.`);
    return localRecord;
  };

  // 6. Staff
  const addStaff = (newStaff) => {
    setStaffList(prev => [
      ...prev,
      {
        // Prefer the real Mongo _id returned by the backend; only fall back to a
        // synthetic placeholder id if the caller didn't have one (e.g. offline path).
        id: newStaff._id || newStaff.id || `STF-${(prev.length + 1).toString().padStart(2, '0')}`,
        ...newStaff,
        status: 'Active',
        joinedDate: new Date().toISOString().split('T')[0],
        avatar: newStaff.avatar || newStaff.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
      }
    ]);
    showToast('New staff member added!');
  };

  const updateStaff = (id, updatedFields) => {
    setStaffList(prev => prev.map(s => {
      if (s.id === id || s._id === id || (s.email && updatedFields.email && s.email.toLowerCase() === updatedFields.email.toLowerCase())) {
        return { ...s, ...updatedFields };
      }
      return s;
    }));
    showToast('Staff member details updated!');
  };

  const deleteStaff = (id, email) => {
    setStaffList(prev => prev.filter(s => s.id !== id && s._id !== id && (!email || s.email?.toLowerCase() !== email.toLowerCase())));
    showToast('Staff member deleted', 'error');
  };

  const toggleStaffStatus = (id) => {
    setStaffList(prev => prev.map(s => s.id === id ? { ...s, status: s.status === 'Active' ? 'Inactive' : 'Active' } : s));
    showToast('Staff status updated');
  };

  // 7. Customers
  const addCustomer = (customerData) => {
    setCustomers(prev => [
      {
        id: `CUST-${(prev.length + 1).toString().padStart(3, '0')}`,
        ...customerData,
        segment: 'New Customer',
        totalSpent: 0,
        loyaltyPoints: 100,
        lastVisit: 'Just now',
        totalBookings: 0
      },
      ...prev
    ]);
    showToast('Customer profile registered');
  };

  // 8. Inventory
  const addInventoryItem = (item) => {
    setInventory(prev => [
      ...prev,
      {
        id: `INV-${Date.now().toString().slice(-3)}`,
        ...item,
        status: item.currentStock <= item.minStock ? 'Low Stock' : 'In Stock'
      }
    ]);
    showToast('Product added to inventory');
  };

  const updateStock = (id, changeQty) => {
    setInventory(prev => prev.map(item => {
      if (item.id === id) {
        const updatedQty = Math.max(0, item.currentStock + changeQty);
        return {
          ...item,
          currentStock: updatedQty,
          status: updatedQty <= item.minStock ? 'Low Stock' : 'In Stock'
        };
      }
      return item;
    }));
    showToast('Stock level updated');
  };

  // 9. Coupons
  const addCoupon = (coupon) => {
    setCoupons(prev => [
      ...prev,
      {
        id: `CPN-${(prev.length + 1).toString().padStart(2, '0')}`,
        ...coupon,
        usedCount: 0,
        status: 'Active'
      }
    ]);
    showToast(`Promo code ${coupon.code} created!`);
  };

  const toggleCouponStatus = (id) => {
    setCoupons(prev => prev.map(c => c.id === id ? { ...c, status: c.status === 'Active' ? 'Expired' : 'Active' } : c));
    showToast('Coupon status updated');
  };

  // 10. Settings Update
  const updateSettings = (newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    showToast('Business & Tax settings saved!');
  };

  // 11. Customer CRM & Membership Anti-Misuse Actions
  const updateCustomerMembership = async (customerId, data) => {
    try {
      const target = customers.find(c => c._id === customerId || c.id === customerId);
      const targetId = target ? (target._id || target.id) : customerId;
      await apiClient.put(`/users/customers/${targetId}/membership`, data);
      await fetchCustomersList();
      showToast('Customer membership status updated');
    } catch (err) {
      console.warn('Error updating customer membership:', err.message);
      setCustomers(prev => prev.map(c => {
        if (c._id === customerId || c.id === customerId) {
          const updatedMembership = { ...(c.membership || {}), ...data };
          let newSegment = c.segment;
          if (data.status === 'Suspended') newSegment = 'Suspended Member';
          else if (data.status === 'Active') newSegment = 'Active Member';
          return { ...c, membership: updatedMembership, segment: newSegment };
        }
        return c;
      }));
      showToast('Customer membership updated');
    }
  };

  const updateCustomerUsageRules = async (customerId, rules) => {
    try {
      const target = customers.find(c => c._id === customerId || c.id === customerId);
      const targetId = target ? (target._id || target.id) : customerId;
      await apiClient.put(`/users/customers/${targetId}/usage-rules`, rules);
      await fetchCustomersList();
      showToast('Membership usage & anti-misuse rules saved');
    } catch (err) {
      console.warn('Error updating usage rules:', err.message);
      setCustomers(prev => prev.map(c => {
        if (c._id === customerId || c.id === customerId) {
          return {
            ...c,
            membership: { ...(c.membership || {}), ...rules }
          };
        }
        return c;
      }));
      showToast('Usage rules saved');
    }
  };

  const addCustomerVehicle = async (customerId, vehicleData) => {
    try {
      const target = customers.find(c => c._id === customerId || c.id === customerId);
      const targetId = target ? (target._id || target.id) : customerId;
      await apiClient.post(`/users/customers/${targetId}/vehicles`, vehicleData);
      await fetchCustomersList();
      showToast('Vehicle added to customer profile');
    } catch (err) {
      console.warn('Error adding vehicle:', err.message);
      const formatted = `${vehicleData.plateNumber} (${vehicleData.model || 'Vehicle'})`;
      setCustomers(prev => prev.map(c => {
        if (c._id === customerId || c.id === customerId) {
          return {
            ...c,
            vehicles: [...(c.vehicles || []), formatted]
          };
        }
        return c;
      }));
      showToast('Vehicle registered');
    }
  };

  return (
    <AdminContext.Provider value={{
      stats,
      revenueTrendData,
      serviceRevenueData,
      paymentModeData,
      services,
      banners,
      memberships,
      staffList,
      bookings,
      customers,
      inventory,
      coupons,
      notifications,
      settings,
      toast,
      showToast,
      // Actions
      toggleServiceStatus,
      updateServicePrice,
      addServicePlan,
      updateServicePlan,
      deleteServicePlan,
      addServiceSection,
      deleteServiceSection,
      addBanner,
      toggleBannerStatus,
      updateBanner,
      deleteBanner,
      composeNotification,
      updateMembershipStatus,
      renewMembership,
      updateBookingStatus,
      assignStaffToBooking,
      addBooking,
      addOfflineSale,
      deleteOfflineSale,
      logMembershipWash,
      addStaff,
      updateStaff,
      deleteStaff,
      toggleStaffStatus,
      addCustomer,
      updateCustomerMembership,
      updateCustomerUsageRules,
      addCustomerVehicle,
      addInventoryItem,
      updateStock,
      addCoupon,
      toggleCouponStatus,
      updateSettings
    }}>
      {children}
      {/* Toast Render */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          backgroundColor: toast.type === 'error' ? '#ef4444' : '#e07b2a',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '10px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          zIndex: 9999,
          fontWeight: 600,
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>{toast.type === 'error' ? '⚠️' : '✓'}</span>
          <span>{toast.message}</span>
        </div>
      )}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => useContext(AdminContext);
