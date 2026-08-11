const mongoose = require('mongoose');

// An append-only ledger of every wash taken off a membership.
//
// The counters on User.membership are a cache; this collection is the record.
// Decrementing a number in place leaves nothing to show a customer who disputes
// a charge, no way to undo a wash the tunnel later aborts, and no way to rebuild
// the balance if a counter drifts. One row per event fixes all three.
const membershipUsageSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null
    },
    washSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WashSession',
      default: null
    },
    // 'consume' takes a wash off the plan; 'reverse' puts it back after an
    // aborted cycle. Reversals never delete the row they undo.
    kind: {
      type: String,
      enum: ['consume', 'reverse'],
      required: true
    },
    plate: { type: String, default: '' },
    serviceKey: { type: String, default: 'car-wash' },
    programCode: { type: String, default: '' },
    planName: { type: String, default: '' },
    source: {
      type: String,
      enum: ['tunnel', 'anpr', 'staff', 'admin', 'system'],
      default: 'tunnel'
    },
    consumedAt: { type: Date, required: true },
    // null on unlimited plans, where there is no balance to move.
    balanceBefore: { type: Number, default: null },
    balanceAfter: { type: Number, default: null },
    // Set on the original row when a reversal is written against it.
    reversedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MembershipUsage',
      default: null
    },
    reversesRow: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MembershipUsage',
      default: null
    },
    notes: { type: String, default: '' }
  },
  { timestamps: true }
);

// The idempotency guarantee. A tunnel that retries its "wash complete" webhook,
// or a poller that sees the same cycle twice, cannot charge a second wash: the
// duplicate insert fails on this index and the caller treats it as already done.
// Partial so that manual staff adjustments, which carry no session, are exempt.
membershipUsageSchema.index(
  { washSessionId: 1, kind: 1 },
  {
    unique: true,
    partialFilterExpression: { washSessionId: { $type: 'objectId' } }
  }
);

membershipUsageSchema.index({ userId: 1, consumedAt: -1 });

module.exports = mongoose.model('MembershipUsage', membershipUsageSchema);
