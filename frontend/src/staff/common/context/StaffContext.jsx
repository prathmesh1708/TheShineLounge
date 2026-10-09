import { mirrorToastToDevice } from '../../../common/services/pushNotificationService';
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import apiClient from '../../../common/utils/apiClient';
import userService from '../../../common/services/userService';
import { useAuth } from '../../../common/context/AuthContext';
import { uploadToCloudinary } from '../../../common/utils/cloudinaryUpload';
import { normalizePermissions, permissionsAllow, samePermissions } from '../../../common/utils/staffPermissions';

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
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      permissions: normalizePermissions(undefined)
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

  const fullName = u.fullName || u.name || (u.email ? u.email.split('@')[0] : 'Staff Member');
  const staffRole = u.staffRole || (u.role === 'staff' ? (dept || 'Staff Specialist') : u.role) || 'Staff Specialist';
  // The Staff collection stores the number as `mobile`; older payloads used `phone`.
  const mobile = u.mobile || u.phone || '';

  return {
    id: u._id || u.id || 'STF-LIVE',
    // The STF-xxx code the admin sees in the department hub.
    staffId: u.staffId || '',
    employeeId: u.staffId || u.employeeId || u.email || '',
    name: fullName,
    fullName,
    role: staffRole,
    staffRole,
    department: dept,
    serviceKey: key,
    email: u.email || '',
    mobile,
    phone: mobile,
    photo: u.photo || u.profileImage || u.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    avatar: u.photo || u.profileImage || u.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    shiftStartTime: u.shiftStartTime || '09:00',
    shiftEndTime: u.shiftEndTime || '18:00',
    shiftTiming: u.shiftTiming || '09:00 AM - 06:00 PM',
    // Exactly what the admin saved; only a record with no array at all gets
    // the legacy hub default (see utils/staffPermissions).
    permissions: normalizePermissions(u.permissions)
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
  const { user: authUser, updateUser } = useAuth();
  // The break poll below is set up once per staff member; read the latest auth
  // user through a ref so a permission change isn't compared against a stale copy.
  const authUserRef = useRef(authUser);
  authUserRef.current = authUser;

  useEffect(() => {
    const syncStaffUser = () => {
      try {
        let newStaff = null;
        if (authUser && authUser.role === 'staff') {
          newStaff = formatStaffUser(authUser);
        } else {
          const stored = localStorage.getItem('tsl_user');
          if (stored) {
            const u = JSON.parse(stored);
            if (u && u.role === 'staff') {
              newStaff = formatStaffUser(u);
            }
          }
        }
        if (!newStaff) newStaff = formatStaffUser(null);

        setCurrentStaff(prev => {
          if (prev && JSON.stringify(prev) === JSON.stringify(newStaff)) {
            return prev;
          }
          return newStaff;
        });
        setIsAuthenticated(true);
      } catch (err) {
        console.warn('Sync staff error:', err);
      }
    };

    syncStaffUser();
    window.addEventListener('storage', syncStaffUser);
    return () => window.removeEventListener('storage', syncStaffUser);
  }, [authUser]);

  // State
  const [jobs, setJobs] = useState([]);
  const [allStaff, setAllStaff] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [vehicleRegistry, setVehicleRegistry] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [notifications, setNotifications] = useState([]);
  
  // Check-In State
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInPhoto, setCheckInPhoto] = useState('');
  const [checkInTime, setCheckInTime] = useState('');

  // Break lifecycle synced with MongoDB: idle -> pending (scheduled or admin
  // assigned) -> active (staff tapped Start) -> idle (staff/admin ended it).
  // Past its end time a break stays active and counts overtime; it never ends
  // on its own.
  const [breakStatus, setBreakStatus] = useState({
    status: 'idle',
    isOnBreak: false,
    breakStartTime: null,
    breakEndTime: null,
    breakDuration: 30,
    breakReason: 'Rest / Lunch Break',
    breakLabel: '',
    breakScheduledTime: '',
    remainingSeconds: 0,
    isOvertime: false,
    overtimeSeconds: 0
  });
  const [isStartingBreak, setIsStartingBreak] = useState(false);
  const [isEndingBreak, setIsEndingBreak] = useState(false);

  // Only drives the "break ended" summary popup; the pending popup is derived from breakStatus.status
  const [breakAlertModal, setBreakAlertModal] = useState({
    isOpen: false,
    type: 'completed',
    title: '',
    message: '',
    duration: 30,
    returnTime: '',
    overtimeSeconds: 0,
    actualSeconds: 0
  });

  const prevBreakStatusRef = useRef('idle');
  const [todayBreakLogs, setTodayBreakLogs] = useState([]);

  // The break poll returns the staff record every few seconds, so profile
  // details and module access the admin changes (in Manage Staff or a
  // department hub) reach this app within moments, without a re-login.
  const PROFILE_FIELDS = ['fullName', 'email', 'mobile', 'staffId', 'staffRole', 'department', 'serviceKey', 'photo', 'profileImage', 'shiftStartTime', 'shiftEndTime', 'shiftTiming'];
  const syncProfileFromServer = (staffDoc) => {
    const current = authUserRef.current;
    if (!staffDoc) return;

    if (staffDoc.shiftStartTime || staffDoc.shiftEndTime || staffDoc.shiftTiming) {
      setCurrentStaff(prev => ({
        ...prev,
        shiftStartTime: staffDoc.shiftStartTime || prev?.shiftStartTime || '09:00',
        shiftEndTime: staffDoc.shiftEndTime || prev?.shiftEndTime || '18:00',
        shiftTiming: staffDoc.shiftTiming || prev?.shiftTiming || '09:00 AM - 06:00 PM'
      }));
    }

    if (!current || current.role !== 'staff') return;

    const patch = {};
    for (const field of PROFILE_FIELDS) {
      if (staffDoc[field] !== undefined && staffDoc[field] !== current[field]) patch[field] = staffDoc[field];
    }
    const permissionsChanged = Array.isArray(staffDoc.permissions)
      && !samePermissions(staffDoc.permissions, current.permissions);
    if (permissionsChanged) patch.permissions = staffDoc.permissions;
    if (Object.keys(patch).length === 0) return;

    updateUser({ ...current, ...patch });
    if (permissionsChanged) showToast('Your module access was updated by the admin.', 'info');
  };
  // Breaks (keyed by end time) whose "time is over" alert already played here.
  const overtimeAlertedRef = useRef(new Set());
  // Server clock minus device clock, from each poll's serverNow. A phone whose
  // clock is a few minutes off would otherwise show the wrong countdown.
  const clockOffsetRef = useRef(0);

  const serverNowMs = () => Date.now() + clockOffsetRef.current;

  const getStaffTargetId = () => currentStaff?.id || currentStaff?._id || currentStaff?.email;

  const broadcastStaffUpdate = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tsl_staff_updated'));
      window.dispatchEvent(new Event('storage'));
      try {
        localStorage.setItem('tsl_staff_updated_event', Date.now().toString());
      } catch (e) {}
    }
  };

  const playBreakAudio = (type = 'start') => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (type === 'completed') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(587.33, now);
        osc.frequency.setValueAtTime(880, now + 0.15);
        osc.frequency.setValueAtTime(1174.66, now + 0.3);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
        osc.start(now);
        osc.stop(now + 0.6);
      } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.15);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
      }
    } catch (err) {
      // AudioContext blocked before user gesture
    }
  };

  // { remainingSeconds, isOvertime, overtimeSeconds } for a break ending at endTime.
  const breakClock = (endTime) => {
    const endMs = endTime ? new Date(endTime).getTime() : NaN;
    if (Number.isNaN(endMs)) return { remainingSeconds: 0, isOvertime: false, overtimeSeconds: 0 };
    const signed = endMs - serverNowMs();
    return signed > 0
      ? { remainingSeconds: Math.ceil(signed / 1000), isOvertime: false, overtimeSeconds: 0 }
      : { remainingSeconds: 0, isOvertime: true, overtimeSeconds: Math.floor(-signed / 1000) };
  };

  // First time this device sees a break run over: one chime and a toast. The
  // break keeps running until the staff (or admin) ends it.
  const noteOvertime = (endTime) => {
    const key = String(endTime || '');
    if (!key || overtimeAlertedRef.current.has(key)) return;
    overtimeAlertedRef.current.add(key);
    playBreakAudio('completed');
    showToast('⏰ Break time is over — tap End Break when you are back.', 'error');
  };

  const formatMmSs = (totalSeconds) => {
    const s = Math.max(0, Math.floor(Number(totalSeconds) || 0));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = String(s % 60).padStart(2, '0');
    return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${String(m).padStart(2, '0')}:${sec}`;
  };

  const resetBreakToIdle = (duration, reason) => {
    prevBreakStatusRef.current = 'idle';
    setBreakStatus(prev => ({
      ...prev,
      status: 'idle',
      isOnBreak: false,
      breakStartTime: null,
      breakEndTime: null,
      breakDuration: duration ?? prev.breakDuration,
      breakReason: reason ?? prev.breakReason,
      breakLabel: '',
      breakScheduledTime: '',
      remainingSeconds: 0,
      isOvertime: false,
      overtimeSeconds: 0
    }));
  };

  // Applies a server snapshot and reacts to state transitions (assigned, cancelled, ended)
  const applyBreakSnapshot = (snap) => {
    if (snap.serverNow) {
      const serverMs = Date.parse(snap.serverNow);
      if (!Number.isNaN(serverMs)) clockOffsetRef.current = serverMs - Date.now();
    }

    const status = snap.breakStatus || (snap.isOnBreak ? 'active' : 'idle');
    const prevStatus = prevBreakStatusRef.current;
    const duration = snap.breakDuration || 30;
    const reason = snap.breakReason || 'Rest / Lunch Break';
    const label = snap.label || reason;

    if (status === 'active') {
      // Past the end time is still active: the clock flips to overtime.
      const clock = breakClock(snap.breakEndTime);
      if (clock.isOvertime) noteOvertime(snap.breakEndTime);
      prevBreakStatusRef.current = 'active';
      setBreakStatus(prev => ({
        status: 'active',
        isOnBreak: true,
        breakStartTime: snap.breakStartTime,
        breakEndTime: snap.breakEndTime,
        breakDuration: duration,
        breakReason: reason,
        breakLabel: snap.label || prev.breakLabel || reason,
        breakScheduledTime: snap.scheduledTime ?? prev.breakScheduledTime ?? '',
        ...clock
      }));
      return;
    }

    if (status === 'pending') {
      if (prevStatus !== 'pending') playBreakAudio('start');
      prevBreakStatusRef.current = 'pending';
      setBreakStatus({
        status: 'pending',
        isOnBreak: false,
        breakStartTime: null,
        breakEndTime: null,
        breakDuration: duration,
        breakReason: reason,
        breakLabel: label,
        breakScheduledTime: snap.scheduledTime || '',
        remainingSeconds: 0,
        isOvertime: false,
        overtimeSeconds: 0
      });
      return;
    }

    // idle
    if (prevStatus === 'active') {
      // Ended somewhere else (admin, another device, or the server's safety cap)
      showToast('Your break was ended. Welcome back!', 'info');
    } else if (prevStatus === 'pending') {
      showToast('Your break was cancelled or has expired.', 'info');
    }
    resetBreakToIdle(duration, reason);
  };

  const fetchLiveBreakStatus = async (staffId) => {
    const targetId = staffId || getStaffTargetId();
    if (!targetId) return;
    try {
      const res = await userService.getStaffBreakStatus(targetId);
      if (res && res.success) {
        applyBreakSnapshot(res);
        setTodayBreakLogs(Array.isArray(res.todayLogs) ? res.todayLogs : []);
        syncProfileFromServer(res.staff);
      }
    } catch (err) {
      console.warn('Error fetching live break status from MongoDB:', err.message);
    }
  };

  // Staff tapped "Start" on a scheduled or admin-assigned break; the countdown begins now
  const startStaffBreak = async () => {
    const targetId = getStaffTargetId();
    if (!targetId || isStartingBreak) return;
    setIsStartingBreak(true);
    try {
      const res = await userService.updateStaffBreak(targetId, { action: 'start' });
      if (res.success && res.staff) {
        applyBreakSnapshot({ ...res.staff, breakStatus: res.breakStatus || 'active' });
        showToast(`☕ Break started (${res.staff.breakDuration || 30} minutes)`, 'info');
        broadcastStaffUpdate();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to start break', 'error');
      fetchLiveBreakStatus(targetId);
    } finally {
      setIsStartingBreak(false);
    }
  };

  // The only way a break ends from this app. The server measures the time
  // taken and the overtime; the summary popup reports what it recorded.
  const endStaffBreak = async () => {
    const targetId = getStaffTargetId();
    if (!targetId || isEndingBreak) return;
    setIsEndingBreak(true);
    const allowedMinutes = breakStatus.breakDuration || 30;
    try {
      const res = await userService.updateStaffBreak(targetId, { action: 'end' });
      if (res.success) {
        resetBreakToIdle();
        const over = Number(res.overtimeSeconds) || 0;
        const took = formatMmSs(res.actualSeconds);
        const allowed = Number(res.allowedMinutes) || allowedMinutes;
        playBreakAudio('start');
        setBreakAlertModal({
          isOpen: true,
          type: 'completed',
          title: over > 0 ? '⏰ Break Ended — Over Time' : '✅ Break Ended On Time',
          message: over > 0
            ? `You took ${took} — ${formatMmSs(over)} over your ${allowed}-min break.`
            : `You took ${took} — on time for your ${allowed}-min break.`,
          duration: allowed,
          returnTime: 'Now',
          overtimeSeconds: over,
          actualSeconds: Number(res.actualSeconds) || 0
        });
        broadcastStaffUpdate();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to end break', 'error');
      fetchLiveBreakStatus(targetId);
    } finally {
      setIsEndingBreak(false);
    }
  };

  const dismissBreakAlertModal = () => {
    setBreakAlertModal(prev => ({ ...prev, isOpen: false }));
  };

  // 1-second clock while the break is active: counts down to the end time, then
  // keeps going as overtime until the server says the break is over.
  useEffect(() => {
    if (breakStatus.status !== 'active' || !breakStatus.breakEndTime) return;
    const endTime = breakStatus.breakEndTime;

    const tick = () => {
      const clock = breakClock(endTime);
      if (clock.isOvertime) noteOvertime(endTime);
      setBreakStatus(prev => (prev.status === 'active' && prev.breakEndTime === endTime ? { ...prev, ...clock } : prev));
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [breakStatus.status, breakStatus.breakEndTime]);

  const fetchStaffNotifications = async () => {
    try {
      const res = await apiClient.get('/notifications/staff');
      if (res.data && Array.isArray(res.data.notifications)) {
        setNotifications(res.data.notifications);
      }
    } catch (err) {
      console.warn('Could not fetch staff notifications from MongoDB:', err.message);
    }
  };

  // Shift end alert tracking ref so we only alert once per day per staff session
  const shiftEndAlertedDayRef = useRef('');

  const checkShiftEndAlert = async () => {
    const staff = authUserRef.current;
    if (!staff || staff.role !== 'staff') return;

    const endTime = staff.shiftEndTime || '18:00';
    const match = String(endTime).trim().match(/^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/);
    if (!match) return;

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const [endHour, endMin] = [parseInt(match[1], 10), parseInt(match[2], 10)];

    const isAfterOrAtShiftEnd = (currentHour > endHour) || (currentHour === endHour && currentMinute >= endMin);
    const todayKeyStr = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;

    const staffId = staff._id || staff.id || staff.email;
    const storageKey = `tsl_shift_end_notified_${staffId}_${todayKeyStr}`;
    let alreadyNotified = shiftEndAlertedDayRef.current === todayKeyStr;
    try {
      if (!alreadyNotified && localStorage.getItem(storageKey) === 'true') {
        alreadyNotified = true;
      }
    } catch (e) {}

    if (isAfterOrAtShiftEnd && !alreadyNotified) {
      shiftEndAlertedDayRef.current = todayKeyStr;
      try { localStorage.setItem(storageKey, 'true'); } catch (e) {}

      const formattedShift = staff.shiftTiming || `${endTime}`;
      showToast(`⏰ Shift Ended: Your shift (${formattedShift}) has completed for today. Please complete pending tasks and punch out.`, 'info');
      playBreakAudio('start');

      // Post notification to MongoDB
      try {
        const targetStaffId = staff._id || staff.id;
        await apiClient.post('/notifications/shift-end', {
          staffId: targetStaffId,
          shiftTiming: formattedShift,
          serviceKey: staff.serviceKey || 'car-wash'
        });
        fetchStaffNotifications();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('tsl_staff_updated'));
        }
      } catch (postErr) {
        console.warn('Could not post shift-end notification to MongoDB:', postErr.message);
      }
    }
  };

  // Fast MongoDB poll every 2.5 seconds + live event listeners for immediate sync
  useEffect(() => {
    const targetId = getStaffTargetId();
    if (!targetId) return;

    fetchLiveBreakStatus(targetId);
    checkShiftEndAlert();
    fetchStaffNotifications();

    const poller = setInterval(() => {
      fetchLiveBreakStatus(targetId);
      checkShiftEndAlert();
    }, 2500);

    const handleStaffBreakSync = () => {
      fetchLiveBreakStatus(targetId);
      checkShiftEndAlert();
      fetchStaffNotifications();
    };

    window.addEventListener('tsl_staff_updated', handleStaffBreakSync);
    window.addEventListener('storage', handleStaffBreakSync);

    return () => {
      clearInterval(poller);
      window.removeEventListener('tsl_staff_updated', handleStaffBreakSync);
      window.removeEventListener('storage', handleStaffBreakSync);
    };
  }, [currentStaff?.id, currentStaff?._id, currentStaff?.email]);

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
            vehicles: Array.isArray(b.vehicles) ? b.vehicles : [],
            vehicleImageUrl: (Array.isArray(b.vehicles) ? b.vehicles : []).find(v => v && v.imageUrl)?.imageUrl || '',
            vehicleModel: b.vehicleType || b.vehicle || (resolvedKey === 'dog-wash' ? 'Pet' : 'Car'),
            vehicleType: b.vehicleType || (resolvedKey === 'dog-wash' ? 'Dog' : 'Car'),
            customerName: resolveCustomerName(b, idx, resolvedKey === 'salon' ? 'Salon Client' : 'Customer'),
            phone: b.phone || b.mobile || b.customerEmail || '+91 98200 12345',
            date: b.date || new Date().toISOString().split('T')[0],
            timeSlot: b.timeSlot || b.time || '02:00 PM',
            amount: b.price || b.amount || (resolvedKey === 'dog-wash' ? 500 : 699),
            total: b.price || b.amount || (resolvedKey === 'dog-wash' ? 500 : 699),
            price: b.price || b.amount || (resolvedKey === 'dog-wash' ? 500 : 699),
            status: b.status || 'Confirmed',
            isOfflineSale: b.isOfflineSale !== undefined ? b.isOfflineSale : (b.bookingId && b.bookingId.startsWith('OFS-')),
            saleType: b.saleType || (isMembershipPackage(b.packageName || b.package || b.membershipName || b.serviceName) ? 'membership' : 'service'),
            membershipName: b.membershipName || '',
            membershipValidity: b.membershipValidity || '',
            membershipExpiry: b.membershipExpiry || '',
            customerEmail: b.customerEmail || '',
            packageName: b.packageName || b.package || b.serviceName || '',
            bookingId: b.bookingId || b.id || b._id,
            saleDate: b.saleDate || b.date || '',
            paymentMode: b.paymentMode || '',
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
          localDetailingJobs = parsed
            .filter(b => {
              if (!b) return false;
              const bId = (b.id || '').toString().toUpperCase();
              if (['BK-9831', 'BK-8271', 'BK-5421', 'BK-9001', 'BK-9002'].includes(bId)) return false;
              const plate = (b.vehicleNo || b.vehiclePlate || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
              if (['MP09AB1234', 'MP09CD5678', 'MP09EF9012'].includes(plate)) return false;
              return true;
            })
            .map((b, idx) => ({
              _id: b.id || `BK-DET-${idx}`,
              id: b.id || `BK-${8000 + idx}`,
              serviceKey: 'car-detailing',
              serviceName: b.package || b.serviceName || 'Car Detailing Treatment',
              planName: b.package || b.serviceName || 'Detailing Treatment',
              vehicleNo: b.vehicleNo || '',
              vehicleModel: b.vehicle || b.vehicleModel || '',
              customerName: b.customerName || b.customer || 'Customer',
              phone: b.phone || '',
              date: b.date || new Date().toISOString().split('T')[0],
              timeSlot: b.time || '02:00 PM - 05:00 PM',
              amount: Number(b.price || b.amount || 0),
              total: Number(b.price || b.amount || 0),
              status: b.status || 'Confirmed',
              stepIndex: b.stepIndex !== undefined ? b.stepIndex : 0,
              notes: b.notes || '',
              staffId: b.staffId || currentStaff?.id || '',
              staffName: (b.technician && b.technician !== 'Vikram Rathore') ? b.technician : (currentStaff?.name || '')
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
    const baseJobsList = combined;

    // Merge any locally synced job updates (stepIndex, status, notes, photos)
    let syncJobsMap = {};
    try {
      const syncStored = localStorage.getItem('tsl_staff_jobs_sync');
      if (syncStored) {
        const syncArr = JSON.parse(syncStored);
        if (Array.isArray(syncArr)) {
          syncArr.forEach(j => {
            if (j.id) syncJobsMap[j.id] = j;
            if (j._id) syncJobsMap[j._id] = j;
          });
        }
      }
    } catch (e) {}

    const finalJobsList = baseJobsList.map(j => {
      const synced = syncJobsMap[j.id] || syncJobsMap[j._id];
      if (synced && synced.stepIndex !== undefined) {
        return {
          ...j,
          stepIndex: synced.stepIndex,
          status: synced.status || j.status,
          notes: synced.notes || j.notes,
          photos: synced.photos || j.photos
        };
      }
      return j;
    });

    setJobs(finalJobsList);
  };

  // Plate -> photo lookup source. Staff sees the same car photo everywhere.
  const fetchVehicleRegistry = async () => {
    try {
      const res = await apiClient.get('/vehicles');
      if (res.data && Array.isArray(res.data.vehicles)) setVehicleRegistry(res.data.vehicles);
    } catch (err) {
      console.warn('Could not fetch vehicle photos:', err.message);
    }
  };

  const getVehicleImage = (plate, vehicleList) => {
    const key = String(plate || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!key) return '';
    const norm = (p) => String(p || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    const hit = (vehicleRegistry || []).find(v => v.imageUrl && norm(v.plateNumber) === key);
    if (hit) return hit.imageUrl;
    const own = (vehicleList || []).find(v => v && v.imageUrl && norm(v.plateNumber) === key);
    return own ? own.imageUrl : '';
  };

  // Customers come from MongoDB only: /users/customers merges the `users` and
  // `customers` collections plus booking-only customers on the server.
  const fetchLiveCustomers = async () => {
    try {
      let baseList = [];
      try {
        const res = await apiClient.get('/users/customers', { params: { limit: 5000 } });
        if (res.data && Array.isArray(res.data.customers)) {
          baseList = res.data.customers;
        }
      } catch (e) {
        console.warn('Could not fetch from /users/customers, trying /customers:', e.message);
        const res = await apiClient.get('/customers');
        if (res.data && Array.isArray(res.data.data)) {
          baseList = res.data.data;
        }
      }

      const mapped = baseList.map((c) => {
        let userVehicles = (c.rawVehicles || [])
          .filter(v => v.plateNumber)
          .map(v => ({
            id: v._id || v.plateNumber,
            registrationNumber: v.plateNumber,
            imageUrl: v.imageUrl || '',
            brand: v.brand || '',
            model: v.model || '',
            color: v.color || '',
            fuelType: v.fuelType || '',
            isPrimary: Boolean(v.isPrimary)
          }));

        // Fall back to the "PLATE (Model)" strings the API also returns
        if (userVehicles.length === 0 && Array.isArray(c.vehicles) && c.vehicles.length > 0) {
          userVehicles = c.vehicles.map(vStr => {
            if (typeof vStr === 'object' && vStr?.registrationNumber) return vStr;
            const match = String(vStr).match(/^([A-Z0-9-]+)\s*(?:\(([^)]+)\))?/i);
            const plate = match ? match[1].trim() : String(vStr).trim();
            const model = match && match[2] ? match[2].trim() : '';
            return { id: plate, registrationNumber: plate, brand: '', model, color: '', fuelType: '', isPrimary: true };
          });
        }

        return {
          id: c.email || c._id || c.customerId || c.mobile,
          _id: c._id,
          customerId: c.customerId || '',
          name: c.fullName || c.name || 'Customer',
          fullName: c.fullName || c.name || 'Customer',
          email: c.email || '',
          mobile: c.mobile || c.phone || '',
          phone: c.mobile || c.phone || '',
          role: c.role || 'user',
          segment: c.segment || 'Regular',
          serviceKey: c.serviceKey || 'car-wash',
          vehicles: userVehicles,
          membership: c.membership || null,
          activePassesCount: c.membership && c.membership.status === 'Active' ? 1 : 0
        };
      });

      setCustomers(mapped);
    } catch (err) {
      console.warn('Could not fetch customers from database in StaffContext:', err.message);
    }
  };

  const fetchLiveStaffList = async () => {
    try {
      const res = await apiClient.get('/users/staff');
      if (res.data && Array.isArray(res.data.staff)) {
        setAllStaff(res.data.staff);
      }
    } catch (err) {
      console.warn('Could not fetch staff list in StaffContext:', err.message);
    }
  };

  useEffect(() => {
    if (!currentStaff) return;

    if (currentStaff.id && !currentStaff.id.toString().startsWith('STF-')) {
      fetchLiveAttendance(currentStaff.id);
    }
    fetchLiveJobs();
    fetchLiveCustomers();
    fetchVehicleRegistry();
    fetchLiveStaffList();

    // Listen for cross-portal customer, booking, and staff updates
    const handleSync = () => {
      fetchLiveCustomers();
      fetchLiveJobs();
      fetchVehicleRegistry();
      fetchLiveStaffList();
    };
    window.addEventListener('tsl_customer_updated', handleSync);
    window.addEventListener('tsl_vehicle_updated', handleSync);
    window.addEventListener('tsl_admin_memberships_updated', handleSync);
    window.addEventListener('tsl_bookings_updated', handleSync);
    window.addEventListener('tsl_staff_updated', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      window.removeEventListener('tsl_customer_updated', handleSync);
      window.removeEventListener('tsl_vehicle_updated', handleSync);
      window.removeEventListener('tsl_admin_memberships_updated', handleSync);
      window.removeEventListener('tsl_bookings_updated', handleSync);
      window.removeEventListener('tsl_staff_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [currentStaff]);

  // Camera Modal State
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraPurpose, setCameraPurpose] = useState('check-in'); // 'check-in' | 'job-photo' | 'inspection'
  const [onCaptureCallback, setOnCaptureCallback] = useState(null);

  // Toast Notification State
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    mirrorToastToDevice(message, type);
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
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
        photoUrl
      });
      if (res.data && res.data.success) {
        setIsCheckedIn(true);
        setCheckInPhoto(photoUrl);
        const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setCheckInTime(timeNow);
        showToast('Check-In Successful! Selfie Logged.', 'success');
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
        let uploadedPhotoUrl = photoUrl;
        if (photoUrl && photoUrl.startsWith('data:')) {
          try {
            const uploaded = await uploadToCloudinary(photoUrl, 'shine-lounge/bookings/inspection');
            uploadedPhotoUrl = uploaded.url;
          } catch (e) {
            console.warn('Cloudinary photo upload fallback:', e);
          }
        }
        await apiClient.put(`/bookings/${targetId}`, {
          status: computedStatus,
          stepIndex: newStepIndex,
          notes: notes || '',
          photoUrl: uploadedPhotoUrl || undefined
        });
      }
    } catch (err) {
      console.warn('Error updating job status in backend:', err.message);
    }
  };

  // Add New Customer
  const addCustomer = async (customerData) => {
    try {
      const cleanName = customerData.name || customerData.fullName || 'Customer';
      const cleanMobile = customerData.mobile || customerData.phone || '';
      const cleanEmail = customerData.email || '';
      const cleanCity = customerData.city || 'Gurgaon';
      const cleanSegment = customerData.segment || 'New Customer';
      const vehicles = Array.isArray(customerData.vehicles) ? customerData.vehicles : [];

      const res = await apiClient.post('/customers', {
        fullName: cleanName,
        email: cleanEmail,
        mobile: cleanMobile,
        city: cleanCity,
        segment: cleanSegment,
        vehicles: vehicles
      });

      // Refresh customers list from database
      await fetchLiveCustomers();

      showToast(`Registered new customer ${cleanName}`, 'success');
      return res.data?.data;
    } catch (err) {
      console.error('Error adding customer via staff panel:', err);
      showToast(err.response?.data?.message || 'Could not save customer to the database', 'error');
      throw err;
    }
  };

  // Update Customer Vehicle
  const updateCustomerVehicle = async (customerIdOrEmail, vehicleData) => {
    const cleanPlate = String(vehicleData.plateNumber || '').trim().toUpperCase();
    const cleanModel = String(vehicleData.model || '').trim();
    if (!cleanPlate) return;

    setCustomers(prev => prev.map(c => {
      const match = c.id === customerIdOrEmail || c.email === customerIdOrEmail || c._id === customerIdOrEmail;
      if (match) {
        const updatedVehicle = {
          id: cleanPlate,
          registrationNumber: cleanPlate,
          brand: vehicleData.brand || '',
          model: cleanModel,
          isPrimary: true
        };
        const otherVehicles = (c.vehicles || []).filter(v => v.registrationNumber !== cleanPlate);
        return {
          ...c,
          vehicles: [updatedVehicle, ...otherVehicles]
        };
      }
      return c;
    }));

    try {
      await apiClient.post(`/users/customers/${customerIdOrEmail}/vehicles`, {
        plateNumber: cleanPlate,
        model: cleanModel,
        isPrimary: true
      });
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not save vehicle to the database', 'error');
    }

    try {
      window.dispatchEvent(new CustomEvent('tsl_customer_updated', {
        detail: { customerId: customerIdOrEmail, newPlate: cleanPlate, newModel: cleanModel }
      }));
      window.dispatchEvent(new CustomEvent('tsl_vehicle_updated'));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {}
  };

  // Filter Jobs strictly to the logged-in staff member:
  // 1. Explicitly assigned by Admin (by staffId, staffName, or email)
  // 2. If the department currently has ONLY ONE staff member registered, all tasks for that service auto-assign to them
  // 3. If the department has MULTIPLE staff members, unassigned tasks remain hidden until Admin assigns them
  const checkJobAssignment = (job) => {
    if (!currentStaff) return false;
    if (
      currentStaff.serviceKey === 'global' ||
      currentStaff.role === 'Super Admin' ||
      currentStaff.role === 'Branch Manager' ||
      currentStaff.role === 'Cashier'
    ) {
      return true;
    }

    const staffKey = (currentStaff.serviceKey || '').toLowerCase();
    const staffDept = (currentStaff.department || '').toLowerCase();
    const jobKey = (job.serviceKey || '').toLowerCase();

    // 1. Department match
    let deptMatch = false;
    if (staffKey === 'drive-through-cafe' || staffDept.includes('drive')) {
      deptMatch = jobKey === 'drive-through-cafe' || (job.serviceName && job.serviceName.toLowerCase().includes('drive'));
    } else if (staffKey === 'cafe' || staffDept.includes('café') || staffDept.includes('cafe')) {
      deptMatch = jobKey === 'cafe' || (job.serviceName && job.serviceName.toLowerCase().includes('cafe') && !job.serviceName.toLowerCase().includes('drive'));
    } else if (staffKey === 'car-detailing' || staffDept.includes('detail')) {
      deptMatch = jobKey === 'car-detailing' || (job.serviceName && job.serviceName.toLowerCase().includes('detail'));
    } else if (staffKey === 'dog-wash' || staffDept.includes('dog')) {
      deptMatch = jobKey === 'dog-wash' || (job.serviceName && job.serviceName.toLowerCase().includes('dog'));
    } else if (staffKey === 'salon' || staffDept.includes('salon')) {
      deptMatch = jobKey === 'salon' || (job.serviceName && job.serviceName.toLowerCase().includes('salon'));
    } else if (staffKey === 'car-wash' || staffDept.includes('wash')) {
      deptMatch = jobKey === 'car-wash' || (job.serviceName && job.serviceName.toLowerCase().includes('wash'));
    } else {
      deptMatch = jobKey === staffKey;
    }

    if (!deptMatch) return false;

    // Normalization helper
    const norm = (str) => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '').trim();
    const myId = norm(currentStaff.id || currentStaff._id || currentStaff.employeeId);
    const myName = norm(currentStaff.name || currentStaff.fullName);
    const myEmail = norm(currentStaff.email);

    const jobStaffId = norm(job.assignedStaffId || job.staffId);
    const jobStaffName = norm(job.assignedStaffName || job.staffName || job.stylist);
    const jobStaffEmail = norm(job.assignedStaffEmail || job.staffEmail);

    // Explicit assignment by ID
    if (jobStaffId && jobStaffId !== 'stflive' && jobStaffId !== 'stf05' && jobStaffId !== 'stf07') {
      if (jobStaffId === myId) return true;
      return false;
    }

    // Explicit assignment by Name
    if (jobStaffName) {
      if (jobStaffName === myName) return true;
      // If it mentions another staff member in this department, hide from me
      const isOtherStaff = allStaff.some(s => {
        const otherName = norm(s.fullName || s.name);
        return otherName && otherName === jobStaffName && otherName !== myName;
      });
      if (isOtherStaff) return false;
    }

    // Explicit assignment by Email
    if (jobStaffEmail && myEmail) {
      if (jobStaffEmail === myEmail) return true;
      return false;
    }

    // Unassigned Job Handling:
    // Check how many staff members are registered in this active department
    const deptStaff = allStaff.filter(s => {
      const sKey = (s.serviceKey || '').toLowerCase();
      const sDept = (s.department || '').toLowerCase();
      if (staffKey === 'car-wash' || staffDept.includes('wash')) return sKey === 'car-wash' || sDept.includes('wash');
      if (staffKey === 'car-detailing' || staffDept.includes('detail')) return sKey === 'car-detailing' || sDept.includes('detail');
      if (staffKey === 'dog-wash' || staffDept.includes('dog')) return sKey === 'dog-wash' || sDept.includes('dog');
      if (staffKey === 'cafe' || staffDept.includes('cafe')) return sKey === 'cafe' || sDept.includes('cafe');
      if (staffKey === 'drive-through-cafe' || staffDept.includes('drive')) return sKey === 'drive-through-cafe' || sDept.includes('drive');
      if (staffKey === 'salon' || staffDept.includes('salon')) return sKey === 'salon' || sDept.includes('salon');
      return sKey === staffKey;
    });

    // If there is ONLY ONE staff member in this department -> Give all tasks to this sole staff member!
    if (deptStaff.length === 1) {
      return true;
    }

    // If there are multiple staff members (or no staff), require Admin assignment
    return false;
  };

  const staffJobs = jobs.filter(checkJobAssignment);

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
        logoutStaff,
        jobs: staffJobs,
        allJobs: jobs,
        allStaff,
        checkJobAssignment,
        updateJobStatus,
        customers: staffCustomers,
        allCustomers: customers,
        getVehicleImage,
        addCustomer,
        updateCustomerVehicle,
        attendance,
        isCheckedIn,
        checkInPhoto,
        checkInTime,
        processCheckIn,
        processCheckOut,
        breakStatus,
        startStaffBreak,
        isStartingBreak,
        endStaffBreak,
        isEndingBreak,
        isOvertime: breakStatus.status === 'active' && breakStatus.isOvertime,
        overtimeSeconds: breakStatus.overtimeSeconds,
        breakLabel: breakStatus.breakLabel,
        breakScheduledTime: breakStatus.breakScheduledTime,
        breakAlertModal,
        dismissBreakAlertModal,
        todayBreakLogs,
        permissions: currentStaff?.permissions || [],
        canAccess: (required) => permissionsAllow(currentStaff?.permissions, required),
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
