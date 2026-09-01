const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const User = require('../models/User');
const { findStaffForService, notifyStaffOfBooking } = require('../utils/staffAssignment');
const { sendNotificationToUser } = require('../common/services/pushNotificationHelper');

// Staff screens address a job by whatever id they have on hand — the Mongo _id
// for jobs pulled from the API, or the human booking id (DT-2841, B-2026-1234)
// for ones that came from local storage. Accept either instead of letting a
// non-ObjectId blow up findById with a CastError.
const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const findBookingByAnyId = async (id) => {
  if (mongoose.Types.ObjectId.isValid(id)) {
    const byObjectId = await Booking.findById(id);
    if (byObjectId) return byObjectId;
  }
  return Booking.findOne({ bookingId: id });
};

const isPrivileged = (user) => user && (user.role === 'admin' || user.role === 'staff');

// Legacy rows were written with whatever casing the client sent, so ownership
// is matched case-insensitively rather than on an exact string. New bookings
// are stored lower-cased (see createBooking) so this converges over time.
const ownedByFilter = (email) => ({
  customerEmail: new RegExp(`^${escapeRegex(String(email))}$`, 'i')
});

// @desc    Create a new booking
// @route   POST /api/bookings
// @access  Public (Users/Guests)
const createBooking = async (req, res) => {
  try {
    const {
      bookingId,
      serviceKey,
      serviceName,
      packageName,
      price,
      date,
      timeSlot,
      customerName,
      customerEmail,
      vehicleNo,
      vehicleType,
      items,
      pickupTime,
      expectedAt,
      status,
      location,
      phone
    } = req.body;

    if (!serviceKey || !serviceName || !packageName || !price || !date || !timeSlot || !customerName) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields.'
      });
    }

    // Ensure live date and time if static/legacy date was passed
    const now = new Date();
    const liveDateStr = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const liveTimeStart = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const liveTimeEnd = new Date(now.getTime() + 30 * 60000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    const finalDate = (!date || date.includes('July 18')) ? liveDateStr : date;
    const finalTimeSlot = (!timeSlot || timeSlot === '02:00 PM - 02:30 PM') ? `${liveTimeStart} - ${liveTimeEnd}` : timeSlot;

    // Auto generate booking ID if not supplied
    const finalBookingId = bookingId || `B-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    // Route the job to whichever staff member is requested or staffed on this service
    let assignedStaff = null;
    const requestedStylistId = req.body.assignedStaffId || req.body.stylistId;
    const requestedStylist = req.body.stylist || req.body.assignedStaffName || req.body.staffName ||
      (vehicleNo && vehicleNo.includes('Stylist:') ? vehicleNo.split('Stylist:')[1].trim() : '');

    if (serviceKey === 'salon' && requestedStylistId && mongoose.Types.ObjectId.isValid(requestedStylistId)) {
      // The client sent the stylist's real id — trust it over name matching.
      assignedStaff = await User.findOne({
        _id: requestedStylistId,
        role: 'staff',
        isActive: true,
        isDeleted: { $ne: true }
      });

      var targetStaffName = assignedStaff ? assignedStaff.fullName : requestedStylist;
      var targetStaffId = assignedStaff ? assignedStaff._id : null;
    } else if (serviceKey === 'salon' && requestedStylist && !['any specialist', 'any'].includes(requestedStylist.toLowerCase().trim())) {
      // Legacy/fallback path for callers that only send a name.
      assignedStaff = await User.findOne({
        role: 'staff',
        isActive: true,
        isDeleted: { $ne: true },
        fullName: { $regex: new RegExp(`^${escapeRegex(requestedStylist.trim())}$`, 'i') }
      });

      var targetStaffName = assignedStaff ? assignedStaff.fullName : requestedStylist;
      var targetStaffId = assignedStaff ? assignedStaff._id : null;
    } else {
      assignedStaff = await findStaffForService(serviceKey);
      var targetStaffName = assignedStaff ? assignedStaff.fullName : '';
      var targetStaffId = assignedStaff ? assignedStaff._id : null;
    }

    const booking = await Booking.create({
      bookingId: finalBookingId,
      serviceKey,
      serviceName,
      packageName,
      price,
      date: finalDate,
      timeSlot: finalTimeSlot,
      customerName,
      // Stored lower-cased because it is the ownership key every read scopes
      // on. Mixed casing here is what forced the case-insensitive matching in
      // ownedByFilter.
      customerEmail: String(customerEmail || '').toLowerCase().trim(),
      vehicleNo: vehicleNo || '',
      vehicleType: vehicleType || '',
      items: Array.isArray(items) ? items : [],
      pickupTime: pickupTime || '',
      expectedAt: expectedAt ? new Date(expectedAt) : null,
      location: location || '',
      phone: phone || '',
      ...(status ? { status } : {}),
      assignedStaffId: targetStaffId,
      assignedStaffName: targetStaffName
    });

    if (assignedStaff) {
      await notifyStaffOfBooking(assignedStaff, booking);
    }

    res.status(201).json({
      success: true,
      message: 'Booking created successfully.',
      booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while creating booking.'
    });
  }
};

// @desc    Get all bookings
// @route   GET /api/bookings
// @access  Private (customers see only their own; admin/staff see all)
const getBookings = async (req, res) => {
  try {
    const { serviceKey, assignedStaffId, mine } = req.query;
    const query = {};
    if (serviceKey) {
      query.serviceKey = serviceKey;
    }
    // `mine=true` lets a logged-in staff member pull only their own queue
    // without having to know their own id client-side.
    if (mine === 'true' && req.user) {
      query.assignedStaffId = req.user._id;
    } else if (assignedStaffId) {
      query.assignedStaffId = assignedStaffId;
    }

    // A customer only ever sees their own bookings. Scoping here rather than in
    // the client means the customer app can't be thrown off by a stale
    // localStorage identity, and no one else's bookings leave the server.
    if (!isPrivileged(req.user)) {
      const email = (req.user.email || '').toLowerCase().trim();
      // An account with no email address owns nothing. Falling through with an
      // empty pattern would match every booking whose customerEmail is ''
      // — which is every guest booking ever taken at the counter.
      if (!email) {
        return res.status(200).json({ success: true, count: 0, bookings: [] });
      }
      Object.assign(query, ownedByFilter(email));
    }

    const bookings = await Booking.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while fetching bookings.'
    });
  }
};

// @desc    Get the authenticated caller's own bookings
// @route   GET /api/bookings/my-bookings
// @access  Private
//
// Unlike GET /, this never widens for staff or admins — it is always "mine".
// The customer app calls this so its result cannot silently become the whole
// table when a staff member browses the customer-facing pages as themselves.
const getMyBookings = async (req, res) => {
  try {
    const email = (req.user.email || '').toLowerCase().trim();
    if (!email) {
      return res.status(200).json({ success: true, count: 0, bookings: [] });
    }

    const query = ownedByFilter(email);
    if (req.query.serviceKey) {
      query.serviceKey = req.query.serviceKey;
    }

    const bookings = await Booking.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while fetching bookings.'
    });
  }
};

// @desc    Update booking details or status
// @route   PUT /api/bookings/:id
// @access  Private (Admin/Staff; a customer may only cancel their own)
const updateBooking = async (req, res) => {
  try {
    const booking = await findBookingByAnyId(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.'
      });
    }

    // Holding a valid token used to be enough to drive any booking in the
    // system through its whole workflow — including someone else's, and
    // including marking a wash "Delivered" that never happened. A customer may
    // now only cancel a job that is theirs.
    if (!isPrivileged(req.user)) {
      const email = (req.user.email || '').toLowerCase().trim();
      const owner = (booking.customerEmail || '').toLowerCase().trim();
      if (!email || owner !== email) {
        return res.status(403).json({
          success: false,
          message: 'You can only modify your own bookings.'
        });
      }
      if (req.body.status !== 'Cancelled') {
        return res.status(403).json({
          success: false,
          message: 'Booking progress is updated by our staff. You can cancel this booking.'
        });
      }
      booking.status = 'Cancelled';
      booking.statusSource = 'customer';
      await booking.save();
      return res.status(200).json({
        success: true,
        message: 'Booking cancelled successfully.',
        booking
      });
    }

    const {
      status,
      stepIndex,
      notes,
      photoUrl,
      assignedStaffId,
      assignedStaffName
    } = req.body;

    const previousStaffId = booking.assignedStaffId
      ? String(booking.assignedStaffId)
      : null;

    if (status !== undefined) booking.status = status;
    if (stepIndex !== undefined) booking.stepIndex = stepIndex;
    if (notes !== undefined) booking.notes = notes;
    if (assignedStaffId !== undefined) booking.assignedStaffId = assignedStaffId || null;
    if (assignedStaffName !== undefined) booking.assignedStaffName = assignedStaffName || '';

    // Append photo if uploaded
    if (photoUrl) {
      booking.photos.push(photoUrl);
    }

    await booking.save();

    // Admin moved this job to a different staff member — tell the new owner.
    const newStaffId = booking.assignedStaffId ? String(booking.assignedStaffId) : null;
    if (newStaffId && newStaffId !== previousStaffId) {
      await notifyStaffOfBooking(
        { _id: booking.assignedStaffId, fullName: booking.assignedStaffName },
        booking
      );
    }

    // Dispatch FCM Push Notification to Customer if user account is attached
    if (status !== undefined && booking.user) {
      sendNotificationToUser(booking.user, {
        title: `Booking Update: ${booking.bookingId}`,
        body: `Your ${booking.serviceName} booking status is now "${booking.status}".`,
        data: {
          type: 'booking_update',
          bookingId: booking.bookingId,
          status: booking.status,
          link: '/bookings'
        }
      }).catch(err => console.warn('FCM Push notification warning:', err.message));
    }

    res.status(200).json({
      success: true,
      message: 'Booking updated successfully.',
      booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while updating booking.'
    });
  }
};

// @desc    Delete a booking
// @route   DELETE /api/bookings/:id
// @access  Private (Admin Only)
const deleteBooking = async (req, res) => {
  try {
    const booking = await findBookingByAnyId(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.'
      });
    }

    await booking.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Booking deleted successfully.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while deleting booking.'
    });
  }
};

module.exports = {
  createBooking,
  getBookings,
  getMyBookings,
  updateBooking,
  deleteBooking
};
