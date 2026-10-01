const LeaveRequest = require('../models/LeaveRequest');
const Staff = require('../models/Staff');
const Attendance = require('../models/Attendance');

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_LEAVE_SPAN_DAYS = 60;
const LEAVE_TYPES = ['Casual', 'Sick', 'Earned', 'Unpaid', 'Emergency'];

// Same date convention as attendanceController (UTC calendar date)
const todayStr = () => new Date().toISOString().split('T')[0];

const parseDateStr = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return null;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  // Rejects rollovers such as 2026-02-31
  return date.getUTCDate() === d ? date : null;
};

const listDates = (fromDate, toDate) => {
  const dates = [];
  for (let t = parseDateStr(fromDate).getTime(); t <= parseDateStr(toDate).getTime(); t += DAY_MS) {
    dates.push(new Date(t).toISOString().split('T')[0]);
  }
  return dates;
};

const notifyStaffAboutLeave = async (leave, { title, message, priority = 'high' }) => {
  try {
    const Notification = require('../models/Notification');
    await Notification.create({
      title,
      message,
      recipientType: 'staff',
      targetUserId: leave.staff,
      serviceKey: leave.serviceKey || 'car-wash',
      category: 'service_update',
      priority,
      actionUrl: '/staff/profile'
    });
  } catch (err) {
    console.warn('Failed to insert leave notification:', err);
  }
};

const describeRange = (leave) =>
  leave.fromDate === leave.toDate ? leave.fromDate : `${leave.fromDate} to ${leave.toDate}`;

// @desc    Staff applies for leave
// @route   POST /api/leaves
// @access  Staff
const applyLeave = async (req, res) => {
  try {
    const { leaveType = 'Casual', fromDate, toDate = fromDate, isHalfDay = false, reason } = req.body;

    const staff = await Staff.findById(req.user._id);
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff profile not found' });
    }

    if (!LEAVE_TYPES.includes(leaveType)) {
      return res.status(400).json({ success: false, message: `Leave type must be one of ${LEAVE_TYPES.join(', ')}` });
    }
    const from = parseDateStr(fromDate);
    const to = parseDateStr(toDate);
    if (!from || !to) {
      return res.status(400).json({ success: false, message: 'Please choose valid leave dates.' });
    }
    if (to < from) {
      return res.status(400).json({ success: false, message: 'End date cannot be before start date.' });
    }
    if (fromDate < todayStr()) {
      return res.status(400).json({ success: false, message: 'Leave cannot start in the past.' });
    }
    const spanDays = Math.round((to - from) / DAY_MS) + 1;
    if (spanDays > MAX_LEAVE_SPAN_DAYS) {
      return res.status(400).json({ success: false, message: `A single request cannot exceed ${MAX_LEAVE_SPAN_DAYS} days.` });
    }
    const halfDay = Boolean(isHalfDay) && spanDays === 1;
    const days = halfDay ? 0.5 : spanDays;

    if (!String(reason || '').trim()) {
      return res.status(400).json({ success: false, message: 'Please enter a reason for your leave.' });
    }

    const overlapping = await LeaveRequest.findOne({
      staff: staff._id,
      status: { $in: ['pending', 'approved'] },
      fromDate: { $lte: toDate },
      toDate: { $gte: fromDate }
    });
    if (overlapping) {
      return res.status(409).json({
        success: false,
        message: `You already have a ${overlapping.status} leave for ${describeRange(overlapping)}.`
      });
    }

    const balance = Number(staff.leaveBalance) || 0;
    if (days > balance) {
      return res.status(400).json({
        success: false,
        message: `Not enough leave balance. Requested ${days} day(s), available ${balance}.`
      });
    }

    const leave = await LeaveRequest.create({
      staff: staff._id,
      staffCode: staff.staffId,
      staffName: staff.fullName,
      staffEmail: staff.email,
      serviceKey: staff.serviceKey || 'car-wash',
      department: staff.department || '',
      leaveType,
      fromDate,
      toDate,
      isHalfDay: halfDay,
      days,
      reason: String(reason).trim()
    });

    res.status(201).json({ success: true, message: 'Leave request submitted to admin.', leave });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server error applying for leave' });
  }
};

// @desc    Logged-in staff member's leave history and balance
// @route   GET /api/leaves/me
// @access  Staff
const getMyLeaves = async (req, res) => {
  try {
    const staff = await Staff.findById(req.user._id).select('leaveBalance');
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff profile not found' });
    }

    const leaves = await LeaveRequest.find({ staff: staff._id }).sort({ createdAt: -1 }).limit(100);
    const yearPrefix = todayStr().slice(0, 4);

    res.status(200).json({
      success: true,
      leaveBalance: staff.leaveBalance,
      summary: {
        pending: leaves.filter((l) => l.status === 'pending').length,
        approvedDaysThisYear: leaves
          .filter((l) => l.status === 'approved' && l.fromDate.startsWith(yearPrefix))
          .reduce((sum, l) => sum + l.days, 0)
      },
      leaves
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server error fetching leaves' });
  }
};

// @desc    Staff cancels their own pending request
// @route   PATCH /api/leaves/:id/cancel
// @access  Staff
const cancelLeave = async (req, res) => {
  try {
    const leave = await LeaveRequest.findOneAndUpdate(
      { _id: req.params.id, staff: req.user._id, status: 'pending' },
      { status: 'cancelled', cancelledAt: new Date() },
      { new: true }
    );
    if (!leave) {
      return res.status(409).json({ success: false, message: 'Only your own pending requests can be cancelled.' });
    }
    res.status(200).json({ success: true, message: 'Leave request cancelled.', leave });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server error cancelling leave' });
  }
};

// @desc    Admin list of leave requests
// @route   GET /api/leaves?serviceKey=car-wash&status=pending&staff=<id>
// @access  Admin
const getLeaveRequests = async (req, res) => {
  try {
    const { serviceKey, status, staff, limit = 100 } = req.query;
    const base = {};
    if (serviceKey && serviceKey !== 'all') base.serviceKey = serviceKey;
    if (staff) base.staff = staff;

    const query = { ...base };
    if (status && status !== 'all') query.status = status;

    const today = todayStr();
    const [leaves, statusCounts, onLeaveToday] = await Promise.all([
      LeaveRequest.find(query)
        .sort({ status: 1, createdAt: -1 })
        .limit(Math.min(Number(limit) || 100, 500))
        .populate('staff', 'fullName staffId leaveBalance photo profileImage staffRole'),
      LeaveRequest.aggregate([{ $match: base }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      LeaveRequest.find({ ...base, status: 'approved', fromDate: { $lte: today }, toDate: { $gte: today } })
        .select('staff staffName leaveType fromDate toDate isHalfDay')
    ]);

    const counts = { pending: 0, approved: 0, rejected: 0, cancelled: 0 };
    statusCounts.forEach(({ _id, count }) => {
      counts[_id] = count;
    });

    res.status(200).json({ success: true, counts, onLeaveToday, leaves });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server error fetching leave requests' });
  }
};

// @desc    Admin reviews or updates decision on a leave request
// @route   PATCH /api/leaves/:id/review
// @access  Admin
const reviewLeave = async (req, res) => {
  try {
    const { decision, adminNote = '' } = req.body;
    const allowedDecisions = ['approved', 'rejected', 'pending', 'cancelled'];
    if (!allowedDecisions.includes(decision)) {
      return res.status(400).json({ success: false, message: 'Decision must be "approved", "rejected", "pending", or "cancelled".' });
    }
    if (decision === 'rejected' && !String(adminNote).trim()) {
      return res.status(400).json({ success: false, message: 'Please add a note explaining the rejection.' });
    }

    const leave = await LeaveRequest.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave request not found.' });
    }

    const prevStatus = leave.status;
    const trimmedNote = String(adminNote).trim();

    // 1. If currently approved and changing away from approved -> ROLLBACK balance & attendance
    if (prevStatus === 'approved' && decision !== 'approved') {
      await Staff.findByIdAndUpdate(leave.staff, { $inc: { leaveBalance: leave.days } });

      if (leave.attendanceRecords && leave.attendanceRecords.length > 0) {
        await Attendance.deleteMany({ _id: { $in: leave.attendanceRecords } });
        leave.attendanceRecords = [];
      } else {
        const dates = listDates(leave.fromDate, leave.toDate);
        await Attendance.deleteMany({
          staffId: leave.staff,
          date: { $in: dates },
          status: { $in: ['On Leave', 'On Leave (Half Day)'] }
        });
      }
    }

    // 2. If moving TO approved from a non-approved state -> DEDUCT balance & CREATE attendance
    if (prevStatus !== 'approved' && decision === 'approved') {
      const staff = await Staff.findOneAndUpdate(
        { _id: leave.staff, leaveBalance: { $gte: leave.days } },
        { $inc: { leaveBalance: -leave.days } },
        { new: true }
      );
      if (!staff) {
        return res.status(400).json({
          success: false,
          message: `${leave.staffName} does not have enough leave balance for ${leave.days} day(s).`
        });
      }

      const dates = listDates(leave.fromDate, leave.toDate);
      const existing = await Attendance.find({ staffId: leave.staff, date: { $in: dates } }).select('date');
      const takenDates = new Set(existing.map((a) => a.date));
      const created = await Attendance.insertMany(
        dates
          .filter((date) => !takenDates.has(date))
          .map((date) => ({
            staffId: leave.staff,
            date,
            checkInTime: '—',
            checkOutTime: '—',
            status: leave.isHalfDay ? 'On Leave (Half Day)' : 'On Leave',
            location: `${leave.leaveType} Leave`
          }))
      );

      leave.balanceBefore = staff.leaveBalance + leave.days;
      leave.balanceAfter = staff.leaveBalance;
      leave.attendanceRecords = created.map((a) => a._id);
    }

    // 3. Update leave request fields
    leave.status = decision;
    leave.adminNote = trimmedNote;
    if (decision === 'pending') {
      leave.reviewedBy = null;
      leave.reviewedByName = '';
      leave.reviewedAt = null;
      leave.balanceBefore = null;
      leave.balanceAfter = null;
    } else {
      leave.reviewedBy = req.user._id;
      leave.reviewedByName = req.user.fullName || req.user.name || req.user.email || 'Admin';
      leave.reviewedAt = new Date();
    }

    await leave.save();

    // 4. Send notification to staff member
    if (decision === 'approved') {
      await notifyStaffAboutLeave(leave, {
        title: '✅ Leave Approved',
        message: `Your ${leave.leaveType} leave for ${describeRange(leave)} (${leave.days} day${leave.days === 1 ? '' : 's'}) is approved.`
      });
    } else if (decision === 'rejected') {
      await notifyStaffAboutLeave(leave, {
        title: '❌ Leave Request Rejected',
        message: `Your ${leave.leaveType} leave for ${describeRange(leave)} was marked as rejected.${trimmedNote ? ` Note: ${trimmedNote}` : ''}`
      });
    } else if (decision === 'pending') {
      await notifyStaffAboutLeave(leave, {
        title: '⏳ Leave Status Reopened',
        message: `Your leave request for ${describeRange(leave)} has been reopened for review.`
      });
    }

    res.status(200).json({
      success: true,
      message: `Leave decision updated to "${decision}" for ${leave.staffName}.`,
      leave
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server error reviewing leave' });
  }
};

module.exports = {
  applyLeave,
  getMyLeaves,
  cancelLeave,
  getLeaveRequests,
  reviewLeave
};
