const MembershipPass = require('../models/MembershipPass');

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
    const { planName, serviceKey, customerName, customerEmail, phone, boundVehicles, amountPaid, paymentMode, purchasedVia } = req.body;

    if (!planName || !customerName) {
      return res.status(400).json({
        success: false,
        message: 'Plan name and customer name are required'
      });
    }

    const passId = `MEM-2026-${Math.floor(100 + Math.random() * 900)}`;

    const pass = await MembershipPass.create({
      passId,
      planName,
      serviceKey: serviceKey || 'car-wash',
      customerName,
      customerEmail: (customerEmail || '').toLowerCase().trim(),
      phone: phone || '',
      boundVehicles: Array.isArray(boundVehicles) ? boundVehicles : (req.body.vehicleNo ? [req.body.vehicleNo] : []),
      startDate: new Date(),
      expiryDate: new Date(Date.now() + 30 * 24 * 3600 * 1000),
      status: 'Active',
      washesRemaining: 4,
      washesUsed: 0,
      amountPaid: Number(amountPaid) || 0,
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

// @desc    Delete / Cancel membership pass
// @route   DELETE /api/memberships/:id
// @access  Private (Staff/Admin)
const deleteMembership = async (req, res) => {
  try {
    const pass = await MembershipPass.findOne({
      $or: [{ _id: req.params.id }, { passId: req.params.id }]
    });

    if (pass) {
      pass.isDeleted = true;
      pass.status = 'Expired';
      await pass.save();
    }

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
  deleteMembership
};
