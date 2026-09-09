import { isMembershipPackage, parseFlexibleDate } from '../../../common/utils/membershipUtils';
import apiClient from '../../../common/utils/apiClient';

/**
 * Normalizes vehicle number plate for reliable string comparison.
 * e.g. "mp 09 gg 8790" -> "MP09GG8790"
 */
export function normalizePlate(plate) {
  return String(plate || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/**
 * Checks if the logged-in staff member belongs to the Car Wash department.
 * Isolates Car Wash staff from Dog Wash, Salon, Cafe, Detailing, etc.
 * Future-proof for any new staff created by the admin under the Car Wash section.
 */
export function isCarWashStaff(staff) {
  if (!staff) return false;

  const key = (staff.serviceKey || '').toLowerCase().trim();
  const dept = (staff.department || '').toLowerCase().trim();
  const role = (staff.staffRole || staff.role || '').toLowerCase().trim();
  const email = (staff.email || '').toLowerCase().trim();
  const name = (staff.name || staff.fullName || '').toLowerCase().trim();
  const combined = `${key} ${dept} ${role} ${email} ${name}`;

  // 1. Explicit exclusion of other distinct departments
  if (
    combined.includes('dog') ||
    combined.includes('pet') ||
    combined.includes('groom') ||
    combined.includes('salon') ||
    combined.includes('barber') ||
    combined.includes('hair') ||
    combined.includes('cafe') ||
    combined.includes('barista') ||
    combined.includes('coffee') ||
    combined.includes('drive-through') ||
    combined.includes('drivethrough') ||
    combined.includes('detail') ||
    combined.includes('ceramic') ||
    combined.includes('ppf')
  ) {
    return false;
  }

  // 2. Direct serviceKey check
  if (key === 'car-wash' || key === 'carwash') return true;

  // 3. Department check
  if (dept.includes('car wash') || dept.includes('car-wash')) return true;
  if (dept.includes('wash') && !dept.includes('dog')) return true;

  // 4. Role check
  if (role.includes('car wash') || role.includes('carwash') || role.includes('wash specialist')) return true;

  // 5. Default fallback if department is car wash or key is car wash
  return key === 'car-wash' || dept === 'Car Wash';
}

/**
 * Reads local offline sales from localStorage
 */
export function getLocalOfflineSales() {
  try {
    const raw = localStorage.getItem('tsl_offline_sales');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

/**
 * Reads dynamic catalog limits configured by Admin
 */
export function getCarWashCatalogLimits() {
  try {
    const raw = localStorage.getItem('tsl_car_wash_service');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed?.memberships)) {
        const map = {};
        parsed.memberships.forEach(m => {
          const key = String(m.name || m.title || '').toLowerCase().trim();
          if (key && m.visitLimit !== undefined && m.visitLimit !== null) {
            map[key] = Number(m.visitLimit) === 999 ? 999 : Number(m.visitLimit);
          }
        });
        return map;
      }
    }
  } catch (e) {}
  return {
    'monthly membership': 30,
    'annual vip pass': 48,
    'yearly membership': 365,
    'quarterly pass': 12
  };
}

/**
 * Reads local membership passes from localStorage
 */
export function getLocalMembershipPasses() {
  const passes = [];
  try {
    const raw = localStorage.getItem('tsl_membership_passes');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) passes.push(...parsed);
    }
  } catch (e) {}

  try {
    const rawActive = localStorage.getItem('tsl_active_membership');
    if (rawActive) {
      const parsed = JSON.parse(rawActive);
      if (parsed && typeof parsed === 'object') passes.push(parsed);
    }
  } catch (e) {}

  return passes;
}

/**
 * Aggregates all Car Wash memberships, Single Wash passes, and Offline Sales
 * into a single unified list for the staff portal, fully synchronized with Admin.
 */
export function getCarWashMembershipsList({ bookings = [], offlineSales = [], memberships = [] } = {}) {
  const catalogLimits = getCarWashCatalogLimits();
  const now = new Date();

  // 1. Gather all offline sales (localStorage + props)
  const storageSales = getLocalOfflineSales().filter(s => s && s.id !== 'OFS-MTJX5GRW-3986' && s.bookingId !== 'OFS-MTJX5GRW-3986');
  const allOfflineSalesMap = new Map();
  storageSales.forEach(s => allOfflineSalesMap.set(s.id || s.bookingId, s));
  (offlineSales || []).filter(s => s && s.id !== 'OFS-MTJX5GRW-3986' && s.bookingId !== 'OFS-MTJX5GRW-3986').forEach(s => allOfflineSalesMap.set(s.id || s.bookingId, s));

  // 2. Identify all completed wash records (e.g., WASH-...)
  const allWashLogs = [];
  const washLogIds = new Set();
  const checkAndAddWash = (b) => {
    if (!b) return;
    const bId = b.id || b.bookingId || '';
    if (bId && washLogIds.has(bId)) return;
    const isWashRecord = (
      bId.startsWith('WASH-') ||
      b.packageName === 'Ground Wash (Completed)' ||
      b.packageName === 'Express Wash (Redeemed)' ||
      (b.paymentMode === 'Membership' && b.status === 'Completed') ||
      (b.paymentMode === 'Membership Pass' && b.status === 'Completed') ||
      (b.notes && b.notes.toLowerCase().includes('wash completed'))
    );
    if (isWashRecord) {
      if (bId) washLogIds.add(bId);
      allWashLogs.push(b);
    }
  };

  Array.from(allOfflineSalesMap.values()).forEach(checkAndAddWash);
  (bookings || []).forEach(checkAndAddWash);

  // 3. Pool of all bookings
  const combinedBookings = [...(bookings || [])];
  const knownBookingIds = new Set(combinedBookings.map(b => b.id || b.bookingId).filter(Boolean));

  allOfflineSalesMap.forEach((sale, key) => {
    if (key && !knownBookingIds.has(key)) {
      knownBookingIds.add(key);
      combinedBookings.push({
        ...sale,
        id: key,
        bookingId: key,
        isOfflineSale: true
      });
    }
  });

  // Local passes
  getLocalMembershipPasses().forEach(p => {
    const key = p.id || p.bookingId || p.passId;
    if (key && !knownBookingIds.has(key)) {
      knownBookingIds.add(key);
      combinedBookings.push({
        ...p,
        id: key,
        bookingId: key,
        serviceKey: 'car-wash',
        plan: p.planName || p.packageName
      });
    }
  });

  // 4. Pool of all memberships (Admin Panel Memberships + props + localStorage, no mock data)
  const combinedMembershipsMap = new Map();

  // Pull live data from Admin Panel -> Membership
  try {
    const adminMemRaw = localStorage.getItem('tsl_admin_memberships');
    if (adminMemRaw) {
      const parsed = JSON.parse(adminMemRaw);
      if (Array.isArray(parsed)) {
        parsed.filter(m => m && !String(m.id || '').startsWith('MEM-100')).forEach(m => {
          if (!m.serviceKey || m.serviceKey === 'car-wash' || m.serviceKey === 'car-detailing') {
            combinedMembershipsMap.set(m.id || m.vehicleNo, m);
          }
        });
      }
    }
  } catch (e) {}

  (memberships || []).forEach(m => {
    if (m.serviceKey === 'car-wash' || m.serviceKey === 'car-detailing') {
      combinedMembershipsMap.set(m.id || m.vehicleNo, m);
    }
  });

  // Also include offline sales with saleType === 'membership'
  allOfflineSalesMap.forEach((s) => {
    if (s.saleType === 'membership') {
      const priceVal = Number(s.amount !== undefined && s.amount !== null ? s.amount : (s.price !== undefined && s.price !== null ? s.price : (s.total || 2499)));
      combinedMembershipsMap.set(s.id || s.bookingId, {
        id: s.id || s.bookingId,
        customerName: s.customerName,
        phone: s.phone,
        email: s.customerEmail || '',
        vehicleNo: s.vehicleNo,
        vehicleModel: s.vehicleModel || s.vehicleType || 'Car',
        planName: s.membershipName || s.packageName || s.planName || 'Monthly Membership',
        serviceKey: s.serviceKey || 'car-wash',
        startDate: s.date || s.saleDate,
        expiryDate: s.membershipExpiry || '',
        washesUsed: 0,
        maxWashes: catalogLimits['monthly membership'] || 30,
        status: 'Active',
        amount: priceVal,
        price: priceVal,
        total: priceVal
      });
    }
  });

  // Apply any customer vehicle updates registered in staff/admin panels
  try {
    const custVehicles = JSON.parse(localStorage.getItem('tsl_customer_vehicles') || '{}');
    combinedMembershipsMap.forEach((m, key) => {
      const emailKey = (m.email || '').toLowerCase().trim();
      const phoneKey = String(m.phone || '').replace(/\D/g, '').slice(-10);
      const plateKey = normalizePlate(m.vehicleNo);
      const nameKey = (m.customerName || '').toLowerCase().trim();

      const override = (emailKey && custVehicles[emailKey]) ||
                       (phoneKey && custVehicles[phoneKey]) ||
                       (plateKey && custVehicles[plateKey]) ||
                       (nameKey && custVehicles[nameKey]) ||
                       (m.id && custVehicles[m.id]);

      if (override && override.plateNumber) {
        m.vehicleNo = override.plateNumber;
        if (override.model) m.vehicleModel = override.model;
      }
    });
  } catch (e) {}

  // 5. Assemble unified passes list
  const passItems = [];
  const processedPassKeys = new Set();

  // Helper to find wash count for a vehicle
  const getWashesForVehicle = (cleanPlate, customerName = '', customerPhone = '', baselineWashes = 0) => {
    const matchingLogs = allWashLogs.filter(w => {
      const wPlate = normalizePlate(w.vehicleNo);
      if (cleanPlate && wPlate && wPlate === cleanPlate) return true;
      if (customerPhone) {
        const wPhone = String(w.phone || '').replace(/\D/g, '').slice(-10);
        const cPhone = String(customerPhone).replace(/\D/g, '').slice(-10);
        if (wPhone && cPhone && wPhone === cPhone) return true;
      }
      return false;
    });

    const totalUsed = baselineWashes + matchingLogs.length;
    const latestWash = matchingLogs[0];
    const lastDate = latestWash ? (latestWash.date || latestWash.saleDate || 'Today') : '';

    return {
      washesUsed: totalUsed,
      lastWashDate: lastDate,
      washHistory: matchingLogs.map((m, idx) => ({
        id: m.id || `WASH-${idx + 1}`,
        date: m.date || m.saleDate || 'Recent',
        time: m.timeSlot || 'Counter Service',
        notes: m.notes || 'Service Wash'
      }))
    };
  };

  // 5A. Ingest Memberships first
  combinedMembershipsMap.forEach((mem) => {
    const plate = (mem.vehicleNo || '').toUpperCase().trim();
    const cleanPlate = normalizePlate(plate);
    const planName = mem.planName || mem.name || 'Monthly Membership';
    const lowerPlan = planName.toLowerCase();

    // Resolve max washes from catalog or tier
    let maxWashes = mem.maxWashes || 30;
    if (catalogLimits[lowerPlan]) {
      maxWashes = catalogLimits[lowerPlan];
    } else if (lowerPlan.includes('annual') || lowerPlan.includes('vip')) {
      maxWashes = catalogLimits['annual vip pass'] || 48;
    } else if (lowerPlan.includes('monthly')) {
      maxWashes = catalogLimits['monthly membership'] || 30;
    } else if (lowerPlan.includes('quarterly')) {
      maxWashes = catalogLimits['quarterly pass'] || 12;
    }

    const baselineWashes = Number(mem.washesUsed) || 0;
    const washData = getWashesForVehicle(cleanPlate, mem.customerName, mem.phone, baselineWashes);

    const isUnlimited = maxWashes === 999 || maxWashes === 'Unlimited';
    const isExhausted = !isUnlimited && washData.washesUsed >= maxWashes;
    let status = mem.status || 'Active';
    if (isExhausted) status = 'Exhausted';

    const passKey = `MEM_${cleanPlate || mem.id}`;
    processedPassKeys.add(passKey);

    const startDateStr = mem.startDateLabel || mem.startDate || '01 Jun 2026';
    const expiryDateStr = mem.expiryDateLabel || mem.expiryDate || '31 Jul 2026';

    passItems.push({
      id: mem.id || `MEM-${Date.now()}`,
      vehicleNo: plate || '—',
      vehicleModel: mem.vehicleModel || 'Car',
      customerName: mem.customerName || 'Valued Member',
      phone: mem.phone || '',
      email: mem.email || '',
      packageName: planName,
      planType: 'membership',
      source: 'Membership Pass',
      washesUsed: washData.washesUsed,
      maxWashes,
      isUnlimited,
      startDate: startDateStr,
      expiryDate: expiryDateStr,
      validity: lowerPlan.includes('annual') ? '1 Year (365 Days)' : (lowerPlan.includes('quarterly') ? '3 Months (90 Days)' : '1 Month (30 Days)'),
      lastWashDate: washData.lastWashDate || startDateStr,
      status,
      washHistory: washData.washHistory,
      rawAmount: Number(mem.amount !== undefined && mem.amount !== null ? mem.amount : (mem.price !== undefined && mem.price !== null ? mem.price : 2499)),
      amount: Number(mem.amount !== undefined && mem.amount !== null ? mem.amount : (mem.price !== undefined && mem.price !== null ? mem.price : 2499)),
      price: Number(mem.price !== undefined && mem.price !== null ? mem.price : (mem.amount !== undefined && mem.amount !== null ? mem.amount : 2499)),
      total: Number(mem.amount !== undefined && mem.amount !== null ? mem.amount : (mem.price !== undefined && mem.price !== null ? mem.price : 2499))
    });
  });

  // 5B. Ingest Single Wash bookings & Offline Sales
  const carWashBookings = combinedBookings.filter(b => {
    const sKey = (b.serviceKey || '').toLowerCase();
    const sName = (b.serviceName || b.service || '').toLowerCase();
    const pName = (b.packageName || b.plan || '').toLowerCase();

    // Exclude other departments
    if (
      sKey.includes('dog') || sName.includes('dog') ||
      sKey.includes('salon') || sName.includes('salon') ||
      sKey.includes('cafe') || sName.includes('cafe') ||
      sKey.includes('drive') || sName.includes('drive')
    ) {
      return false;
    }

    // Must be car wash or detailing pass
    return (
      sKey === 'car-wash' ||
      sKey === 'carwash' ||
      sName.includes('car wash') ||
      pName.includes('wash') ||
      b.isOfflineSale
    );
  });

  carWashBookings.forEach(rec => {
    const bId = rec.id || rec.bookingId || '';
    // Skip if this record is just a redeemed wash log itself
    if (
      bId.startsWith('WASH-') ||
      rec.packageName === 'Ground Wash (Completed)' ||
      rec.packageName === 'Express Wash (Redeemed)' ||
      rec.paymentMode === 'Membership' ||
      rec.paymentMode === 'Membership Pass'
    ) {
      return;
    }

    const planName = rec.packageName || rec.plan || 'Single Wash';
    const isMembership = isMembershipPackage(planName) || rec.saleType === 'membership';

    // If it's a membership, it was handled in 5A unless unmapped
    const plate = (rec.vehicleNo || rec.vehiclePlate || '').trim().toUpperCase();
    const cleanPlate = normalizePlate(plate);
    const passKey = isMembership ? `MEM_${cleanPlate || bId}` : `SINGLE_${cleanPlate}_${bId}`;

    if (processedPassKeys.has(passKey)) return;
    processedPassKeys.add(passKey);

    const ownerName = rec.customerName || rec.userName || 'Walk-in Customer';
    const phone = rec.phone || rec.mobile || '';
    const email = (rec.customerEmail || rec.email || '').toLowerCase().trim();

    if (isMembership) {
      // Offline membership sale
      const washData = getWashesForVehicle(cleanPlate, ownerName, phone, 0);
      passItems.push({
        id: bId || `MEM-${Date.now()}`,
        vehicleNo: plate || '—',
        vehicleModel: rec.vehicleModel || rec.vehicleType || 'Car',
        customerName: ownerName,
        phone,
        email,
        packageName: planName,
        planType: 'membership',
        source: rec.isOfflineSale ? 'Offline POS Sale' : 'Online Booking',
        washesUsed: washData.washesUsed,
        maxWashes: catalogLimits['monthly membership'] || 30,
        isUnlimited: false,
        startDate: rec.date || 'Today',
        expiryDate: rec.membershipExpiry || '30 Days',
        validity: rec.membershipValidity || '1 Month (30 Days)',
        lastWashDate: washData.lastWashDate || rec.date || '—',
        status: 'Active',
        washHistory: washData.washHistory,
        rawAmount: Number(rec.amount !== undefined && rec.amount !== null ? rec.amount : (rec.price !== undefined && rec.price !== null ? rec.price : (rec.total || 2499))),
        amount: Number(rec.amount !== undefined && rec.amount !== null ? rec.amount : (rec.price !== undefined && rec.price !== null ? rec.price : (rec.total || 2499))),
        price: Number(rec.price !== undefined && rec.price !== null ? rec.price : (rec.amount !== undefined && rec.amount !== null ? rec.amount : (rec.total || 2499))),
        total: Number(rec.amount !== undefined && rec.amount !== null ? rec.amount : (rec.price !== undefined && rec.price !== null ? rec.price : (rec.total || 2499)))
      });
    } else {
      // Single Wash Booking / Counter Sale
      const isAlreadyCompleted = rec.status === 'Completed';
      const hasWashLog = allWashLogs.some(w => {
        const wPlate = normalizePlate(w.vehicleNo);
        return cleanPlate && wPlate && wPlate === cleanPlate;
      });

      const washesCompleted = (isAlreadyCompleted || hasWashLog) ? 1 : 0;
      const status = washesCompleted >= 1 ? 'Completed' : 'Active';
      const lastWashDate = washesCompleted >= 1
        ? (rec.date || 'September 2, 2026')
        : 'Pending First Wash';

      passItems.push({
        id: bId || `POS-${Date.now()}`,
        vehicleNo: plate || '—',
        vehicleModel: rec.vehicleModel || rec.vehicleType || 'Car',
        customerName: ownerName,
        phone,
        email,
        packageName: planName,
        planType: 'single_wash',
        source: rec.isOfflineSale ? 'Offline POS Sale' : 'Online Booking',
        washesUsed: washesCompleted,
        maxWashes: 1,
        isUnlimited: false,
        startDate: rec.date || 'Today',
        expiryDate: rec.date ? `${rec.date} (End of Day)` : 'Valid Today',
        validity: '1 Day (Single Wash)',
        lastWashDate,
        status,
        washHistory: washesCompleted >= 1 ? [{
          id: bId || 'WASH-1',
          date: rec.date || 'Today',
          time: rec.timeSlot || 'Counter Walk-in',
          notes: rec.notes || 'Single Wash Service'
        }] : [],
        rawAmount: Number(rec.amount !== undefined && rec.amount !== null ? rec.amount : (rec.price !== undefined && rec.price !== null ? rec.price : (rec.total || 499))),
        amount: Number(rec.amount !== undefined && rec.amount !== null ? rec.amount : (rec.price !== undefined && rec.price !== null ? rec.price : (rec.total || 499))),
        price: Number(rec.price !== undefined && rec.price !== null ? rec.price : (rec.amount !== undefined && rec.amount !== null ? rec.amount : (rec.total || 499))),
        total: Number(rec.amount !== undefined && rec.amount !== null ? rec.amount : (rec.price !== undefined && rec.price !== null ? rec.price : (rec.total || 499)))
      });
    }
  });

  return passItems;
}

/**
 * Logs a completed wash for a vehicle directly by ground staff.
 * Updates backend /bookings, saves to tsl_offline_sales, and dispatches events.
 */
export async function recordStaffWashDone({
  vehicleNo,
  customerName,
  phone,
  vehicleModel,
  membershipName,
  serviceKey = 'car-wash'
}) {
  const newId = `WASH-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const timeStart = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  const washRecord = {
    id: newId,
    bookingId: newId,
    serviceKey: serviceKey || 'car-wash',
    serviceName: 'Car Wash',
    packageName: 'Ground Wash (Completed)',
    plan: 'Ground Wash (Completed)',
    price: 0,
    total: 0,
    date: dateStr,
    saleDate: now.toISOString().split('T')[0],
    timeSlot: `${timeStart}`,
    customerName: customerName || 'Valued Customer',
    phone: phone || '',
    vehicleNo: (vehicleNo || '').toUpperCase().trim(),
    vehicleModel: vehicleModel || 'Car',
    vehicleType: vehicleModel || 'Car',
    status: 'Completed',
    isOfflineSale: true,
    saleType: 'service',
    paymentMode: 'Membership Pass',
    notes: `Wash performed and logged by Car Wash ground staff for pass: ${membershipName || 'Membership'}`,
    createdAt: now.toISOString()
  };

  // 1. Try sending to backend API
  try {
    await apiClient.post('/bookings', washRecord);
  } catch (err) {
    console.warn('Backend booking save note (using local offline storage):', err.message);
  }

  // 2. Persist to local offline sales
  try {
    const existing = JSON.parse(localStorage.getItem('tsl_offline_sales') || '[]');
    const nextSales = [washRecord, ...existing.filter(s => s.id !== newId && s.bookingId !== newId)];
    localStorage.setItem('tsl_offline_sales', JSON.stringify(nextSales));
  } catch (e) {
    console.warn('LocalStorage save error:', e);
  }

  // 3. Dispatch events for real-time reactivity across all portals (Admin & Staff)
  try {
    window.dispatchEvent(new CustomEvent('tsl_wash_logged', { detail: washRecord }));
    window.dispatchEvent(new CustomEvent('tsl_wash_used', { detail: washRecord }));
    window.dispatchEvent(new CustomEvent('tsl_offline_sales_updated', { detail: washRecord }));
    window.dispatchEvent(new Event('storage'));
  } catch (e) {}

  return washRecord;
}

/**
 * Reads memberships directly from Admin Panel -> Membership
 */
export function getAdminMemberships() {
  try {
    const raw = localStorage.getItem('tsl_admin_memberships');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter(m => m && !String(m.id || '').startsWith('MEM-100'));
    }
  } catch (e) {}
  return [];
}

/**
 * Updates a car number plate and model across the entire system:
 * - Local offline sales (tsl_offline_sales)
 * - Admin memberships (tsl_admin_memberships)
 * - Customer vehicles registry (tsl_customer_vehicles)
 * - Backend /api/users/customers/:id/vehicles
 * - Fires window events to update Admin & Staff portals in real-time
 */
export async function updateCarNumberAcrossSystem({
  passId,
  customerId,
  customerEmail,
  customerPhone,
  customerName,
  oldPlate,
  newPlate,
  newModel
}) {
  const cleanNewPlate = String(newPlate || '').trim().toUpperCase();
  const cleanNewModel = String(newModel || '').trim();
  if (!cleanNewPlate) return false;

  // 1. Update customer vehicles mapping in localStorage
  try {
    const customerVehicles = JSON.parse(localStorage.getItem('tsl_customer_vehicles') || '{}');
    const vehicleObj = { plateNumber: cleanNewPlate, model: cleanNewModel, isPrimary: true };
    if (customerEmail) customerVehicles[customerEmail.toLowerCase().trim()] = vehicleObj;
    if (customerId) customerVehicles[customerId] = vehicleObj;
    if (customerPhone) customerVehicles[String(customerPhone).replace(/\D/g, '').slice(-10)] = vehicleObj;
    if (customerName) customerVehicles[customerName.toLowerCase().trim()] = vehicleObj;
    if (oldPlate) customerVehicles[normalizePlate(oldPlate)] = vehicleObj;
    customerVehicles[normalizePlate(cleanNewPlate)] = vehicleObj;
    localStorage.setItem('tsl_customer_vehicles', JSON.stringify(customerVehicles));
  } catch (e) {}

  // 2. Update offline sales
  try {
    const offlineSales = JSON.parse(localStorage.getItem('tsl_offline_sales') || '[]');
    let modifiedSales = false;
    const updatedSales = offlineSales.map(s => {
      const matchesPass = passId && (s.id === passId || s.bookingId === passId);
      const matchesPlate = oldPlate && normalizePlate(s.vehicleNo) === normalizePlate(oldPlate);
      const matchesEmail = customerEmail && s.customerEmail && s.customerEmail.toLowerCase().trim() === customerEmail.toLowerCase().trim();
      if (matchesPass || matchesPlate || matchesEmail) {
        modifiedSales = true;
        return {
          ...s,
          vehicleNo: cleanNewPlate,
          vehicleModel: cleanNewModel || s.vehicleModel || s.vehicleType || 'Car',
          vehicleType: cleanNewModel || s.vehicleType || 'Car'
        };
      }
      return s;
    });
    if (modifiedSales) {
      localStorage.setItem('tsl_offline_sales', JSON.stringify(updatedSales));
    }
  } catch (e) {}

  // 3. Update Admin Panel -> Membership in localStorage
  try {
    const adminRaw = localStorage.getItem('tsl_admin_memberships');
    const adminMemberships = adminRaw ? (JSON.parse(adminRaw) || []).filter(m => m && !String(m.id || '').startsWith('MEM-100')) : [];
    let modifiedAdmin = false;
    const updatedAdmin = adminMemberships.map(m => {
      const matchesPass = passId && (m.id === passId || m.bookingId === passId);
      const matchesPlate = oldPlate && normalizePlate(m.vehicleNo) === normalizePlate(oldPlate);
      const matchesEmail = customerEmail && m.email && m.email.toLowerCase().trim() === customerEmail.toLowerCase().trim();
      if (matchesPass || matchesPlate || matchesEmail) {
        modifiedAdmin = true;
        return {
          ...m,
          vehicleNo: cleanNewPlate,
          vehicleModel: cleanNewModel || m.vehicleModel || 'Car'
        };
      }
      return m;
    });
    if (modifiedAdmin) {
      localStorage.setItem('tsl_admin_memberships', JSON.stringify(updatedAdmin));
    }
  } catch (e) {}

  // 4. Try updating backend if customer ID or email available
  if (customerId || customerEmail) {
    try {
      const targetId = customerId || customerEmail;
      await apiClient.post(`/users/customers/${targetId}/vehicles`, {
        plateNumber: cleanNewPlate,
        model: cleanNewModel,
        isPrimary: true
      });
    } catch (err) {
      console.warn('Backend customer vehicle update note:', err.message);
    }
  }

  // 5. Fire dispatch events
  try {
    window.dispatchEvent(new CustomEvent('tsl_vehicle_updated', {
      detail: { passId, customerId, oldPlate, newPlate: cleanNewPlate, newModel: cleanNewModel }
    }));
    window.dispatchEvent(new CustomEvent('tsl_customer_updated', {
      detail: { customerId, customerEmail, newPlate: cleanNewPlate, newModel: cleanNewModel }
    }));
    window.dispatchEvent(new CustomEvent('tsl_offline_sales_updated'));
    window.dispatchEvent(new CustomEvent('tsl_admin_memberships_updated'));
    window.dispatchEvent(new Event('storage'));
  } catch (e) {}

  return true;
}

