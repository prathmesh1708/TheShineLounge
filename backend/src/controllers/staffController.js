const Staff = require('../models/Staff');
const User = require('../models/User');

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
        if (stf.isOnBreak && stf.breakEndTime && new Date(stf.breakEndTime) <= now) {
          stf.isOnBreak = false;
          if (stf.breakStartTime) {
            stf.breakHistory.push({
              startTime: stf.breakStartTime,
              endTime: stf.breakEndTime,
              duration: stf.breakDuration || 30,
              reason: stf.breakReason,
              startedBy: 'admin',
              endedBy: 'system_timer',
              completedNaturally: true
            });
          }
          stf.breakStartTime = null;
          stf.breakEndTime = null;
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

    // Auto-expire break if time elapsed
    if (staff.isOnBreak && staff.breakEndTime && new Date(staff.breakEndTime) <= new Date()) {
      staff.isOnBreak = false;
      staff.breakStartTime = null;
      staff.breakEndTime = null;
      await staff.save().catch(() => {});
    }

    res.status(200).json({
      success: true,
      staff
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
      salary,
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
      salary: salary || '',
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
          salary: salary || '',
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
      salary,
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
    if (salary !== undefined) {
      staff.salary = salary;
      if (legacyUser) legacyUser.salary = salary;
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

    await staff.save();
    if (legacyUser) {
      await legacyUser.save().catch(() => {});
    }

    res.status(200).json({
      success: true,
      message: 'Staff member updated successfully',
      staff
    });
  } catch (error) {
    res.status(500).json({
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

// @desc    Start or End a staff break in MongoDB
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
    const durationNum = Number(duration) || 30;

    if (action === 'start') {
      const breakEndTime = new Date(now.getTime() + durationNum * 60 * 1000);
      staff.isOnBreak = true;
      staff.breakStartTime = now;
      staff.breakEndTime = breakEndTime;
      staff.breakDuration = durationNum;
      staff.breakReason = reason || 'Rest / Lunch Break';

      await staff.save();

      try {
        const Notification = require('../models/Notification');
        await Notification.create({
          title: `☕ ${durationNum}-Minute Break Started`,
          message: `Your ${durationNum}-minute break has started (${reason}). Return time: ${breakEndTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
          recipientType: 'staff',
          targetUserId: staff._id,
          serviceKey: staff.serviceKey || 'car-wash',
          category: 'service_update',
          priority: 'high',
          actionUrl: '/staff/dashboard'
        });
      } catch (err) {
        console.warn('Failed to insert break start notification:', err);
      }

      return res.status(200).json({
        success: true,
        message: `Break started for ${staff.fullName} (${durationNum} minutes)`,
        staff
      });
    } else if (action === 'end' || action === 'complete') {
      if (staff.breakStartTime) {
        const actualEnd = now;
        const actualDurationMinutes = Math.round((actualEnd.getTime() - new Date(staff.breakStartTime).getTime()) / 60000);
        staff.breakHistory.push({
          startTime: staff.breakStartTime,
          endTime: actualEnd,
          duration: actualDurationMinutes,
          reason: staff.breakReason || 'Rest / Lunch Break',
          startedBy: 'admin',
          endedBy: req.user?.role || 'staff',
          completedNaturally: action === 'complete'
        });
      }

      staff.isOnBreak = false;
      staff.breakStartTime = null;
      staff.breakEndTime = null;

      await staff.save();

      try {
        const Notification = require('../models/Notification');
        await Notification.create({
          title: `⏰ Break Completed`,
          message: `Your break is over. Please return to your workstation.`,
          recipientType: 'staff',
          targetUserId: staff._id,
          serviceKey: staff.serviceKey || 'car-wash',
          category: 'service_update',
          priority: 'urgent',
          actionUrl: '/staff/dashboard'
        });
      } catch (err) {
        console.warn('Failed to insert break end notification:', err);
      }

      return res.status(200).json({
        success: true,
        message: `Break ended for ${staff.fullName}. Status reset to active.`,
        staff
      });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid action. Must be "start" or "end".' });
    }
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

    let isStillOnBreak = Boolean(staff.isOnBreak);
    let remainingSeconds = 0;

    if (isStillOnBreak && staff.breakEndTime) {
      const now = new Date();
      const end = new Date(staff.breakEndTime);
      const diffMs = end.getTime() - now.getTime();
      if (diffMs <= 0) {
        // Break has naturally finished in MongoDB
        staff.isOnBreak = false;
        if (staff.breakStartTime) {
          staff.breakHistory.push({
            startTime: staff.breakStartTime,
            endTime: staff.breakEndTime,
            duration: staff.breakDuration || 30,
            reason: staff.breakReason,
            startedBy: 'admin',
            endedBy: 'system_timer',
            completedNaturally: true
          });
        }
        staff.breakStartTime = null;
        staff.breakEndTime = null;
        await staff.save();
        isStillOnBreak = false;
        remainingSeconds = 0;
      } else {
        remainingSeconds = Math.floor(diffMs / 1000);
      }
    }

    res.status(200).json({
      success: true,
      isOnBreak: isStillOnBreak,
      breakStartTime: staff.breakStartTime,
      breakEndTime: staff.breakEndTime,
      breakDuration: staff.breakDuration,
      breakReason: staff.breakReason,
      remainingSeconds,
      staff
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

