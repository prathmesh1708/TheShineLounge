const mongoose = require('mongoose');

const deregisteredVehicleSchema = new mongoose.Schema({
  plateNumber: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  plateNormalized: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    unique: true
  },
  deregisteredAt: {
    type: Date,
    default: Date.now
  },
  deregisteredBy: {
    type: String,
    default: 'admin'
  }
}, { timestamps: true });

module.exports = mongoose.model('DeregisteredVehicle', deregisteredVehicleSchema);
