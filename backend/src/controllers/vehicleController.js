const RegisteredVehicle = require('../models/RegisteredVehicle');
const { normalizePlate } = require('../utils/plateNormalizer');

// @desc    Get all registered fleet vehicles
// @route   GET /api/vehicles
// @access  Private (Staff/Admin)
const getRegisteredVehicles = async (req, res) => {
  try {
    const vehicles = await RegisteredVehicle.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: vehicles.length,
      vehicles
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching registered vehicles'
    });
  }
};

// @desc    Register a new fleet vehicle
// @route   POST /api/vehicles
// @access  Private (Staff/Admin)
const registerVehicle = async (req, res) => {
  try {
    const { plateNumber, brand, model, category, year, ownerName, ownerEmail, ownerPhone, customerId, addedVia } = req.body;

    if (!plateNumber) {
      return res.status(400).json({
        success: false,
        message: 'Plate number is required'
      });
    }

    const cleanPlate = String(plateNumber).toUpperCase().trim();
    const plateNorm = normalizePlate(cleanPlate);

    let vehicle = await RegisteredVehicle.findOne({ plateNormalized: plateNorm, isDeleted: { $ne: true } });

    if (vehicle) {
      if (brand) vehicle.brand = brand;
      if (model) vehicle.model = model;
      if (ownerName) vehicle.ownerName = ownerName;
      if (ownerEmail) vehicle.ownerEmail = ownerEmail;
      if (ownerPhone) vehicle.ownerPhone = ownerPhone;
      await vehicle.save();
    } else {
      const vehicleId = `VEH-${cleanPlate.replace(/[^A-Z0-9]/g, '')}`;
      vehicle = await RegisteredVehicle.create({
        vehicleId,
        plateNumber: cleanPlate,
        plateNormalized: plateNorm,
        brand: brand || '',
        model: model || '',
        category: category || 'Car',
        year: year || '',
        ownerName: ownerName || 'Customer',
        ownerEmail: ownerEmail || '',
        ownerPhone: ownerPhone || '',
        customerId: customerId || null,
        addedVia: addedVia || 'staff'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Vehicle registered successfully',
      vehicle
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error registering vehicle'
    });
  }
};

// @desc    Deregister / Delete vehicle
// @route   DELETE /api/vehicles/:id
// @access  Private (Staff/Admin)
const deleteVehicle = async (req, res) => {
  try {
    const id = req.params.id;
    const cleanPlate = normalizePlate(id);

    const vehicle = await RegisteredVehicle.findOne({
      $or: [{ _id: id }, { vehicleId: id }, { plateNormalized: cleanPlate }]
    });

    if (vehicle) {
      vehicle.isDeleted = true;
      await vehicle.save();
    }

    res.status(200).json({
      success: true,
      message: 'Vehicle deregistered successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error deregistering vehicle'
    });
  }
};

module.exports = {
  getRegisteredVehicles,
  registerVehicle,
  deleteVehicle
};
