const Attendance = require('../models/Attendance');

// @desc    Register staff check-in
// @route   POST /api/attendance/check-in
// @access  Staff
const checkIn = async (req, res) => {
  try {
    const staffId = req.user._id;
    const dateStr = new Date().toISOString().split('T')[0];

    // Check if there is an active check-in session today (not checked out yet)
    const existingActive = await Attendance.findOne({ staffId, date: dateStr, checkOutTime: 'In Progress' });
    if (existingActive) {
      return res.status(400).json({
        success: false,
        message: 'You have already checked in. Please check out first before checking in again.'
      });
    }

    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const { photoUrl, location } = req.body;

    const record = await Attendance.create({
      staffId,
      date: dateStr,
      checkInTime: timeNow,
      photoUrl: photoUrl || '',
      location: location || '19.0760° N, 72.8777° E (Main Branch)',
      status: 'Present'
    });

    res.status(201).json({
      success: true,
      message: 'Check-in registered successfully.',
      attendance: record
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during check-in.'
    });
  }
};

// @desc    Register staff check-out
// @route   POST /api/attendance/check-out
// @access  Staff
const checkOut = async (req, res) => {
  try {
    const staffId = req.user._id;
    const dateStr = new Date().toISOString().split('T')[0];

    const record = await Attendance.findOne({ staffId, date: dateStr, checkOutTime: 'In Progress' });
    if (!record) {
      return res.status(400).json({
        success: false,
        message: 'No active check-in session found to check out from today.'
      });
    }

    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    record.checkOutTime = timeNow;
    await record.save();

    res.status(200).json({
      success: true,
      message: 'Check-out registered successfully.',
      attendance: record
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during check-out.'
    });
  }
};

// @desc    Get attendance logs for a staff member
// @route   GET /api/attendance/staff/:id
// @access  Admin or Owner Staff
const getStaffAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const logs = await Attendance.find({ staffId: id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      attendance: logs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching attendance logs.'
    });
  }
};

module.exports = {
  checkIn,
  checkOut,
  getStaffAttendance
};
