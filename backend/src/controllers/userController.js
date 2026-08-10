const User = require('../models/User');
const Feedback = require('../models/Feedback');
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

    // Deduce proper department & serviceKey if not explicitly provided
    let finalServiceKey = serviceKey || '';
    let finalDept = department || '';
    const roleLower = (staffRole || '').toLowerCase();

    if (!finalServiceKey || !finalDept) {
      if (roleLower.includes('cafe supervisor') || roleLower.includes('barista') || roleLower.includes('chef') || roleLower.includes('pastry')) {
        finalServiceKey = finalServiceKey || 'cafe';
        finalDept = finalDept || 'Café';
      } else if (roleLower.includes('drive-thru') || roleLower.includes('drive-through')) {
        finalServiceKey = finalServiceKey || 'drive-through-cafe';
        finalDept = finalDept || 'Drive-Through Café';
      } else if (roleLower.includes('detail') || roleLower.includes('paint correction')) {
        finalServiceKey = finalServiceKey || 'car-detailing';
        finalDept = finalDept || 'Car Detailing';
      } else if (roleLower.includes('groomer') || roleLower.includes('pet')) {
        finalServiceKey = finalServiceKey || 'dog-wash';
        finalDept = finalDept || 'Dog Wash';
      } else if (roleLower.includes('salon') || roleLower.includes('barber') || roleLower.includes('stylist')) {
        finalServiceKey = finalServiceKey || 'salon';
        finalDept = finalDept || "Men's Salon";
      } else {
        finalServiceKey = finalServiceKey || 'car-wash';
        finalDept = finalDept || 'Car Wash';
      }
    }

    const staff = await User.create({
      fullName,
      email,
      password,
      mobile: mobile || '',
      role: 'staff',
      department: finalDept,
      serviceKey: finalServiceKey,
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
    const andConditions = [];

    if (serviceKey) {
      const matchConditions = [{ serviceKey: serviceKey }];
      if (serviceKey === 'car-wash') {
        matchConditions.push({ department: 'Car Wash' });
        andConditions.push({
          staffRole: { $not: /cafe|barista|pastry|chef|groomer|pet|salon|barber/i }
        });
      } else if (serviceKey === 'car-detailing') {
        matchConditions.push({ department: { $in: ['Car Detailing', 'Detailing'] } });
      } else if (serviceKey === 'cafe') {
        matchConditions.push({ department: { $in: ['Cafe', 'Café'] } });
      } else if (serviceKey === 'dog-wash') {
        matchConditions.push({ department: 'Dog Wash' });
      } else if (serviceKey === 'salon') {
        matchConditions.push({ department: { $in: ['Salon', "Men's Salon"] } });
      } else if (serviceKey === 'drive-through-cafe') {
        matchConditions.push({ department: { $in: ['Drive-Through Cafe', 'Drive-Through Café'] } });
      }

      andConditions.push({
        $or: matchConditions
      });
    } else if (department && department !== 'All') {
      query.department = department;
    }

    // Search by name, email, or mobile
    if (search) {
      andConditions.push({
        $or: [
          { fullName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { mobile: { $regex: search, $options: 'i' } }
        ]
      });
    }

    // Filter by status
    if (status === 'Active') {
      query.isActive = true;
    } else if (status === 'Inactive') {
      query.isActive = false;
    }

    if (andConditions.length > 0) {
      query.$and = andConditions;
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
    const {
      fullName,
      email,
      mobile,
      department,
      serviceKey,
      staffRole,
      salary,
      leaveBalance,
      photo,
      permissions,
      branch,
      password
    } = req.body;

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
      staff.email = email.toLowerCase();
    }

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
    if (password) {
      staff.password = password; // Triggers the schema pre-save hook for hashing!
    }

    await staff.save();

    res.status(200).json({
      success: true,
      message: 'Staff member updated successfully',
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

// ─── CUSTOMER CRM & MEMBERSHIP MANAGEMENT ─────────────────────────────────────

// Helper to compute dynamic membership status
const computeMembershipStatus = (user) => {
  if (!user.membership || !user.membership.planName || user.membership.status === 'None') {
    return 'Regular Customer';
  }
  if (user.membership.status === 'Suspended') {
    return 'Suspended Member';
  }
  const now = new Date();
  const expiry = user.membership.expiryDate ? new Date(user.membership.expiryDate) : null;
  
  if (!expiry || expiry < now) {
    return 'Expired Member';
  }
  
  const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 3600 * 24));
  if (diffDays <= 7) {
    return 'Due for Renewal';
  }
  
  return 'Active Member';
};

// @desc    Get all customers with enriched CRM profile & membership info
// @route   GET /api/users/customers
// @access  Admin
const getCustomers = async (req, res) => {
  try {
    const { page = 1, limit = 50, search = '' } = req.query;

    const query = { role: 'user', isDeleted: false };

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [rawCustomers, total] = await Promise.all([
      User.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(query)
    ]);

    // Everything below reports what is actually stored. Placeholder vehicles and
    // stand-in memberships used to be substituted here when a record was empty,
    // which reads fine on a dashboard but is not survivable now that hardware
    // acts on this data: an ANPR arrival would check in a car that does not
    // exist, and a wash would be taken off a membership nobody bought. An empty
    // field must look empty.
    const customers = rawCustomers.map(u => {
      const computedSegment = computeMembershipStatus(u);
      const vehicleList = (u.vehicles || [])
        .filter(v => v.plateNumber)
        .map(v => `${v.plateNumber}${v.model ? ` (${v.model})` : ''}`);

      return {
        _id: u._id,
        id: u.email || u._id,
        name: u.fullName,
        fullName: u.fullName,
        email: u.email,
        phone: u.mobile || '',
        mobile: u.mobile || '',
        city: u.city || '',
        segment: computedSegment,
        totalSpent: u.totalSpent || 0,
        loyaltyPoints: u.loyaltyPoints || 0,
        vehicles: vehicleList,
        rawVehicles: u.vehicles || [],
        membership: u.membership || null,
        lastVisit: u.updatedAt ? new Date(u.updatedAt).toISOString().split('T')[0] : null,
        createdAt: u.createdAt
      };
    });

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

    const computedSegment = computeMembershipStatus(customer);
    const result = customer.toObject();
    result.segment = computedSegment;

    res.status(200).json({
      success: true,
      customer: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Update customer membership & suspension status
// @route   PUT /api/users/customers/:id/membership
// @access  Admin
const updateCustomerMembership = async (req, res) => {
  try {
    const { status, planName, serviceKey, expiryDate, suspensionReason } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    if (!user.membership) {
      user.membership = {};
    }

    if (status !== undefined) user.membership.status = status;
    if (planName !== undefined) user.membership.planName = planName;
    if (serviceKey !== undefined) user.membership.serviceKey = serviceKey;
    if (expiryDate !== undefined) user.membership.expiryDate = new Date(expiryDate);
    if (suspensionReason !== undefined) user.membership.suspensionReason = suspensionReason;

    // Log administrative action in misuseAlerts/audit log if suspended
    if (status === 'Suspended') {
      user.membership.misuseAlerts.unshift({
        date: new Date(),
        alertType: 'Management Suspension',
        description: suspensionReason || 'Membership suspended by admin due to policy breach'
      });
    } else if (status === 'Active' && user.membership.status === 'Suspended') {
      user.membership.misuseAlerts.unshift({
        date: new Date(),
        alertType: 'Admin Reactivation',
        description: 'Membership reactivated by admin override'
      });
    }

    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: 'Membership status updated successfully',
      membership: user.membership
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server error updating membership' });
  }
};

// @desc    Update customer membership anti-misuse usage rules
// @route   PUT /api/users/customers/:id/usage-rules
// @access  Admin
const updateCustomerUsageRules = async (req, res) => {
  try {
    const { maxPerDay, maxPerMonth, coolOffHours, boundVehiclesOnly } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    if (!user.membership) {
      user.membership = {};
    }

    if (maxPerDay !== undefined) user.membership.maxPerDay = Number(maxPerDay);
    if (maxPerMonth !== undefined) user.membership.maxPerMonth = Number(maxPerMonth);
    if (coolOffHours !== undefined) user.membership.coolOffHours = Number(coolOffHours);
    if (boundVehiclesOnly !== undefined) user.membership.boundVehiclesOnly = Boolean(boundVehiclesOnly);

    user.membership.misuseAlerts.unshift({
      date: new Date(),
      alertType: 'Rules Updated',
      description: `Usage rules updated: Max/Day=${user.membership.maxPerDay}, Max/Month=${user.membership.maxPerMonth}, CoolOff=${user.membership.coolOffHours}h, PlateBinding=${user.membership.boundVehiclesOnly}`
    });

    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: 'Membership usage rules updated successfully',
      membership: user.membership
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server error updating usage rules' });
  }
};

// @desc    Add vehicle to customer CRM profile
// @route   POST /api/users/customers/:id/vehicles
// @access  Admin
const addCustomerVehicle = async (req, res) => {
  try {
    const { plateNumber, model, category, isPrimary } = req.body;
    if (!plateNumber) {
      return res.status(400).json({ success: false, message: 'Plate number is required' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    user.vehicles.push({
      plateNumber,
      model: model || 'Vehicle',
      category: category || 'Car',
      isPrimary: Boolean(isPrimary)
    });

    // Also update boundVehicles if array exists
    if (user.membership && user.membership.boundVehicles) {
      const formatted = `${plateNumber} (${model || 'Vehicle'})`;
      if (!user.membership.boundVehicles.includes(formatted)) {
        user.membership.boundVehicles.push(formatted);
      }
    }

    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: 'Vehicle added successfully',
      vehicles: user.vehicles
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server error adding vehicle' });
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

// @desc    Submit feedback or help support request
// @route   POST /api/users/feedback
// @access  Public / Private
const submitFeedback = async (req, res) => {
  try {
    const { name, email, phone, category, rating, message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please write a message or feedback'
      });
    }

    const userId = req.user ? req.user._id : null;

    const feedback = await Feedback.create({
      name: name || (req.user ? (req.user.fullName || req.user.name) : 'Customer'),
      email: (email || (req.user ? req.user.email : '')).toLowerCase(),
      phone: phone || (req.user ? req.user.mobile : ''),
      category: category || 'General Feedback',
      rating: Number(rating) || 5,
      message: message.trim(),
      userId
    });

    try {
      const Notification = require('../models/Notification');
      await Notification.create({
        title: `Feedback / Support (${feedback.category}): ${feedback.rating} Stars`,
        message: `From: ${feedback.name} (${feedback.email || 'No email'})\nCategory: ${feedback.category}\n\nMessage:\n${feedback.message}`,
        recipientType: 'all_staff',
        serviceKey: 'system',
        category: 'service_update',
        priority: feedback.category === 'Bug or Technical Issue' ? 'high' : 'normal'
      });
    } catch (notifErr) {
      console.warn('Could not create notification log for feedback:', notifErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Thank you for your feedback! Our support team has received your message.',
      feedback
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error submitting feedback'
    });
  }
};

// @desc    Get customer's own submitted feedbacks & support tickets
// @route   GET /api/users/my-feedback
// @access  Private (or query by email)
const getMyFeedback = async (req, res) => {
  try {
    let query = {};
    if (req.user) {
      query = {
        $or: [
          { userId: req.user._id },
          { email: (req.user.email || '').toLowerCase() }
        ]
      };
    } else if (req.query.email) {
      query = { email: String(req.query.email).toLowerCase() };
    } else {
      return res.status(200).json({ success: true, feedbacks: [] });
    }

    const feedbacks = await Feedback.find(query).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      feedbacks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching feedback'
    });
  }
};

// @desc    Get all feedbacks for Admin Panel
// @route   GET /api/users/admin/feedback
// @access  Admin / Staff
const getAdminFeedbacks = async (req, res) => {
  try {
    const { status, category, search } = req.query;
    const filter = {};

    if (status && status !== 'All') {
      filter.status = status;
    }
    if (category && category !== 'All') {
      filter.category = category;
    }
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { name: regex },
        { email: regex },
        { phone: regex },
        { message: regex },
        { replyMessage: regex }
      ];
    }

    const feedbacks = await Feedback.find(filter).sort({ createdAt: -1 });
    
    // Stats calculation
    const totalCount = await Feedback.countDocuments();
    const pendingCount = await Feedback.countDocuments({ status: 'Pending' });
    const repliedCount = await Feedback.countDocuments({ status: 'Replied' });
    const resolvedCount = await Feedback.countDocuments({ status: 'Resolved' });
    
    const allRatings = await Feedback.find({}, 'rating');
    const avgRating = allRatings.length > 0 
      ? (allRatings.reduce((sum, item) => sum + (item.rating || 5), 0) / allRatings.length).toFixed(1)
      : '5.0';

    res.status(200).json({
      success: true,
      feedbacks,
      stats: {
        total: totalCount,
        pending: pendingCount,
        replied: repliedCount,
        resolved: resolvedCount,
        avgRating: Number(avgRating)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching admin feedbacks'
    });
  }
};

// @desc    Admin reply to customer feedback / support ticket
// @route   PUT /api/users/admin/feedback/:id/reply
// @access  Admin / Staff
const replyToFeedback = async (req, res) => {
  try {
    const { replyMessage, status } = req.body;

    if (!replyMessage || !replyMessage.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a reply message'
      });
    }

    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback record not found'
      });
    }

    feedback.replyMessage = replyMessage.trim();
    feedback.status = status || 'Replied';
    feedback.repliedBy = req.user ? (req.user.fullName || req.user.email) : 'Admin Executive';
    feedback.repliedAt = new Date();

    await feedback.save();

    // Optionally notify customer
    try {
      if (feedback.userId || feedback.email) {
        const Notification = require('../models/Notification');
        await Notification.create({
          title: `Reply to your feedback: ${feedback.category}`,
          message: `Dear ${feedback.name},\n\nAdmin response: "${feedback.replyMessage}"`,
          recipientType: feedback.userId ? 'user' : 'all_users',
          targetUserId: feedback.userId || null,
          category: 'service_update',
          priority: 'normal'
        });
      }
    } catch (e) {
      console.warn('Could not send reply notification:', e.message);
    }

    res.status(200).json({
      success: true,
      message: 'Reply sent successfully',
      feedback
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error replying to feedback'
    });
  }
};

// @desc    Update feedback status
// @route   PATCH /api/users/admin/feedback/:id/status
// @access  Admin / Staff
const updateFeedbackStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Pending', 'Replied', 'Resolved', 'Archived'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback record not found'
      });
    }

    res.status(200).json({
      success: true,
      message: `Feedback status updated to ${status}`,
      feedback
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error updating feedback status'
    });
  }
};

// @desc    Delete feedback item
// @route   DELETE /api/users/admin/feedback/:id
// @access  Admin
const deleteFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findByIdAndDelete(req.params.id);
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback record not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Feedback deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error deleting feedback'
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
  updateCustomerMembership,
  updateCustomerUsageRules,
  addCustomerVehicle,
  updateProfile,
  submitFeedback,
  getMyFeedback,
  getAdminFeedbacks,
  replyToFeedback,
  updateFeedbackStatus,
  deleteFeedback
};


