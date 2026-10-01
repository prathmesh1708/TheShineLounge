// Turns each staff member's breakSchedule into real breaks: at the scheduled
// minute the staff gets a pending break (push + in-app + the Start popup), an
// unstarted one is eventually logged as missed, and an overdue one gets a
// single "break is over" reminder. It never ends a break on time — overtime is
// the whole point — except for the safety cap on a break left running for hours.
//
// Runs two ways:
//   * a 30s setInterval inside a long-lived server (PM2), and
//   * lazily from GET /staff/:id/break, which the staff app polls, so a popup
//     still appears on time when no background timer exists (serverless).
// Every write is guarded (unique index / conditional update), so ticks from
// several instances or the lazy path can overlap without double-firing.

const Staff = require('../models/Staff');
const BreakLog = require('../models/BreakLog');
const Attendance = require('../models/Attendance');
const env = require('../common/config/env');
const staffBreaks = require('./staffBreaks');
const { nowParts, hhmmToMinutes, dayKey } = require('../utils/siteTime');

const TICK_MS = 30 * 1000;

const settings = (overrides = {}) => ({
  catchUpMin: env.BREAK_CATCHUP_MIN,
  pendingExpiryMin: env.BREAK_PENDING_EXPIRY_MIN,
  maxOvertimeMin: env.BREAK_MAX_OVERTIME_MIN,
  requireCheckIn: env.BREAK_REQUIRE_CHECKIN,
  ...overrides
});

// Slots whose start minute has arrived and is still inside the catch-up window
// (a restart at 12:05 still fires the 12:00 break; at 15:00 it does not).
const dueSlots = (schedule, minutesOfDay, catchUpMin) => (schedule || []).filter((slot) => {
  if (!slot || !slot.enabled || !slot.startTime) return false;
  const start = hhmmToMinutes(slot.startTime);
  if (start === null) return false;
  const late = minutesOfDay - start;
  return late >= 0 && late <= catchUpMin;
});

// Attendance.date is written as the UTC calendar date (attendanceController
// uses toISOString), so match that, and the site-local date for safety.
const isCheckedIn = async (staffId, now) => {
  const utcKey = now.toISOString().split('T')[0];
  const row = await Attendance.findOne({
    staffId,
    date: { $in: [...new Set([utcKey, dayKey(now)])] },
    checkOutTime: 'In Progress'
  }).select('_id').lean();
  return !!row;
};

const fireDueSlot = async (staff, slot, { now, today }) => {
  let log;
  try {
    log = await BreakLog.create({
      ...staffBreaks.logIdentity(staff, now),
      date: today,
      slot: slot.slot,
      label: slot.label || `Break ${slot.slot}`,
      source: 'scheduled',
      scheduledTime: slot.startTime,
      allowedMinutes: slot.durationMinutes,
      notifiedAt: now,
      status: 'notified'
    });
  } catch (err) {
    if (err && err.code === 11000) return false; // already fired by another tick
    throw err;
  }

  // Claim the staff only if no other break is pending or running. Conditional
  // so a manual assign landing at the same moment wins cleanly.
  const claimed = await Staff.updateOne(
    { _id: staff._id, breakStatus: { $nin: ['pending', 'active'] }, isOnBreak: { $ne: true } },
    {
      $set: {
        breakStatus: 'pending',
        isOnBreak: false,
        breakDuration: slot.durationMinutes,
        breakReason: log.label,
        breakStartTime: null,
        breakEndTime: null,
        currentBreakLogId: log._id,
        currentBreakSlot: slot.slot
      }
    }
  );

  if (!claimed.modifiedCount) {
    await BreakLog.updateOne({ _id: log._id }, { $set: { status: 'missed', note: 'Staff already on another break' } });
    return false;
  }

  // Mirror the write onto the in-memory doc so a lazy caller responds with it.
  staff.breakStatus = 'pending';
  staff.isOnBreak = false;
  staff.breakDuration = slot.durationMinutes;
  staff.breakReason = log.label;
  staff.breakStartTime = null;
  staff.breakEndTime = null;
  staff.currentBreakLogId = log._id;
  staff.currentBreakSlot = slot.slot;

  await staffBreaks.notifyStaff(staff, {
    title: `☕ ${log.label} – ${slot.durationMinutes} min (${staffBreaks.formatClock(slot.startTime)})`,
    message: `It's time for your ${slot.durationMinutes}-minute break. Open the app and tap Start.`,
    priority: 'high',
    data: { type: 'break_due', slot: slot.slot }
  });
  return true;
};

const expireUnstartedBreak = async (staff, { now, pendingExpiryMin }) => {
  if (!staff.currentBreakLogId) return false;
  const cutoff = new Date(now.getTime() - pendingExpiryMin * 60 * 1000);
  // Only scheduled breaks lapse on their own; a manual assign is an explicit
  // admin decision that stays until the admin cancels it.
  const log = await BreakLog.findOneAndUpdate(
    { _id: staff.currentBreakLogId, source: 'scheduled', status: 'notified', notifiedAt: { $lte: cutoff } },
    { $set: { status: 'missed', note: 'Not started in time' } },
    { returnDocument: 'after' }
  );
  if (!log) return false;

  await Staff.updateOne(
    { _id: staff._id, currentBreakLogId: log._id, breakStatus: 'pending' },
    { $set: { breakStatus: 'idle', isOnBreak: false, breakStartTime: null, breakEndTime: null, currentBreakLogId: null, currentBreakSlot: null } }
  );
  staffBreaks.resetLiveBreak(staff);
  return true;
};

const handleOverdueBreak = async (staff, { now, maxOvertimeMin }) => {
  if (!staff.breakEndTime) return false;
  const overMs = now.getTime() - new Date(staff.breakEndTime).getTime();
  if (overMs <= 0) return false;

  if (overMs > maxOvertimeMin * 60 * 1000) {
    // Forgotten break: close it so it does not run forever, with every second
    // of overtime still recorded.
    await staffBreaks.endActiveBreak(staff, {
      now,
      endedBy: 'system_cap',
      completedNaturally: false,
      note: `Closed automatically after ${maxOvertimeMin} min of overtime`
    });
    return true;
  }

  if (!staff.currentBreakLogId) return false;
  const log = await BreakLog.findOneAndUpdate(
    { _id: staff.currentBreakLogId, status: 'active', overtimeNotifiedAt: null },
    { $set: { overtimeNotifiedAt: now } },
    { returnDocument: 'after' }
  );
  if (!log) return false;

  await staffBreaks.notifyStaff(staff, {
    title: '⏰ Break time is over — please return to work',
    message: `Your ${log.allowedMinutes}-minute ${log.label || 'break'} has ended. Tap End Break when you are back.`,
    priority: 'urgent',
    data: { type: 'break_overtime' }
  });
  return true;
};

// Everything the scheduler does for one staff member. `staff` must be a full
// Mongoose document. `knownSlots` (slots already logged today) lets the batch
// tick skip a query per staff.
const processStaffBreaks = async (staff, now = new Date(), options = {}) => {
  const cfg = settings(options);
  if (!staff || staff.isActive === false || staff.isDeleted) return;

  if (staffBreaks.isActive(staff)) {
    await handleOverdueBreak(staff, { now, maxOvertimeMin: cfg.maxOvertimeMin });
  } else if (staffBreaks.isPending(staff)) {
    await expireUnstartedBreak(staff, { now, pendingExpiryMin: cfg.pendingExpiryMin });
  }

  const { dayKey: today, minutesOfDay } = nowParts(now);
  const due = dueSlots(staff.breakSchedule, minutesOfDay, cfg.catchUpMin);
  if (!due.length) return;

  let known = options.knownSlots;
  if (!known) {
    const rows = await BreakLog.find({ staff: staff._id, date: today, source: 'scheduled' }).select('slot').lean();
    known = new Set(rows.map((r) => r.slot));
  }
  const fresh = due.filter((slot) => !known.has(slot.slot));
  if (!fresh.length) return;

  if (cfg.requireCheckIn && !(await isCheckedIn(staff._id, now))) return;

  for (const slot of fresh) {
    await fireDueSlot(staff, slot, { now, today });
  }
};

let isRunning = false;

const runBreakSchedulerTick = async (now = new Date(), options = {}) => {
  if (isRunning) return { skipped: true };
  isRunning = true;
  const summary = { scanned: 0, processed: 0, errors: 0 };
  try {
    const cfg = settings(options);
    const { dayKey: today, minutesOfDay } = nowParts(now);

    // Lean scan; only staff with something possibly to do get a full doc.
    const candidates = await Staff.find({
      isActive: true,
      isDeleted: { $ne: true },
      $or: [
        { breakSchedule: { $elemMatch: { enabled: true, startTime: { $nin: ['', null] } } } },
        { breakStatus: { $in: ['pending', 'active'] } },
        { isOnBreak: true }
      ]
    }).select('_id breakSchedule breakStatus isOnBreak').lean();
    summary.scanned = candidates.length;
    if (!candidates.length) return summary;

    const todayLogs = await BreakLog.find({
      staff: { $in: candidates.map((c) => c._id) },
      date: today,
      source: 'scheduled'
    }).select('staff slot').lean();
    const slotsByStaff = new Map();
    for (const row of todayLogs) {
      const key = String(row.staff);
      if (!slotsByStaff.has(key)) slotsByStaff.set(key, new Set());
      slotsByStaff.get(key).add(row.slot);
    }

    for (const c of candidates) {
      const known = slotsByStaff.get(String(c._id)) || new Set();
      const busy = c.isOnBreak || c.breakStatus === 'pending' || c.breakStatus === 'active';
      const hasFreshDue = dueSlots(c.breakSchedule, minutesOfDay, cfg.catchUpMin).some((s) => !known.has(s.slot));
      if (!busy && !hasFreshDue) continue;

      try {
        const staff = await Staff.findById(c._id);
        if (!staff) continue;
        await processStaffBreaks(staff, now, { ...options, knownSlots: known });
        summary.processed += 1;
      } catch (err) {
        summary.errors += 1;
        console.error(`[breakScheduler] staff ${c._id}:`, err.message);
      }
    }
    return summary;
  } finally {
    isRunning = false;
  }
};

let timer = null;

const startBreakScheduler = () => {
  if (timer) return;
  const tick = () => runBreakSchedulerTick().catch((err) => console.error('[breakScheduler] tick failed:', err.message));
  timer = setInterval(tick, TICK_MS);
  // Never keep the process alive just for this timer.
  if (typeof timer.unref === 'function') timer.unref();
  tick();
  console.log('⏱️  Staff break scheduler started (30s interval).');
};

const stopBreakScheduler = () => {
  if (timer) clearInterval(timer);
  timer = null;
};

module.exports = {
  runBreakSchedulerTick,
  processStaffBreaks,
  startBreakScheduler,
  stopBreakScheduler
};
