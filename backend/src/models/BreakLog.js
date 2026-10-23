const mongoose = require('mongoose');

// One row per break a staff member was given, scheduled or manual. This is the
// permanent record overtime reports are built from — Staff.breakHistory is an
// unbounded embedded array that cannot be queried by date range.
const breakLogSchema = new mongoose.Schema(
  {
    staff: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
    staffCode: { type: String, default: '' }, // STF-xxx, for exports
    serviceKey: { type: String, default: '' },
    department: { type: String, default: '' },
    // 'YYYY-MM-DD' in SITE_TIMEZONE — the day the break belongs to
    date: { type: String, required: true },
    slot: { type: Number, default: null }, // 1|2|3 for scheduled, null for manual
    label: { type: String, default: '' },
    source: { type: String, enum: ['scheduled', 'manual'], required: true },
    scheduledTime: { type: String, default: '' }, // 'HH:mm' or ''
    allowedMinutes: { type: Number, default: 0 },
    notifiedAt: { type: Date, default: null },
    startedAt: { type: Date, default: null },
    plannedEndAt: { type: Date, default: null },
    endedAt: { type: Date, default: null },
    actualSeconds: { type: Number, default: 0 },
    overtimeSeconds: { type: Number, default: 0 },
    overtimeNotifiedAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ['notified', 'active', 'completed', 'missed', 'cancelled'],
      default: 'notified'
    },
    endedBy: { type: String, enum: ['staff', 'admin', 'system_cap', ''], default: '' },
    note: { type: String, default: '' }
  },
  { timestamps: true }
);

// Idempotency guard for the scheduler: a slot fires at most once per staff per
// day, however many ticks or instances race to create it.
breakLogSchema.index(
  { staff: 1, date: 1, slot: 1 },
  { unique: true, partialFilterExpression: { source: 'scheduled' } }
);
breakLogSchema.index({ staff: 1, date: -1 });
breakLogSchema.index({ date: 1, overtimeSeconds: -1 });

module.exports = mongoose.model('BreakLog', breakLogSchema, 'break_logs');
