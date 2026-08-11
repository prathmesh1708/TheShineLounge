const mongoose = require('mongoose');

const EVENT_TYPES = [
  'vehicle.entered',
  'wash.started',
  'wash.stage_changed',
  'wash.completed',
  'wash.aborted',
  'vehicle.exited',
  'heartbeat'
];

// Every payload a site device sends us, exactly as received, before any
// interpretation. Two jobs: de-duplication, and being able to replay a day's
// traffic when a matching rule turns out to be wrong.
const deviceEventSchema = new mongoose.Schema(
  {
    // Deterministic id built by the edge connector from device + timestamp +
    // plate. The unique index on it is the entire replay defence: a retried
    // delivery collides here and is acknowledged rather than reprocessed.
    eventId: {
      type: String,
      required: true,
      unique: true
    },
    source: {
      type: String,
      enum: ['anpr', 'tunnel', 'simulator', 'manual'],
      required: true
    },
    type: {
      type: String,
      enum: EVENT_TYPES,
      required: true
    },
    deviceId: { type: String, default: '' },
    occurredAt: { type: Date, required: true },
    receivedAt: { type: Date, default: Date.now },
    plateRaw: { type: String, default: '' },
    plate: { type: String, default: '', index: true },
    laneId: { type: String, default: '' },
    channelMac: { type: String, default: '' },
    cycleId: { type: String, default: '' },
    programCode: { type: String, default: '' },
    photoUrl: { type: String, default: '' },
    // Verbatim vendor payload. Keeping it means a field we did not think to map
    // today is still recoverable tomorrow.
    raw: { type: mongoose.Schema.Types.Mixed, default: {} },

    status: {
      type: String,
      enum: ['pending', 'processed', 'ignored', 'failed'],
      default: 'pending',
      index: true
    },
    // Why the event did or did not change anything — the first thing to look at
    // when an operator reports "the camera saw it but nothing happened".
    outcome: { type: String, default: '' },
    error: { type: String, default: '' },
    processedAt: { type: Date, default: null },
    washSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WashSession',
      default: null
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null
    }
  },
  { timestamps: true }
);

deviceEventSchema.index({ occurredAt: -1 });
deviceEventSchema.index({ source: 1, type: 1, occurredAt: -1 });

// One physical trip through the tunnel. Exists independently of a booking so
// that a wash we could not attach to a customer is still fully recorded rather
// than discarded.
const washSessionSchema = new mongoose.Schema(
  {
    // Vendor cycle identifier when the machine supplies one; otherwise the
    // connector synthesises one from lane + arrival time.
    cycleId: { type: String, default: '' },
    laneId: { type: String, default: '', index: true },

    plateRaw: { type: String, default: '' },
    plate: { type: String, default: '', index: true },

    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },

    state: {
      type: String,
      // 'abandoned' is a cycle that never reported a finish and was superseded
      // by the same vehicle arriving again.
      enum: ['created', 'entered', 'washing', 'completed', 'aborted', 'exited', 'abandoned'],
      default: 'created',
      index: true
    },
    programCode: { type: String, default: '' },
    programName: { type: String, default: '' },

    enteredAt: { type: Date, default: null },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    abortedAt: { type: Date, default: null },
    exitedAt: { type: Date, default: null },
    abortReason: { type: String, default: '' },

    // 'exact' is the only value that permits automatic membership consumption.
    // Anything weaker goes to a human first.
    matchConfidence: {
      type: String,
      enum: ['exact', 'confusable', 'similar', 'none'],
      default: 'none'
    },
    matchedBy: {
      type: String,
      enum: ['booking', 'vehicle', 'manual', 'none'],
      default: 'none'
    },

    membershipApplied: { type: Boolean, default: false },
    membershipDenyCode: { type: String, default: '' },
    membershipDenyReason: { type: String, default: '' },
    membershipUsageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MembershipUsage',
      default: null
    },

    photos: { type: [String], default: [] },
    eventIds: { type: [String], default: [] }
  },
  { timestamps: true }
);

// Sparse-unique on cycleId: sessions without a vendor cycle id (dry-contact or
// ANPR-only sites) must not all collide on the empty string.
// $gt: '' rather than $ne: '' — partial indexes reject $ne, and comparison
// operators are type-bracketed, so this matches non-empty strings and nothing else.
washSessionSchema.index(
  { cycleId: 1 },
  { unique: true, partialFilterExpression: { cycleId: { $gt: '' } } }
);
washSessionSchema.index({ plate: 1, createdAt: -1 });
washSessionSchema.index({ state: 1, createdAt: -1 });

const DeviceEvent = mongoose.models.DeviceEvent
  || mongoose.model('DeviceEvent', deviceEventSchema);
const WashSession = mongoose.models.WashSession
  || mongoose.model('WashSession', washSessionSchema);

module.exports = { DeviceEvent, WashSession, EVENT_TYPES };
