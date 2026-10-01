const DetailingWarranty = require('../models/DetailingWarranty');
const WarrantyPeriod = require('../models/WarrantyPeriod');
const { nextSequentialId } = require('../utils/sequentialId');
const { normalizePlate } = require('../utils/plateNormalizer');

const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Years -> expiry. Calendar arithmetic rather than years x 365 days, so a
// 3-year warranty bought on 29 Feb expires on the right date and leap years do
// not quietly shorten it.
const addYears = (date, years) => {
  const d = new Date(date);
  const whole = Math.floor(years);
  const months = Math.round((years - whole) * 12);
  d.setFullYear(d.getFullYear() + whole);
  if (months) d.setMonth(d.getMonth() + months);
  return d;
};

// @desc    List warranties
// @route   GET /api/car-detailing/warranties
// @access  Private (Staff/Admin)
const getWarranties = async (req, res) => {
  try {
    const { search, status } = req.query;
    const query = { isDeleted: { $ne: true } };

    if (search && String(search).trim()) {
      const raw = String(search).trim();
      const rx = new RegExp(escapeRegex(raw), 'i');
      query.$or = [
        { warrantyNo: rx },
        { customerName: rx },
        { customerPhone: rx },
        { vehicleNo: rx },
        { vehicleNoNormalized: normalizePlate(raw) },
        { packageName: rx },
        { sourceId: rx }
      ];
    }

    let warranties = await DetailingWarranty.find(query).sort({ createdAt: -1 });

    // Status is a virtual, so it cannot be filtered in the query.
    if (status && status !== 'All') {
      warranties = warranties.filter((w) => w.status === status);
    }

    res.status(200).json({ success: true, count: warranties.length, warranties });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server error fetching warranties' });
  }
};

// @desc    Look up the warranties on a vehicle (counter lookup)
// @route   GET /api/car-detailing/warranties/vehicle/:plate
// @access  Private (Staff/Admin)
const getWarrantiesByVehicle = async (req, res) => {
  try {
    const plate = normalizePlate(req.params.plate || '');
    if (!plate) {
      return res.status(400).json({ success: false, message: 'A vehicle number is required' });
    }

    const warranties = await DetailingWarranty.find({
      vehicleNoNormalized: plate,
      isDeleted: { $ne: true }
    }).sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: warranties.length, warranties });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server error looking up warranties' });
  }
};

// @desc    Issue a warranty
// @route   POST /api/car-detailing/warranties
// @access  Private (Staff/Admin)
const createWarranty = async (req, res) => {
  try {
    const { customerName, years } = req.body;

    if (!customerName || years === undefined || years === null) {
      return res.status(400).json({
        success: false,
        message: 'Customer name and warranty period are required'
      });
    }

    const numYears = Number(years);
    if (!Number.isFinite(numYears) || numYears <= 0) {
      return res.status(400).json({ success: false, message: 'Warranty period must be greater than zero' });
    }

    // Start at purchase unless the caller backdates it for work already done.
    const startDate = req.body.startDate ? new Date(req.body.startDate) : new Date();
    if (isNaN(startDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid start date' });
    }

    const warrantyNo = await nextSequentialId(DetailingWarranty, {
      field: 'warrantyNo',
      prefix: 'TSL-WR-',
      pad: 4
    });

    const warranty = await DetailingWarranty.create({
      warrantyNo,
      sourceType: req.body.sourceType === 'booking' ? 'booking' : 'invoice',
      sourceId: String(req.body.sourceId || '').trim(),
      customerName: String(customerName).trim(),
      customerPhone: String(req.body.customerPhone || '').trim(),
      customerEmail: String(req.body.customerEmail || '').trim().toLowerCase(),
      vehicleNo: String(req.body.vehicleNo || '').trim(),
      vehicleModel: String(req.body.vehicleModel || '').trim(),
      packageName: String(req.body.packageName || 'Car Detailing').trim(),
      years: numYears,
      startDate,
      expiryDate: addYears(startDate, numYears),
      amountPaid: Number(req.body.amountPaid) || 0,
      issuedBy: String(req.body.issuedBy || (req.user && req.user.fullName) || '').trim(),
      terms: String(req.body.terms || ''),
      notes: String(req.body.notes || '')
    });

    res.status(201).json({ success: true, message: 'Warranty issued', warranty });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server error issuing warranty' });
  }
};

// @desc    Void a warranty
// @route   PATCH /api/car-detailing/warranties/:id/void
// @access  Private (Staff/Admin)
const voidWarranty = async (req, res) => {
  try {
    const warranty = await DetailingWarranty.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
    if (!warranty) {
      return res.status(404).json({ success: false, message: 'Warranty not found' });
    }

    warranty.isVoided = true;
    warranty.voidReason = String(req.body.reason || '').trim();
    await warranty.save();

    res.status(200).json({ success: true, message: `${warranty.warrantyNo} voided`, warranty });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server error voiding warranty' });
  }
};

// @desc    Warranties belonging to the signed-in customer
// @route   GET /api/car-detailing/warranties/mine
// @access  Private (any signed-in user)
const getMyWarranties = async (req, res) => {
  try {
    const email = String((req.user && req.user.email) || '').toLowerCase().trim();
    const phone = String((req.user && (req.user.mobile || req.user.phone)) || '').trim();

    const or = [];
    if (email) or.push({ customerEmail: email });
    if (phone) or.push({ customerPhone: phone });

    // No identifiers means nothing can be attributed to them. Returning an
    // empty list beats returning somebody else's warranties.
    if (or.length === 0) {
      return res.status(200).json({ success: true, count: 0, warranties: [] });
    }

    const warranties = await DetailingWarranty.find({
      $or: or,
      isDeleted: { $ne: true }
    }).sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: warranties.length, warranties });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server error fetching your warranties' });
  }
};

// ------------------------------------------------- warranty period options

const DEFAULT_PERIODS = [0.5, 1, 2, 3, 4, 5, 7, 10];

// 0.5 -> "6 Months", 1 -> "1 Year", 2.5 -> "2.5 Years". Derived rather than
// typed so the button text can never disagree with the cover it grants.
const labelForYears = (years) => {
  const y = Number(years);
  if (y < 1) {
    const months = Math.round(y * 12);
    return `${months} Month${months === 1 ? '' : 's'}`;
  }
  const rounded = Math.round(y * 100) / 100;
  return `${rounded} Year${rounded === 1 ? '' : 's'}`;
};

// @desc    List the warranty period choices
// @route   GET /api/car-detailing/warranty-periods
// @access  Private (Staff/Admin)
const getWarrantyPeriods = async (req, res) => {
  try {
    // Seed the shipped defaults the first time, so the invoice is never left
    // with no periods to choose from.
    if ((await WarrantyPeriod.countDocuments()) === 0) {
      await WarrantyPeriod.insertMany(
        DEFAULT_PERIODS.map((years) => ({ years, label: labelForYears(years), isSystem: true }))
      );
    }

    const periods = await WarrantyPeriod.find({ isDeleted: { $ne: true } }).sort({ years: 1 });
    res.status(200).json({ success: true, count: periods.length, periods });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server error fetching warranty periods' });
  }
};

// @desc    Add a warranty period
// @route   POST /api/car-detailing/warranty-periods
// @access  Private (Staff/Admin)
const createWarrantyPeriod = async (req, res) => {
  try {
    const years = Number(req.body.years);
    if (!Number.isFinite(years) || years <= 0) {
      return res.status(400).json({ success: false, message: 'Enter a period greater than zero' });
    }
    if (years > 50) {
      return res.status(400).json({ success: false, message: 'That is longer than 50 years — check the value' });
    }

    const rounded = Math.round(years * 100) / 100;

    // Reviving a removed period rather than failing on the unique index, which
    // is what adding it back is meant to do.
    const existing = await WarrantyPeriod.findOne({ years: rounded });
    if (existing) {
      if (existing.isDeleted) {
        existing.isDeleted = false;
        await existing.save();
        return res.status(200).json({ success: true, message: 'Restored', period: existing });
      }
      return res.status(409).json({ success: false, message: `${existing.label} is already on the list` });
    }

    const period = await WarrantyPeriod.create({
      years: rounded,
      label: String(req.body.label || '').trim() || labelForYears(rounded)
    });

    res.status(201).json({ success: true, message: `${period.label} added`, period });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'That period already exists' });
    }
    res.status(500).json({ success: false, message: error.message || 'Server error adding warranty period' });
  }
};

// @desc    Remove a warranty period
// @route   DELETE /api/car-detailing/warranty-periods/:id
// @access  Private (Staff/Admin)
const deleteWarrantyPeriod = async (req, res) => {
  try {
    const period = await WarrantyPeriod.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
    if (!period) {
      return res.status(404).json({ success: false, message: 'Warranty period not found' });
    }

    // Warranties already issued at this length keep their own `years` value, so
    // removing the button never shortens or voids an existing certificate. Only
    // the choice disappears.
    period.isDeleted = true;
    await period.save();

    res.status(200).json({ success: true, message: `${period.label} removed` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server error removing warranty period' });
  }
};

module.exports = {
  getWarrantyPeriods,
  createWarrantyPeriod,
  deleteWarrantyPeriod,
  getWarranties,
  getWarrantiesByVehicle,
  getMyWarranties,
  createWarranty,
  voidWarranty
};
