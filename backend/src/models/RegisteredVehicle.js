const mongoose = require('mongoose');
const { normalizePlate } = require('../utils/plateNormalizer');

const registeredVehicleSchema = new mongoose.Schema(
  {
    vehicleId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    plateNumber: {
      type: String,
      required: true,
      trim: true
    },
    plateNormalized: {
      type: String,
      required: true,
      index: true,
      trim: true
    },
    brand: {
      type: String,
      default: ''
    },
    model: {
      type: String,
      default: ''
    },
    category: {
      type: String,
      default: 'Car'
    },
    year: {
      type: String,
      default: ''
    },
    ownerName: {
      type: String,
      default: 'Customer'
    },
    ownerEmail: {
      type: String,
      default: ''
    },
    ownerPhone: {
      type: String,
      default: ''
    },
    customerId: {
      type: String,
      default: null
    },
    addedVia: {
      type: String,
      enum: ['self', 'staff', 'admin', 'anpr', 'pos'],
      default: 'self'
    },
    verifiedAt: {
      type: Date,
      default: null
    },
    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

registeredVehicleSchema.pre('save', function () {
  if (this.plateNumber) {
    this.plateNormalized = normalizePlate(this.plateNumber);
  }
});

module.exports = mongoose.model('RegisteredVehicle', registeredVehicleSchema, 'registeredvehicles');
