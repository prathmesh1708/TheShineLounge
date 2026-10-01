const mongoose = require('mongoose');
const { normalizePlate } = require('../utils/plateNormalizer');

// Warranty issued against a car detailing job (ceramic coating, PPF, paint
// correction). Its own collection rather than fields on the booking: a warranty
// outlives the job that created it by years, gets looked up by number plate long
// after anyone remembers the invoice, and can be voided without touching the
// sale it came from.
const detailingWarrantySchema = new mongoose.Schema(
  {
    warrantyNo: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    // What it was issued against. Free-form because it may come from a staff
    // invoice (INV-...) or an online booking (BK-...).
    sourceType: {
      type: String,
      enum: ['invoice', 'booking'],
      default: 'invoice'
    },
    sourceId: { type: String, default: '', index: true },

    customerName: { type: String, required: true, trim: true },
    customerPhone: { type: String, default: '', trim: true },
    customerEmail: { type: String, default: '', trim: true, lowercase: true },

    vehicleNo: { type: String, default: '', trim: true },
    // Searching by plate is the main way a warranty gets found at the counter,
    // and people type plates inconsistently.
    vehicleNoNormalized: { type: String, default: '', index: true },
    vehicleModel: { type: String, default: '' },

    packageName: { type: String, default: 'Car Detailing' },
    serviceKey: { type: String, default: 'car-detailing' },

    years: {
      type: Number,
      required: true,
      min: 0
    },
    // The clock starts when the work is paid for, which is what the customer
    // understands by "my warranty started".
    startDate: { type: Date, default: Date.now },
    expiryDate: { type: Date, required: true },

    amountPaid: { type: Number, default: 0 },
    issuedBy: { type: String, default: '' },
    terms: { type: String, default: '' },
    notes: { type: String, default: '' },

    // Set explicitly when a warranty is revoked. Expiry is derived from the
    // dates rather than stored, so it can never go stale.
    isVoided: { type: Boolean, default: false },
    voidReason: { type: String, default: '' },
    isDeleted: { type: Boolean, default: false }
  },
  { timestamps: true }
);

detailingWarrantySchema.pre('save', function () {
  if (this.vehicleNo) {
    this.vehicleNoNormalized = normalizePlate(this.vehicleNo);
  }
});

// Live status is computed, never stored: a warranty that lapsed overnight must
// read as Expired the next morning without anything having run.
detailingWarrantySchema.virtual('status').get(function () {
  if (this.isVoided) return 'Voided';
  const now = Date.now();
  const expiry = this.expiryDate ? new Date(this.expiryDate).getTime() : 0;
  if (expiry < now) return 'Expired';
  const daysLeft = Math.ceil((expiry - now) / 86400000);
  if (daysLeft <= 30) return 'Expiring Soon';
  return 'Active';
});

detailingWarrantySchema.virtual('daysRemaining').get(function () {
  const expiry = this.expiryDate ? new Date(this.expiryDate).getTime() : 0;
  return Math.max(0, Math.ceil((expiry - Date.now()) / 86400000));
});

detailingWarrantySchema.set('toJSON', { virtuals: true });
detailingWarrantySchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('DetailingWarranty', detailingWarrantySchema, 'detailingwarranties');
