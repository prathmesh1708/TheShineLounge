const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const { findStaffForService, notifyStaffOfBooking } = require('../utils/staffAssignment');

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
      status
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

    // Route the job to whichever staff member the admin has staffed on this
    // service, so it lands in that person's queue the moment it is created.
    const assignedStaff = await findStaffForService(serviceKey);

    const booking = await Booking.create({
      bookingId: finalBookingId,
      serviceKey,
      serviceName,
      packageName,
      price,
      date: finalDate,
      timeSlot: finalTimeSlot,
      customerName,
      customerEmail: customerEmail || '',
      vehicleNo: vehicleNo || '',
      vehicleType: vehicleType || '',
      items: Array.isArray(items) ? items : [],
      pickupTime: pickupTime || '',
      expectedAt: expectedAt ? new Date(expectedAt) : null,
      ...(status ? { status } : {}),
      assignedStaffId: assignedStaff ? assignedStaff._id : null,
      assignedStaffName: assignedStaff ? assignedStaff.fullName : ''
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
// @access  Private (Admin/Staff)
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
    const role = req.user?.role;
    if (req.user && role !== 'admin' && role !== 'staff') {
      query.customerEmail = new RegExp(`^${escapeRegex(req.user.email || '')}$`, 'i');
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
// @access  Private (Admin/Staff)
const updateBooking = async (req, res) => {
  try {
    const booking = await findBookingByAnyId(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.'
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
  updateBooking,
  deleteBooking
};
