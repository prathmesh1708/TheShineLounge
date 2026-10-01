// The staff break lifecycle, shared by the HTTP controller and the scheduler so
// a break ended by the staff, by an admin or by the safety cap is recorded the
// same way. All timing here uses server time; clients never supply durations.

const BreakLog = require('../models/BreakLog');
const Notification = require('../models/Notification');
const pushHelper = require('../common/services/pushNotificationHelper');
const { dayKey } = require('../utils/siteTime');

const DEFAULT_REASON = 'Rest / Lunch Break';

const secondsBetween = (from, to) => Math.floor((new Date(to).getTime() - new Date(from).getTime()) / 1000);

// '12:00' -> '12:00 PM' for notification text.
const formatClock = (hhmm) => {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${suffix}`;
};

const isActive = (staff) => staff.isOnBreak === true || staff.breakStatus === 'active';
const isPending = (staff) => !isActive(staff) && staff.breakStatus === 'pending';

// Overtime is derived, never stored as a status: an active break whose end time
// has passed is simply "active and over". Old clients keep seeing 'active'.
const resolveBreakStatus = (staff) => {
  if (isActive(staff)) return 'active';
  if (staff.breakStatus === 'pending') return 'pending';
  return 'idle';
};

const liveBreakFields = (staff, now = new Date()) => {
  const breakStatus = resolveBreakStatus(staff);
  let remainingSeconds = 0;
  let overtimeSeconds = 0;
  if (breakStatus === 'active' && staff.breakEndTime) {
    const signed = secondsBetween(now, staff.breakEndTime);
    remainingSeconds = Math.max(0, signed);
    overtimeSeconds = Math.max(0, -signed);
  }
  return {
    breakStatus,
    isOvertime: breakStatus === 'active' && !!staff.breakEndTime && new Date(staff.breakEndTime) < now,
    remainingSeconds,
    overtimeSeconds
  };
};

// In-app notification plus FCM push. Neither may fail the caller: a missing
// token or a Firebase outage must not stop a break from being assigned.
const notifyStaff = async (staff, { title, message, priority = 'high', data = {} }) => {
  try {
    await Notification.create({
      title,
      message,
      recipientType: 'staff',
      targetUserId: staff._id,
      serviceKey: staff.serviceKey || 'car-wash',
      category: 'service_update',
      priority,
      actionUrl: '/staff/dashboard'
    });
  } catch (err) {
    console.warn('Failed to insert break notification:', err.message);
  }

  try {
    // Staff._id equals the legacy User._id that holds the FCM tokens. FCM data
    // values must be strings.
    const stringData = Object.fromEntries(
      Object.entries({ url: '/staff/dashboard', ...data }).map(([k, v]) => [k, String(v ?? '')])
    );
    await pushHelper.sendNotificationToUser(staff._id, { title, body: message, data: stringData });
  } catch (err) {
    console.warn('Failed to send break push notification:', err.message);
  }
};

const logIdentity = (staff, now) => ({
  staff: staff._id,
  staffCode: staff.staffId || '',
  serviceKey: staff.serviceKey || '',
  department: staff.department || '',
  date: dayKey(now)
});

const resetLiveBreak = (staff) => {
  staff.breakStatus = 'idle';
  staff.isOnBreak = false;
  staff.breakStartTime = null;
  staff.breakEndTime = null;
  staff.currentBreakLogId = null;
  staff.currentBreakSlot = null;
};

// Admin override: a manual break replaces anything pending, and closes an
// active break first so it still lands in the history with its overtime.
const assignManualBreak = async (staff, { duration, reason, now = new Date(), endedBy = 'admin' }) => {
  const durationNum = Math.min(240, Math.max(1, Math.round(Number(duration) || 30)));
  const label = String(reason || '').trim() || DEFAULT_REASON;

  if (isActive(staff)) {
    await endActiveBreak(staff, { now, endedBy, completedNaturally: false, logStatus: 'cancelled', note: 'Replaced by a manual break' });
  } else if (isPending(staff) && staff.currentBreakLogId) {
    await BreakLog.updateOne(
      { _id: staff.currentBreakLogId, status: 'notified' },
      { $set: { status: 'cancelled', endedBy, note: 'Replaced by a manual break' } }
    );
  }

  const log = await BreakLog.create({
    ...logIdentity(staff, now),
    slot: null,
    label,
    source: 'manual',
    allowedMinutes: durationNum,
    notifiedAt: now,
    status: 'notified'
  });

  staff.breakStatus = 'pending';
  staff.isOnBreak = false;
  staff.breakDuration = durationNum;
  staff.breakReason = label;
  staff.breakStartTime = null;
  staff.breakEndTime = null;
  staff.currentBreakLogId = log._id;
  staff.currentBreakSlot = null;
  await staff.save();

  await notifyStaff(staff, {
    title: `☕ ${durationNum}-Minute Break Assigned`,
    message: `Admin has assigned you a ${durationNum}-minute break (${label}). Open the app and tap Start when you are ready.`,
    priority: 'high',
    data: { type: 'break_assigned' }
  });

  return { log, durationNum };
};

const startBreak = async (staff, { now = new Date() } = {}) => {
  const durationNum = Number(staff.breakDuration) || 30;
  const plannedEndAt = new Date(now.getTime() + durationNum * 60 * 1000);

  let log = null;
  if (staff.currentBreakLogId) {
    log = await BreakLog.findOneAndUpdate(
      { _id: staff.currentBreakLogId, status: 'notified' },
      { $set: { status: 'active', startedAt: now, plannedEndAt, allowedMinutes: durationNum } },
      { returnDocument: 'after' }
    );
  }
  // A pending break from before BreakLog existed (or whose row was closed
  // under it) still deserves a record.
  if (!log) {
    log = await BreakLog.create({
      ...logIdentity(staff, now),
      slot: null,
      label: staff.breakReason || DEFAULT_REASON,
      source: 'manual',
      allowedMinutes: durationNum,
      notifiedAt: now,
      startedAt: now,
      plannedEndAt,
      status: 'active'
    });
    staff.currentBreakSlot = null;
  }

  staff.breakStatus = 'active';
  staff.isOnBreak = true;
  staff.breakDuration = durationNum;
  staff.breakReason = staff.breakReason || DEFAULT_REASON;
  staff.breakStartTime = now;
  staff.breakEndTime = plannedEndAt;
  staff.currentBreakLogId = log._id;
  await staff.save();

  return { log, durationNum };
};

// Closes an active break: overtime = time past the planned end, measured on
// the server. Returns { actualSeconds, overtimeSeconds }.
const endActiveBreak = async (staff, {
  now = new Date(),
  endedBy = 'staff',
  completedNaturally = true,
  logStatus = 'completed',
  note = ''
} = {}) => {
  const startedAt = staff.breakStartTime || now;
  const plannedEndAt = staff.breakEndTime || now;
  const actualSeconds = Math.max(0, secondsBetween(startedAt, now));
  const overtimeSeconds = Math.max(0, secondsBetween(plannedEndAt, now));

  const logUpdate = {
    status: logStatus,
    endedAt: now,
    actualSeconds,
    overtimeSeconds,
    endedBy,
    ...(note ? { note } : {})
  };

  let closed = null;
  if (staff.currentBreakLogId) {
    // Guarded on status so a staff "End" racing the scheduler's cap can only
    // close the row once.
    closed = await BreakLog.findOneAndUpdate(
      { _id: staff.currentBreakLogId, status: 'active' },
      { $set: logUpdate },
      { returnDocument: 'after' }
    );
  }
  if (!closed && !staff.currentBreakLogId && staff.breakStartTime) {
    closed = await BreakLog.create({
      ...logIdentity(staff, startedAt),
      slot: null,
      label: staff.breakReason || DEFAULT_REASON,
      source: 'manual',
      allowedMinutes: Number(staff.breakDuration) || 0,
      notifiedAt: startedAt,
      startedAt,
      plannedEndAt,
      ...logUpdate
    });
  }

  if (staff.breakStartTime && Array.isArray(staff.breakHistory)) {
    staff.breakHistory.push({
      startTime: staff.breakStartTime,
      endTime: now,
      duration: Math.round(actualSeconds / 60),
      reason: staff.breakReason || DEFAULT_REASON,
      startedBy: staff.currentBreakSlot ? 'schedule' : 'admin',
      endedBy,
      completedNaturally,
      overtimeSeconds
    });
  }

  resetLiveBreak(staff);
  await staff.save();

  return { actualSeconds, overtimeSeconds, log: closed };
};

const cancelBreak = async (staff, { now = new Date(), endedBy = 'admin' } = {}) => {
  if (isActive(staff)) {
    return endActiveBreak(staff, { now, endedBy, completedNaturally: false, logStatus: 'cancelled' });
  }
  if (staff.currentBreakLogId) {
    await BreakLog.updateOne(
      { _id: staff.currentBreakLogId, status: 'notified' },
      { $set: { status: 'cancelled', endedBy } }
    );
  }
  resetLiveBreak(staff);
  await staff.save();
  return { actualSeconds: 0, overtimeSeconds: 0 };
};

module.exports = {
  DEFAULT_REASON,
  formatClock,
  isActive,
  isPending,
  resolveBreakStatus,
  liveBreakFields,
  notifyStaff,
  logIdentity,
  resetLiveBreak,
  assignManualBreak,
  startBreak,
  endActiveBreak,
  cancelBreak
};
