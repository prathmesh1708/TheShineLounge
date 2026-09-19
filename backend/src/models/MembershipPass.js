const mongoose = require('mongoose');

const membershipPassSchema = new mongoose.Schema(
  {
    passId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    planName: {
      type: String,
      required: true
    },
    serviceKey: {
      type: String,
      default: 'car-wash'
    },
    customerName: {
      type: String,
      required: true
    },
    customerEmail: {
      type: String,
      default: ''
    },
    phone: {
      type: String,
      default: ''
    },
    boundVehicles: {
      type: [String],
      default: []
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    expiryDate: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ['Active', 'Due for Renewal', 'Expired', 'Suspended'],
      default: 'Active'
    },
    suspensionReason: {
      type: String,
      default: ''
    },
    maxPerDay: {
      type: Number,
      default: 1
    },
    maxPerMonth: {
      type: Number,
      default: 4
    },
    coolOffHours: {
      type: Number,
      default: 24
    },
    unlimited: {
      type: Boolean,
      default: false
    },
    washesRemaining: {
      type: Number,
      default: null
    },
    washesUsed: {
      type: Number,
      default: 0
    },
    amountPaid: {
      type: Number,
      default: 0
    },
    paymentMode: {
      type: String,
      default: 'Cash'
    },
    purchasedVia: {
      type: String,
      enum: ['app', 'staff', 'pos'],
      default: 'pos'
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

module.exports = mongoose.model('MembershipPass', membershipPassSchema, 'memberships');
