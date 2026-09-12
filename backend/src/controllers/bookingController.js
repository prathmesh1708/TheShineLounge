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
  if (!id) return null;
  const raw = String(id).trim();
  if (mongoose.Types.ObjectId.isValid(raw)) {
    const byObjectId = await Booking.findById(raw);
    if (byObjectId) return byObjectId;
  }
  const cleanId = raw.replace(/^MEM-/, '');
  return Booking.findOne({
    $or: [
      { bookingId: raw },
      { bookingId: cleanId },
      { bookingId: `MEM-${cleanId}` },
      { bookingId: new RegExp(`^${escapeRegex(cleanId)}$`, 'i') }
    ]
  });
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

    if (!serviceKey || !serviceName || !packageName || price === undefined || price === null || isNaN(Number(price)) || !date || !timeSlot || !customerName) {
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

    const bookingData = {
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
      assignedStaffName: targetStaffName,
      isOfflineSale: req.body.isOfflineSale !== undefined ? req.body.isOfflineSale : (finalBookingId && finalBookingId.startsWith('OFS-')),
      saleType: req.body.saleType || 'service',
      paymentMode: req.body.paymentMode || 'Cash',
      vehicleModel: req.body.vehicleModel || vehicleType || '',
      saleDate: req.body.saleDate || '',
      notes: req.body.notes || '',
      membershipName: req.body.membershipName || '',
      membershipValidity: req.body.membershipValidity || '',
      membershipExpiry: req.body.membershipExpiry || ''
    };

    const booking = await Booking.findOneAndUpdate(
      { bookingId: finalBookingId },
      { $set: bookingData },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    if (assignedStaff) {
      await notifyStaffOfBooking(assignedStaff, booking);
    }

    // Auto-sync / upsert customer profile into User collection so offline sale & booking customers appear in Admin -> Customers
    try {
      const cleanEmail = String(customerEmail || '').toLowerCase().trim();
      const cleanPhone = String(phone || '').trim();
      const cleanName = String(customerName || '').trim();
      const cleanVehicle = String(vehicleNo || '').toUpperCase().trim();
      const numPrice = Number(price) || 0;

      const isMembership = req.body.saleType === 'membership' || 
        (packageName && (packageName.toLowerCase().includes('membership') || packageName.toLowerCase().includes('pass') || packageName.toLowerCase().includes('vip')));

      let userQuery = [];
      if (cleanEmail) userQuery.push({ email: cleanEmail });
      if (cleanPhone) userQuery.push({ mobile: cleanPhone });

      let existingUser = userQuery.length > 0 ? await User.findOne({ $or: userQuery, isDeleted: { $ne: true } }) : null;

      if (!existingUser && (cleanEmail || cleanPhone || cleanName)) {
        const bcrypt = require('bcryptjs');
        const fallbackEmail = cleanEmail || `${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'cust'}_${cleanPhone.replace(/\D/g, '').slice(-4) || Math.floor(1000 + Math.random() * 9000)}@theshinelounge.com`;
        const tempPass = await bcrypt.hash('Welcome@123', 10);
        await User.create({
          fullName: cleanName || 'Valued Customer',
          email: fallbackEmail,
          password: tempPass,
          mobile: cleanPhone,
          role: 'user',
          totalSpent: numPrice,
          vehicles: cleanVehicle ? [{
            plateNumber: cleanVehicle,
            model: vehicleType || 'Car',
            brand: vehicleType || 'Car',
            addedVia: 'staff'
          }] : [],
          membership: isMembership ? {
            planName: req.body.membershipName || packageName,
            serviceKey: serviceKey || 'car-wash',
            startDate: new Date(),
            expiryDate: new Date(Date.now() + (req.body.membershipExpiry ? (new Date(req.body.membershipExpiry).getTime() - Date.now()) : 30 * 24 * 3600 * 1000)),
            status: 'Active',
            boundVehicles: cleanVehicle ? [cleanVehicle] : []
          } : undefined
        });
      } else if (existingUser) {
        const updateDoc = {
          $inc: { totalSpent: numPrice },
          $set: { updatedAt: new Date() }
        };
        if (cleanVehicle) {
          const hasPlate = (existingUser.vehicles || []).some(v => v.plateNumber?.toUpperCase().trim() === cleanVehicle);
          if (!hasPlate) {
            updateDoc.$push = {
              vehicles: {
                plateNumber: cleanVehicle,
                model: vehicleType || 'Car',
                brand: vehicleType || 'Car',
                addedVia: 'staff'
              }
            };
          }
        }
        if (isMembership) {
          updateDoc.$set['membership.planName'] = req.body.membershipName || packageName;
          updateDoc.$set['membership.serviceKey'] = serviceKey || 'car-wash';
          updateDoc.$set['membership.startDate'] = new Date();
          updateDoc.$set['membership.expiryDate'] = new Date(Date.now() + (req.body.membershipExpiry ? (new Date(req.body.membershipExpiry).getTime() - Date.now()) : 30 * 24 * 3600 * 1000));
          updateDoc.$set['membership.status'] = 'Active';
          if (cleanVehicle) {
            updateDoc.$addToSet = { 'membership.boundVehicles': cleanVehicle };
          }
        }
        await User.updateOne({ _id: existingUser._id }, updateDoc);
      }
    } catch (syncErr) {
      console.warn('Note: Could not auto-sync customer to User collection:', syncErr.message);
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

// @desc    Get public receipt for booking / offline sale
// @route   GET /api/bookings/receipt/:id
// @access  Public
const getPublicReceipt = async (req, res) => {
  try {
    const booking = await findBookingByAnyId(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Receipt not found' });
    }
    res.json({
      success: true,
      data: {
        id: booking.bookingId || booking._id,
        bookingId: booking.bookingId,
        serviceKey: booking.serviceKey,
        serviceName: booking.serviceName,
        packageName: booking.packageName,
        price: booking.price,
        date: booking.date,
        timeSlot: booking.timeSlot,
        customerName: booking.customerName,
        customerEmail: booking.customerEmail,
        phone: booking.phone,
        vehicleNo: booking.vehicleNo,
        vehicleType: booking.vehicleType,
        vehicleModel: booking.vehicleModel,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        paymentMode: booking.paymentMode,
        isOfflineSale: booking.isOfflineSale,
        saleType: booking.saleType,
        membershipName: booking.membershipName || '',
        membershipExpiry: booking.membershipExpiry,
        membershipValidity: booking.membershipValidity,
        saleDate: booking.saleDate || booking.date,
        notes: booking.notes || '',
        hasPdf: !!booking.receiptPdfBase64
      }
    });
  } catch (error) {
    console.error('Error fetching public receipt:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch receipt' });
  }
};

// @desc    Save pre-generated PDF receipt base64 string
// @route   POST /api/bookings/receipt/:id/pdf
// @access  Public
const saveReceiptPdf = async (req, res) => {
  try {
    let booking = await findBookingByAnyId(req.params.id);
    const { pdfBase64, saleData } = req.body;

    // If the booking does not exist yet (e.g. offline sale recorded before API sync), auto-create it
    if (!booking && saleData) {
      const bId = req.params.id || saleData.id || saleData.bookingId;
      const sKey = saleData.serviceKey || 'car-wash';
      const sName = saleData.serviceName || (sKey === 'car-detailing' ? 'Car Detailing' : 'Car Wash');
      const pName = saleData.packageName || saleData.membershipName || (saleData.saleType === 'membership' ? 'Monthly Membership' : 'Standard Service');
      const cleanPrice = Number(String(saleData.price || saleData.total || saleData.amount || 0).replace(/[^0-9.]/g, '')) || 0;

      booking = await Booking.create({
        bookingId: bId,
        serviceKey: sKey,
        serviceName: sName,
        packageName: pName,
        price: cleanPrice,
        date: saleData.date || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        timeSlot: saleData.timeSlot || '09:00 AM - 09:30 AM',
        customerName: saleData.customerName || saleData.customer || 'Valued Customer',
        customerEmail: String(saleData.customerEmail || saleData.email || '').toLowerCase().trim(),
        phone: saleData.phone || saleData.mobile || '',
        vehicleNo: String(saleData.vehicleNo || '').toUpperCase().trim(),
        vehicleType: saleData.vehicleModel || saleData.vehicleType || '',
        vehicleModel: saleData.vehicleModel || saleData.vehicleType || '',
        status: 'Completed',
        isOfflineSale: true,
        saleType: saleData.saleType || (saleData.membershipName ? 'membership' : 'service'),
        membershipName: saleData.membershipName || (saleData.saleType === 'membership' ? pName : ''),
        membershipExpiry: saleData.membershipExpiry || '',
        membershipValidity: saleData.membershipValidity || '',
        paymentMode: saleData.paymentMode || 'Cash',
        notes: saleData.notes || '',
        receiptPdfBase64: pdfBase64 || ''
      });

      return res.json({ success: true, message: 'Receipt created and PDF saved', bookingId: booking.bookingId });
    }

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Receipt not found' });
    }
    if (pdfBase64) {
      booking.receiptPdfBase64 = pdfBase64;
      await booking.save();
    }
    res.json({ success: true, message: 'Receipt PDF saved' });
  } catch (error) {
    console.error('Error saving receipt PDF:', error);
    res.status(500).json({ success: false, message: 'Failed to save receipt PDF' });
  }
};

// @desc    Direct PDF file stream download
// @route   GET /api/bookings/receipt/:id/pdf
// @access  Public
const streamReceiptPdf = async (req, res) => {
  try {
    const booking = await findBookingByAnyId(req.params.id);
    if (!booking || !booking.receiptPdfBase64) {
      return res.status(404).json({ success: false, message: 'Receipt PDF not available directly' });
    }
    const buffer = Buffer.from(booking.receiptPdfBase64, 'base64');
    const receiptNo = booking.bookingId || req.params.id;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Invoice-${receiptNo}.pdf"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } catch (error) {
    console.error('Error streaming receipt PDF:', error);
    res.status(500).json({ success: false, message: 'Failed to stream receipt PDF' });
  }
};

module.exports = {
  createBooking,
  getBookings,
  getMyBookings,
  updateBooking,
  deleteBooking,
  getPublicReceipt,
  saveReceiptPdf,
  streamReceiptPdf
};

