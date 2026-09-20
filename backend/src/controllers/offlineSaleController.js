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

// @desc    Delete offline sale
// @route   DELETE /api/offline-sales/:id
// @access  Private (Admin)
const deleteOfflineSale = async (req, res) => {
  try {
    const sale = await OfflineSale.findOne({
      $or: [{ _id: req.params.id }, { saleId: req.params.id }]
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
  deleteOfflineSale
};
