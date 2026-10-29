const mongoose = require('mongoose');
const { normalizePlate } = require('../utils/plateNormalizer');
const invalidateOnWrite = require('../common/cache/invalidateOnWrite');
const { BOOKINGS_ROLLUP, CUSTOMER_DIRECTORY } = require('../common/cache/keys');

const bookingSchema = new mongoose.Schema({
  bookingId: {
    type: String,
    required: true,
    unique: true
  },
  serviceKey: {
    type: String,
    required: true,
    enum: ['car-wash', 'car-detailing', 'dog-wash', 'cafe', 'drive-through-cafe', 'salon']
  },
  serviceName: {
    type: String,
    required: true
  },
  packageName: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  date: {
    type: String,
    required: true
  },
  timeSlot: {
    type: String,
    required: true
  },
  customerName: {
    type: String,
    required: true
  },
  customerEmail: {
    type: String,
    default: ''
  },
  vehicleNo: {
    type: String,
    default: ''
  },
  // Lookup key for ANPR arrivals — vehicleNo is free text and is typed
  // differently by every customer. Maintained by the pre-save hook below.
  vehicleNoNormalized: {
    type: String,
    default: '',
    index: true
  },
  vehicleType: {
    type: String,
    default: ''
  },
  vehicleModel: {
    type: String,
    default: ''
  },
  vehicles: [
    {
      plateNumber: { type: String, default: '' },
      model: { type: String, default: '' },
      brand: { type: String, default: '' },
      category: { type: String, default: 'Car' },
      imageUrl: { type: String, default: '' }
    }
  ],
  location: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    default: ''
  },
  // Line items for food/beverage orders (cafe & drive-through-cafe)
  items: {
    type: [
      {
        name: { type: String, default: '' },
        quantity: { type: Number, default: 1 },
        price: { type: Number, default: 0 }
      }
    ],
    default: []
  },
  // Human-readable arrival/pickup window chosen by the customer
  pickupTime: {
    type: String,
    default: ''
  },
  // Absolute time the customer is expected at the bay, used for sorting the queue
  expectedAt: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: [
      'Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled',
      // Car Wash steps
      'Vehicle Received', 'Wash Started', 'Wash Completed', 'Delivered',
      // Car Detailing steps
      'Received', 'Inspected', 'Started', 'Quality Check', 'Ready',
      // Cafe steps
      'Order Received', 'Accepted', 'Kitchen Preparing', 'Ready for Pickup',
      // Dog Wash steps
      'Pet Arrived', 'Lavender Bath', 'Coat Blowout', 'Nail & Paw Spa', 'Ready for Owner',
      // Salon steps
      'Client Seated', 'Grooming WIP', 'Styling Complete',
      // Drive-Through Cafe steps
      'Bay Arrival', 'Preparing (90s)', 'Packaged', 'Car Handover',
      // Generic fallbacks
      'Preparing', 'Served', 'Picked Up',
      'Checked In', 'Service Started', 'Service Completed',
      'Pet Received', 'Grooming', 'Drying', 'Pet Ready'
    ],
    default: 'Confirmed'
  },
  stepIndex: {
    type: Number,
    default: 0
  },
  notes: {
    type: String,
    default: ''
  },
  photos: {
    type: [String],
    default: []
  },
  assignedStaffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  assignedStaffName: {
    type: String,
    default: ''
  },
  // Who last moved this booking along. Automation and staff both write status,
  // so without this an operator cannot tell a camera's decision from a
  // colleague's, and a disputed wash is unanswerable.
  statusSource: {
    type: String,
    enum: ['staff', 'admin', 'customer', 'anpr', 'tunnel', 'system'],
    default: 'staff'
  },
  // Set when a booking was created by hardware rather than by a customer.
  createdVia: {
    type: String,
    enum: ['customer', 'staff', 'admin', 'anpr', 'tunnel'],
    default: 'customer'
  },
  // Arrivals the system could not confidently attach to a customer wait here
  // for a human instead of being guessed at.
  needsReview: {
    type: Boolean,
    default: false
  },
  reviewReason: {
    type: String,
    default: ''
  },
  washSessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WashSession',
    default: null
  },
  // Offline sale / Manual counter sale tracking
  isOfflineSale: {
    type: Boolean,
    default: false
  },
  saleType: {
    type: String,
    enum: ['service', 'membership', 'redemption', 'wash'],
    default: 'service'
  },
  paymentMode: {
    type: String,
    default: 'Cash'
  },
  // Set for Pine Labs card sales: the terminal's own record lives in the
  // pinelabstransactions collection, keyed by this reference.
  paymentStatus: {
    type: String,
    enum: ['paid', 'pending', 'failed'],
    default: 'paid'
  },
  pineLabsTxnRef: {
    type: String,
    default: '',
    index: true
  },
  cardDetails: {
    cardType: { type: String, default: '' },
    last4: { type: String, default: '' },
    approvalCode: { type: String, default: '' },
    rrn: { type: String, default: '' },
    acquirerName: { type: String, default: '' }
  },
  membershipName: {
    type: String,
    default: ''
  },
  membershipValidity: {
    type: String,
    default: ''
  },
  membershipExpiry: {
    type: String,
    default: ''
  },
  saleDate: {
    type: String,
    default: ''
  },
  vehicleDeregistered: {
    type: Boolean,
    default: false
  },
  receiptPdfBase64: {
    type: String,
    default: ''
  },
  includeGst: {
    type: Boolean,
    default: false
  },
  gstRate: {
    type: Number,
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
  // ── Salon WhatsApp reminder (whatsapp/salonReminder.js) ──
  // Set only once the reminder actually went out, so a failed send is retried
  // on the next tick and a restart never sends it twice.
  reminderSent: {
    type: Boolean,
    default: false
  },
  reminderSentAt: {
    type: Date,
    default: null
  },
  // The normalized number the reminder went to; replies are matched on it.
  reminderPhone: {
    type: String,
    default: ''
  },
  // Claimed by one scheduler tick while it sends; expires if that tick dies.
  reminderLockUntil: {
    type: Date,
    default: null
  },
  // Why the last attempt did not send (no phone, opted out, provider error).
  reminderError: {
    type: String,
    default: ''
  },
  // null until a reminder has been sent.
  customerResponse: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'rescheduled', 'no_response'],
    default: null
  },
  // Where the WhatsApp conversation about this booking stands.
  chatState: {
    type: String,
    enum: ['awaiting_confirmation', 'awaiting_reschedule_choice', 'awaiting_day', 'awaiting_slot', 'done'],
    default: null
  },
  // Options offered during a reschedule, so "2" means what the customer saw.
  chatContext: {
    dayOptions: { type: [String], default: undefined },
    selectedDay: { type: String, default: '' },
    slotOptions: { type: [String], default: undefined },
    // Meta retries webhooks; a repeated message id must not advance the chat twice.
    lastInboundId: { type: String, default: '' },
    updatedAt: { type: Date, default: null }
  },
  rescheduledAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

bookingSchema.index({ createdAt: -1 });
bookingSchema.index({ customerEmail: 1, createdAt: -1 });
bookingSchema.index({ serviceKey: 1, vehicleNoNormalized: 1, createdAt: -1 });
bookingSchema.index({ serviceKey: 1, date: 1 });
bookingSchema.index({ reminderPhone: 1, chatState: 1 });
bookingSchema.index({ chatState: 1 });

bookingSchema.pre('save', function () {
  if (!this.isModified('vehicleNo')) return;
  this.vehicleNoNormalized = normalizePlate(this.vehicleNo);
});

// The admin rollups cache a whole-collection view of bookings; any write here
// drops it so the next read is fresh. Registered before model compilation, as
// middleware added afterwards never runs.
invalidateOnWrite(bookingSchema, BOOKINGS_ROLLUP, CUSTOMER_DIRECTORY);

module.exports = mongoose.model('Booking', bookingSchema);
