const Staff = require('../models/Staff');

// @desc    Get all staff members
// @route   GET /api/staff
// @access  Private (Staff/Admin)
const getStaffList = async (req, res) => {
  try {
    const { department, serviceKey, page = 1, limit = 20 } = req.query;
    const query = { isDeleted: { $ne: true } };
    if (department && department !== 'All') query.department = department;
    if (serviceKey) query.serviceKey = serviceKey;

    const total = await Staff.countDocuments(query);
    const pages = Math.ceil(total / Number(limit)) || 1;
    const staff = await Staff.find(query)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      count: staff.length,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages
      },
      staff
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching staff'
    });
  }
};

// @desc    Create new staff member
// @route   POST /api/staff
// @access  Private (Admin)
const createStaff = async (req, res) => {
  try {
    const { fullName, email, password, mobile, department, serviceKey, staffRole, salary, leaveBalance, photo, permissions, branch } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide fullName, email, and password'
      });
    }

    const existing = await Staff.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Staff member with this email already exists'
      });
    }

    const staffId = `STF-${Math.floor(100 + Math.random() * 900)}`;

    const staff = await Staff.create({
      staffId,
      fullName,
      email: email.toLowerCase().trim(),
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
    const staff = await Staff.findOne({
      $or: [{ _id: req.params.id }, { staffId: req.params.id }, { email: String(req.params.id).toLowerCase() }]
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    const { fullName, mobile, department, serviceKey, staffRole, salary, leaveBalance, photo, permissions, branch } = req.body;

    if (fullName) staff.fullName = fullName;
    if (mobile !== undefined) staff.mobile = mobile;
    if (department !== undefined) staff.department = department;
    if (serviceKey !== undefined) staff.serviceKey = serviceKey;
    if (staffRole !== undefined) staff.staffRole = staffRole;
    if (salary !== undefined) staff.salary = salary;
    if (leaveBalance !== undefined) staff.leaveBalance = Number(leaveBalance);
    if (photo !== undefined) {
      staff.photo = photo;
      staff.profileImage = photo;
    }
    if (permissions !== undefined) staff.permissions = permissions;
    if (branch !== undefined) staff.branch = branch;

    await staff.save();

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
    const staff = await Staff.findOne({
      $or: [{ _id: req.params.id }, { staffId: req.params.id }]
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    staff.isDeleted = true;
    staff.isActive = false;
    await staff.save();

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
    const staff = await Staff.findOne({
      $or: [{ _id: req.params.id }, { staffId: req.params.id }]
    });

    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }

    staff.isActive = !staff.isActive;
    await staff.save();

    res.status(200).json({
      success: true,
      message: `Staff member ${staff.isActive ? 'activated' : 'deactivated'} successfully`,
      staff
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

    const staff = await Staff.findOne({
      $or: [{ _id: req.params.id }, { staffId: req.params.id }]
    });

    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }

    staff.password = newPassword;
    await staff.save();

    res.status(200).json({ success: true, message: 'Staff password reset successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server error resetting password' });
  }
};

module.exports = {
  getStaffList,
  createStaff,
  updateStaff,
  deleteStaff,
  toggleStaffStatus,
  resetStaffPassword
};

