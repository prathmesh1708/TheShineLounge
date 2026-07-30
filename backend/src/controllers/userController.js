const User = require('../models/User');
const bcrypt = require('bcryptjs');

// ─── STAFF MANAGEMENT (Admin Only) ──────────────────────────

// @desc    Create a new staff member
// @route   POST /api/users/staff
// @access  Admin
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

    // Check duplicate email
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists'
      });
    }

    const staff = await User.create({
      fullName,
      email,
      password,
      mobile: mobile || '',
      role: 'staff',
      department: department || 'Car Wash',
      serviceKey: serviceKey || 'car-wash',
      staffRole: staffRole || 'Staff Specialist',
      salary: salary || '',
      leaveBalance: leaveBalance ? Number(leaveBalance) : 12,
      photo: photo || '',
      profileImage: photo || '',
      permissions: permissions || ['bookings', 'orders'],
      branch: branch || 'Main Branch',
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: 'Staff member created successfully',
      staff: {
        _id: staff._id,
        fullName: staff.fullName,
        email: staff.email,
        mobile: staff.mobile,
        role: staff.role,
        department: staff.department,
        serviceKey: staff.serviceKey,
        staffRole: staff.staffRole,
        salary: staff.salary,
        leaveBalance: staff.leaveBalance,
        photo: staff.photo,
        permissions: staff.permissions,
        isActive: staff.isActive,
        branch: staff.branch,
        createdAt: staff.createdAt
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Server error creating staff'
    });
  }
};

// @desc    Get all staff members
// @route   GET /api/users/staff
// @access  Admin
const getStaffList = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      search = '',
      department = '',
      serviceKey = '',
      status = ''
    } = req.query;

    const query = { role: 'staff', isDeleted: false };

    if (serviceKey) {
      query.$or = [
        { serviceKey: serviceKey },
        { department: { $regex: serviceKey.replace('-', ' '), $options: 'i' } }
      ];
    } else if (department && department !== 'All') {
      query.department = department;
    }

    // Search by name, email, or mobile
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by department
    if (department && department !== 'All') {
      query.department = department;
    }

    // Filter by status
    if (status === 'Active') {
      query.isActive = true;
    } else if (status === 'Inactive') {
      query.isActive = false;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [staffList, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      staff: staffList,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching staff'
    });
  }
};

// @desc    Get staff member by ID
// @route   GET /api/users/staff/:id
// @access  Admin
const getStaffById = async (req, res) => {
  try {
    const staff = await User.findOne({
      _id: req.params.id,
      role: 'staff',
      isDeleted: false
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    res.status(200).json({
      success: true,
      staff
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Update staff member
// @route   PUT /api/users/staff/:id
// @access  Admin
const updateStaff = async (req, res) => {
  try {
    const { fullName, email, mobile, department, permissions, branch } = req.body;

    const staff = await User.findOne({
      _id: req.params.id,
      role: 'staff',
      isDeleted: false
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    // Check duplicate email if changed
    if (email && email.toLowerCase() !== staff.email) {
      const emailExists = await User.findOne({ email: email.toLowerCase() });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'This email is already in use by another account'
        });
      }
      staff.email = email;
    }

    if (fullName) staff.fullName = fullName;
    if (mobile !== undefined) staff.mobile = mobile;
    if (department !== undefined) staff.department = department;
    if (permissions !== undefined) staff.permissions = permissions;
    if (branch !== undefined) staff.branch = branch;

    await staff.save({ validateBeforeSave: false });

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

// @desc    Toggle staff active status
// @route   PATCH /api/users/staff/:id/status
// @access  Admin
const toggleStaffStatus = async (req, res) => {
  try {
    const staff = await User.findOne({
      _id: req.params.id,
      role: 'staff',
      isDeleted: false
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    staff.isActive = !staff.isActive;
    await staff.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: `Staff member ${staff.isActive ? 'activated' : 'deactivated'} successfully`,
      staff
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error toggling status'
    });
  }
};

// @desc    Reset staff password
// @route   PATCH /api/users/staff/:id/reset-password
// @access  Admin
const resetStaffPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters'
      });
    }

    const staff = await User.findOne({
      _id: req.params.id,
      role: 'staff',
      isDeleted: false
    }).select('+password');

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    staff.password = newPassword;
    await staff.save();

    res.status(200).json({
      success: true,
      message: 'Staff password reset successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error resetting password'
    });
  }
};

// @desc    Soft delete staff member
// @route   DELETE /api/users/staff/:id
// @access  Admin
const deleteStaff = async (req, res) => {
  try {
    const staff = await User.findOne({
      _id: req.params.id,
      role: 'staff',
      isDeleted: false
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    staff.isDeleted = true;
    staff.isActive = false;
    await staff.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: 'Staff member deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error deleting staff'
    });
  }
};

// ─── CUSTOMER MANAGEMENT ─────────────────────────────────────

// @desc    Get all customers
// @route   GET /api/users/customers
// @access  Admin
const getCustomers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = ''
    } = req.query;

    const query = { role: 'user', isDeleted: false };

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [customers, total] = await Promise.all([
      User.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      customers,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching customers'
    });
  }
};

// @desc    Get customer by ID
// @route   GET /api/users/customers/:id
// @access  Admin
const getCustomerById = async (req, res) => {
  try {
    const customer = await User.findOne({
      _id: req.params.id,
      role: 'user',
      isDeleted: false
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.status(200).json({
      success: true,
      customer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// ─── USER SELF-SERVICE ────────────────────────────────────────

// @desc    Update own profile
// @route   PUT /api/users/profile
// @access  Private (any logged in user)
const updateProfile = async (req, res) => {
  try {
    const { fullName, mobile, profileImage } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (fullName) user.fullName = fullName;
    if (mobile !== undefined) user.mobile = mobile;
    if (profileImage !== undefined) user.profileImage = profileImage;

    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        department: user.department,
        permissions: user.permissions,
        profileImage: user.profileImage,
        branch: user.branch
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error updating profile'
    });
  }
};

module.exports = {
  createStaff,
  getStaffList,
  getStaffById,
  updateStaff,
  toggleStaffStatus,
  resetStaffPassword,
  deleteStaff,
  getCustomers,
  getCustomerById,
  updateProfile
};
