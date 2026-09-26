const mongoose = require('mongoose');
const MembershipPass = require('../models/MembershipPass');
const Booking = require('../models/Booking');

// Helper to build flexible lookup conditions
const buildMembershipFind = (idParam) => {
  const isObjectId = idParam && mongoose.Types.ObjectId.isValid(idParam);
  const cleanId = String(idParam || '').trim();
  const conditions = [
    { passId: cleanId },
    { passId: `MEM-${cleanId.replace(/^MEM-/, '')}` }
  ];
  if (isObjectId) {
    conditions.unshift({ _id: idParam });
  }
  return { $or: conditions };
};

// @desc    Get all membership passes
// @route   GET /api/memberships
// @access  Private (Staff/Admin)
const getMemberships = async (req, res) => {
  try {
    const { serviceKey, status } = req.query;
    const query = { isDeleted: { $ne: true } };
    if (serviceKey) query.serviceKey = serviceKey;
    if (status) query.status = status;

    const memberships = await MembershipPass.find(query).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: memberships.length,
      memberships
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching memberships'
    });
  }
};

// @desc    Create / Issue new membership pass
// @route   POST /api/memberships
// @access  Private (Staff/Admin)
const createMembership = async (req, res) => {
  try {
    const {
      planName,
      serviceKey,
      customerName,
      customerEmail,
      phone,
      boundVehicles,
      vehicleNo,
      startDate,
      expiryDate,
      amountPaid,
      price,
      amount,
      paymentMode,
      purchasedVia,
      status,
      washesUsed,
      washesRemaining
    } = req.body;

    if (!planName || !customerName) {
      return res.status(400).json({
        success: false,
        message: 'Plan name and customer name are required'
      });
    }

    const passId = `MEM-2026-${Math.floor(100 + Math.random() * 900)}`;
    const finalVehicles = Array.isArray(boundVehicles) && boundVehicles.length > 0
      ? boundVehicles
      : (vehicleNo ? [String(vehicleNo).toUpperCase().trim()] : []);

    const finalAmount = Number(amountPaid !== undefined ? amountPaid : (price !== undefined ? price : amount)) || 0;
    const sDate = startDate ? new Date(startDate) : new Date();
    const eDate = expiryDate ? new Date(expiryDate) : new Date(Date.now() + 30 * 24 * 3600 * 1000);

    const pass = await MembershipPass.create({
      passId,
      planName,
      serviceKey: serviceKey || 'car-wash',
      customerName,
      customerEmail: (customerEmail || '').toLowerCase().trim(),
      phone: phone || '',
      boundVehicles: finalVehicles,
      startDate: sDate,
      expiryDate: eDate,
      status: status || 'Active',
      washesRemaining: washesRemaining !== undefined ? Number(washesRemaining) : 4,
      washesUsed: Number(washesUsed) || 0,
      amountPaid: finalAmount,
      paymentMode: paymentMode || 'Cash',
      purchasedVia: purchasedVia || 'pos'
    });

    res.status(201).json({
      success: true,
      message: 'Membership pass issued successfully',
      pass
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error creating membership'
    });
  }
};

// @desc    Update membership pass details in database
// @route   PUT /api/memberships/:id
// @access  Private (Staff/Admin)
const updateMembership = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      planName,
      customerName,
      customerEmail,
      email,
      phone,
      boundVehicles,
      vehicleNo,
      startDate,
      expiryDate,
      status,
      washesUsed,
      washesRemaining,
      maxPerMonth,
      maxWashes,
      unlimited,
      amountPaid,
      amount,
      price,
      paymentMode,
      serviceKey,
      suspensionReason
    } = req.body;

    const search = buildMembershipFind(id);
    let pass = await MembershipPass.findOne(search);

    const finalVehicles = Array.isArray(boundVehicles) && boundVehicles.length > 0
      ? boundVehicles
      : (vehicleNo ? [String(vehicleNo).toUpperCase().trim()] : []);

    const finalAmount = amountPaid !== undefined ? Number(amountPaid) : (price !== undefined ? Number(price) : (amount !== undefined ? Number(amount) : undefined));
    const finalEmail = customerEmail !== undefined ? customerEmail : (email !== undefined ? email : undefined);

    if (pass) {
      if (planName) pass.planName = planName;
      if (customerName) pass.customerName = customerName;
      if (finalEmail !== undefined) pass.customerEmail = String(finalEmail).toLowerCase().trim();
      if (phone !== undefined) pass.phone = phone;
      if (finalVehicles.length > 0) pass.boundVehicles = finalVehicles;
      if (startDate) pass.startDate = new Date(startDate);
      if (expiryDate) pass.expiryDate = new Date(expiryDate);
      if (status) pass.status = status;
      if (suspensionReason !== undefined) pass.suspensionReason = suspensionReason;
      if (washesUsed !== undefined) pass.washesUsed = Number(washesUsed);
      if (washesRemaining !== undefined) pass.washesRemaining = Number(washesRemaining);
      if (maxPerMonth !== undefined) pass.maxPerMonth = Number(maxPerMonth);
      if (maxWashes !== undefined) pass.washesRemaining = maxWashes === 'Unlimited' || maxWashes === 999 ? null : Number(maxWashes);
      if (unlimited !== undefined) pass.unlimited = Boolean(unlimited);
      if (finalAmount !== undefined) pass.amountPaid = finalAmount;
      if (paymentMode) pass.paymentMode = paymentMode;
      if (serviceKey) pass.serviceKey = serviceKey;

      await pass.save();
    } else {
      // Upsert new MembershipPass in MongoDB if not existing yet
      const passId = id && String(id).startsWith('MEM-') ? id : `MEM-${id}`;
      pass = await MembershipPass.create({
        passId,
        planName: planName || 'Monthly Membership',
        serviceKey: serviceKey || 'car-wash',
        customerName: customerName || 'Valued Member',
        customerEmail: finalEmail ? String(finalEmail).toLowerCase().trim() : '',
        phone: phone || '',
        boundVehicles: finalVehicles,
        startDate: startDate ? new Date(startDate) : new Date(),
        expiryDate: expiryDate ? new Date(expiryDate) : new Date(Date.now() + 30 * 24 * 3600 * 1000),
        status: status || 'Active',
        washesRemaining: washesRemaining !== undefined ? Number(washesRemaining) : (maxWashes && maxWashes !== 999 ? Number(maxWashes) : 4),
        washesUsed: Number(washesUsed) || 0,
        amountPaid: finalAmount || 0,
        paymentMode: paymentMode || 'Cash',
        purchasedVia: 'pos'
      });
    }

    // Also update any matching Booking record and User in database
    try {
      const isObjectId = id && mongoose.Types.ObjectId.isValid(id);
      const bookingConditions = [
        { bookingId: id },
        { bookingId: pass.passId },
        { 'membershipDetails.passId': id },
        { 'membershipDetails.passId': pass.passId }
      ];
      if (isObjectId) bookingConditions.unshift({ _id: id });
      if (phone) bookingConditions.push({ phone, saleType: 'membership' });
      if (vehicleNo || finalVehicles[0]) bookingConditions.push({ vehicleNo: vehicleNo || finalVehicles[0], saleType: 'membership' });

      const booking = await Booking.findOne({ $or: bookingConditions });
      if (booking) {
        if (customerName) booking.customerName = customerName;
        if (phone) booking.phone = phone;
        if (finalEmail) booking.customerEmail = finalEmail;
        if (vehicleNo || finalVehicles[0]) booking.vehicleNo = vehicleNo || finalVehicles[0];
        if (planName) {
          booking.packageName = planName;
          booking.membershipName = planName;
        }
        if (finalAmount !== undefined) booking.price = finalAmount;
        if (startDate) {
          booking.membershipStartDate = new Date(startDate);
          booking.date = new Date(startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
          booking.saleDate = new Date(startDate).toISOString().split('T')[0];
          booking.purchasedAt = new Date(startDate);
        }
        if (expiryDate) booking.membershipExpiry = new Date(expiryDate);
        if (status) {
          booking.membershipStatus = status;
          if (status === 'Active') booking.status = 'Confirmed';
        }
        if (washesUsed !== undefined) booking.washesUsed = Number(washesUsed);

        await booking.save();
      }

      // Sync customer's User profile if exists
      const User = require('../models/User');
      const user = await User.findOne({
        $or: [
          { email: finalEmail ? String(finalEmail).toLowerCase().trim() : '___none___' },
          { mobile: phone ? String(phone).replace(/\D/g, '').slice(-10) : '___none___' }
        ]
      });
      if (user && user.membership) {
        if (startDate) user.membership.startDate = new Date(startDate);
        if (expiryDate) user.membership.expiryDate = new Date(expiryDate);
        if (status) user.membership.status = status;
        if (planName) user.membership.planName = planName;
        await user.save();
      }
    } catch (bookingSyncErr) {
      console.warn('Booking / User sync notice:', bookingSyncErr.message);
    }

    res.status(200).json({
      success: true,
      message: 'Membership updated successfully in database',
      pass
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error updating membership'
    });
  }
};

// @desc    Delete / Cancel membership pass
// @route   DELETE /api/memberships/:id
// @access  Private (Staff/Admin)
const deleteMembership = async (req, res) => {
  try {
    const search = buildMembershipFind(req.params.id);
    const pass = await MembershipPass.findOne(search);

    if (pass) {
      pass.isDeleted = true;
      pass.status = 'Expired';
      await pass.save();
    }

    // Also mark matching Booking record
    try {
      const isObjectId = req.params.id && mongoose.Types.ObjectId.isValid(req.params.id);
      const bookingConditions = [
        { bookingId: req.params.id },
        { 'membershipDetails.passId': req.params.id }
      ];
      if (isObjectId) bookingConditions.unshift({ _id: req.params.id });

      const booking = await Booking.findOne({ $or: bookingConditions });
      if (booking) {
        booking.isDeleted = true;
        booking.membershipStatus = 'Expired';
        await booking.save();
      }
    } catch (_) {}

    res.status(200).json({
      success: true,
      message: 'Membership pass cancelled successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error deleting membership'
    });
  }
};

module.exports = {
  getMemberships,
  createMembership,
  updateMembership,
  deleteMembership
};
