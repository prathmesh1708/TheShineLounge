const mongoose = require('mongoose');

// The warranty period buttons on the detailing invoice.
//
// These were a hardcoded array in the frontend, so offering a 15-year coating
// warranty meant a code change. Stored server-side rather than in localStorage
// so every member of staff sees the same options.
const warrantyPeriodSchema = new mongoose.Schema(
  {
    // Decimal years, so half-year and 18-month covers are expressible without a
    // separate unit field. 0.5 = six months.
    years: {
      type: Number,
      required: true,
      min: [0, 'A warranty period cannot be negative'],
      unique: true
    },
    label: {
      type: String,
      required: true,
      trim: true
    },
    isSystem: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model('WarrantyPeriod', warrantyPeriodSchema, 'warrantyperiods');
