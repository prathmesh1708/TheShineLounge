const mongoose = require('mongoose');

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// One document per leave application. Rows are never deleted: cancelled and rejected
// requests stay as the staff member's leave record, alongside approved ones.
const leaveRequestSchema = new mongoose.Schema(
  {
    staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
      required: true,
      index: true
    },
    // Snapshot of the staff member at the time of applying, so the admin list
    // can filter and display without a join and survives later profile edits
    staffCode: { type: String, default: '' },
    staffName: { type: String, required: true, trim: true },
    staffEmail: { type: String, default: '', lowercase: true, trim: true },
    serviceKey: { type: String, default: 'car-wash', index: true },
    department: { type: String, default: '' },

    leaveType: {
      type: String,
      enum: ['Casual', 'Sick', 'Earned', 'Unpaid', 'Emergency'],
      default: 'Casual'
    },
    fromDate: {
      type: String,
      required: true,
      match: [DATE_PATTERN, 'fromDate must be YYYY-MM-DD']
    },
    toDate: {
      type: String,
      required: true,
      match: [DATE_PATTERN, 'toDate must be YYYY-MM-DD']
    },
    isHalfDay: { type: Boolean, default: false },
    days: { type: Number, required: true, min: 0.5 },
    reason: {
      type: String,
      required: [true, 'Leave reason is required'],
      trim: true,
      maxlength: 500
    },

    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled'],
      default: 'pending',
      index: true
    },
    adminNote: { type: String, default: '', trim: true, maxlength: 500 },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, default: null },
    reviewedByName: { type: String, default: '' },
    reviewedAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },

    // Audit trail of the balance change made on approval
    balanceBefore: { type: Number, default: null },
    balanceAfter: { type: Number, default: null },
    // "On Leave" attendance rows created on approval
    attendanceRecords: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Attendance' }]
  },
  {
    timestamps: true
  }
);

leaveRequestSchema.index({ staff: 1, fromDate: 1, toDate: 1 });
leaveRequestSchema.index({ serviceKey: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('LeaveRequest', leaveRequestSchema, 'leave_requests');
