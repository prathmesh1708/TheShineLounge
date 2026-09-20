const mongoose = require('mongoose');

const offlineSaleSchema = new mongoose.Schema(
  {
    saleId: {
      type: String,
      required: true,
      unique: true,
      index: true
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
    vehicleNo: {
      type: String,
      default: ''
    },
    vehicleType: {
      type: String,
      default: ''
    },
    serviceKey: {
      type: String,
      required: true,
      default: 'car-wash'
    },
    serviceName: {
      type: String,
      required: true,
      default: 'Car Wash'
    },
    packageName: {
      type: String,
      required: true,
      default: 'Single Wash'
    },
    price: {
      type: Number,
      required: true,
      default: 0
    },
    subtotal: {
      type: Number,
      default: 0
    },
    gstAmount: {
      type: Number,
      default: 0
    },
    includeGst: {
      type: Boolean,
      default: false
    },
    paymentMode: {
      type: String,
      default: 'Cash'
    },
    saleDate: {
      type: String,
      default: ''
    },
    saleType: {
      type: String,
      enum: ['service', 'membership'],
      default: 'service'
    },
    staffId: {
      type: String,
      default: null
    },
    staffName: {
      type: String,
      default: ''
    },
    notes: {
      type: String,
      default: ''
    },
    receiptPdfBase64: {
      type: String,
      default: ''
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

module.exports = mongoose.model('OfflineSale', offlineSaleSchema, 'offlinesales');
