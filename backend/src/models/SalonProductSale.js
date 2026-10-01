const mongoose = require('mongoose');

// A line on the bill. Prices are copied in rather than referenced, because a
// bill has to keep saying what was actually charged after someone edits the
// product's price next month.
const saleItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'SalonProduct' },
    sku: { type: String, default: '' },
    barcode: { type: String, default: '' },
    name: { type: String, required: true },
    variant: { type: String, default: '' },
    category: { type: String, default: '' },
    quantity: { type: Number, required: true, min: 1 },
    mrp: { type: Number, default: 0, min: 0 },
    sellPrice: { type: Number, required: true, min: 0 },
    // mrp - sellPrice, per unit, frozen at the moment of sale.
    discountPerUnit: { type: Number, default: 0, min: 0 },
    lineTotal: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

// A counter sale of salon retail products. Separate from `bookings` and
// `offlinesales`, which both describe services rendered -- this is stock
// leaving the shelf, and it is the only thing that moves product stock.
const salonProductSaleSchema = new mongoose.Schema(
  {
    billNo: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    items: {
      type: [saleItemSchema],
      validate: [(v) => Array.isArray(v) && v.length > 0, 'A bill needs at least one item']
    },
    customerName: { type: String, default: 'Walk-in Customer', trim: true },
    customerPhone: { type: String, default: '', trim: true },
    customerEmail: { type: String, default: '', trim: true, lowercase: true },

    // Sum of mrp x qty, before any discount.
    grossAmount: { type: Number, default: 0, min: 0 },
    // Everything saved against MRP: the per-product discount plus any extra the
    // cashier granted on the whole bill.
    itemDiscountTotal: { type: Number, default: 0, min: 0 },
    billDiscount: { type: Number, default: 0, min: 0 },
    subtotal: { type: Number, default: 0, min: 0 },

    includeGst: { type: Boolean, default: true },
    gstRate: { type: Number, default: 18, min: 0 },
    gstAmount: { type: Number, default: 0, min: 0 },
    total: { type: Number, default: 0, min: 0 },

    paymentMode: { type: String, default: 'Cash' },
    soldBy: { type: String, default: '' },
    soldById: { type: mongoose.Schema.Types.ObjectId, default: null },
    notes: { type: String, default: '' },
    isDeleted: { type: Boolean, default: false }
  },
  { timestamps: true }
);

salonProductSaleSchema.index({ createdAt: -1 });

module.exports = mongoose.model('SalonProductSale', salonProductSaleSchema, 'salonproductsales');
