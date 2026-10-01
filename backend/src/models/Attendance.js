const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    date: {
      type: String,
      required: true // YYYY-MM-DD
    },
    checkInTime: {
      type: String,
      required: true // e.g. 08:45 AM
    },
    checkOutTime: {
      type: String,
      default: 'In Progress' // e.g. 05:30 PM or In Progress
    },
    status: {
      type: String,
      default: 'Present' // Present, On Leave
    },
    photoUrl: {
      type: String,
      default: ''
    },
    location: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Attendance', attendanceSchema);
