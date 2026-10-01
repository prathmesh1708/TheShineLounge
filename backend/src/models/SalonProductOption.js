const mongoose = require('mongoose');

// The category and unit dropdowns on the salon product form.
//
// These were a hardcoded array in the component, which meant the shop could not
// add "Hair Colour" or "sachet" without a code change. Storing them server-side
// rather than in localStorage so every admin sees the same list instead of one
// per browser.
const salonProductOptionSchema = new mongoose.Schema(
  {
    kind: {
      type: String,
      enum: ['category', 'unit'],
      required: true,
      index: true
    },
    value: {
      type: String,
      required: true,
      trim: true
    },
    // Defaults ship with the app and are restored if the collection is empty;
    // they are still removable, this only marks where a row came from.
    isSystem: {
      type: Boolean,
      default: false
    },
    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

// Case-insensitive uniqueness per kind, so "Hair Care" and "hair care" cannot
// both end up in the dropdown.
salonProductOptionSchema.index(
  { kind: 1, value: 1 },
  { unique: true, collation: { locale: 'en', strength: 2 } }
);

module.exports = mongoose.model('SalonProductOption', salonProductOptionSchema, 'salonproductoptions');
