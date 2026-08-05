const mongoose = require('mongoose');

// Sub-schema for Pricing Tiers
const pricingSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  gst: { type: Boolean, default: true },
  description: { type: String, trim: true, default: '' },
  displayOrder: { type: Number, default: 0 }
}, { _id: true });

// Sub-schema for Memberships
const membershipSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  duration: { type: Number, required: true, default: 30 }, // e.g. 30, 365
  durationType: { type: String, enum: ['days', 'months', 'years'], default: 'days' },
  visitLimit: { type: Number, default: 30 },
  oneVisitPerDay: { type: Boolean, default: true },
  benefits: [{ type: String, trim: true }],
  renewable: { type: Boolean, default: true },
  upgradeAvailable: { type: Boolean, default: true },
  isPopular: { type: Boolean, default: false },
  badge: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  displayOrder: { type: Number, default: 0 }
}, { _id: true });

// Sub-schema for Menu Sections (e.g. for Cafe)
const menuSectionSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  subtitle: { type: String, default: '' },
  description: { type: String, default: '' },
  bgColor: { type: String, default: 'linear-gradient(135deg, #F5A623 0%, #D48806 100%)' },
  image: { type: String, default: '' },
  displayOrder: { type: Number, default: 0 }
}, { _id: true });

// Sub-schema for Plans / Sub-Service Packages
const planSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true, default: '' },
  price: { type: Number, required: true, min: 0 },
  duration: { type: String, default: '30 mins' },
  features: [{ type: String, trim: true }],
  images: [{ type: String }],
  recommended: { type: Boolean, default: false },
  displayOrder: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  // Extended fields for cafe menu items
  section: { type: String, default: 'Main Menu' },
  weight: { type: String, default: '' },
  subcat: { type: String, default: '' },
  image: { type: String, default: '' }
}, { _id: true });

// Sub-schema for Features
const featureSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true, default: '' },
  icon: { type: String, default: 'Sparkles' },
  category: { type: String, default: 'General' },
  displayOrder: { type: Number, default: 0 }
}, { _id: true });

// Sub-schema for FAQs
const faqSchema = new mongoose.Schema({
  question: { type: String, required: true, trim: true },
  answer: { type: String, required: true, trim: true },
  displayOrder: { type: Number, default: 0 }
}, { _id: true });

// Sub-schema for Dynamic Theme Customization
const themeSchema = new mongoose.Schema({
  primaryColor: { type: String, default: '#1e4a7e' },
  secondaryColor: { type: String, default: '#e07b2a' },
  textColor: { type: String, default: '#1f2937' },
  gradient: { type: String, default: 'from-blue-900 via-blue-800 to-indigo-900' },
  buttonColor: { type: String, default: '#e07b2a' },
  cardColor: { type: String, default: '#ffffff' },
  iconColor: { type: String, default: '#f59e0b' },
  background: { type: String, default: '#f8fafc' },
  hoverColor: { type: String, default: '#c9681f' }
}, { _id: false });

const serviceSchema = new mongoose.Schema({
  serviceName: {
    type: String,
    required: [true, 'Service name is required'],
    trim: true,
    unique: true
  },
  slug: {
    type: String,
    required: [true, 'Service slug is required'],
    trim: true,
    unique: true,
    lowercase: true
  },
  shortDescription: {
    type: String,
    required: [true, 'Short description is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Full description is required'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },

  // Media URLs
  icon: { type: String, default: 'Car' },
  bannerImage: { type: String, default: '' },
  heroVideo: { type: String, default: '' },
  bannerVideo: { type: String, default: '' },
  thumbnail: { type: String, default: '' },
  coverImage: { type: String, default: '' },
  mobileBanner: { type: String, default: '' },
  gallery: [{ type: String }],

  // Dynamic Color Theme
  theme: { type: themeSchema, default: () => ({}) },

  // Display & Ordering
  displayOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  showOnHome: { type: Boolean, default: true },
  showInNavbar: { type: Boolean, default: true },

  // Feature Configuration Flags
  allowBooking: { type: Boolean, default: true },
  allowMembership: { type: Boolean, default: true },
  allowOnlinePayment: { type: Boolean, default: true },
  allowPartialPayment: { type: Boolean, default: false },
  allowWalkIn: { type: Boolean, default: true },
  allowVehicleSelection: { type: Boolean, default: false },
  allowStaffSelection: { type: Boolean, default: true },
  allowDateSelection: { type: Boolean, default: true },
  allowTimeSlot: { type: Boolean, default: true },
  allowReviews: { type: Boolean, default: true },
  allowRatings: { type: Boolean, default: true },
  allowOffers: { type: Boolean, default: true },
  allowCoupons: { type: Boolean, default: true },
  allowLoyaltyPoints: { type: Boolean, default: true },
  allowInvoice: { type: Boolean, default: true },
  branchSupport: { type: Boolean, default: true },

  // Operational Settings
  gstPercentage: { type: Number, default: 18 },
  serviceDuration: { type: String, default: '30 mins' },
  perCarDiscountActive: { type: Boolean, default: false },
  perCarDiscountAmount: { type: Number, default: 0 },
  perCarDiscountType: { type: String, default: 'fixed' },
  cancellationPolicy: { type: String, default: 'Free cancellation up to 2 hours before appointment.' },
  termsConditions: { type: String, default: 'Standard lounge terms and conditions apply.' },

  // Embedded Lists
  pricing: [pricingSchema],
  memberships: [membershipSchema],
  plans: [planSchema],
  features: [featureSchema],
  faqs: [faqSchema],
  menuSections: [menuSectionSchema],

  // SEO Info
  seoTitle: { type: String, default: '' },
  seoDescription: { type: String, default: '' },

  // Audit
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  isDeleted: { type: Boolean, default: false }
}, {
  timestamps: true
});

// Index for fast search and homepage queries
serviceSchema.index({ slug: 1, isDeleted: 1 });
serviceSchema.index({ showOnHome: 1, isActive: 1, isDeleted: 1, displayOrder: 1 });

const Service = mongoose.model('Service', serviceSchema);

module.exports = Service;
