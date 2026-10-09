const mongoose = require('mongoose');

// A staff POS invoice from /staff/invoicing. The customer is snapshotted
// (name/phone/vehicle at billing time) and linked by id when known.
const invoiceSchema = new mongoose.Schema(
  {
    invoiceNo: { type: String, required: true, unique: true, index: true },
    customerId: { type: String, default: '', index: true },
    customerName: { type: String, required: true, trim: true },
    customerEmail: { type: String, default: '', lowercase: true, trim: true },
    phone: { type: String, default: '' },
    vehicleNo: { type: String, default: '' },
    department: { type: String, default: '' },
    departmentKey: { type: String, default: '' },
    sacCode: { type: String, default: '' },
    items: [
      {
        _id: false,
        name: { type: String, required: true },
        price: { type: Number, default: 0 },
        qty: { type: Number, default: 1 }
      }
    ],
    subtotal: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    taxableAmount: { type: Number, default: 0 },
    includeGst: { type: Boolean, default: false },
    gstRate: { type: Number, default: 0 },
    taxType: { type: String, enum: ['igst', 'split'], default: 'split' },
    gst: { type: Number, default: 0 },
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    igst: { type: Number, default: 0 },
    total: { type: Number, required: true },
    paymentMethod: { type: String, default: 'UPI' },
    staffId: { type: String, default: '' },
    staffName: { type: String, default: '' },
    warrantyNo: { type: String, default: '' },
    isDeleted: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Invoice', invoiceSchema);
