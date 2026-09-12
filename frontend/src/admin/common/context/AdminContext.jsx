import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import serviceApi from '../../../common/services/serviceApi';
import apiClient from '../../../common/utils/apiClient';
import {
  initialDashboardStats,
  initialServices,
  initialBanners,
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
  toISODateString,
  normalizeMembershipId
} from '../../../common/utils/membershipUtils';
import { readAllScoped } from '../../../common/utils/userScopedStorage';
import { defaultCalculationSettings } from '../utils/calculationUtils';

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
  const [memberships, setMemberships] = useState(() => {
    try {
      const saved = localStorage.getItem('tsl_admin_memberships');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const seen = new Set();
          const clean = [];
          for (const m of parsed) {
            if (!m || String(m.id || '').startsWith('MEM-100')) continue;
            const norm = normalizeMembershipId(m.id || m.bookingId || m.rawBookingId);
            if (norm) {
              if (seen.has(norm)) continue;
              seen.add(norm);
            }
            clean.push(m);
          }
          return clean;
        }
      }
    } catch (e) {}
    return [];
  });

  useEffect(() => {
    try {
      const seen = new Set();
      const clean = [];
      for (const m of memberships) {
        if (!m || String(m.id || '').startsWith('MEM-100')) continue;
        const norm = normalizeMembershipId(m.id || m.bookingId || m.rawBookingId);
        if (norm) {
          if (seen.has(norm)) continue;
          seen.add(norm);
        }
        clean.push(m);
      }
      localStorage.setItem('tsl_admin_memberships', JSON.stringify(clean));
      window.dispatchEvent(new CustomEvent('tsl_admin_memberships_updated', { detail: clean }));
    } catch (e) {
      console.warn('Could not save memberships to localStorage:', e);
    }
  }, [memberships]);
  const [staffList, setStaffList] = useState(() => {
    try {
      const saved = localStorage.getItem('tsl_admin_staff_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(s => !String(s.id || '').startsWith('STF-0'));
        }
      }
    } catch (e) {}
    return [];
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
        return cachedOffline.filter(b =>
          b &&
          b.id !== 'OFS-MTJX5GRW-3986' &&
          b.bookingId !== 'OFS-MTJX5GRW-3986' &&
          !String(b.id || '').startsWith('BK-90') &&
          !String(b.id || '').startsWith('B-2026-88') &&
          !String(b.id || '').startsWith('BK-SAL-') &&
          !String(b.id || '').startsWith('BK-70') &&
          !String(b.id || '').startsWith('BK-80')
        );
      }
    } catch (e) {}
    return [];
  });
  const [customers, setCustomers] = useState([]);
  const [inventory, setInventory] = useState(() => {
    try {
      const saved = localStorage.getItem('tsl_admin_inventory');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(i =>
            i &&
            !String(i.id || '').startsWith('INV-10') &&
            !String(i.id || '').startsWith('INV-20') &&
            !String(i.id || '').startsWith('INV-30') &&
            !String(i.id || '').startsWith('INV-40') &&
            !String(i.id || '').startsWith('INV-50') &&
            !String(i.id || '').startsWith('INV-60') &&
            !String(i.id || '').startsWith('INV-0')
          );
        }
      }
    } catch (e) {}
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('tsl_admin_inventory', JSON.stringify(inventory));
    } catch (e) {
      console.warn('Could not save inventory to localStorage:', e);
    }
  }, [inventory]);

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

  // Request deduplication & stale-time cache refs
  const inFlightRequestsRef = useRef({});
  const lastFetchedRef = useRef({});

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

  // Financial Calculation Rules & CA Settings State
  const [calculationSettings, setCalculationSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('tsl_calculation_settings');
      if (saved) return { ...defaultCalculationSettings, ...JSON.parse(saved) };
    } catch (e) {
      console.warn('Error reading calculation settings:', e);
    }
    return defaultCalculationSettings;
  });

  const updateCalculationSettings = (newSettings) => {
    setCalculationSettings(prev => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem('tsl_calculation_settings', JSON.stringify(updated));
      } catch (e) {}
      window.dispatchEvent(new CustomEvent('tsl_calculation_settings_updated', { detail: updated }));
      return updated;
    });
    showToast('Financial calculation rules & CA settings saved successfully!');
  };

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
    const knownIds = new Set();
    membershipBookings.forEach(b => {
      [b.bookingId, b.id, b._id].filter(Boolean).forEach(id => {
        const norm = normalizeMembershipId(id);
        if (norm) knownIds.add(norm);
      });
    });

    const localPasses = [];
    const addLocalPass = (pass) => {
      if (!pass || (!pass.packageName && !pass.planName && !pass.plan)) return;
      const passId = pass.bookingId || pass.id || pass.passId || pass._id;
      const normPassId = normalizeMembershipId(passId);
      if (normPassId && knownIds.has(normPassId)) return;
      if (normPassId) knownIds.add(normPassId);
      const pkg = pass.packageName || pass.planName || pass.plan;
      const passPrice = Number(pass.amount !== undefined && pass.amount !== null ? pass.amount : (pass.price !== undefined && pass.price !== null ? pass.price : (pass.total || 0)));
      localPasses.push({
        id: passId,
        bookingId: passId,
        customerName: pass.customerName || 'Valued Passholder',
        customerEmail: pass.customerEmail || pass.email || '',
        phone: pass.phone || pass.mobile || '',
        vehicleNo: pass.vehicleNo || '',
        vehicleType: pass.vehicleModel || pass.vehicleType || 'Car',
        serviceKey: pass.serviceKey || 'car-wash',
        serviceName: pass.serviceName || 'Car Wash',
        plan: pkg,
        packageName: pkg,
        price: passPrice,
        amount: passPrice,
        total: passPrice,
        date: pass.date,
        purchasedAt: pass.purchasedAt || pass.date
      });
    };

    // Local passes are stored per customer, so sweep every scope in this browser.
    readAllScoped('tsl_membership_passes').forEach(({ value }) => {
      if (Array.isArray(value)) value.forEach(addLocalPass);
    });
    readAllScoped('tsl_active_membership').forEach(({ value }) => addLocalPass(value));

    // Offline sales from localStorage (if not yet in backend bookings)
    try {
      const offline = JSON.parse(localStorage.getItem('tsl_offline_sales') || '[]');
      if (Array.isArray(offline)) {
        offline.filter(s => s.saleType === 'membership' || isMembershipPackage(s.packageName || s.planName || s.plan || '')).forEach(addLocalPass);
      }
    } catch (e) {}

    // Note: Do NOT re-ingest tsl_admin_memberships here because it is a cached output of this exact function,
    // which caused single memberships to re-add and duplicate into artificial stacked passes.

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

      // Calculate washes used by matching vehicle plate or customer contact
      const washesUsed = bookingList.filter(b => {
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
        if (passPlate && washPlate) {
          // If membership is registered to a plate, matching plate is authoritative
          isMatch = washPlate === passPlate;
        } else if (passEmail && washEmail) {
          isMatch = washEmail === passEmail;
        } else if (passPhone && washPhone) {
          isMatch = washPhone === passPhone;
        }

        if (!isMatch) return false;

        const washedOn = parseFlexibleDate(b.date || b.createdAt || b.bookedAt);
        if (!washedOn) return true;
        // Count washes on or after purchase date up to expiry
        const effectiveStart = record.startDate <= new Date() ? record.startDate : (record.purchaseDate || record.startDate);
        return washedOn >= effectiveStart && washedOn <= record.expiryDate;
      }).length;

      let status = record.status;
      if (record.isActive && record.expiryDate <= soonCutoff) status = 'Expiring Soon';

      const rawId = record.bookingId || '';
      return {
        id: rawId
          ? (rawId.startsWith('MEM-') ? rawId : `MEM-${rawId.replace('B-2026-', '')}`)
          : (record._id ? `MEM-${String(record._id).slice(-6)}` : `MEM-${idx + 1}`),
        bookingId: record.bookingId || record.id || record._id || rawId,
        rawBookingId: rawId,
        customerName: record.customerName || 'Valued Member',
        phone: record.phone || record.mobile || '',
        email: record.customerEmail || '',
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
        amount: Number(record.amount !== undefined && record.amount !== null ? record.amount : (record.price || 2499)),
        price: Number(record.price !== undefined && record.price !== null ? record.price : (record.amount || 2499))
      };
    });

    // Deduplicate derived passes to ensure no duplicate twin rows with matching ID ever display
    const seenDerived = new Set();
    const uniqueDerived = [];
    for (const d of derived) {
      const norm = normalizeMembershipId(d.id || d.bookingId || d.rawBookingId);
      if (norm) {
        if (seenDerived.has(norm)) continue;
        seenDerived.add(norm);
      }
      uniqueDerived.push(d);
    }

    // Newest purchases first (no mock data appended)
    uniqueDerived.reverse();
    return uniqueDerived;
  };

  const fetchBookingsList = async (force = false) => {
    const now = Date.now();
    if (!force && lastFetchedRef.current.bookings && now - lastFetchedRef.current.bookings < 15000) {
      return;
    }
    if (inFlightRequestsRef.current.bookings) {
      return inFlightRequestsRef.current.bookings;
    }

    const fetchPromise = (async () => {
      try {
        let mapped = [];
        const res = await apiClient.get('/bookings');
        lastFetchedRef.current.bookings = Date.now();
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

          // Bi-directional sync of genuine offline sales between backend and localStorage
          const backendOfflineSales = mapped.filter(b =>
            !b.isDeleted &&
            b.id !== 'OFS-MTJX5GRW-3986' &&
            b.bookingId !== 'OFS-MTJX5GRW-3986' &&
            !String(b.bookingId || b.id || '').startsWith('WASH-') &&
            !String(b.bookingId || b.id || '').startsWith('BK-90') &&
            !String(b.bookingId || b.id || '').startsWith('B-2026-88') &&
            !String(b.bookingId || b.id || '').startsWith('BK-SAL-') &&
            !String(b.bookingId || b.id || '').startsWith('BK-70') &&
            !String(b.bookingId || b.id || '').startsWith('BK-80') &&
            (
              (b.bookingId && String(b.bookingId).startsWith('OFS-')) ||
              (b.isOfflineSale && !String(b.bookingId || b.id || '').startsWith('WASH-'))
            )
          );
          try {
            const rawCached = JSON.parse(localStorage.getItem('tsl_offline_sales') || '[]');
            const cachedOffline = Array.isArray(rawCached) ? rawCached.filter(s =>
              s &&
              s.id !== 'OFS-MTJX5GRW-3986' &&
              s.bookingId !== 'OFS-MTJX5GRW-3986' &&
              !String(s.id || s.bookingId || '').startsWith('WASH-') &&
              !String(s.id || s.bookingId || '').startsWith('BK-90') &&
              !String(s.id || s.bookingId || '').startsWith('B-2026-88') &&
              !String(s.id || s.bookingId || '').startsWith('BK-SAL-') &&
              !String(s.id || s.bookingId || '').startsWith('BK-70') &&
              !String(s.id || s.bookingId || '').startsWith('BK-80')
            ) : [];

            const combinedOfflineMap = new Map();
            // Include backend offline sales
            backendOfflineSales.forEach(s => combinedOfflineMap.set(s.id || s.bookingId, s));
            // Include locally cached offline sales if not already from backend, and auto-sync them to MongoDB
            cachedOffline.forEach(s => {
              const key = s.id || s.bookingId;
              if (!combinedOfflineMap.has(key)) {
                combinedOfflineMap.set(key, s);
                // Auto-sync missing offline sale to MongoDB
                apiClient.post('/bookings', {
                  bookingId: s.bookingId || s.id,
                  serviceKey: s.serviceKey || 'car-wash',
                  serviceName: s.serviceName || (s.serviceKey === 'car-detailing' ? 'Car Detailing' : 'Car Wash'),
                  packageName: s.packageName || s.membershipName || 'Standard Service',
                  price: Number(s.price || s.total || s.amount || 0),
                  date: s.date || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
                  saleDate: s.saleDate || s.date,
                  timeSlot: s.timeSlot || '09:00 AM - 09:30 AM',
                  customerName: s.customerName || 'Valued Customer',
                  customerEmail: s.customerEmail || '',
                  phone: s.phone || '',
                  vehicleNo: s.vehicleNo || '',
                  vehicleType: s.vehicleModel || s.vehicleType || '',
                  vehicleModel: s.vehicleModel || s.vehicleType || '',
                  status: 'Completed',
                  isOfflineSale: true,
                  saleType: s.saleType || (s.membershipName ? 'membership' : 'service'),
                  membershipName: s.membershipName || '',
                  membershipValidity: s.membershipValidity || '',
                  membershipExpiry: s.membershipExpiry || '',
                  paymentMode: s.paymentMode || 'Cash',
                  notes: s.notes || ''
                }).catch(() => {});
              }
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

          // Rely EXCLUSIVELY on live database bookings + genuine offline sales (no mock salon bookings or fake fallbacks)
          const cleanBookings = mapped.filter(b =>
            b &&
            !String(b.id || b.bookingId || '').startsWith('BK-90') &&
            !String(b.id || b.bookingId || '').startsWith('B-2026-88') &&
            !String(b.id || b.bookingId || '').startsWith('BK-SAL-') &&
            !String(b.id || b.bookingId || '').startsWith('BK-70') &&
            !String(b.id || b.bookingId || '').startsWith('BK-80') &&
            b.id !== 'OFS-MTJX5GRW-3986' &&
            b.bookingId !== 'OFS-MTJX5GRW-3986'
          );

          setBookings(cleanBookings);
          setMemberships(deriveMembershipsFromBookings(cleanBookings));
        } else {
          setBookings([]);
          setMemberships(deriveMembershipsFromBookings([]));
        }
      } catch (err) {
        console.warn('Could not fetch bookings list, preserving local offline sales:', err.message);
        try {
          const cachedOffline = JSON.parse(localStorage.getItem('tsl_offline_sales') || '[]');
          if (Array.isArray(cachedOffline) && cachedOffline.length > 0) {
            const cleanOffline = cachedOffline.filter(b =>
              b &&
              b.id !== 'OFS-MTJX5GRW-3986' &&
              b.bookingId !== 'OFS-MTJX5GRW-3986' &&
              !String(b.id || b.bookingId || '').startsWith('BK-90') &&
              !String(b.id || b.bookingId || '').startsWith('B-2026-88') &&
              !String(b.id || b.bookingId || '').startsWith('BK-SAL-') &&
              !String(b.id || b.bookingId || '').startsWith('BK-70') &&
              !String(b.id || b.bookingId || '').startsWith('BK-80')
            );
            setBookings(cleanOffline);
            setMemberships(deriveMembershipsFromBookings(cleanOffline));
            return;
          }
        } catch (e) {}
        setBookings([]);
        setMemberships([]);
      } finally {
        delete inFlightRequestsRef.current.bookings;
      }
    })();

    inFlightRequestsRef.current.bookings = fetchPromise;
    return fetchPromise;
  };


  const fetchStaffList = async (force = false) => {
    const now = Date.now();
    if (!force && lastFetchedRef.current.staff && now - lastFetchedRef.current.staff < 60000) {
      return;
    }
    if (inFlightRequestsRef.current.staff) {
      return inFlightRequestsRef.current.staff;
    }

    const fetchPromise = (async () => {
      try {
        const res = await apiClient.get('/users/staff');
        lastFetchedRef.current.staff = Date.now();
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
      } finally {
        delete inFlightRequestsRef.current.staff;
      }
    })();

    inFlightRequestsRef.current.staff = fetchPromise;
    return fetchPromise;
  };

  // Derives enriched customers combining backend CRM accounts, live bookings & offline sales
  const deriveCustomers = (baseCustomers = [], bookingList = [], offlineSalesList = []) => {
    const customerMap = new Map();

    const normalizeKey = (email, phone, name) => {
      const e = (email || '').toLowerCase().trim();
      if (e) return `email:${e}`;
      const p = String(phone || '').replace(/\D/g, '').slice(-10);
      if (p) return `phone:${p}`;
      const n = (name || '').toLowerCase().trim();
      return n ? `name:${n}` : '';
    };

    // 1. Seed base customers
    (baseCustomers || []).forEach(c => {
      if (!c) return;
      const key = normalizeKey(c.email, c.phone || c.mobile, c.name || c.fullName);
      if (key) {
        customerMap.set(key, {
          ...c,
          vehicles: Array.isArray(c.vehicles) ? [...c.vehicles] : [],
          rawVehicles: Array.isArray(c.rawVehicles) ? [...c.rawVehicles] : []
        });
      }
    });

    // 2. Aggregate offline sales and bookings
    const allTransactions = [...(bookingList || []), ...(offlineSalesList || [])];

    // Local membership cache for segment verification
    let adminMems = [];
    try {
      adminMems = JSON.parse(localStorage.getItem('tsl_admin_memberships') || '[]');
    } catch (e) {}

    allTransactions.forEach(t => {
      if (!t) return;
      const tName = (t.customerName || t.fullName || t.name || '').trim();
      const tEmail = (t.customerEmail || t.email || '').toLowerCase().trim();
      const tPhone = String(t.phone || t.mobile || '').trim();
      const tPlate = (t.vehicleNo || t.vehiclePlate || '').toUpperCase().trim();
      const tModel = t.vehicleType || t.vehicleModel || 'Car';
      const tPrice = Number(t.price !== undefined ? t.price : (t.amount !== undefined ? t.amount : (t.total || 0))) || 0;
      const tDate = t.date || (t.createdAt ? new Date(t.createdAt).toISOString().split('T')[0] : '');

      const isMem = t.saleType === 'membership' || 
        isMembershipPackage(t.packageName || t.plan || t.planName || t.membershipName);

      const key = normalizeKey(tEmail, tPhone, tName);
      if (!key) return;

      if (customerMap.has(key)) {
        const existing = customerMap.get(key);

        // Update vehicle list
        if (tPlate) {
          const cleanPlate = tPlate.replace(/[^A-Z0-9]/g, '');
          const hasPlate = existing.vehicles.some(v => v.replace(/[^A-Z0-9]/g, '').includes(cleanPlate));
          if (!hasPlate) {
            existing.vehicles.push(`${tPlate}${tModel ? ` (${tModel})` : ''}`);
            existing.rawVehicles.push({ plateNumber: tPlate, model: tModel });
          }
        }

        // Add to total lifetime spent for offline transactions
        if (t.isOfflineSale) {
          existing.totalSpent = Math.max(Number(existing.totalSpent) || 0, tPrice);
          existing.loyaltyPoints = Math.max(existing.loyaltyPoints || 0, Math.floor(existing.totalSpent / 100));
        }

        if (isMem) {
          existing.segment = 'Active Member';
          if (!existing.membership || !existing.membership.planName) {
            existing.membership = {
              planName: t.membershipName || t.packageName || 'Monthly Membership',
              status: 'Active',
              startDate: tDate || new Date().toISOString(),
              expiryDate: t.membershipExpiry || t.validUntil || ''
            };
          }
        }

        if (tDate) {
          existing.lastVisit = tDate;
        }
      } else {
        // Create new customer record for this offline sale / booking customer
        const vehList = tPlate ? [`${tPlate}${tModel ? ` (${tModel})` : ''}`] : [];
        const rawVehList = tPlate ? [{ plateNumber: tPlate, model: tModel }] : [];

        customerMap.set(key, {
          _id: t.id || t.bookingId || `CUST-OFS-${Date.now()}`,
          id: tEmail || tPhone || t.id || `CUST-${Date.now()}`,
          name: tName || 'Valued Customer',
          fullName: tName || 'Valued Customer',
          email: tEmail,
          phone: tPhone,
          mobile: tPhone,
          city: t.location || 'Mumbai',
          segment: isMem ? 'Active Member' : 'Offline Customer',
          totalSpent: tPrice,
          loyaltyPoints: Math.floor(tPrice / 100),
          vehicles: vehList,
          rawVehicles: rawVehList,
          membership: isMem ? {
            planName: t.membershipName || t.packageName || 'Monthly Membership',
            status: 'Active',
            startDate: tDate || new Date().toISOString(),
            expiryDate: t.membershipExpiry || t.validUntil || ''
          } : null,
          lastVisit: tDate || new Date().toISOString().split('T')[0],
          role: 'user',
          createdAt: tDate || new Date().toISOString()
        });
      }
    });

    // Cross-reference any active memberships in Admin Panel -> Memberships
    adminMems.forEach(m => {
      if (!m) return;
      const key = normalizeKey(m.customerEmail || m.email, m.phone || m.mobile, m.customerName || m.name);
      if (key && customerMap.has(key)) {
        const c = customerMap.get(key);
        c.segment = 'Active Member';
        if (!c.membership) {
          c.membership = {
            planName: m.planName || m.packageName || 'Monthly Membership',
            status: 'Active',
            startDate: m.startDate || m.date,
            expiryDate: m.expiryDate || m.validUntil
          };
        }
      }
    });

    return Array.from(customerMap.values());
  };

  const fetchCustomersList = async (force = false) => {
    const now = Date.now();
    if (!force && lastFetchedRef.current.customers && now - lastFetchedRef.current.customers < 30000) {
      return;
    }
    if (inFlightRequestsRef.current.customers) {
      return inFlightRequestsRef.current.customers;
    }

    const fetchPromise = (async () => {
      try {
        const res = await apiClient.get('/users/customers');
        lastFetchedRef.current.customers = Date.now();
        let base = [];
        if (res.data && Array.isArray(res.data.customers)) {
          base = res.data.customers.map(c => ({
            _id: c._id,
            id: c.email || c.phone || c._id,
            name: c.fullName || c.name || 'Customer',
            fullName: c.fullName || c.name || 'Customer',
            email: c.email,
            phone: c.phone || c.mobile || '',
            mobile: c.mobile || c.phone || '',
            city: c.city || '',
            segment: c.segment || 'Regular Customer',
            totalSpent: Number(c.totalSpent) || 0,
            loyaltyPoints: c.loyaltyPoints !== undefined ? c.loyaltyPoints : Math.floor((Number(c.totalSpent) || 0) / 100),
            vehicles: Array.isArray(c.vehicles) ? c.vehicles : [],
            rawVehicles: Array.isArray(c.rawVehicles) ? c.rawVehicles : [],
            membership: c.membership || null,
            lastVisit: c.lastVisit || null,
            role: c.role,
            createdAt: c.createdAt
          }));
        } else {
          base = [];
        }

        let offline = [];
        try {
          offline = JSON.parse(localStorage.getItem('tsl_offline_sales') || '[]');
        } catch (e) {}

        const merged = deriveCustomers(base, bookingsRef.current || [], offline);
        setCustomers(merged);
      } catch (err) {
        console.warn('Could not fetch customers list:', err.message);
        let offline = [];
        try {
          offline = JSON.parse(localStorage.getItem('tsl_offline_sales') || '[]');
        } catch (e) {}
        setCustomers(prev => deriveCustomers(prev || [], bookingsRef.current || [], offline));
      } finally {
        delete inFlightRequestsRef.current.customers;
      }
    })();

    inFlightRequestsRef.current.customers = fetchPromise;
    return fetchPromise;
  };


  const fetchServicesList = async (force = false) => {
    const now = Date.now();
    if (!force && lastFetchedRef.current.services && now - lastFetchedRef.current.services < 60000) {
      return;
    }
    if (inFlightRequestsRef.current.services) {
      return inFlightRequestsRef.current.services;
    }

    const fetchPromise = (async () => {
      try {
        const res = await serviceApi.getServices();
        lastFetchedRef.current.services = Date.now();
        if (res && res.services) {
          setServices(res.services);
          setMemberships(deriveMembershipsFromBookings(bookingsRef.current, res.services));
        }
      } catch (err) {
        console.warn('Could not fetch services list:', err.message);
      } finally {
        delete inFlightRequestsRef.current.services;
      }
    })();

    inFlightRequestsRef.current.services = fetchPromise;
    return fetchPromise;
  };

  useEffect(() => {
    // Initial single on-demand fetch on mount (Zero background polling loops)
    fetchBookingsList();
    fetchStaffList();
    fetchCustomersList();
    fetchServicesList();

    const handleLiveBooking = () => fetchBookingsList(true);

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
        setCustomers(prev => deriveCustomers(prev, [record], [record]));
      }
    };

    window.addEventListener('tsl_booking_created', handleLiveBooking);
    window.addEventListener('salonDataChanged', handleLiveBooking);
    window.addEventListener('bookingAdded', handleLiveBooking);
    window.addEventListener('tsl_service_updated', handleServiceUpdated);
    window.addEventListener('tsl_wash_logged', handleExternalWashOrSale);
    window.addEventListener('tsl_wash_used', handleExternalWashOrSale);
    window.addEventListener('tsl_offline_sales_updated', handleExternalWashOrSale);
    window.addEventListener('tsl_admin_memberships_updated', handleExternalWashOrSale);

    return () => {
      window.removeEventListener('tsl_booking_created', handleLiveBooking);
      window.removeEventListener('salonDataChanged', handleLiveBooking);
      window.removeEventListener('bookingAdded', handleLiveBooking);
      window.removeEventListener('tsl_service_updated', handleServiceUpdated);
      window.removeEventListener('tsl_wash_logged', handleExternalWashOrSale);
      window.removeEventListener('tsl_wash_used', handleExternalWashOrSale);
      window.removeEventListener('tsl_offline_sales_updated', handleExternalWashOrSale);
      window.removeEventListener('tsl_admin_memberships_updated', handleExternalWashOrSale);
    };
  }, []);

  // Clean up any stale mock keys in localStorage on initial boot
  useEffect(() => {
    try {
      // 1. Remove obsolete mock bookings storage
      const oldB = localStorage.getItem('tsl_admin_bookings');
      if (oldB) {
        localStorage.removeItem('tsl_admin_bookings');
      }

      // 2. Clean offline sales of any fake or test bookings
      const rawOffline = localStorage.getItem('tsl_offline_sales');
      if (rawOffline) {
        try {
          const parsed = JSON.parse(rawOffline);
          if (Array.isArray(parsed)) {
            const cleanOffline = parsed.filter(b =>
              b &&
              b.id !== 'OFS-MTJX5GRW-3986' &&
              b.bookingId !== 'OFS-MTJX5GRW-3986' &&
              !String(b.id || b.bookingId || '').startsWith('BK-90') &&
              !String(b.id || b.bookingId || '').startsWith('B-2026-88') &&
              !String(b.id || b.bookingId || '').startsWith('BK-SAL-') &&
              !String(b.id || b.bookingId || '').startsWith('BK-70') &&
              !String(b.id || b.bookingId || '').startsWith('BK-80')
            );
            if (cleanOffline.length !== parsed.length) {
              localStorage.setItem('tsl_offline_sales', JSON.stringify(cleanOffline));
            }
          }
        } catch (e) {}
      }

      // 3. Clean mock inventory
      const oldInv = localStorage.getItem('tsl_admin_inventory');
      if (oldInv && (oldInv.includes('INV-10') || oldInv.includes('INV-20') || oldInv.includes('INV-0') || oldInv.includes('INV-30') || oldInv.includes('INV-40') || oldInv.includes('INV-50') || oldInv.includes('INV-60'))) {
        try {
          const parsed = JSON.parse(oldInv);
          if (Array.isArray(parsed)) {
            const cleanInv = parsed.filter(i =>
              i &&
              !String(i.id || '').startsWith('INV-10') &&
              !String(i.id || '').startsWith('INV-20') &&
              !String(i.id || '').startsWith('INV-30') &&
              !String(i.id || '').startsWith('INV-40') &&
              !String(i.id || '').startsWith('INV-50') &&
              !String(i.id || '').startsWith('INV-60') &&
              !String(i.id || '').startsWith('INV-0')
            );
            localStorage.setItem('tsl_admin_inventory', JSON.stringify(cleanInv));
          }
        } catch (e) {
          localStorage.removeItem('tsl_admin_inventory');
        }
      }

      // 4. Clean mock staff
      const oldStaff = localStorage.getItem('tsl_admin_staff_list');
      if (oldStaff && oldStaff.includes('STF-0')) {
        localStorage.removeItem('tsl_admin_staff_list');
      }

      // 5. Clean mock customers
      const oldCust = localStorage.getItem('tsl_admin_customers');
      if (oldCust && oldCust.includes('CUST-0')) {
        localStorage.removeItem('tsl_admin_customers');
      }

      // 6. Clean mock memberships
      const oldMem = localStorage.getItem('tsl_admin_memberships');
      if (oldMem && oldMem.includes('MEM-100')) {
        try {
          const parsed = JSON.parse(oldMem);
          if (Array.isArray(parsed)) {
            const cleanMem = parsed.filter(m => m && !String(m.id || '').startsWith('MEM-100'));
            localStorage.setItem('tsl_admin_memberships', JSON.stringify(cleanMem));
          }
        } catch (e) {
          localStorage.removeItem('tsl_admin_memberships');
        }
      }

      // 7. Clean mock car detailing bookings
      const oldDet = localStorage.getItem('shine_car_detailing_bookings');
      if (oldDet) {
        try {
          const parsed = JSON.parse(oldDet);
          if (Array.isArray(parsed)) {
            const cleanDet = parsed.filter(b => {
              if (!b) return false;
              const bId = (b.id || '').toString().toUpperCase();
              if (['BK-9831', 'BK-8271', 'BK-5421', 'BK-9001', 'BK-9002'].includes(bId)) return false;
              const plate = (b.vehicleNo || b.vehiclePlate || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
              if (['MP09AB1234', 'MP09CD5678', 'MP09EF9012'].includes(plate)) return false;
              return true;
            });
            if (cleanDet.length !== parsed.length) {
              localStorage.setItem('shine_car_detailing_bookings', JSON.stringify(cleanDet));
            }
          }
        } catch (e) {
          localStorage.removeItem('shine_car_detailing_bookings');
        }
      }
    } catch (e) {}
  }, []);

  // Compute dynamic stats based on live database records
  useEffect(() => {
    const pending = (bookings || []).filter(b => b.status === 'Pending' || b.status === 'Confirmed' || b.status === 'In Progress').length;
    const lowStock = (inventory || []).filter(i => {
      const qty = parseInt(i.currentStock ?? i.quantity) || 0;
      const min = parseInt(i.minStock) || 5;
      return qty <= min;
    }).length;

    // Calculate dynamic revenue stats from real paid or completed bookings
    const totalRev = (bookings || []).reduce((sum, b) => {
      const isPaid = b.status === 'Completed' || b.paymentStatus === 'Completed' || b.isOfflineSale;
      const amt = Number(b.total ?? b.price ?? b.amount ?? 0);
      return isPaid ? sum + amt : sum;
    }, 0);

    const todayStr = new Date().toISOString().split('T')[0];
    const todaySales = (bookings || []).reduce((sum, b) => {
      const raw = b.date || b.createdAt || b.bookedAt || '';
      const matchesToday = typeof raw === 'string' && raw.startsWith(todayStr);
      const isPaid = b.status === 'Completed' || b.paymentStatus === 'Completed' || b.isOfflineSale;
      const amt = Number(b.total ?? b.price ?? b.amount ?? 0);
      return (matchesToday && isPaid) ? sum + amt : sum;
    }, 0);

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const monthlySales = (bookings || []).reduce((sum, b) => {
      const raw = b.date || b.createdAt || b.bookedAt || '';
      const d = new Date(raw);
      const isCurrentMonth = !isNaN(d.getTime()) && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      const isPaid = b.status === 'Completed' || b.paymentStatus === 'Completed' || b.isOfflineSale;
      const amt = Number(b.total ?? b.price ?? b.amount ?? 0);
      return (isCurrentMonth && isPaid) ? sum + amt : sum;
    }, 0);

    const activeMembersCount = (memberships || []).filter(m => m.status === 'active' || m.status === 'Active').length;

    setStats({
      totalRevenue: totalRev,
      revenueGrowth: 0,
      todaySales,
      todayGrowth: 0,
      monthlySales,
      monthlyGrowth: 0,
      annualSales: totalRev,
      annualGrowth: 0,
      activeMembers: activeMembersCount,
      totalCustomers: (customers || []).length,
      activeCustomers: (customers || []).length,
      pendingBookings: pending,
      lowStockItems: lowStock,
      activeStaff: (staffList || []).filter(s => s.isActive !== false).length
    });
  }, [bookings, inventory, customers, staffList, memberships]);

  // Dynamic 12-Month Revenue Trend calculated from real bookings
  const dynamicRevenueTrendData = React.useMemo(() => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    const map = {};
    monthNames.forEach(m => {
      map[m] = { month: m, revenue: 0, bookings: 0 };
    });

    (bookings || []).forEach(b => {
      const rawDate = b.date || b.createdAt || b.bookedAt;
      if (!rawDate) return;
      const d = new Date(rawDate);
      if (isNaN(d.getTime())) return;
      if (d.getFullYear() === currentYear) {
        const mName = monthNames[d.getMonth()];
        if (map[mName]) {
          const amt = Number(b.total ?? b.price ?? b.amount ?? 0);
          map[mName].revenue += amt;
          map[mName].bookings += 1;
        }
      }
    });

    return Object.values(map);
  }, [bookings]);

  // Dynamic Service-wise Revenue Distribution
  const dynamicServiceRevenueData = React.useMemo(() => {
    const colorMap = {
      'car-wash': '#e07b2a',
      'car-detailing': '#1e4a7e',
      'cafe': '#f59e0b',
      'drive-through-cafe': '#3b82f6',
      'dog-wash': '#10b981',
      'salon': '#8b5cf6'
    };
    const titleMap = {
      'car-wash': 'Car Wash',
      'car-detailing': 'Car Detailing',
      'cafe': 'Café',
      'drive-through-cafe': 'Drive-Through Café',
      'dog-wash': 'Dog Bath',
      'salon': "Men's Salon"
    };

    const map = {};
    (bookings || []).forEach(b => {
      const key = b.serviceKey || 'car-wash';
      const amt = Number(b.total ?? b.price ?? b.amount ?? 0);
      if (!map[key]) {
        map[key] = {
          name: titleMap[key] || b.service || key,
          value: 0,
          color: colorMap[key] || '#6366f1'
        };
      }
      map[key].value += amt;
    });

    const activeList = Object.values(map).filter(item => item.value > 0);
    return activeList.length > 0 ? activeList : [
      { name: 'Car Wash', value: 0, color: '#e07b2a' },
      { name: 'Car Detailing', value: 0, color: '#1e4a7e' }
    ];
  }, [bookings]);

  // Dynamic Payment Mode Distribution
  const dynamicPaymentModeData = React.useMemo(() => {
    const map = {};
    (bookings || []).forEach(b => {
      const mode = b.paymentMode || 'Cash';
      const amt = Number(b.total ?? b.price ?? b.amount ?? 0);
      if (!map[mode]) {
        map[mode] = { mode, amount: 0, count: 0 };
      }
      map[mode].amount += amt;
      map[mode].count += 1;
    });

    const result = Object.values(map);
    return result.length > 0 ? result : [
      { mode: 'UPI', amount: 0, count: 0 },
      { mode: 'Cash', amount: 0, count: 0 }
    ];
  }, [bookings]);


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

  const deleteMembership = async (membershipIdOrObj) => {
    const mem = typeof membershipIdOrObj === 'object' ? membershipIdOrObj : { id: membershipIdOrObj };
    const rawId = String(mem.id || '');
    const bookingId = String(mem.bookingId || mem.rawBookingId || '');
    const cleanId = rawId.replace(/^MEM-/, '');

    const candidateIds = Array.from(new Set([rawId, bookingId, cleanId, mem._id].filter(Boolean)));

    // 1. Delete from backend if booking exists
    for (const idToDel of candidateIds) {
      try {
        await apiClient.delete(`/bookings/${idToDel}`);
      } catch (_) {}
    }

    // 2. Remove from bookings state and derive memberships
    setBookings(prev => {
      const nextBookings = prev.filter(b => {
        const bId = String(b.bookingId || b.id || b._id || '');
        return !candidateIds.includes(bId);
      });
      return nextBookings;
    });

    // 3. Remove from offline sales in localStorage
    try {
      const offline = JSON.parse(localStorage.getItem('tsl_offline_sales') || '[]');
      if (Array.isArray(offline)) {
        const filtered = offline.filter(s => {
          const sId = String(s.id || s.bookingId || s._id || '');
          return !candidateIds.includes(sId);
        });
        localStorage.setItem('tsl_offline_sales', JSON.stringify(filtered));
      }
    } catch (_) {}

    // 4. Remove from admin memberships in localStorage
    try {
      const adminMems = JSON.parse(localStorage.getItem('tsl_admin_memberships') || '[]');
      if (Array.isArray(adminMems)) {
        const filtered = adminMems.filter(m => {
          const mId = String(m.id || m.bookingId || '');
          return !candidateIds.includes(mId);
        });
        localStorage.setItem('tsl_admin_memberships', JSON.stringify(filtered));
      }
    } catch (_) {}

    // 5. Remove from scoped passes in localStorage
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.includes('tsl_membership_passes')) {
          try {
            const val = JSON.parse(localStorage.getItem(key) || '[]');
            if (Array.isArray(val)) {
              const filtered = val.filter(p => !candidateIds.includes(String(p.id || p.bookingId || p.passId || '')));
              localStorage.setItem(key, JSON.stringify(filtered));
            }
          } catch (_) {}
        }
        if (key.includes('tsl_active_membership')) {
          try {
            const val = JSON.parse(localStorage.getItem(key) || 'null');
            if (val && candidateIds.includes(String(val.id || val.bookingId || val.passId || ''))) {
              localStorage.removeItem(key);
            }
          } catch (_) {}
        }
      });
    } catch (_) {}

    // 6. Update memberships state directly
    setMemberships(prev => {
      return prev.filter(m => {
        const mId = String(m.id || '');
        const mBId = String(m.bookingId || '');
        return !candidateIds.includes(mId) && !candidateIds.includes(mBId);
      });
    });

    // 7. Dispatch events so all tabs and components re-sync
    try {
      window.dispatchEvent(new CustomEvent('tsl_admin_memberships_updated', { detail: { id: rawId, deleted: true } }));
      window.dispatchEvent(new CustomEvent('tsl_offline_sales_updated', { detail: { id: rawId, deleted: true } }));
      window.dispatchEvent(new Event('storage'));
    } catch (_) {}

    showToast('Membership deleted successfully');
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
        vehicleNo: bookingData.vehicleNo || '',
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

    const cleanPrice = Number(String(formData.price || 0).replace(/[^0-9.]/g, '')) || 0;
    const pName = formData.saleType === 'membership'
      ? (formData.membershipName || 'Monthly Membership')
      : (formData.packageName || 'Standard Service');

    const bookingPayload = {
      bookingId: newId,
      serviceKey: formData.serviceKey || 'car-wash',
      serviceName: formData.serviceName || (formData.serviceKey === 'car-detailing' ? 'Car Detailing' : 'Car Wash'),
      packageName: pName,
      price: cleanPrice,
      date: dateStr,
      saleDate: formData.saleDate || now.toISOString().split('T')[0],
      timeSlot: `${timeStart} - ${timeEnd}`,
      customerName: formData.customerName || 'Valued Customer',
      customerEmail: (formData.customerEmail || '').toLowerCase().trim(),
      vehicleNo: (formData.vehicleNo || '').toUpperCase().trim(),
      vehicleType: formData.vehicleModel || formData.vehicleType || '',
      phone: formData.phone || '',
      status: 'Completed',
      isOfflineSale: true,
      saleType: formData.saleType || (formData.membershipName ? 'membership' : 'service'),
      vehicleModel: formData.vehicleModel || '',
      membershipName: formData.saleType === 'membership' ? (formData.membershipName || pName) : '',
      membershipValidity,
      membershipExpiry,
      paymentMode: formData.paymentMode || 'Cash',
      notes: formData.notes || ''
    };

    // Persist invoice directly to MongoDB
    let savedRecord = null;
    try {
      const res = await apiClient.post('/bookings', bookingPayload);
      if (res && res.data && res.data.booking) {
        savedRecord = {
          ...res.data.booking,
          id: res.data.booking.bookingId || res.data.booking._id
        };
      }
      fetchBookingsList();
    } catch (err) {
      console.error('Offline sale MongoDB save error:', err.response?.data || err.message);
    }

    const finalRecord = savedRecord || {
      id: newId,
      ...bookingPayload,
      createdAt: now.toISOString(),
      bookedAt: now.toISOString()
    };

    try {
      const cached = JSON.parse(localStorage.getItem('tsl_offline_sales') || '[]');
      const filtered = cached.filter(s => s && (s.id !== finalRecord.id && s.bookingId !== finalRecord.bookingId));
      localStorage.setItem('tsl_offline_sales', JSON.stringify([finalRecord, ...filtered]));
    } catch (e) {}

    setBookings(prev => {
      const filtered = prev.filter(b => b && (b.id !== finalRecord.id && b.bookingId !== finalRecord.bookingId));
      const next = [finalRecord, ...filtered];
      setMemberships(deriveMembershipsFromBookings(next));
      return next;
    });

    setCustomers(prev => deriveCustomers(prev, [finalRecord], [finalRecord]));

    try {
      window.dispatchEvent(new CustomEvent('tsl_offline_sales_updated', { detail: finalRecord }));
      window.dispatchEvent(new CustomEvent('tsl_customer_updated', { detail: finalRecord }));
      window.dispatchEvent(new CustomEvent('tsl_wash_logged', { detail: finalRecord }));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {}

    showToast(`✅ Offline sale ${newId} recorded successfully!`);
    return finalRecord;
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

  const clearAllOfflineSales = async () => {
    try {
      localStorage.removeItem('tsl_offline_sales');
      // Delete any offline sale bookings from backend
      try {
        const res = await apiClient.get('/bookings');
        if (res.data?.success && Array.isArray(res.data?.bookings)) {
          const ofsList = res.data.bookings.filter(b =>
            !String(b.bookingId || b.id || '').startsWith('WASH-') &&
            ((b.bookingId && String(b.bookingId).startsWith('OFS-')) ||
             (b.id && String(b.id).startsWith('OFS-')) ||
             (b.isOfflineSale && !String(b.bookingId || b.id || '').startsWith('WASH-')))
          );
          for (const s of ofsList) {
            try {
              await apiClient.delete(`/bookings/${s._id || s.id || s.bookingId}`);
            } catch (_) {}
          }
        }
      } catch (err) {
        console.warn('Backend clear offline sales error:', err.message);
      }

      setBookings(prev => {
        const next = prev.filter(b =>
          !String(b.bookingId || b.id || '').startsWith('OFS-') &&
          !(b.isOfflineSale && !String(b.bookingId || b.id || '').startsWith('WASH-'))
        );
        setMemberships(deriveMembershipsFromBookings(next));
        return next;
      });

      window.dispatchEvent(new CustomEvent('tsl_offline_sales_updated', { detail: { cleared: true } }));
      window.dispatchEvent(new Event('storage'));
      showToast('All offline sales cleared');
    } catch (e) {
      console.error('Failed to clear offline sales:', e);
    }
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
      isOfflineSale: false,
      saleType: 'redemption',
      paymentMode: 'Membership',
      notes: `Wash completed and redeemed under active membership: ${membershipName || 'Pass'}`
    };

    let savedRecord = null;
    // Save to backend database
    try {
      const res = await apiClient.post('/bookings', bookingPayload);
      if (res.data && res.data.booking) {
        savedRecord = res.data.booking;
      }
      await fetchBookingsList();
    } catch (err) {
      console.warn('Backend save error for membership wash, using local fallback:', err.message);
    }

    const localRecord = savedRecord ? {
      id: savedRecord.bookingId || savedRecord._id,
      _id: savedRecord._id,
      ...savedRecord,
      createdAt: savedRecord.createdAt || now.toISOString(),
      bookedAt: savedRecord.createdAt || now.toISOString()
    } : {
      id: newId,
      _id: newId,
      ...bookingPayload,
      createdAt: now.toISOString(),
      bookedAt: now.toISOString()
    };

    setBookings(prev => {
      const exists = prev.some(b => b.bookingId === localRecord.bookingId || b.id === localRecord.id);
      const next = exists ? prev : [localRecord, ...prev];
      setMemberships(deriveMembershipsFromBookings(next));
      return next;
    });

    setCustomers(prev => deriveCustomers(prev, [localRecord], []));

    try {
      window.dispatchEvent(new CustomEvent('tsl_wash_logged', { detail: localRecord }));
      window.dispatchEvent(new CustomEvent('tsl_wash_used', { detail: localRecord }));
      window.dispatchEvent(new CustomEvent('tsl_customer_updated', { detail: localRecord }));
      window.dispatchEvent(new CustomEvent('tsl_offline_sales_updated', { detail: localRecord }));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {}

    showToast(`🚿 Wash logged for ${bookingPayload.vehicleNo || 'vehicle'}! Membership updated.`);
    return localRecord;
  };

  // 6. Staff
  const addStaff = (newStaff) => {
    if (!newStaff) return;
    const cleanStaff = {
      id: newStaff._id || newStaff.id || newStaff.email || `STF-${Date.now()}`,
      _id: newStaff._id || newStaff.id,
      name: newStaff.fullName || newStaff.name || 'Staff Member',
      fullName: newStaff.fullName || newStaff.name || 'Staff Member',
      email: newStaff.email || '',
      mobile: newStaff.mobile || newStaff.phone || '',
      department: newStaff.department || 'Car Wash',
      staffRole: newStaff.staffRole || newStaff.role || 'Specialist',
      serviceKey: newStaff.serviceKey || 'car-wash',
      salary: newStaff.salary || '',
      leaveBalance: newStaff.leaveBalance !== undefined ? newStaff.leaveBalance : 12,
      photo: newStaff.photo || newStaff.avatar || newStaff.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      avatar: newStaff.avatar || newStaff.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      permissions: Array.isArray(newStaff.permissions) ? newStaff.permissions : ['bookings', 'orders'],
      status: newStaff.status || (newStaff.isActive !== false ? 'Active' : 'Inactive'),
      isActive: newStaff.isActive !== false,
      joinedDate: newStaff.joinedDate || new Date().toISOString().split('T')[0]
    };

    setStaffList(prev => {
      const email = cleanStaff.email?.toLowerCase();
      const filtered = prev.filter(s => {
        if (cleanStaff._id && s._id === cleanStaff._id) return false;
        if (email && s.email?.toLowerCase() === email) return false;
        return true;
      });
      return [cleanStaff, ...filtered];
    });

    try {
      window.dispatchEvent(new CustomEvent('tsl_staff_updated', { detail: cleanStaff }));
    } catch (e) {}

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

  const deleteCustomerVehicle = async (customerId, plateNumber) => {
    const rawPlate = String(plateNumber || '').trim();
    if (!rawPlate) return;
    const cleanPlate = rawPlate.toUpperCase().replace(/[^A-Z0-9]/g, '');

    // 1. Persist immediately to localStorage deregistered plates list
    try {
      const existingDereg = JSON.parse(localStorage.getItem('tsl_deregistered_plates') || '[]');
      if (!existingDereg.includes(cleanPlate)) {
        existingDereg.push(cleanPlate);
        localStorage.setItem('tsl_deregistered_plates', JSON.stringify(existingDereg));
      }
    } catch (e) {}

    // 2. Call backend API
    try {
      const target = customers.find(c => c._id === customerId || c.id === customerId);
      const targetId = target ? (target._id || target.id) : (customerId || 'any');
      await apiClient.delete(`/users/vehicles/deregister/${cleanPlate}`, {
        data: { customerId: targetId, plateNumber: cleanPlate }
      });
      showToast(`Vehicle ${rawPlate} removed from fleet and records`);
    } catch (err) {
      console.warn('Backend deregister warning:', err.message);
      showToast(`Vehicle ${rawPlate} removed from fleet`);
    }

    // 3. Immediately update in-memory state
    setCustomers(prev => prev.map(c => {
      const filteredVehicles = (c.vehicles || []).filter(v => {
        const vClean = String(v || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
        return !vClean.includes(cleanPlate);
      });
      const filteredRaw = (c.rawVehicles || []).filter(v => {
        const p = typeof v === 'string' ? v : (v.plateNumber || v.plate || v.vehicleNo || '');
        return String(p || '').toUpperCase().replace(/[^A-Z0-9]/g, '') !== cleanPlate;
      });
      return {
        ...c,
        vehicles: filteredVehicles,
        rawVehicles: filteredRaw
      };
    }));

    setBookings(prev => prev.map(b => {
      const bPlate = String(b.vehicleNo || b.vehiclePlate || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (bPlate === cleanPlate) {
        return { ...b, vehicleDeregistered: true };
      }
      return b;
    }));

    setMemberships(prev => prev.map(m => {
      const mPlate = String(m.vehicleNo || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (mPlate === cleanPlate) {
        return { ...m, vehicleNo: '' };
      }
      return m;
    }));

    try {
      const offline = JSON.parse(localStorage.getItem('tsl_offline_sales') || '[]');
      if (Array.isArray(offline)) {
        const updatedOffline = offline.map(s => {
          const sPlate = String(s.vehicleNo || s.vehiclePlate || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
          if (sPlate === cleanPlate) {
            return { ...s, vehicleDeregistered: true };
          }
          return s;
        });
        localStorage.setItem('tsl_offline_sales', JSON.stringify(updatedOffline));
      }
    } catch (e) {}

    window.dispatchEvent(new CustomEvent('tsl_vehicle_updated', { detail: { plate: cleanPlate } }));
  };

  return (
    <AdminContext.Provider value={{
      stats,
      revenueTrendData: dynamicRevenueTrendData,
      serviceRevenueData: dynamicServiceRevenueData,
      paymentModeData: dynamicPaymentModeData,
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
      calculationSettings,
      updateCalculationSettings,
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
      deleteMembership,
      updateBookingStatus,
      assignStaffToBooking,
      addBooking,
      addOfflineSale,
      deleteOfflineSale,
      clearAllOfflineSales,
      logMembershipWash,
      addStaff,
      updateStaff,
      deleteStaff,
      toggleStaffStatus,
      addCustomer,
      updateCustomerMembership,
      updateCustomerUsageRules,
      addCustomerVehicle,
      deleteCustomerVehicle,
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
