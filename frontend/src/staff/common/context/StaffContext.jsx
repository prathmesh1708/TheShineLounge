import React, { createContext, useContext, useState, useEffect } from 'react';
import { mockStaffMembers, mockAssignedJobs, mockCustomers, mockAttendanceRecords, mockStaffNotifications } from '../data/staffMockData';
import apiClient from '../../../common/utils/apiClient';

const StaffContext = createContext();

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

  // Sync staff context whenever localStorage tsl_user changes or mounts
  useEffect(() => {
    const syncStaffUser = () => {
      try {
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
  }, []);

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
        apiMapped = res.data.bookings.map(b => {
          const sName = (b.serviceName || b.plan || b.packageName || '').toLowerCase();
          const pName = (b.packageName || b.package || '').toLowerCase();
          const vType = (b.vehicleType || '').toLowerCase();

          let resolvedKey = b.serviceKey;
          if (!resolvedKey) {
            if (sName.includes('dog') || sName.includes('pet') || sName.includes('groom') || sName.includes('hydrobath') || pName.includes('dog') || vType.includes('dog')) {
              resolvedKey = 'dog-wash';
            } else if (sName.includes('salon') || sName.includes('hair') || sName.includes('barber') || pName.includes('salon')) {
              resolvedKey = 'salon';
            } else if (sName.includes('cafe') || sName.includes('coffee') || sName.includes('drive')) {
              resolvedKey = 'cafe';
            } else if (sName.includes('detail') || pName.includes('detail') || pName.includes('ceramic') || pName.includes('ppf')) {
              resolvedKey = 'car-detailing';
            } else {
              resolvedKey = 'car-wash';
            }
          }

          return {
            _id: b._id,
            id: b.bookingId || b.id || `BK-${b._id?.slice(-4)}`,
            serviceKey: resolvedKey,
            serviceName: b.serviceName || b.plan || b.package || (resolvedKey === 'dog-wash' ? 'Dog Wash' : 'Car Wash'),
            planName: b.packageName || b.package || b.serviceName || (resolvedKey === 'dog-wash' ? 'Dog Hydrobath Spa' : 'Car Wash'),
            itemsSummary: b.itemsSummary || b.packageName || 'Service Order',
            items: b.items || [],
            vehicleNo: b.vehicleNo || (resolvedKey === 'dog-wash' ? 'Max (Golden Retriever)' : 'MH02CD5678'),
            vehicleModel: b.vehicleType || b.vehicle || (resolvedKey === 'dog-wash' ? 'Pet' : 'Car'),
            vehicleType: b.vehicleType || (resolvedKey === 'dog-wash' ? 'Dog' : 'Car'),
            customerName: b.customerName || b.user || 'Customer',
            phone: b.customerEmail || b.phone || b.mobile || '+91 98200 12345',
            date: b.date || new Date().toISOString().split('T')[0],
            timeSlot: b.timeSlot || b.time || '02:00 PM',
            amount: b.price || b.amount || (resolvedKey === 'dog-wash' ? 500 : 699),
            total: b.price || b.amount || (resolvedKey === 'dog-wash' ? 500 : 699),
            status: b.status || 'Confirmed',
            stepIndex: b.stepIndex !== undefined ? b.stepIndex : 0,
            notes: b.notes || '',
            photos: b.photos || [],
            staffId: b.assignedStaffId || 'STF-LIVE',
            staffName: b.assignedStaffName || 'Specialist'
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

    const combined = [...apiMapped, ...localDetailingJobs, ...localDogJobs];
    const finalJobsList = combined.length > 0 ? combined : mockAssignedJobs;
    setJobs(finalJobsList);
  };

  const fetchLiveCustomers = async () => {
    try {
      const res = await apiClient.get('/users/customers');
      if (res.data && res.data.customers) {
        const mapped = res.data.customers.map(c => ({
          id: c.email || c._id,
          name: c.fullName,
          fullName: c.fullName,
          email: c.email,
          mobile: c.mobile || '',
          phone: c.mobile || '',
          role: c.role,
          vehicleNo: 'MH-02-CP-4455',
          activePassesCount: 0
        }));
        setCustomers(mapped);
      }
    } catch (err) {
      console.warn('Could not fetch customers from database in StaffContext:', err.message);
    }
  };

  useEffect(() => {
    if (currentStaff) {
      if (currentStaff.id && !currentStaff.id.toString().startsWith('STF-')) {
        fetchLiveAttendance(currentStaff.id);
      }
      fetchLiveJobs();
      fetchLiveCustomers();
    }
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

    const isCompleted = newStepIndex >= 7 || newStatus?.toLowerCase() === 'delivered' || newStatus?.toLowerCase() === 'completed';
    const computedStatus = isCompleted ? 'Completed' : (newStatus || ALL_STEPS[newStepIndex]);

    let updatedTargetJob = null;

    // 1. Optimistically update local jobs state and persist tsl_staff_jobs_sync
    setJobs(prev => {
      const nextJobs = prev.map(job => {
        if (job.id === jobId || job._id === jobId) {
          const updatedPhotos = photoUrl ? [...(job.photos || []), photoUrl] : job.photos;
          const uJob = {
            ...job,
            status: computedStatus,
            stepIndex: newStepIndex,
            notes: notes || job.notes,
            photos: updatedPhotos
          };
          updatedTargetJob = uJob;
          return uJob;
        }
        return job;
      });

      try {
        localStorage.setItem('tsl_staff_jobs_sync', JSON.stringify(nextJobs));
      } catch (e) {}

      return nextJobs;
    });

    showToast(`Job ${jobId} updated to "${newStatus}"`, 'success');

    // 2. Persist to local storage shine_car_detailing_bookings and build updated timeline for user tracking
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
      const match = jobs.find(j => j.id === jobId || j._id === jobId);
      if (match && match._id) {
        await apiClient.put(`/bookings/${match._id}`, {
          status: computedStatus,
          stepIndex: newStepIndex,
          notes: notes || match.notes,
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
        customers,
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
