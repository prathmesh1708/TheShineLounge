const mongoose = require('mongoose');

const detailingServiceSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true, trim: true },
  category: { type: String, default: 'Paint Protection' },
  price: { type: Number, required: true, min: 0 },
  duration: { type: String, default: '60 mins' },
  rating: { type: Number, default: 5 },
  reviewsCount: { type: Number, default: 0 },
  tagline: { type: String, default: '' },
  description: { type: String, default: '' },
  image: { type: String, default: '' },
  features: { type: [String], default: [] },
  inclusions: { type: [String], default: [] },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('DetailingService', detailingServiceSchema, 'detailingservices');
