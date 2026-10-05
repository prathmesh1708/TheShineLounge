const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendNotificationToUser, sendNotificationToAll, sendNotificationToRole } = require('../common/services/pushNotificationHelper');

// @desc    Create / Broadcast new notification
// @route   POST /api/notifications/admin
// @access  Private (Admin)
const createNotification = async (req, res) => {
  try {
    const {
      title,
      message,
      recipientType = 'all_users',
      targetUserId = null,
      targetSegment = 'all',
      serviceKey = 'system',
      category = 'system_announcement',
      priority = 'normal',
      actionUrl = ''
    } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please provide notification title and message.'
      });
    }

    const notification = await Notification.create({
      title,
      message,
      recipientType,
      targetUserId: targetUserId || null,
      targetSegment,
      serviceKey,
      category,
      priority,
      actionUrl
    });

    // Dispatch FCM Push Notifications based on recipient target
    const payload = {
      title: title,
      body: message,
      data: {
        category,
        serviceKey,
        link: actionUrl || '/'
      }
    };

    if (recipientType === 'single_user' && targetUserId) {
      sendNotificationToUser(targetUserId, payload).catch(err => console.warn('Push error:', err.message));
    } else if (recipientType === 'staff_only') {
      sendNotificationToRole('staff', payload).catch(err => console.warn('Push error:', err.message));
    } else {
      sendNotificationToAll(payload).catch(err => console.warn('Push error:', err.message));
    }

    res.status(201).json({
      success: true,
      message: 'Notification sent successfully.',
      notification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error creating notification.'
    });
  }
};

// @desc    Get all notifications for Admin management
// @route   GET /api/notifications/admin
// @access  Private (Admin)
const getAdminNotifications = async (req, res) => {
  try {
    const { recipientType, category, serviceKey } = req.query;
    const query = {};

    if (recipientType && recipientType !== 'all') {
      query.recipientType = recipientType;
    }
    if (category && category !== 'all') {
      query.category = category;
    }
    if (serviceKey && serviceKey !== 'all') {
      query.serviceKey = serviceKey;
    }

    const notifications = await Notification.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: notifications.length,
      notifications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching notifications.'
    });
  }
};

// @desc    Update / Edit sent notification
// @route   PUT /api/notifications/admin/:id
// @access  Private (Admin)
const updateNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found.'
      });
    }

    const { title, message, recipientType, targetSegment, serviceKey, category, priority, actionUrl } = req.body;

    if (title !== undefined) notification.title = title;
    if (message !== undefined) notification.message = message;
    if (recipientType !== undefined) notification.recipientType = recipientType;
    if (targetSegment !== undefined) notification.targetSegment = targetSegment;
    if (serviceKey !== undefined) notification.serviceKey = serviceKey;
    if (category !== undefined) notification.category = category;
    if (priority !== undefined) notification.priority = priority;
    if (actionUrl !== undefined) notification.actionUrl = actionUrl;
    notification.isEdited = true;

    await notification.save();

    res.status(200).json({
      success: true,
      message: 'Notification updated successfully.',
      notification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error updating notification.'
    });
  }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/admin/:id
// @access  Private (Admin)
const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found.'
      });
    }

    await notification.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error deleting notification.'
    });
  }
};

// @desc    Get user notifications for logged in customer
// @route   GET /api/notifications/user
// @access  Private (User)
const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user ? String(req.user._id) : null;
    const userEmail = (req.user?.email || req.query.email || '').toLowerCase().trim();

    // Check if user has any active membership or pass in database
    const Booking = require('../models/Booking');
    const userBookings = userEmail ? await Booking.find({ customerEmail: userEmail }) : [];
    const hasMembership = userBookings.some(b => 
      b.packageName && (
        b.packageName.toLowerCase().includes('pass') ||
        b.packageName.toLowerCase().includes('membership') ||
        b.packageName.toLowerCase().includes('monthly') ||
        b.packageName.toLowerCase().includes('yearly')
      )
    );

    const query = {
      $or: [
        { recipientType: 'all_users' },
        { recipientType: 'segment' },
        { recipientType: 'user', targetUserId: userId }
      ]
    };
    if (userId) {
      query.deletedBy = { $ne: userId };
    }

    const rawNotifications = await Notification.find(query).sort({ createdAt: -1 });

    // Filter out membership expiry / pass renewal notifications if user has no membership!
    const filtered = rawNotifications.filter(n => {
      const isMembershipAlert =
        n.category === 'membership_expiry' ||
        n.category === 'renewal_reminder' ||
        n.targetSegment === 'expiring_soon' ||
        n.targetSegment === 'active_members' ||
        n.targetSegment === 'expired_members';

      if (isMembershipAlert && !hasMembership) {
        return false; // Users without memberships will NOT receive pass expiry warnings
      }
      return true;
    });

    const formatted = filtered.map((n) => {
      const isRead = userId ? n.readBy.includes(userId) : false;
      return {
        ...n.toObject(),
        isRead
      };
    });

    res.status(200).json({
      success: true,
      count: formatted.length,
      notifications: formatted
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching user notifications.'
    });
  }
};

// @desc    Get staff notifications for logged in staff member
// @route   GET /api/notifications/staff
// @access  Private (Staff)
const getStaffNotifications = async (req, res) => {
  try {
    const staffId = req.user ? String(req.user._id) : null;

    const query = {
      $or: [
        { recipientType: 'all_staff' },
        { recipientType: 'staff', targetUserId: staffId }
      ]
    };
    if (staffId) {
      query.deletedBy = { $ne: staffId };
    }

    const notifications = await Notification.find(query).sort({ createdAt: -1 });

    const formatted = notifications.map((n) => {
      const isRead = staffId ? n.readBy.includes(staffId) : false;
      return {
        ...n.toObject(),
        isRead
      };
    });

    res.status(200).json({
      success: true,
      count: formatted.length,
      notifications: formatted
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching staff notifications.'
    });
  }
};

// @desc    Mark a notification as read
// @route   POST /api/notifications/read/:id
// @access  Private
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user ? String(req.user._id) : req.body.userId;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    const notification = await Notification.findById(id);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    if (!notification.readBy.includes(userId)) {
      notification.readBy.push(userId);
      await notification.save();
    }

    res.status(200).json({
      success: true,
      message: 'Notification marked as read.',
      notification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error marking notification read.'
    });
  }
};

// @desc    Mark all notifications as read for current user
// @route   POST /api/notifications/read-all
// @access  Private
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user ? String(req.user._id) : req.body.userId;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    await Notification.updateMany(
      { readBy: { $ne: userId } },
      { $addToSet: { readBy: userId } }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error marking all read.'
    });
  }
};

// @desc    Dismiss / Delete a notification for current user or staff
// @route   DELETE /api/notifications/dismiss/:id or POST /api/notifications/dismiss/:id
// @access  Private
const dismissNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user ? String(req.user._id) : (req.body?.userId || req.query?.userId);

    const notification = await Notification.findById(id);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    if (userId) {
      if (!notification.deletedBy.includes(userId)) {
        notification.deletedBy.push(userId);
        await notification.save();
      }
    } else {
      await notification.deleteOne();
    }

    res.status(200).json({
      success: true,
      message: 'Notification removed successfully.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error dismissing notification.'
    });
  }
};

// @desc    Clear / Deplete all notifications for current user or staff
// @route   POST /api/notifications/clear-all
// @access  Private
const clearAllNotifications = async (req, res) => {
  try {
    const userId = req.user ? String(req.user._id) : (req.body?.userId || req.query?.userId);
    const isStaff = req.body?.isStaff || req.query?.isStaff === 'true';

    if (userId) {
      const matchCriteria = isStaff
        ? { $or: [{ recipientType: 'all_staff' }, { recipientType: 'staff', targetUserId: userId }] }
        : { $or: [{ recipientType: 'all_users' }, { recipientType: 'segment' }, { recipientType: 'user', targetUserId: userId }] };

      await Notification.updateMany(
        { ...matchCriteria, deletedBy: { $ne: userId } },
        { $addToSet: { deletedBy: userId } }
      );
    } else {
      // If general fallback (e.g. staff dev session), soft-clear staff alerts
      const matchCriteria = isStaff
        ? { recipientType: 'all_staff' }
        : { recipientType: 'all_users' };
      await Notification.deleteMany(matchCriteria);
    }

    res.status(200).json({
      success: true,
      message: 'All notifications cleared successfully.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error clearing notifications.'
    });
  }
};

// @desc    Record shift end notification for staff
// @route   POST /api/notifications/shift-end
// @access  Private (Staff/Admin)
const createStaffShiftEndNotification = async (req, res) => {
  try {
    const Staff = require('../models/Staff');
    const targetStaffId = req.body.staffId || (req.user ? req.user._id : null);
    const shiftTiming = req.body.shiftTiming || 'Scheduled Shift';

    if (!targetStaffId) {
      return res.status(400).json({ success: false, message: 'Staff ID is required' });
    }

    let staff = await Staff.findById(targetStaffId);
    if (!staff && req.user?.email) {
      staff = await Staff.findOne({ email: req.user.email });
    }

    const title = 'Shift Completed';
    const message = `Your shift (${shiftTiming}) has ended for today. Please make sure to complete pending tasks, submit logs, and punch out.`;

    // Deduplicate per day in MongoDB: check if a shift end notification already exists for today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const existingNotif = await Notification.findOne({
      recipientType: 'staff',
      targetUserId: targetStaffId,
      title: 'Shift Completed',
      createdAt: { $gte: startOfDay }
    });

    if (existingNotif) {
      return res.status(200).json({
        success: true,
        message: 'Shift end notification already recorded for today.',
        notification: existingNotif
      });
    }

    const notification = await Notification.create({
      title,
      message,
      recipientType: 'staff',
      targetUserId: targetStaffId,
      category: 'service_update',
      priority: 'high',
      serviceKey: staff?.serviceKey || req.body.serviceKey || 'car-wash',
      actionUrl: '/staff/profile'
    });

    // Optional push notification
    try {
      const payload = {
        title,
        body: message,
        data: {
          category: 'service_update',
          serviceKey: staff?.serviceKey || 'car-wash',
          link: '/staff/profile'
        }
      };
      sendNotificationToUser(targetStaffId, payload).catch(() => {});
    } catch (pushErr) {}

    res.status(201).json({
      success: true,
      message: 'Shift end notification created successfully.',
      notification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error recording shift end notification'
    });
  }
};

module.exports = {
  createNotification,
  getAdminNotifications,
  updateNotification,
  deleteNotification,
  getUserNotifications,
  getStaffNotifications,
  createStaffShiftEndNotification,
  markAsRead,
  markAllAsRead,
  dismissNotification,
  clearAllNotifications
};
