const Staff = require('../models/Staff');
const User = require('../models/User');
const payroll = require('../services/payroll');
const { parseSalaryText, formatSalaryText } = require('../utils/salaryAmount');

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

// Derive authoritative break status
const resolveBreakStatus = (staff) => {
  if (staff.breakStatus === 'pending' && !staff.isOnBreak) return 'pending';
  if (staff.isOnBreak || staff.breakStatus === 'active') {
    if (staff.breakEndTime && new Date(staff.breakEndTime) <= new Date()) {
      return 'idle';
    }
    return 'active';
  }
  return staff.breakStatus === 'pending' ? 'pending' : 'idle';
};

// Logs the active break into breakHistory and resets the staff member to idle
const closeActiveBreak = (staff, { endTime = new Date(), endedBy = 'admin', completedNaturally = true } = {}) => {
  if (staff.breakStartTime && Array.isArray(staff.breakHistory)) {
    staff.breakHistory.push({
      startTime: staff.breakStartTime,
      endTime,
      duration: Math.round((new Date(endTime).getTime() - new Date(staff.breakStartTime).getTime()) / 60000),
      reason: staff.breakReason || 'Rest / Lunch Break',
      startedBy: 'admin',
      endedBy,
      completedNaturally
    });
  }
  staff.breakStatus = 'idle';
  staff.isOnBreak = false;
  staff.breakStartTime = null;
  staff.breakEndTime = null;
};

// Returns true if an active break had run out and was closed
const expireFinishedBreak = (staff, now = new Date()) => {
  if ((staff.isOnBreak || staff.breakStatus === 'active') && staff.breakEndTime && new Date(staff.breakEndTime) <= now) {
    closeActiveBreak(staff, { endTime: staff.breakEndTime, endedBy: 'system_timer', completedNaturally: true });
    return true;
  }
  return false;
};

const notifyStaffAboutBreak = async (staff, { title, message, priority }) => {
  try {
    const Notification = require('../models/Notification');
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
    console.warn('Failed to insert break notification:', err);
  }
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

    // Auto-expire any finished breaks in MongoDB
    const now = new Date();
    const updatedStaff = await Promise.all(
      staffList.map(async (stf) => {
        if (expireFinishedBreak(stf, now)) {
          await stf.save().catch(() => {});
        }
        return stf;
      })
    );

    res.status(200).json({
      success: true,
      count: updatedStaff.length,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages
      },
      staff: updatedStaff.map((stf) => forClient(req, stf))
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

    // Auto-expire break if time elapsed
    if (expireFinishedBreak(staff)) {
      await staff.save().catch(() => {});
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
      branch: branch || 'Main Branch'
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
          branch: branch || 'Main Branch'
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

// @desc    Drive the staff break lifecycle: assign -> start -> end (or cancel while pending)
// @route   POST /api/staff/:id/break
// @access  Private (Admin or Staff)
const updateStaffBreak = async (req, res) => {
  try {
    const { action, duration = 30, reason = 'Rest / Lunch Break' } = req.body;
    const search = buildStaffSearch(req.params.id, req.user);
    let staff = await Staff.findOne(search);

    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }

    const now = new Date();
    if (expireFinishedBreak(staff, now)) {
      await staff.save();
    }
    const currentStatus = resolveBreakStatus(staff);

    if (action === 'assign' || action === 'request') {
      const durationNum = Number(duration) || 30;
      staff.breakStatus = 'pending';
      staff.isOnBreak = false;
      staff.breakDuration = durationNum;
      staff.breakReason = reason || 'Rest / Lunch Break';
      staff.breakStartTime = null;
      staff.breakEndTime = null;
      await staff.save();

      await notifyStaffAboutBreak(staff, {
        title: `☕ ${durationNum}-Minute Break Assigned`,
        message: `Admin has assigned you a ${durationNum}-minute break (${staff.breakReason}). Open the app and tap Start when you are ready.`,
        priority: 'high'
      });

      return res.status(200).json({
        success: true,
        message: `${durationNum}-minute break assigned to ${staff.fullName}. Waiting for staff to start.`,
        breakStatus: 'pending',
        staff: forClient(req, staff)
      });
    }

    if (action === 'start' || action === 'start_active') {
      const durationNum = Number(staff.breakDuration) || Number(duration) || 30;
      const breakReasonStr = staff.breakReason || reason || 'Rest / Lunch Break';
      staff.breakStatus = 'active';
      staff.isOnBreak = true;
      staff.breakDuration = durationNum;
      staff.breakReason = breakReasonStr;
      staff.breakStartTime = now;
      staff.breakEndTime = new Date(now.getTime() + durationNum * 60 * 1000);
      await staff.save();

      return res.status(200).json({
        success: true,
        message: `Break started for ${staff.fullName} (${durationNum} minutes)`,
        breakStatus: 'active',
        staff: forClient(req, staff)
      });
    }

    if (action === 'cancel') {
      if (currentStatus === 'active') {
        closeActiveBreak(staff, {
          endTime: now,
          endedBy: req.user?.role || 'admin',
          completedNaturally: false
        });
      } else {
        staff.breakStatus = 'idle';
        staff.isOnBreak = false;
        staff.breakStartTime = null;
        staff.breakEndTime = null;
      }
      await staff.save();

      await notifyStaffAboutBreak(staff, {
        title: '❌ Break Request Revoked',
        message: 'Your assigned break has been cancelled by admin. Please continue with your duties.',
        priority: 'high'
      });

      return res.status(200).json({
        success: true,
        message: `Break request for ${staff.fullName} cancelled.`,
        breakStatus: 'idle',
        staff: forClient(req, staff)
      });
    }

    if (action === 'end' || action === 'complete') {
      closeActiveBreak(staff, {
        endTime: now,
        endedBy: req.user?.role || 'staff',
        completedNaturally: action === 'complete'
      });
      await staff.save();

      if (currentStatus === 'active') {
        await notifyStaffAboutBreak(staff, {
          title: '⏰ Break Completed',
          message: 'Your break is over. Please return to your workstation.',
          priority: 'urgent'
        });
      }

      return res.status(200).json({
        success: true,
        message: `Break ended for ${staff.fullName}. Status reset to active.`,
        breakStatus: 'idle',
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

// @desc    Get staff break status
// @route   GET /api/staff/:id/break
// @access  Private (Staff/Admin)
const getStaffBreakStatus = async (req, res) => {
  try {
    const search = buildStaffSearch(req.params.id, req.user);
    let staff = await Staff.findOne(search);

    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }

    const now = new Date();
    if (expireFinishedBreak(staff, now)) {
      await staff.save();
    }

    const breakStatus = resolveBreakStatus(staff);
    const remainingSeconds = breakStatus === 'active' && staff.breakEndTime
      ? Math.max(0, Math.floor((new Date(staff.breakEndTime).getTime() - now.getTime()) / 1000))
      : 0;

    res.status(200).json({
      success: true,
      breakStatus,
      isOnBreak: breakStatus === 'active',
      breakStartTime: staff.breakStartTime,
      breakEndTime: staff.breakEndTime,
      breakDuration: staff.breakDuration,
      breakReason: staff.breakReason,
      remainingSeconds,
      staff: forClient(req, staff)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server error getting break status' });
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
  getStaffBreakStatus
};

