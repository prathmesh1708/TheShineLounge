const mongoose = require('mongoose');

// Retail stock sold over the salon counter (shampoo, wax, beard oil...).
//
// Deliberately its own collection rather than a row in the shared `services`
// catalog: a service is something booked for a time slot, a product is a thing
// with stock that runs out. Keeping them apart means salon retail can gain
// barcodes, stock levels and reorder alerts without every other module having
// to grow those fields.
const salonProductSchema = new mongoose.Schema(
  {
    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    // What a scanner reads. Separate from sku because shop-bought stock arrives
    // with a manufacturer barcode we should keep rather than overwrite.
    barcode: {
      type: String,
      default: '',
      trim: true,
      index: true
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true
    },
    // Free text rather than an enum: the shop will invent categories we have
    // not thought of, and a bad enum value is a failed save at the counter.
    category: {
      type: String,
      default: 'General',
      trim: true
    },
    variant: {
      type: String,
      default: '',
      trim: true
    },
    brand: {
      type: String,
      default: '',
      trim: true
    },
    unit: {
      type: String,
      default: 'pc',
      trim: true
    },
    mrp: {
      type: Number,
      required: [true, 'MRP is required'],
      min: 0
    },
    sellPrice: {
      type: Number,
      required: [true, 'Selling price is required'],
      min: 0
    },
    stock: {
      type: Number,
      default: 0,
      min: 0
    },
    lowStockThreshold: {
      type: Number,
      default: 5,
      min: 0
    },
    hsnCode: {
      type: String,
      default: '',
      trim: true
    },
    taxRate: {
      type: Number,
      default: 18,
      min: 0
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active'
    },
    notes: {
      type: String,
      default: ''
    },
    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

// Discount is never stored. It is whatever MRP and selling price currently say,
// so it cannot drift out of step with them after a price edit.
salonProductSchema.virtual('discountPercent').get(function () {
  if (!this.mrp || this.mrp <= 0) return 0;
  const pct = ((this.mrp - this.sellPrice) / this.mrp) * 100;
  return Math.max(0, Math.round(pct * 100) / 100);
});

salonProductSchema.virtual('discountAmount').get(function () {
  return Math.max(0, Number(this.mrp || 0) - Number(this.sellPrice || 0));
});

salonProductSchema.virtual('isLowStock').get(function () {
  return Number(this.stock || 0) <= Number(this.lowStockThreshold || 0);
});

salonProductSchema.set('toJSON', { virtuals: true });
salonProductSchema.set('toObject', { virtuals: true });

salonProductSchema.index({ name: 'text', sku: 'text', barcode: 'text', category: 'text' });

module.exports = mongoose.model('SalonProduct', salonProductSchema, 'salonproducts');
