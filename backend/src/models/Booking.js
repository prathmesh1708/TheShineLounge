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
    enum: ['Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'],
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
