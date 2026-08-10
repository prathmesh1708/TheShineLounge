const mongoose = require('mongoose');

const Booking = require('../models/Booking');
const User = require('../models/User');
const MembershipUsage = require('../models/MembershipUsage');
const { DeviceEvent, WashSession } = require('./integrations.model');
const service = require('./integrations.service');
const { normalizePlate, formatPlate } = require('../utils/plateNormalizer');
const { evaluateEntitlement } = require('../utils/membershipEntitlement');

// @desc    Ingest one or more hardware events
// @route   POST /api/integrations/events
// @access  Device (API key + HMAC)
const ingestEvents = async (req, res) => {
  try {
    const results = await service.ingestBatch(req.events, { deviceId: req.device?.id });

    const accepted = results.filter((r) => !r.duplicate && r.status !== 'failed').length;
    const duplicates = results.filter((r) => r.duplicate).length;
    const failed = results.filter((r) => r.status === 'failed').length;

    // 207 tells the connector some events need attention while still
    // acknowledging the rest, so it does not resend the whole batch.
    const code = failed > 0 ? 207 : 200;

    return res.status(code).json({
      success: failed === 0,
      accepted,
      duplicates,
      failed,
      results
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while ingesting device events.'
    });
  }
};

// @desc    Connector liveness probe
// @route   GET /api/integrations/health
// @access  Device
const health = async (req, res) => {
  res.status(200).json({
    success: true,
    deviceId: req.device?.id || null,
    serverTime: new Date().toISOString()
  });
};

// @desc    Recent wash sessions
// @route   GET /api/integrations/sessions
// @access  Admin/Staff
const listSessions = async (req, res) => {
  try {
    const { state, plate, limit = 50, page = 1 } = req.query;
    const query = {};
    if (state) query.state = state;
    if (plate) query.plate = normalizePlate(plate);

    const perPage = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (Math.max(1, parseInt(page, 10) || 1) - 1) * perPage;

    const [sessions, total] = await Promise.all([
      WashSession.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(perPage)
        .populate('bookingId', 'bookingId customerName status stepIndex')
        .populate('userId', 'fullName email'),
      WashSession.countDocuments(query)
    ]);

    res.status(200).json({ success: true, total, sessions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Raw device event log
// @route   GET /api/integrations/events
// @access  Admin
const listEvents = async (req, res) => {
  try {
    const { source, type, status, plate, limit = 100 } = req.query;
    const query = {};
    if (source) query.source = source;
    if (type) query.type = type;
    if (status) query.status = status;
    if (plate) query.plate = normalizePlate(plate);

    const perPage = Math.min(500, Math.max(1, parseInt(limit, 10) || 100));
    const events = await DeviceEvent.find(query).sort({ occurredAt: -1 }).limit(perPage);

    res.status(200).json({ success: true, count: events.length, events });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Arrivals the system could not attach to a customer
// @route   GET /api/integrations/unmatched
// @access  Admin/Staff
const listUnmatched = async (req, res) => {
  try {
    const bookings = await Booking.find({
      needsReview: true,
      status: { $nin: ['Cancelled', 'Completed', 'Delivered'] }
    }).sort({ createdAt: -1 }).limit(100);

    res.status(200).json({ success: true, count: bookings.length, bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Attach a customer to an unmatched arrival, and optionally register
//          the plate to their account so the next visit matches on its own.
// @route   POST /api/integrations/sessions/:id/attach
// @access  Admin/Staff
const attachCustomer = async (req, res) => {
  try {
    const { userId, registerVehicle = true } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid session id.' });
    }
    if (!mongoose.Types.ObjectId.isValid(userId || '')) {
      return res.status(400).json({ success: false, message: 'A valid userId is required.' });
    }

    const session = await WashSession.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Wash session not found.' });
    }

    const user = await User.findById(userId);
    if (!user || user.isDeleted) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    session.userId = user._id;
    // A human confirmed it, so it is now as trustworthy as an exact read.
    session.matchConfidence = 'exact';
    session.matchedBy = 'manual';

    const booking = session.bookingId ? await Booking.findById(session.bookingId) : null;
    if (booking) {
      booking.customerName = user.fullName;
      booking.customerEmail = user.email;
      booking.needsReview = false;
      booking.reviewReason = '';
      await booking.save();
    }

    if (registerVehicle && session.plate) {
      const already = (user.vehicles || []).some((v) => v.plateNormalized === session.plate);
      if (!already) {
        user.vehicles.push({
          plateNumber: formatPlate(session.plate),
          model: '',
          category: 'Car',
          isPrimary: (user.vehicles || []).length === 0,
          addedVia: 'staff',
          verifiedAt: new Date()
        });
        await user.save();
      }
    }

    await session.save();

    res.status(200).json({ success: true, message: 'Customer attached.', session, booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    A customer's wash ledger and current entitlement
// @route   GET /api/integrations/customers/:id/usage
// @access  Admin/Staff
const customerUsage = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid customer id.' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    const ledger = await MembershipUsage.find({ userId: user._id })
      .sort({ consumedAt: -1 })
      .limit(100);

    const primaryPlate = (user.vehicles || []).find((v) => v.isPrimary)?.plateNormalized
      || (user.vehicles || [])[0]?.plateNormalized
      || '';

    const entitlement = evaluateEntitlement(user, {
      at: new Date(),
      plate: primaryPlate,
      serviceKey: 'car-wash'
    });

    res.status(200).json({
      success: true,
      membership: user.membership,
      entitlement,
      ledger
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  ingestEvents,
  health,
  listSessions,
  listEvents,
  listUnmatched,
  attachCustomer,
  customerUsage
};
