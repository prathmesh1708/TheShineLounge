const Staff = require('../models/Staff');
const User = require('../models/User');
const BreakLog = require('../models/BreakLog');
const payroll = require('../services/payroll');
const staffBreaks = require('../services/staffBreaks');
const { processStaffBreaks } = require('../services/breakScheduler');
const { parseSalaryText, formatSalaryText } = require('../utils/salaryAmount');
const { normalizeBreakSchedule } = require('../utils/breakSchedule');
const { dayKey } = require('../utils/siteTime');

// Staff accounts may read the roster (e.g. to hand jobs over) but never another
// person's pay. Their own salary is served only by /api/salary/me.
const PAYROLL_FIELDS = ['salary', 'monthlySalary'];
const forClient = (req, staffDoc) => {
  if (!staffDoc) return staffDoc;
  const obj = typeof staffDoc.toJSON === 'function' ? staffDoc.toJSON() : { ...staffDoc };
  const requesterRole = String(req.user?.role || '').toLowerCase();
  if (requesterRole === 'staff') PAYROLL_FIELDS.forEach((field) => delete obj[field]);
  return obj;
};

// Salary arrives as a number (monthlySalary) from current forms, or as text from
// older clients. A blank field means "not provided", so an edit form that failed
// to load the amount can never wipe it; setting ₹0 goes through /api/salary.
const readSalaryInput = (body) => {
  if (body.monthlySalary !== undefined && String(body.monthlySalary).trim() !== '') {
    return parseSalaryText(Number(body.monthlySalary));
  }
  if (body.salary !== undefined && String(body.salary).trim() !== '') return parseSalaryText(body.salary);
  return undefined;
};

// Helper to build query for staff lookup by _id, staffId, or email
const buildStaffSearch = (idParam, reqUser) => {
  if (idParam === 'me' && reqUser) {
    const conditions = [];
    if (reqUser._id) conditions.push({ _id: reqUser._id });
    if (reqUser.email) conditions.push({ email: String(reqUser.email).toLowerCase().trim() });
    if (reqUser.staffId) conditions.push({ staffId: reqUser.staffId });
    if (conditions.length > 0) return { $or: conditions };
  }
  const isObjectId = idParam && /^[0-9a-fA-F]{24}$/.test(idParam);
  const conditions = [
    { staffId: idParam },
    { email: String(idParam || '').toLowerCase().trim() }
  ];
  if (isObjectId) {
    conditions.unshift({ _id: idParam });
  }
  return { $or: conditions };
};

// Break-lifecycle rules live in services/staffBreaks so the scheduler and this
// controller record breaks identically.
const { resolveBreakStatus, liveBreakFields } = staffBreaks;

const isAdminRole = (user) => ['admin', 'superadmin', 'manager'].includes(String(user?.role || '').toLowerCase());

// Who may drive someone else's break. Narrower than canManageStaff on purpose:
// 'orders'/'bookings' are default permissions for ordinary staff, and break
// records now feed overtime reports, so only admins and real department
// managers (explicit 'staff' permission or a management department) qualify.
const canManageBreaks = (user) => {
  if (isAdminRole(user)) return true;
  const dept = String(user?.department || '').toLowerCase();
  return String(user?.role || '').toLowerCase() === 'staff' && (
    user.permissions?.includes('staff') || dept === 'management' || dept === 'manager'
  );
};

const isSelf = (staff, user) => {
  if (!staff || !user) return false;
  if (user._id && String(staff._id) === String(user._id)) return true;
  return !!user.email && staff.email === String(user.email).toLowerCase().trim();
};

// Ending your own break counts as 'staff' even for a manager.
const endedByFor = (staff, user) => (isSelf(staff, user) ? 'staff' : 'admin');

// Today's break totals for a page of staff, in one aggregate (no per-row
// query). A break running past its end right now counts its live overtime.
const todayBreakSummaries = async (staffList, now) => {
  const result = new Map();
  for (const stf of staffList) {
    const live = liveBreakFields(stf, now);
    result.set(String(stf._id), {
      overtimeSeconds: live.overtimeSeconds,
      completedCount: 0,
      missedCount: 0
    });
  }
  if (!staffList.length) return result;

  const rows = await BreakLog.aggregate([
    { $match: { staff: { $in: staffList.map((s) => s._id) }, date: dayKey(now) } },
    {
      $group: {
        _id: '$staff',
        overtimeSeconds: { $sum: { $cond: [{ $in: ['$status', ['completed', 'cancelled']] }, '$overtimeSeconds', 0] } },
        completedCount: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        missedCount: { $sum: { $cond: [{ $eq: ['$status', 'missed'] }, 1, 0] } }
      }
    }
  ]);
  for (const row of rows) {
    const entry = result.get(String(row._id));
    if (!entry) continue;
    entry.overtimeSeconds += row.overtimeSeconds;
    entry.completedCount = row.completedCount;
    entry.missedCount = row.missedCount;
  }
  return result;
};

// @desc    Get all staff members
// @route   GET /api/staff
// @access  Private (Staff/Admin)
const getStaffList = async (req, res) => {
  try {
    const { department, serviceKey, page = 1, limit = 50 } = req.query;
    const query = { isDeleted: { $ne: true } };
    if (department && department !== 'All') query.department = department;
    if (serviceKey) query.serviceKey = serviceKey;

    const total = await Staff.countDocuments(query);
    const pages = Math.ceil(total / Number(limit)) || 1;
    const staffList = await Staff.find(query)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    // Breaks are no longer closed when their time runs out: an overdue break
    // stays active so its overtime can be measured when the staff ends it.
    const now = new Date();
    const summaries = await todayBreakSummaries(staffList, now);
    const updatedStaff = staffList.map((stf) => {
      const obj = forClient(req, stf);
      obj.todayBreakSummary = summaries.get(String(stf._id));
      return obj;
    });

    res.status(200).json({
      success: true,
      count: updatedStaff.length,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages
      },
      staff: updatedStaff
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching staff'
    });
  }
};

// @desc    Get staff by ID
// @route   GET /api/staff/:id
// @access  Private (Staff/Admin)
const getStaffById = async (req, res) => {
  try {
    const search = buildStaffSearch(req.params.id, req.user);
    let staff = await Staff.findOne({ ...search, isDeleted: { $ne: true } });

    if (!staff) {
      staff = await User.findOne({ ...search, role: 'staff', isDeleted: { $ne: true } });
    }

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    res.status(200).json({
      success: true,
      staff: forClient(req, staff)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching staff member'
    });
  }
};

// @desc    Create new staff member
// @route   POST /api/staff
// @access  Private (Admin)
const createStaff = async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      mobile,
      department,
      serviceKey,
      staffRole,
      leaveBalance,
      photo,
      permissions,
      branch
    } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide fullName, email, and password'
      });
    }

    const initialSalary = readSalaryInput(req.body) ?? 0;
    if (initialSalary === null) {
      return res.status(400).json({ success: false, message: 'Monthly salary must be a number in rupees' });
    }

    const { value: breakSchedule, error: scheduleError } = normalizeBreakSchedule(req.body.breakSchedule);
    if (scheduleError) {
      return res.status(400).json({ success: false, message: scheduleError });
    }

    const cleanEmail = email.toLowerCase().trim();

    const existingStaff = await Staff.findOne({ email: cleanEmail });
    if (existingStaff) {
      return res.status(400).json({
        success: false,
        message: 'Staff member with this email already exists'
      });
    }

    const staffId = `STF-${Math.floor(100 + Math.random() * 900)}`;

    const staff = await Staff.create({
      staffId,
      fullName,
      email: cleanEmail,
      password,
      mobile: mobile || '',
      department: department || 'Car Wash',
      serviceKey: serviceKey || 'car-wash',
      staffRole: staffRole || 'Staff Specialist',
      monthlySalary: initialSalary,
      salary: formatSalaryText(initialSalary),
      leaveBalance: leaveBalance !== undefined ? Number(leaveBalance) : 12,
      photo: photo || '',
      profileImage: photo || '',
      permissions: permissions || [],
      branch: branch || 'Main Branch',
      breakSchedule
    });

    // Also sync/create in legacy User collection to keep backward compatibility
    try {
      const existingUser = await User.findOne({ email: cleanEmail });
      if (!existingUser) {
        await User.create({
          _id: staff._id,
          staffId,
          fullName,
          email: cleanEmail,
          password,
          mobile: mobile || '',
          role: 'staff',
          department: department || 'Car Wash',
          serviceKey: serviceKey || 'car-wash',
          staffRole: staffRole || 'Staff Specialist',
          salary: formatSalaryText(initialSalary),
          leaveBalance: leaveBalance !== undefined ? Number(leaveBalance) : 12,
          photo: photo || '',
          permissions: permissions || [],
          branch: branch || 'Main Branch',
          // Only mirrored if the legacy schema ever grows the field.
          ...(User.schema.path('breakSchedule') ? { breakSchedule } : {})
        });
      } else {
        existingUser.role = 'staff';
        existingUser.password = password;
        await existingUser.save();
      }
    } catch (userSyncErr) {
      console.warn('Legacy user sync note:', userSyncErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Staff member created successfully',
      staff
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error creating staff'
    });
  }
};

// @desc    Update staff member
// @route   PUT /api/staff/:id
// @access  Private (Admin)
const updateStaff = async (req, res) => {
  try {
    const idParam = req.params.id;
    const search = buildStaffSearch(idParam);

    let staff = await Staff.findOne(search);
    let legacyUser = null;
    
    if (idParam && /^[0-9a-fA-F]{24}$/.test(idParam)) {
      legacyUser = await User.findById(idParam);
    }
    if (!legacyUser) {
      legacyUser = await User.findOne({ email: String(idParam).toLowerCase().trim(), role: 'staff' });
    }

    if (!staff && !legacyUser) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    const {
      fullName,
      email,
      password,
      mobile,
      department,
      serviceKey,
      staffRole,
      leaveBalance,
      photo,
      permissions,
      branch
    } = req.body;

    // If staff document was only in legacy User collection, create Staff document
    if (!staff && legacyUser) {
      staff = new Staff({
        _id: legacyUser._id,
        staffId: legacyUser.staffId || `STF-${Math.floor(100 + Math.random() * 900)}`,
        fullName: legacyUser.fullName,
        email: legacyUser.email,
        password: legacyUser.password || 'Temporary@123',
        mobile: legacyUser.mobile || '',
        department: legacyUser.department || 'Car Wash',
        serviceKey: legacyUser.serviceKey || 'car-wash',
        staffRole: legacyUser.staffRole || 'Staff Specialist',
        salary: legacyUser.salary || '',
        leaveBalance: legacyUser.leaveBalance || 12,
        permissions: legacyUser.permissions || [],
        photo: legacyUser.photo || '',
        branch: legacyUser.branch || 'Main Branch',
        isActive: legacyUser.isActive !== undefined ? legacyUser.isActive : true
      });
    }

    if (email && email.toLowerCase().trim() !== staff.email) {
      const cleanEmail = email.toLowerCase().trim();
      const existing = await Staff.findOne({ email: cleanEmail, _id: { $ne: staff._id } });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Staff member with this email already exists' });
      }
      staff.email = cleanEmail;
      if (legacyUser) legacyUser.email = cleanEmail;
    }

    if (fullName) {
      staff.fullName = fullName;
      if (legacyUser) legacyUser.fullName = fullName;
    }
    if (mobile !== undefined) {
      staff.mobile = mobile;
      if (legacyUser) legacyUser.mobile = mobile;
    }
    if (department !== undefined) {
      staff.department = department;
      if (legacyUser) legacyUser.department = department;
    }
    if (serviceKey !== undefined) {
      staff.serviceKey = serviceKey;
      if (legacyUser) legacyUser.serviceKey = serviceKey;
    }
    if (staffRole !== undefined) {
      staff.staffRole = staffRole;
      if (legacyUser) {
        legacyUser.staffRole = staffRole;
        legacyUser.role = 'staff';
      }
    }
    if (leaveBalance !== undefined) {
      staff.leaveBalance = Number(leaveBalance);
      if (legacyUser) legacyUser.leaveBalance = Number(leaveBalance);
    }
    if (photo !== undefined) {
      staff.photo = photo;
      staff.profileImage = photo;
      if (legacyUser) {
        legacyUser.photo = photo;
        legacyUser.profileImage = photo;
      }
    }
    if (permissions !== undefined) {
      staff.permissions = permissions;
      if (legacyUser) legacyUser.permissions = permissions;
    }
    if (branch !== undefined) {
      staff.branch = branch;
      if (legacyUser) legacyUser.branch = branch;
    }

    if (password && String(password).trim()) {
      if (String(password).trim().length < 6) {
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
      }
      staff.password = String(password).trim();
      if (legacyUser) {
        legacyUser.password = String(password).trim();
      }
    }

    const requestedSalary = readSalaryInput(req.body);
    if (requestedSalary === null) {
      return res.status(400).json({ success: false, message: 'Monthly salary must be a number in rupees' });
    }

    // Only touched when the form sent it, so older edit forms keep the schedule.
    if (req.body.breakSchedule !== undefined) {
      const { value, error: scheduleError } = normalizeBreakSchedule(req.body.breakSchedule);
      if (scheduleError) {
        return res.status(400).json({ success: false, message: scheduleError });
      }
      staff.breakSchedule = value;
      if (legacyUser && User.schema.path('breakSchedule')) legacyUser.breakSchedule = value;
    }

    await staff.save();
    if (legacyUser) {
      await legacyUser.save().catch(() => {});
    }

    // Salary changes go through payroll so they are logged in salary_revisions
    if (requestedSalary !== undefined) {
      const result = await payroll.changeBaseSalary({
        staff,
        newSalary: requestedSalary,
        reason: 'Updated from the Edit Staff form',
        actor: req.user
      });
      staff = result.staff;
    }

    res.status(200).json({
      success: true,
      message: 'Staff member updated successfully',
      staff
    });
  } catch (error) {
    res.status(error instanceof payroll.PayrollError ? error.status : 500).json({
      success: false,
      message: error.message || 'Server error updating staff'
    });
  }
};

// @desc    Delete staff member
// @route   DELETE /api/staff/:id
// @access  Private (Admin)
const deleteStaff = async (req, res) => {
  try {
    const search = buildStaffSearch(req.params.id);
    const staff = await Staff.findOne(search);
    const legacyUser = await User.findOne(search);

    if (!staff && !legacyUser) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    if (staff) {
      staff.isDeleted = true;
      staff.isActive = false;
      await staff.save();
    }

    if (legacyUser) {
      legacyUser.isDeleted = true;
      legacyUser.isActive = false;
      await legacyUser.save().catch(() => {});
    }

    res.status(200).json({
      success: true,
      message: 'Staff member removed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error deleting staff'
    });
  }
};

// @desc    Toggle staff active status
// @route   PATCH /api/staff/:id/status
// @access  Private (Admin)
const toggleStaffStatus = async (req, res) => {
  try {
    const search = buildStaffSearch(req.params.id);
    const staff = await Staff.findOne(search);
    const legacyUser = await User.findOne(search);

    if (!staff && !legacyUser) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }

    let nextState = true;
    if (staff) {
      staff.isActive = !staff.isActive;
      nextState = staff.isActive;
      await staff.save();
    }

    if (legacyUser) {
      legacyUser.isActive = nextState;
      await legacyUser.save().catch(() => {});
    }

    res.status(200).json({
      success: true,
      message: `Staff member ${nextState ? 'activated' : 'deactivated'} successfully`,
      staff: staff || legacyUser
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server error toggling staff status' });
  }
};

// @desc    Reset staff password
// @route   PATCH /api/staff/:id/reset-password
// @access  Private (Admin)
const resetStaffPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const search = buildStaffSearch(req.params.id);
    const staff = await Staff.findOne(search);
    const legacyUser = await User.findOne(search);

    if (!staff && !legacyUser) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }

    if (staff) {
      staff.password = newPassword;
      await staff.save();
    }

    if (legacyUser) {
      legacyUser.password = newPassword;
      await legacyUser.save().catch(() => {});
    }

    res.status(200).json({ success: true, message: 'Staff password reset successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server error resetting password' });
  }
};

// Loads the staff a break request targets and applies the ownership rule:
// ordinary staff may only touch their own record. Sends the error response and
// returns null when the request must stop.
const loadBreakTarget = async (req, res) => {
  const search = buildStaffSearch(req.params.id, req.user);
  const staff = await Staff.findOne({ ...search, isDeleted: { $ne: true } });
  if (!staff) {
    res.status(404).json({ success: false, message: 'Staff member not found' });
    return null;
  }
  if (!canManageBreaks(req.user) && !isSelf(staff, req.user)) {
    res.status(403).json({ success: false, message: 'You can only view or change your own break.' });
    return null;
  }
  return staff;
};

const SELF_SERVICE_BREAK_ACTIONS = new Set(['start', 'start_active', 'end', 'complete']);

// @desc    Drive the staff break lifecycle: assign -> start -> end (or cancel)
// @route   POST /api/staff/:id/break
// @access  Private (Staff: own start/end only; Admin/manager: everything)
const updateStaffBreak = async (req, res) => {
  try {
    const { action, duration = 30, reason = staffBreaks.DEFAULT_REASON } = req.body;

    if (!canManageBreaks(req.user) && !SELF_SERVICE_BREAK_ACTIONS.has(action)) {
      return res.status(403).json({ success: false, message: 'Only an admin or manager can assign or cancel breaks.' });
    }

    const staff = await loadBreakTarget(req, res);
    if (!staff) return;

    const now = new Date();
    const currentStatus = resolveBreakStatus(staff);

    if (action === 'assign' || action === 'request') {
      const { durationNum } = await staffBreaks.assignManualBreak(staff, {
        duration,
        reason,
        now,
        endedBy: endedByFor(staff, req.user)
      });

      return res.status(200).json({
        success: true,
        message: `${durationNum}-minute break assigned to ${staff.fullName}. Waiting for staff to start.`,
        breakStatus: 'pending',
        staff: forClient(req, staff)
      });
    }

    if (action === 'start' || action === 'start_active') {
      if (currentStatus === 'active') {
        // Starting twice (double tap, two tabs) must not reset the clock.
        return res.status(200).json({
          success: true,
          message: 'Break is already running.',
          breakStatus: 'active',
          staff: forClient(req, staff)
        });
      }
      if (currentStatus !== 'pending') {
        return res.status(409).json({ success: false, message: 'There is no assigned break to start.' });
      }

      const { durationNum } = await staffBreaks.startBreak(staff, { now });

      return res.status(200).json({
        success: true,
        message: `Break started for ${staff.fullName} (${durationNum} minutes)`,
        breakStatus: 'active',
        staff: forClient(req, staff)
      });
    }

    // An admin pressing "End" on a break the staff never started means "call
    // it off" — the old controller treated it that way too.
    const isAdminEndOfPending = (action === 'end' || action === 'complete')
      && currentStatus === 'pending' && canManageBreaks(req.user);

    if (action === 'cancel' || isAdminEndOfPending) {
      const result = await staffBreaks.cancelBreak(staff, { now, endedBy: endedByFor(staff, req.user) });

      await staffBreaks.notifyStaff(staff, {
        title: '❌ Break Request Revoked',
        message: 'Your assigned break has been cancelled by admin. Please continue with your duties.',
        priority: 'high',
        data: { type: 'break_cancelled' }
      });

      return res.status(200).json({
        success: true,
        message: `Break request for ${staff.fullName} cancelled.`,
        breakStatus: 'idle',
        overtimeSeconds: result.overtimeSeconds,
        actualSeconds: result.actualSeconds,
        staff: forClient(req, staff)
      });
    }

    if (action === 'end' || action === 'complete') {
      if (currentStatus !== 'active') {
        return res.status(409).json({ success: false, message: 'There is no running break to end.' });
      }

      const allowedMinutes = Number(staff.breakDuration) || 0;
      const { actualSeconds, overtimeSeconds } = await staffBreaks.endActiveBreak(staff, {
        now,
        endedBy: endedByFor(staff, req.user),
        completedNaturally: true
      });

      await staffBreaks.notifyStaff(staff, {
        title: '⏰ Break Completed',
        message: overtimeSeconds > 0
          ? `Your break ran ${Math.ceil(overtimeSeconds / 60)} min over. Please return to your workstation.`
          : 'Your break is over. Please return to your workstation.',
        priority: 'urgent',
        data: { type: 'break_completed' }
      });

      return res.status(200).json({
        success: true,
        message: `Break ended for ${staff.fullName}. Status reset to active.`,
        breakStatus: 'idle',
        actualSeconds,
        overtimeSeconds,
        allowedMinutes,
        staff: forClient(req, staff)
      });
    }

    return res.status(400).json({
      success: false,
      message: 'Invalid action. Must be "assign", "start", "cancel" or "end".'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server error updating staff break' });
  }
};

// @desc    Get staff break status (plus today's breaks and the schedule)
// @route   GET /api/staff/:id/break
// @access  Private (Staff: own only; Admin/manager)
const getStaffBreakStatus = async (req, res) => {
  try {
    const staff = await loadBreakTarget(req, res);
    if (!staff) return;

    const now = new Date();
    // The staff app polls this every few seconds, so running the scheduler's
    // per-staff step here makes the break popup appear on time even when no
    // background timer is running (serverless). Never fail the read over it.
    try {
      await processStaffBreaks(staff, now);
    } catch (err) {
      console.warn('[breakScheduler] lazy check failed:', err.message);
    }
    const live = liveBreakFields(staff, now);

    const [currentLog, todayLogs] = await Promise.all([
      staff.currentBreakLogId ? BreakLog.findById(staff.currentBreakLogId).lean() : null,
      BreakLog.find({ staff: staff._id, date: dayKey(now) }).sort({ createdAt: 1 }).lean()
    ]);

    res.status(200).json({
      success: true,
      breakStatus: live.breakStatus,
      isOnBreak: live.breakStatus === 'active',
      breakStartTime: staff.breakStartTime,
      breakEndTime: staff.breakEndTime,
      breakDuration: staff.breakDuration,
      breakReason: staff.breakReason,
      remainingSeconds: live.remainingSeconds,
      isOvertime: live.isOvertime,
      overtimeSeconds: live.overtimeSeconds,
      currentSlot: staff.currentBreakSlot ?? null,
      label: currentLog?.label || staff.breakReason,
      scheduledTime: currentLog?.scheduledTime || '',
      source: currentLog?.source || null,
      breakSchedule: staff.breakSchedule || [],
      todayLogs,
      serverNow: now.toISOString(),
      staff: forClient(req, staff)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server error getting break status' });
  }
};

// @desc    Replace a staff member's daily break schedule
// @route   PUT /api/staff/:id/break-schedule
// @access  Private (Admin / staff managers)
const updateStaffBreakSchedule = async (req, res) => {
  try {
    const { value, error } = normalizeBreakSchedule(req.body.breakSchedule);
    if (error) return res.status(400).json({ success: false, message: error });

    const search = buildStaffSearch(req.params.id);
    const staff = await Staff.findOne({ ...search, isDeleted: { $ne: true } });
    if (!staff) return res.status(404).json({ success: false, message: 'Staff member not found' });

    // A break already handed out stays as it is even if its slot was just
    // disabled; the change applies from the next occurrence.
    staff.breakSchedule = value;
    await staff.save();

    if (User.schema.path('breakSchedule')) {
      await User.updateOne({ _id: staff._id }, { $set: { breakSchedule: value } }).catch(() => {});
    }

    return res.status(200).json({
      success: true,
      message: `Break schedule updated for ${staff.fullName}`,
      breakSchedule: staff.breakSchedule,
      staff: forClient(req, staff)
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Server error updating break schedule' });
  }
};

const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;
const MAX_LOG_RANGE_DAYS = 92;
const shiftDayKey = (key, days) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
};
const daysBetweenKeys = (from, to) => Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000);

// @desc    Break history for one staff member, with overtime totals
// @route   GET /api/staff/:id/break-logs?from=YYYY-MM-DD&to=YYYY-MM-DD
// @access  Private (Staff: own only; Admin/manager)
const getStaffBreakLogs = async (req, res) => {
  try {
    const today = dayKey(new Date());
    const to = req.query.to ? String(req.query.to) : today;
    const from = req.query.from ? String(req.query.from) : shiftDayKey(to, -6);
    if (!DAY_KEY.test(from) || !DAY_KEY.test(to) || Number.isNaN(Date.parse(from)) || Number.isNaN(Date.parse(to))) {
      return res.status(400).json({ success: false, message: 'from and to must be YYYY-MM-DD' });
    }
    const span = daysBetweenKeys(from, to);
    if (span < 0) return res.status(400).json({ success: false, message: '"from" must be on or before "to"' });
    if (span + 1 > MAX_LOG_RANGE_DAYS) {
      return res.status(400).json({ success: false, message: `Range is limited to ${MAX_LOG_RANGE_DAYS} days` });
    }

    const staff = await loadBreakTarget(req, res);
    if (!staff) return;

    const logs = await BreakLog.find({ staff: staff._id, date: { $gte: from, $lte: to } })
      .sort({ date: -1, createdAt: -1 })
      .lean();

    const summary = { totalOvertimeSeconds: 0, overtimeCount: 0, completedCount: 0, missedCount: 0, totalBreakSeconds: 0 };
    for (const log of logs) {
      summary.totalOvertimeSeconds += log.overtimeSeconds || 0;
      summary.totalBreakSeconds += log.actualSeconds || 0;
      if ((log.overtimeSeconds || 0) > 0) summary.overtimeCount += 1;
      if (log.status === 'completed') summary.completedCount += 1;
      if (log.status === 'missed') summary.missedCount += 1;
    }

    return res.status(200).json({ success: true, from, to, logs, summary });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Server error fetching break logs' });
  }
};

module.exports = {
  getStaffList,
  getStaffById,
  createStaff,
  updateStaff,
  deleteStaff,
  toggleStaffStatus,
  resetStaffPassword,
  updateStaffBreak,
  getStaffBreakStatus,
  updateStaffBreakSchedule,
  getStaffBreakLogs
};

