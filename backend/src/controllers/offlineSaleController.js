const mongoose = require('mongoose');
const OfflineSale = require('../models/OfflineSale');
const { tryUpsertRegisteredVehicle } = require('../services/vehicleRegistry');
const { nextSequentialId } = require('../utils/sequentialId');

// @desc    Get all offline POS sales
// @route   GET /api/offline-sales
// @access  Private (Staff/Admin)
const getOfflineSales = async (req, res) => {
  try {
    const { serviceKey } = req.query;
    const query = { isDeleted: { $ne: true } };
    if (serviceKey) query.serviceKey = serviceKey;

    const sales = await OfflineSale.find(query).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: sales.length,
      sales
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching offline sales'
    });
  }
};

// @desc    Create new offline POS sale
// @route   POST /api/offline-sales
// @access  Private (Staff/Admin)
const createOfflineSale = async (req, res) => {
  try {
    const { customerName, customerEmail, phone, vehicleNo, vehicleType, serviceKey, serviceName, packageName, price, subtotal, gstAmount, includeGst, paymentMode, saleDate, saleType, staffId, staffName, notes } = req.body;

    if (!customerName || !packageName || price === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Customer name, package name, and price are required'
      });
    }

    // Highest existing id + 1, never the row count -- see utils/sequentialId.
    const saleId = req.body.saleId || (await nextSequentialId(OfflineSale, { field: 'saleId', prefix: 'OFS-TSH-' }));

    const sale = await OfflineSale.create({
      saleId,
      customerName,
      customerEmail: (customerEmail || '').toLowerCase().trim(),
      phone: phone || '',
      vehicleNo: vehicleNo || '',
      vehicleType: vehicleType || '',
      serviceKey: serviceKey || 'car-wash',
      serviceName: serviceName || 'Car Wash',
      packageName: packageName || 'Single Wash',
      price: Number(price) || 0,
      subtotal: Number(subtotal) || Number(price) || 0,
      gstAmount: Number(gstAmount) || 0,
      includeGst: Boolean(includeGst),
      paymentMode: paymentMode || 'Cash',
      saleDate: saleDate || new Date().toISOString().split('T')[0],
      saleType: saleType || 'service',
      staffId: staffId || null,
      staffName: staffName || '',
      notes: notes || ''
    });

    // A plate sold to at the counter is a registered vehicle from now on.
    await tryUpsertRegisteredVehicle({
      plateNumber: vehicleNo,
      brand: vehicleType,
      model: vehicleType,
      ownerName: customerName,
      ownerEmail: customerEmail,
      ownerPhone: phone,
      addedVia: 'pos'
    });

    res.status(201).json({
      success: true,
      message: 'Offline POS sale recorded successfully',
      sale
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error creating offline sale'
    });
  }
};

// @desc    Update offline POS sale
// @route   PUT /api/offline-sales/:id
// @access  Private (Staff/Admin)
const updateOfflineSale = async (req, res) => {
  try {
    const saleIdParam = req.params.id;
    const isObjId = mongoose.isValidObjectId(saleIdParam);

    let sale = await OfflineSale.findOne({
      $or: [
        ...(isObjId ? [{ _id: saleIdParam }] : []),
        { saleId: saleIdParam }
      ]
    });

    const Booking = require('../models/Booking');
    let booking = await Booking.findOne({
      $or: [
        ...(isObjId ? [{ _id: saleIdParam }] : []),
        { bookingId: saleIdParam }
      ]
    });

    if (!sale && !booking) {
      return res.status(404).json({
        success: false,
        message: 'Offline sale not found'
      });
    }

    const {
      customerName,
      customerEmail,
      phone,
      vehicleNo,
      vehicleType,
      vehicleModel,
      serviceKey,
      serviceName,
      packageName,
      membershipName,
      price,
      subtotal,
      gstAmount,
      includeGst,
      paymentMode,
      saleDate,
      saleType,
      membershipValidity,
      membershipExpiry,
      staffId,
      staffName,
      notes
    } = req.body;

    const resolvedPackageName = packageName || membershipName;
    const resolvedVehicleType = vehicleType || vehicleModel || '';

    // If sale doesn't exist yet in offlinesales collection but was in bookings, instantiate it
    if (!sale) {
      sale = new OfflineSale({
        saleId: saleIdParam,
        customerName: customerName || booking.customerName || 'Customer',
        serviceKey: serviceKey || booking.serviceKey || 'car-wash',
        serviceName: serviceName || booking.serviceName || 'Car Wash',
        packageName: resolvedPackageName || booking.packageName || 'Single Wash',
        price: Number(price !== undefined ? price : booking.price) || 0
      });
    }

    if (customerName !== undefined) sale.customerName = customerName;
    if (customerEmail !== undefined) sale.customerEmail = (customerEmail || '').toLowerCase().trim();
    if (phone !== undefined) sale.phone = phone;
    if (vehicleNo !== undefined) sale.vehicleNo = (vehicleNo || '').toUpperCase().trim();
    if (resolvedVehicleType) sale.vehicleType = resolvedVehicleType;
    if (serviceKey !== undefined) sale.serviceKey = serviceKey;
    if (serviceName !== undefined) sale.serviceName = serviceName;
    if (resolvedPackageName !== undefined) sale.packageName = resolvedPackageName;
    if (price !== undefined) sale.price = Number(price) || 0;
    if (subtotal !== undefined) sale.subtotal = Number(subtotal) || Number(price) || 0;
    if (gstAmount !== undefined) sale.gstAmount = Number(gstAmount) || 0;
    if (includeGst !== undefined) sale.includeGst = Boolean(includeGst);
    if (paymentMode !== undefined) sale.paymentMode = paymentMode;
    if (saleDate !== undefined) sale.saleDate = saleDate;
    if (saleType !== undefined) sale.saleType = saleType;
    if (staffId !== undefined) sale.staffId = staffId;
    if (staffName !== undefined) sale.staffName = staffName;
    if (notes !== undefined) sale.notes = notes;

    await sale.save();

    // Also update Booking in MongoDB if present
    if (booking) {
      if (customerName !== undefined) booking.customerName = customerName;
      if (customerEmail !== undefined) booking.customerEmail = (customerEmail || '').toLowerCase().trim();
      if (phone !== undefined) booking.phone = phone;
      if (vehicleNo !== undefined) booking.vehicleNo = (vehicleNo || '').toUpperCase().trim();
      if (resolvedVehicleType) {
        booking.vehicleType = resolvedVehicleType;
        booking.vehicleModel = resolvedVehicleType;
      }
      if (serviceKey !== undefined) booking.serviceKey = serviceKey;
      if (serviceName !== undefined) booking.serviceName = serviceName;
      if (resolvedPackageName !== undefined) {
        booking.packageName = resolvedPackageName;
        if (saleType === 'membership' || membershipName) {
          booking.membershipName = resolvedPackageName;
        }
      }
      if (price !== undefined) {
        booking.price = Number(price) || 0;
        booking.total = Number(price) || 0;
      }
      if (subtotal !== undefined) booking.subtotal = Number(subtotal) || 0;
      if (gstAmount !== undefined) {
        booking.gstAmount = Number(gstAmount) || 0;
        booking.gst = Number(gstAmount) || 0;
      }
      if (includeGst !== undefined) booking.includeGst = Boolean(includeGst);
      if (paymentMode !== undefined) booking.paymentMode = paymentMode;
      if (saleDate !== undefined) {
        booking.saleDate = saleDate;
        booking.date = saleDate;
      }
      if (saleType !== undefined) booking.saleType = saleType;
      if (membershipValidity !== undefined) booking.membershipValidity = membershipValidity;
      if (membershipExpiry !== undefined) booking.membershipExpiry = membershipExpiry;
      if (notes !== undefined) booking.notes = notes;

      await booking.save();
    }

    // Keep vehicle registry up to date
    if (sale.vehicleNo) {
      await tryUpsertRegisteredVehicle({
        plateNumber: sale.vehicleNo,
        brand: sale.vehicleType,
        model: sale.vehicleType,
        ownerName: sale.customerName,
        ownerEmail: sale.customerEmail,
        ownerPhone: sale.phone,
        addedVia: 'pos'
      });
    }

    // Mirror to MembershipPass if it's a membership
    if (sale.saleType === 'membership' || (booking && booking.saleType === 'membership')) {
      const { mirrorMembershipPass } = require('../services/salesRegistry');
      await mirrorMembershipPass(booking || sale);
    }

    res.status(200).json({
      success: true,
      message: 'Offline sale updated successfully',
      sale: {
        ...sale.toObject(),
        id: sale.saleId || String(sale._id),
        bookingId: sale.saleId || (booking ? booking.bookingId : String(sale._id))
      }
    });
  } catch (error) {
    console.error('Update offline sale error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error updating offline sale'
    });
  }
};

// @desc    Delete offline sale
// @route   DELETE /api/offline-sales/:id
// @access  Private (Admin)
const deleteOfflineSale = async (req, res) => {
  try {
    const isObjId = mongoose.isValidObjectId(req.params.id);
    const sale = await OfflineSale.findOne({
      $or: [
        ...(isObjId ? [{ _id: req.params.id }] : []),
        { saleId: req.params.id }
      ]
    });

    if (sale) {
      sale.isDeleted = true;
      await sale.save();
    }

    res.status(200).json({
      success: true,
      message: 'Offline sale deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error deleting offline sale'
    });
  }
};

module.exports = {
  getOfflineSales,
  createOfflineSale,
  updateOfflineSale,
  deleteOfflineSale
};
