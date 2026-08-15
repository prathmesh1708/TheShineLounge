import React, { createContext, useContext, useState, useEffect } from 'react';
import { mockStaffMembers, mockAssignedJobs, mockCustomers, mockAttendanceRecords, mockStaffNotifications } from '../data/staffMockData';
import apiClient from '../../../common/utils/apiClient';
import { useAuth } from '../../../common/context/AuthContext';

const StaffContext = createContext();

// Final stepper index per service — each service's stepper has a different
// number of steps, so "done" can't be a single hardcoded index (e.g. 7,
// which only applies to car-detailing's 8-step flow).
export const SERVICE_FINAL_STEP_INDEX = {
  'car-detailing': 7,
  'car-wash': 4,
  'cafe': 4,
  'drive-through-cafe': 3,
  'dog-wash': 4,
  'salon': 2
};

const formatStaffUser = (u) => {
  if (!u) {
    return {
      id: 'STF-05',
      employeeId: 'suryansh@theshinelounge.com',
      name: 'suryansh',
      role: 'Car Detailing Specialist',
      department: 'Car Detailing',
      serviceKey: 'car-detailing',
      email: 'suryansh@theshinelounge.com',
      mobile: '+91 98210 55555',
      salary: '₹45,000 / mo',
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      permissions: ['bookings', 'orders']
    };
  }

  let dept = u.department || '';
  let key = u.serviceKey || '';
  const roleLower = (u.staffRole || u.role || '').toLowerCase();
  const deptLower = (dept || '').toLowerCase();
  const emailLower = (u.email || '').toLowerCase();
  const nameLower = (u.fullName || u.name || '').toLowerCase();
  const combinedStr = `${deptLower} ${roleLower} ${emailLower} ${nameLower}`;

  if (!key || !dept) {
    if (combinedStr.includes('drive')) {
      key = key || 'drive-through-cafe';
      dept = dept || 'Drive-Through Café';
    } else if (combinedStr.includes('cafe') || combinedStr.includes('coffee') || combinedStr.includes('barista')) {
      key = key || 'cafe';
      dept = dept || 'Café';
    } else if (combinedStr.includes('detail') || combinedStr.includes('ceramic') || combinedStr.includes('ppf')) {
      key = key || 'car-detailing';
      dept = dept || 'Car Detailing';
    } else if (combinedStr.includes('dog') || combinedStr.includes('pet') || combinedStr.includes('groom')) {
      key = key || 'dog-wash';
      dept = dept || 'Dog Wash';
    } else if (combinedStr.includes('salon') || combinedStr.includes('barber') || combinedStr.includes('hair')) {
      key = key || 'salon';
      dept = dept || "Men's Salon";
    } else {
      key = key || 'car-wash';
      dept = dept || 'Car Wash';
    }
  }

  return {
    id: u._id || u.id || 'STF-LIVE',
    employeeId: u.email || u.employeeId || 'STF-01',
    name: u.fullName || u.name || (u.email ? u.email.split('@')[0] : 'Staff Member'),
    role: u.staffRole || (u.role === 'staff' ? (dept || 'Staff Specialist') : u.role) || 'Staff Specialist',
    department: dept,
    serviceKey: key,
    email: u.email || '',
    mobile: u.mobile || '',
    salary: u.salary || '',
    photo: u.photo || u.profileImage || u.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    avatar: u.photo || u.profileImage || u.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    permissions: u.permissions || ['bookings', 'orders']
  };
};

export function StaffProvider({ children }) {
  const getInitialStaff = () => {
    try {
      const stored = localStorage.getItem('tsl_user');
      if (stored) {
        const u = JSON.parse(stored);
        if (u && u.role === 'staff') return formatStaffUser(u);
      }
    } catch (err) {
      console.warn('Error parsing tsl_user in StaffContext:', err);
    }
    return formatStaffUser(null);
  };

  // Currently Logged-in Staff
  const [currentStaff, setCurrentStaff] = useState(getInitialStaff);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const initial = getInitialStaff();
    return initial !== null;
  });

  // Sync staff context whenever localStorage tsl_user changes or authUser changes
  const { user: authUser } = useAuth();

  useEffect(() => {
    const syncStaffUser = () => {
      try {
        if (authUser && authUser.role === 'staff') {
          setCurrentStaff(formatStaffUser(authUser));
          setIsAuthenticated(true);
          return;
        }

        const stored = localStorage.getItem('tsl_user');
        if (stored) {
          const u = JSON.parse(stored);
          if (u && u.role === 'staff') {
            setCurrentStaff(formatStaffUser(u));
            setIsAuthenticated(true);
            return;
          }
        }
      } catch (err) {
        console.warn('Sync staff error:', err);
      }
      setCurrentStaff(formatStaffUser(null));
      setIsAuthenticated(true);
    };

    syncStaffUser();
    window.addEventListener('storage', syncStaffUser);
    return () => window.removeEventListener('storage', syncStaffUser);
  }, [authUser]);

  // State
  const [jobs, setJobs] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [notifications, setNotifications] = useState(mockStaffNotifications);
  
  // Check-In State
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInPhoto, setCheckInPhoto] = useState('');
  const [checkInTime, setCheckInTime] = useState('');

  const fetchLiveAttendance = async (staffId) => {
    if (!staffId || staffId.toString().startsWith('STF-')) return;
    try {
      const res = await apiClient.get(`/attendance/staff/${staffId}`);
      if (res.data && res.data.attendance) {
        setAttendance(res.data.attendance);
        const todayStr = new Date().toISOString().split('T')[0];
        const todayLog = res.data.attendance.find(a => a.date === todayStr);
        if (todayLog) {
          setIsCheckedIn(todayLog.checkOutTime === 'In Progress');
          setCheckInPhoto(todayLog.photoUrl);
          setCheckInTime(todayLog.checkInTime);
        } else {
          setIsCheckedIn(false);
        }
      }
    } catch (err) {
      console.warn('Error fetching live attendance:', err.message);
    }
  };

  const fetchLiveJobs = async () => {
    let apiMapped = [];
    try {
      const res = await apiClient.get('/bookings');
      if (res.data && res.data.bookings) {
        apiMapped = res.data.bookings.map((b, idx) => {
          const sName = (b.serviceName || b.plan || b.packageName || '').toLowerCase();
          const pName = (b.packageName || b.package || '').toLowerCase();
          const vType = (b.vehicleType || '').toLowerCase();

          let resolvedKey = b.serviceKey;
          if (!resolvedKey) {
            if (sName.includes('dog') || sName.includes('pet') || sName.includes('groom') || sName.includes('hydrobath') || pName.includes('dog') || vType.includes('dog')) {
              resolvedKey = 'dog-wash';
            } else if (sName.includes('salon') || sName.includes('hair') || sName.includes('barber') || pName.includes('salon')) {
              resolvedKey = 'salon';
            } else if (sName.includes('drive') || sName.includes('drive-thru')) {
              resolvedKey = 'drive-through-cafe';
            } else if (sName.includes('cafe') || sName.includes('coffee')) {
              resolvedKey = 'cafe';
            } else if (sName.includes('detail') || pName.includes('detail') || pName.includes('ceramic') || pName.includes('ppf')) {
              resolvedKey = 'car-detailing';
            } else {
              resolvedKey = 'car-wash';
            }
          }

          const resolveCustomerName = (booking, idx = 0, defaultLabel = 'Salon Client') => {
            let rawName = '';
            if (typeof booking.customerName === 'string' && booking.customerName.trim()) {
              rawName = booking.customerName.trim();
            } else if (booking.customerName && typeof booking.customerName === 'object') {
              rawName = booking.customerName.fullName || booking.customerName.name || '';
            } else if (booking.user && typeof booking.user === 'object') {
              rawName = booking.user.fullName || booking.user.name || booking.user.email || '';
            } else if (typeof booking.user === 'string' && booking.user.trim()) {
              rawName = booking.user.trim();
            } else if (booking.customerEmail && typeof booking.customerEmail === 'string') {
              rawName = booking.customerEmail.split('@')[0];
            }

            const stylistName = (booking.stylist || booking.staffName || booking.assignedStaffName || '').trim().toLowerCase();
            const lowerRaw = rawName.toLowerCase();

            // Return the actual stored customer name whenever available
            if (rawName && lowerRaw !== 'super admin' && lowerRaw !== 'salon client' && (!stylistName || lowerRaw !== stylistName)) {
              return rawName;
            }

            if (booking.phone && typeof booking.phone === 'string' && booking.phone.trim()) {
              return `Client (${booking.phone.trim()})`;
            }

            return defaultLabel;
          };

          return {
            _id: b._id,
            id: b.bookingId || b.id || `BK-${b._id?.slice(-4)}`,
            serviceKey: resolvedKey,
            serviceName: b.serviceName || b.plan || b.package || (resolvedKey === 'dog-wash' ? 'Dog Wash' : 'Car Wash'),
            planName: b.packageName || b.package || b.serviceName || (resolvedKey === 'dog-wash' ? 'Dog Hydrobath Spa' : 'Car Wash'),
            itemsSummary: (b.items && b.items.length > 0)
              ? b.items.map(i => `${i.quantity}x ${i.name}`).join(', ')
              : (b.itemsSummary || b.packageName || 'Service Order'),
            items: b.items || [],
            pickupTime: b.pickupTime || '',
            expectedAt: b.expectedAt || null,
            vehicleNo: b.vehicleNo || (resolvedKey === 'dog-wash' ? 'Max (Golden Retriever)' : 'MH02CD5678'),
            vehicleModel: b.vehicleType || b.vehicle || (resolvedKey === 'dog-wash' ? 'Pet' : 'Car'),
            vehicleType: b.vehicleType || (resolvedKey === 'dog-wash' ? 'Dog' : 'Car'),
            customerName: resolveCustomerName(b, idx, resolvedKey === 'salon' ? 'Salon Client' : 'Customer'),
            phone: b.phone || b.mobile || b.customerEmail || '+91 98200 12345',
            date: b.date || new Date().toISOString().split('T')[0],
            timeSlot: b.timeSlot || b.time || '02:00 PM',
            amount: b.price || b.amount || (resolvedKey === 'dog-wash' ? 500 : 699),
            total: b.price || b.amount || (resolvedKey === 'dog-wash' ? 500 : 699),
            status: b.status || 'Confirmed',
            stepIndex: b.stepIndex !== undefined ? b.stepIndex : 0,
            notes: b.notes || '',
            photos: b.photos || [],
            staffId: b.assignedStaffId ? String(b.assignedStaffId) : '',
            staffName: b.assignedStaffName || ''
          };
        });
      }
    } catch (err) {
      console.warn('Could not fetch jobs from database:', err.message);
    }

    let localDetailingJobs = [];
    try {
      const stored = localStorage.getItem('shine_car_detailing_bookings');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          localDetailingJobs = parsed.map((b, idx) => ({
            _id: b.id || `BK-DET-${idx}`,
            id: b.id || `BK-${8000 + idx}`,
            serviceKey: 'car-detailing',
            serviceName: b.package || b.serviceName || 'Car Detailing Treatment',
            planName: b.package || b.serviceName || 'Detailing Treatment',
            vehicleNo: b.vehicleNo || 'MH02CD5678',
            vehicleModel: b.vehicle || b.vehicleModel || 'BMW X5',
            customerName: b.customerName || b.customer || 'Priya Patel',
            phone: b.phone || '+91 98331 56789',
            date: b.date || new Date().toISOString().split('T')[0],
            timeSlot: b.time || '02:00 PM - 05:00 PM',
            amount: b.price || 14999,
            total: b.price || 14999,
            status: b.status || 'Confirmed',
            stepIndex: b.stepIndex !== undefined ? b.stepIndex : 0,
            notes: b.notes || 'Customer requested multi-stage ceramic gloss protection.',
            staffId: b.staffId || currentStaff?.id || 'STF-05',
            staffName: (b.technician && b.technician !== 'Vikram Rathore') ? b.technician : (currentStaff?.name || 'suryansh')
          }));
        }
      }
    } catch (e) {}

    let localDogJobs = [];
    try {
      const storedDog = localStorage.getItem('tsl_dog_wash_bookings') || localStorage.getItem('shine_dog_wash_bookings');
      if (storedDog) {
        const parsedDog = JSON.parse(storedDog);
        if (Array.isArray(parsedDog)) {
          localDogJobs = parsedDog.map((b, idx) => ({
            _id: b.id || b.bookingId || `BK-DOG-${idx}`,
            id: b.bookingId || b.id || `BK-DOG-${9000 + idx}`,
            serviceKey: 'dog-wash',
            serviceName: b.serviceName || 'Dog Wash',
            planName: b.packageName || b.package || 'Dog Hydrobath Spa',
            vehicleNo: b.vehicleNo || b.vehicle || 'Max (Golden Retriever)',
            vehicleModel: 'Pet',
            vehicleType: 'Dog',
            customerName: b.customerName || 'Pet Owner',
            phone: b.phone || b.customerEmail || '+91 98212 34567',
            date: b.date || new Date().toISOString().split('T')[0],
            timeSlot: b.timeSlot || b.time || 'Walk-In',
            amount: b.price || b.amount || 500,
            total: b.price || b.amount || 500,
            status: b.status || 'Confirmed',
            stepIndex: b.stepIndex !== undefined ? b.stepIndex : 0,
            notes: b.notes || 'Dog wash & hydrobath session scheduled.',
            photos: b.photos || [],
            staffId: b.staffId || currentStaff?.id || 'STF-07',
            staffName: b.staffName || currentStaff?.name || 'Sneha Rao'
          }));
        }
      }
    } catch (e) {}

    let localSalonJobs = [];
    try {
      const storedSalon = localStorage.getItem('salon_bookings') || localStorage.getItem('shine_salon_bookings');
      if (storedSalon) {
        const parsedSalon = JSON.parse(storedSalon);
        if (Array.isArray(parsedSalon)) {
          localSalonJobs = parsedSalon.map((b, idx) => ({
            _id: b.id || b.bookingId || `BK-SAL-${idx}`,
            id: b.bookingId || b.id || `BK-${7000 + idx}`,
            serviceKey: 'salon',
            serviceName: b.serviceName || 'Men\'s Salon',
            planName: b.packageName || b.package || b.service || 'Executive Haircut',
            vehicleNo: b.vehicleNo || (b.stylist ? `Stylist: ${b.stylist}` : 'Any Specialist'),
            vehicleModel: 'Salon Client',
            vehicleType: 'Salon Client',
            customerName: resolveCustomerName(b, idx, 'Salon Client'),
            phone: b.phone || b.customerEmail || '+91 98210 77777',
            date: b.date || new Date().toISOString().split('T')[0],
            timeSlot: b.timeSlot || (b.date && b.time ? `${b.date} | ${b.time}` : (b.time || '01:30 PM')),
            amount: b.price || b.total || b.amount || 499,
            total: b.price || b.total || b.amount || 499,
            status: b.status === 'Upcoming' ? 'Confirmed' : (b.status || 'Confirmed'),
            stepIndex: b.stepIndex !== undefined ? b.stepIndex : 0,
            notes: b.notes || 'Salon appointment scheduled.',
            photos: b.photos || [],
            staffId: b.staffId || b.assignedStaffId || '',
            staffName: b.assignedStaffName || b.stylist || b.staffName || ''
          }));
        }
      }
    } catch (e) {}

    // A job already returned by the API must not be duplicated by its local
    // storage mirror — the mirror carries only the display id as its _id.
    const apiIds = new Set(apiMapped.flatMap(j => [j.id, j._id].filter(Boolean)));
    const notAlreadyLive = (j) => !apiIds.has(j.id) && !apiIds.has(j._id);

    const combined = [
      ...apiMapped,
      ...localDetailingJobs.filter(notAlreadyLive),
      ...localDogJobs.filter(notAlreadyLive),
      ...localSalonJobs.filter(notAlreadyLive)
    ];
    const finalJobsList = combined.length > 0 ? combined : mockAssignedJobs;
    setJobs(finalJobsList);
  };

  const fetchLiveCustomers = async () => {
    try {
      const res = await apiClient.get('/users/customers');
      if (res.data && res.data.customers) {
        const mapped = res.data.customers.map((c, idx) => {
          const emailLower = (c.email || '').toLowerCase().trim();
          const nameLower = (c.fullName || c.name || '').toLowerCase().trim();
          
          let userVehicles = (c.vehicles && c.vehicles.length > 0) ? c.vehicles : [];

          if (userVehicles.length === 0) {
            if (emailLower.includes('prabhat') || nameLower.includes('prabhat')) {
              userVehicles = [
                { id: 'v-prabhat-1', registrationNumber: 'MP09WC4444', brand: 'Hyundai', model: 'Elite i20', color: 'White', fuelType: 'Petrol' }
              ];
            } else if (emailLower.includes('jawade') || nameLower.includes('prathmesh')) {
              userVehicles = [
                { id: 'v-prathmesh-1', registrationNumber: 'DL09AC4444', brand: 'BMW', model: 'M4', color: 'Black', fuelType: 'Petrol' }
              ];
            } else if (emailLower.includes('harsh') || nameLower.includes('harsh')) {
              userVehicles = [
                { id: 'v-harsh-1', registrationNumber: 'MH02CP4455', brand: 'Hyundai', model: 'Creta', color: 'Silver', fuelType: 'Petrol' }
              ];
            } else if (emailLower.includes('mohit') || nameLower.includes('mohit')) {
              userVehicles = [
                { id: 'v-mohit-1', registrationNumber: 'MH04AB1234', brand: 'Honda', model: 'City', color: 'Grey', fuelType: 'Petrol' }
              ];
            } else if (c.vehicleNo) {
              userVehicles = [
                { id: `v-${c._id || idx}`, registrationNumber: c.vehicleNo.toUpperCase(), brand: c.vehicleType || 'Car', model: 'Standard', color: 'White', fuelType: 'Petrol' }
              ];
            } else {
              const num = 1000 + ((emailLower + nameLower).split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % 8999);
              userVehicles = [
                { id: `v-${c._id || idx}`, registrationNumber: `MH02AB${num}`, brand: 'Toyota', model: 'Fortuner', color: 'White', fuelType: 'Petrol' }
              ];
            }
          }

          return {
            id: c.email || c._id,
            name: c.fullName || c.name || 'Customer',
            fullName: c.fullName || c.name || 'Customer',
            email: c.email,
            mobile: c.mobile || '',
            phone: c.mobile || '',
            role: c.role,
            segment: c.segment || 'Regular',
            vehicles: userVehicles,
            activePassesCount: 0
          };
        });
        setCustomers(mapped);
      }
    } catch (err) {
      console.warn('Could not fetch customers from database in StaffContext:', err.message);
    }
  };

  useEffect(() => {
    if (!currentStaff) return;

    if (currentStaff.id && !currentStaff.id.toString().startsWith('STF-')) {
      fetchLiveAttendance(currentStaff.id);
    }
    fetchLiveJobs();
    fetchLiveCustomers();

    // Poll so orders placed by customers land in the queue without a refresh.
    const interval = setInterval(fetchLiveJobs, 10000);
    return () => clearInterval(interval);
  }, [currentStaff]);

  // Camera Modal State
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraPurpose, setCameraPurpose] = useState('check-in'); // 'check-in' | 'job-photo' | 'inspection'
  const [onCaptureCallback, setOnCaptureCallback] = useState(null);

  // Toast Notification State
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Staff Login Handler
  const loginStaff = (employeeId, password) => {
    const found = mockStaffMembers.find(s => s.employeeId.toLowerCase() === employeeId.toLowerCase());
    if (found) {
      setCurrentStaff(found);
      setIsAuthenticated(true);
      showToast(`Welcome back, ${found.name}! (${found.role})`, 'success');
      return true;
    } else {
      // Fallback: Login with default
      setCurrentStaff(mockStaffMembers[2]);
      setIsAuthenticated(true);
      showToast(`Logged in as ${mockStaffMembers[2].name} (${mockStaffMembers[2].role})`, 'success');
      return true;
    }
  };

  // Logout Handler
  const logoutStaff = () => {
    setIsAuthenticated(false);
    showToast('Logged out successfully', 'info');
  };

  // Check In Handler with Photo
  const processCheckIn = async (photoUrl) => {
    try {
      const res = await apiClient.post('/attendance/check-in', {
        photoUrl,
        location: '19.0760° N, 72.8777° E (Main Branch)'
      });
      if (res.data && res.data.success) {
        setIsCheckedIn(true);
        setCheckInPhoto(photoUrl);
        const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setCheckInTime(timeNow);
        showToast('Check-In Successful! Selfie & Location Logged.', 'success');
        fetchLiveAttendance(currentStaff.id);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Check-in failed.', 'error');
    }
  };

  // Check Out Handler
  const processCheckOut = async () => {
    try {
      const res = await apiClient.post('/attendance/check-out');
      if (res.data && res.data.success) {
        setIsCheckedIn(false);
        showToast('Checked-Out Successfully. Shift logged.', 'info');
        fetchLiveAttendance(currentStaff.id);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Check-out failed.', 'error');
    }
  };

  // Update Job Status Stepper
  const updateJobStatus = async (jobId, newStatus, newStepIndex, notes = '', photoUrl = null) => {
    const ALL_STEPS = [
      'Confirmed',
      'Received',
      'Inspected',
      'Started',
      'In Progress',
      'Quality Check',
      'Ready',
      'Delivered'
    ];

    const matchesJob = (job) => job.id === jobId || job._id === jobId;
    const existingJob = jobs.find(matchesJob);
    if (!existingJob) {
      console.warn(`Job ${jobId} not found in state.`);
      return;
    }

    const jobService = existingJob.serviceKey;
    const finalStepIndex = SERVICE_FINAL_STEP_INDEX[jobService] ?? 7;

    const isCompleted = newStepIndex >= finalStepIndex || newStatus?.toLowerCase() === 'delivered' || newStatus?.toLowerCase() === 'completed';
    const computedStatus = isCompleted ? 'Completed' : (newStatus || ALL_STEPS[newStepIndex]);

    const updatedPhotos = photoUrl ? [...(existingJob.photos || []), photoUrl] : existingJob.photos;
    const updatedTargetJob = {
      ...existingJob,
      status: computedStatus,
      stepIndex: newStepIndex,
      notes: notes || existingJob.notes,
      photos: updatedPhotos
    };

    // The same job can appear twice — once from the API and once from a local
    // storage mirror whose _id is only the display id — so lock onto the
    // database-backed copy first and never let the mirror overwrite it.
    const isMongoId = (val) => /^[a-f\d]{24}$/i.test(String(val || ''));
    const preferredId =
      jobs.find(job => matchesJob(job) && isMongoId(job._id))?._id || null;

    // 1. Optimistically update local jobs state and persist tsl_staff_jobs_sync
    setJobs(prev => {
      const nextJobs = prev.map(job => {
        if (matchesJob(job)) {
          return updatedTargetJob;
        }
        return job;
      });

      try {
        localStorage.setItem('tsl_staff_jobs_sync', JSON.stringify(nextJobs));
      } catch (e) {}

      return nextJobs;
    });

    showToast(`Job ${jobId} updated to "${newStatus}"`, 'success');

    // 2. Persist to local storage shine_car_detailing_bookings and build updated timeline for user tracking.
    // Only detailing jobs belong in this mirror — writing other services here
    // re-imports them as phantom detailing jobs on the next poll.
    const isDetailingJob = updatedTargetJob.serviceKey === 'car-detailing';
    if (isDetailingJob) {
      try {
        const stored = localStorage.getItem('shine_car_detailing_bookings');
        let parsed = stored ? JSON.parse(stored) : [];
        if (!Array.isArray(parsed)) parsed = [];

        const updatedTimeline = ALL_STEPS.map((stepLabel, idx) => ({
          status: stepLabel,
          time: idx <= newStepIndex ? (idx === newStepIndex ? `Active Phase (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})` : 'Done') : 'Pending',
          active: idx <= newStepIndex
        }));

        const matchedIndex = parsed.findIndex(b => b.id === jobId || b._id === jobId);

        if (matchedIndex !== -1) {
          parsed[matchedIndex] = {
            ...parsed[matchedIndex],
            status: computedStatus,
            stepIndex: newStepIndex,
            technician: currentStaff?.name || 'suryansh',
            timeline: updatedTimeline
          };
        } else {
          const newEntry = {
            id: jobId,
            status: computedStatus,
            stepIndex: newStepIndex,
            technician: currentStaff?.name || 'suryansh',
            package: updatedTargetJob?.planName || updatedTargetJob?.serviceName || 'Car Detailing Treatment',
            price: updatedTargetJob?.total || updatedTargetJob?.amount || 2348,
            customerName: updatedTargetJob?.customerName || 'Car Owner',
            vehicle: updatedTargetJob?.vehicleModel || 'Vehicle',
            vehicleNo: updatedTargetJob?.vehicleNo || 'MP092545',
            timeline: updatedTimeline
          };
          parsed.unshift(newEntry);
        }

        localStorage.setItem('shine_car_detailing_bookings', JSON.stringify(parsed));
      } catch (e) {}
    }

    // Dispatch global data changed events & broadcast live sync so user live tracking page updates immediately!
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('carDetailingDataChanged'));
      window.dispatchEvent(new Event('storage'));
      try {
        const bc = new BroadcastChannel('tsl_live_sync');
        bc.postMessage({ type: 'JOB_UPDATED', jobId, newStepIndex, computedStatus });
        bc.close();
      } catch (e) {}
    }

    // 3. Call PUT /bookings/:id in backend
    try {
      // Prefer the Mongo _id; otherwise send the booking id, which the API
      // resolves too. Never send a local-mirror _id that is neither.
      const targetId = preferredId
        || (isMongoId(updatedTargetJob?._id) ? updatedTargetJob._id : null)
        || updatedTargetJob?.id
        || jobId;
      if (targetId) {
        await apiClient.put(`/bookings/${targetId}`, {
          status: computedStatus,
          stepIndex: newStepIndex,
          notes: notes || updatedTargetJob?.notes,
          photoUrl
        });
      }
    } catch (err) {
      console.warn('Error updating job status in backend:', err.message);
    }
  };

  // Add New Customer
  const addCustomer = (customerData) => {
    const newCust = {
      id: `CUST-${Date.now().toString().slice(-3)}`,
      ...customerData,
      serviceKey: customerData.serviceKey || currentStaff?.serviceKey,
      totalSpent: 0,
      loyaltyPoints: 100,
      joinDate: new Date().toISOString().split('T')[0],
      lastVisit: new Date().toISOString().split('T')[0]
    };
    setCustomers(prev => [newCust, ...prev]);
    showToast(`Registered new customer ${customerData.name}`, 'success');
    return newCust;
  };

  // Filter Jobs Relevant strictly to Logged In Staff Role & Department
  const staffJobs = jobs.filter(job => {
    if (currentStaff.serviceKey === 'global' || currentStaff.role === 'Super Admin' || currentStaff.role === 'Branch Manager' || currentStaff.role === 'Cashier') {
      return true;
    }
    return job.serviceKey === currentStaff.serviceKey;
  });

  // Filter Customers strictly relevant to the logged-in staff's serviceKey
  const getDigits = (str) => (str || '').replace(/[^\d]/g, '');
  const staffCustomers = customers.filter(c => {
    if (
      !currentStaff ||
      currentStaff.serviceKey === 'global' ||
      currentStaff.role === 'Super Admin' ||
      currentStaff.role === 'Branch Manager' ||
      currentStaff.role === 'Cashier'
    ) {
      return true;
    }

    // 1. Check if the customer matches the active staff's serviceKey
    if (c.serviceKey === currentStaff.serviceKey) return true;

    // 2. Check if the customer has at least one booking in `staffJobs`
    const custEmail = (c.email || c.id || '').toLowerCase().trim();
    const custName = (c.name || c.fullName || '').toLowerCase().trim();
    const custDigits = getDigits(c.mobile || c.phone);

    return staffJobs.some(b => {
      const bEmail = (b.customerEmail || '').toLowerCase().trim();
      const bName = (b.customerName || '').toLowerCase().trim();
      const bDigits = getDigits(b.phone);

      const emailMatch = custEmail && bEmail === custEmail;
      const nameMatch = custName && bName === custName;
      const phoneMatch = custDigits && bDigits && (custDigits.endsWith(bDigits) || bDigits.endsWith(custDigits));

      return emailMatch || nameMatch || phoneMatch;
    });
  });

  return (
    <StaffContext.Provider
      value={{
        currentStaff,
        setCurrentStaff,
        isAuthenticated,
        loginStaff,
        logoutStaff,
        jobs: staffJobs,
        allJobs: jobs,
        updateJobStatus,
        customers: staffCustomers,
        allCustomers: customers,
        addCustomer,
        attendance,
        isCheckedIn,
        checkInPhoto,
        checkInTime,
        processCheckIn,
        processCheckOut,
        notifications,
        isCameraOpen,
        setIsCameraOpen,
        cameraPurpose,
        setCameraPurpose,
        onCaptureCallback,
        setOnCaptureCallback,
        toast,
        showToast
      }}
    >
      {children}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full text-xs font-bold text-white shadow-lg flex items-center gap-2 transition-all animate-bounce"
          style={{ backgroundColor: toast.type === 'error' ? '#ef4444' : toast.type === 'info' ? '#1e4a7e' : '#e07b2a' }}>
          <span>{toast.message}</span>
        </div>
      )}
    </StaffContext.Provider>
  );
}

export function useStaff() {
  return useContext(StaffContext);
}
