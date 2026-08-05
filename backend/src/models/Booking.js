const mongoose = require('mongoose');

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
  vehicleType: {
    type: String,
    default: ''
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
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Booking', bookingSchema);
