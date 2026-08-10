const mongoose = require('mongoose');

const Booking = require('../models/Booking');
const User = require('../models/User');
const MembershipUsage = require('../models/MembershipUsage');
const Notification = require('../models/Notification');
const { DeviceEvent, WashSession } = require('./integrations.model');
const { findStaffForService, notifyStaffOfBooking } = require('../utils/staffAssignment');
const { normalizePlate, isUsablePlate, formatPlate } = require('../utils/plateNormalizer');
const {
  evaluateEntitlement,
  buildConsumption,
  buildReversal
} = require('../utils/membershipEntitlement');
const {
  decideBookingTransition,
  canTransitionSession,
  EVENT_SESSION_STATE
} = require('./washStateMachine');

const SERVICE_KEY = 'car-wash';

// A car that rolls back over the entry loop, or a camera that fires twice on one
// arrival, must not open a second job.
const ENTRY_DEBOUNCE_MS = Number(process.env.INTEGRATION_ENTRY_DEBOUNCE_MS || 10 * 60 * 1000);
// How far back to look for the booking a driver made earlier today.
const BOOKING_MATCH_WINDOW_MS = Number(process.env.INTEGRATION_BOOKING_WINDOW_MS || 12 * 60 * 60 * 1000);
// A tunnel cycle that never reported completion is abandoned after this long.
const SESSION_STALE_MS = Number(process.env.INTEGRATION_SESSION_STALE_MS || 2 * 60 * 60 * 1000);

const isDuplicateKeyError = (error) => error && (error.code === 11000 || error.code === 11001);

// Statuses a booking can be in and still be a candidate for an arriving car.
const OPEN_BOOKING_STATUSES = [
  'Pending', 'Confirmed', 'Vehicle Received', 'Wash Started', 'Wash Completed'
];

// ── booking creation ────────────────────────────────────────────────────────

const makeWalkInBookingId = () => {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `W-${stamp}-${rand}`;
};

// Retries on the unique index rather than trusting Math.random not to collide.
const createWalkInBooking = async (fields, attempt = 0) => {
  try {
    return await Booking.create({ bookingId: makeWalkInBookingId(), ...fields });
  } catch (error) {
    if (isDuplicateKeyError(error) && attempt < 5) {
      return createWalkInBooking(fields, attempt + 1);
    }
    throw error;
  }
};

// ── matching ────────────────────────────────────────────────────────────────

// Decides which booking, if any, an arriving plate belongs to.
//
// Returns { booking, user, confidence, matchedBy, review } where `review` is a
// reason string whenever a human has to confirm. The rule that matters: only an
// exact plate match may proceed automatically. A confusable or one-edit-away
// read is a *candidate*, and acting on a candidate is how the wrong customer
// gets billed.
const matchArrival = async (plate, at) => {
  const normalized = normalizePlate(plate);

  if (!isUsablePlate(normalized)) {
    return {
      booking: null,
      user: null,
      confidence: 'none',
      matchedBy: 'none',
      review: 'Plate could not be read clearly enough to match.'
    };
  }

  const since = new Date(at.getTime() - BOOKING_MATCH_WINDOW_MS);

  const candidates = await Booking.find({
    serviceKey: SERVICE_KEY,
    vehicleNoNormalized: normalized,
    status: { $in: OPEN_BOOKING_STATUSES },
    createdAt: { $gte: since }
  }).sort({ createdAt: -1 });

  if (candidates.length === 1) {
    const booking = candidates[0];
    const user = booking.customerEmail
      ? await User.findOne({ email: booking.customerEmail.toLowerCase(), isDeleted: { $ne: true } })
      : null;
    return { booking, user, confidence: 'exact', matchedBy: 'booking', review: '' };
  }

  if (candidates.length > 1) {
    // Two live bookings for one plate is rare and always means something is
    // wrong (a double-booking, or two customers sharing a car). Returning a
    // booking here would let the caller attach to it despite the 'none'
    // confidence — so return none at all and let a human choose.
    return {
      booking: null,
      user: null,
      confidence: 'none',
      matchedBy: 'none',
      candidateIds: candidates.map((c) => c.bookingId),
      review: `${candidates.length} open bookings share plate ${formatPlate(normalized)}: ${candidates.map((c) => c.bookingId).join(', ')}.`
    };
  }

  // No booking — is the plate on a customer account?
  const owners = await User.find({
    'vehicles.plateNormalized': normalized,
    isDeleted: { $ne: true }
  }).limit(3);

  if (owners.length === 1) {
    return { booking: null, user: owners[0], confidence: 'exact', matchedBy: 'vehicle', review: '' };
  }
  if (owners.length > 1) {
    return {
      booking: null,
      user: null,
      confidence: 'none',
      matchedBy: 'none',
      review: `Plate ${formatPlate(normalized)} is registered to ${owners.length} accounts.`
    };
  }

  return {
    booking: null,
    user: null,
    confidence: 'none',
    matchedBy: 'none',
    review: `Plate ${formatPlate(normalized)} is not registered to any customer.`
  };
};

// ── sessions ────────────────────────────────────────────────────────────────

// Finds the wash session an event belongs to, or opens a new one. Cycle id from
// the machine is authoritative when present; otherwise events are stitched
// together by plate and lane inside the debounce window.
const resolveSession = async (event, at) => {
  const plate = normalizePlate(event.plate);

  if (event.cycleId) {
    const existing = await WashSession.findOne({ cycleId: event.cycleId });
    if (existing) return { session: existing, created: false };
  }

  if (plate) {
    const openStates = ['created', 'entered', 'washing', 'completed'];
    const since = new Date(at.getTime() - SESSION_STALE_MS);
    const open = await WashSession.findOne({
      plate,
      ...(event.laneId ? { laneId: event.laneId } : {}),
      state: { $in: openStates },
      createdAt: { $gte: since }
    }).sort({ createdAt: -1 });

    if (open) {
      if (event.type === 'vehicle.entered') {
        const enteredAt = open.enteredAt ? open.enteredAt.getTime() : open.createdAt.getTime();
        const gap = at.getTime() - enteredAt;

        // Inside the window this is one car being seen twice — a vehicle
        // rolling back over the loop, or the poller re-reading the same
        // crossing. Reuse the session so no second job is opened.
        if (gap <= ENTRY_DEBOUNCE_MS) {
          return { session: open, created: false, deduped: true };
        }

        // Beyond it the car has genuinely come back, and the earlier cycle
        // never reported a finish. Retire it explicitly rather than leaving an
        // open session that would swallow this visit's wash events.
        open.state = 'abandoned';
        open.abortReason = 'Superseded by a later arrival of the same vehicle';
        await open.save();
      } else {
        return { session: open, created: false };
      }
    }
  }

  try {
    const session = await WashSession.create({
      cycleId: event.cycleId || '',
      laneId: event.laneId || '',
      plate,
      plateRaw: event.plateRaw || event.plate || '',
      programCode: event.programCode || '',
      state: 'created'
    });
    return { session, created: true };
  } catch (error) {
    if (isDuplicateKeyError(error) && event.cycleId) {
      // Two events for the same cycle landed at once; one lost the race.
      const session = await WashSession.findOne({ cycleId: event.cycleId });
      if (session) return { session, created: false };
    }
    throw error;
  }
};

// ── membership ──────────────────────────────────────────────────────────────

// Takes one wash off the membership, exactly once.
//
// The ledger row is written first and carries a unique index on
// (washSessionId, kind). A retried completion event therefore fails the insert
// and returns `alreadyApplied` instead of charging a second wash — the counter
// update can never run twice for one cycle.
const consumeMembership = async (session, booking, at) => {
  if (!session.userId) {
    return { applied: false, code: 'NO_CUSTOMER', message: 'No customer attached to this wash.' };
  }
  if (session.matchConfidence !== 'exact') {
    return {
      applied: false,
      code: 'UNVERIFIED_MATCH',
      message: 'Vehicle match needs review before a membership wash is used.'
    };
  }

  const user = await User.findById(session.userId);
  if (!user) {
    return { applied: false, code: 'NO_CUSTOMER', message: 'Customer account not found.' };
  }

  const decision = evaluateEntitlement(user, {
    at,
    plate: session.plate,
    serviceKey: SERVICE_KEY
  });

  if (!decision.allowed) {
    return { applied: false, code: decision.code, message: decision.message, user };
  }

  const consumption = buildConsumption(user, { at });

  let ledgerRow;
  try {
    ledgerRow = await MembershipUsage.create({
      userId: user._id,
      bookingId: booking ? booking._id : null,
      washSessionId: session._id,
      kind: 'consume',
      plate: session.plate,
      serviceKey: SERVICE_KEY,
      programCode: session.programCode || '',
      planName: user.membership?.planName || '',
      source: 'tunnel',
      consumedAt: at,
      balanceBefore: consumption.balanceBefore,
      balanceAfter: consumption.balanceAfter
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return {
        applied: false,
        alreadyApplied: true,
        code: 'ALREADY_APPLIED',
        message: 'This wash was already taken off the membership.'
      };
    }
    throw error;
  }

  await User.updateOne({ _id: user._id }, { $set: consumption.set });

  return {
    applied: true,
    code: 'OK',
    message: 'Wash consumed from membership.',
    ledgerRow,
    balanceAfter: consumption.balanceAfter,
    user
  };
};

// Puts a wash back after an aborted cycle. Writes a reversing row rather than
// deleting the original, so the audit trail shows both halves.
const reverseMembershipForSession = async (session, at, reason = '') => {
  const original = await MembershipUsage.findOne({ washSessionId: session._id, kind: 'consume' });
  if (!original) {
    return { reversed: false, code: 'NOTHING_TO_REVERSE' };
  }
  if (original.reversedBy) {
    return { reversed: false, code: 'ALREADY_REVERSED' };
  }

  const user = await User.findById(original.userId);
  if (!user) {
    return { reversed: false, code: 'NO_CUSTOMER' };
  }

  const reversal = buildReversal(user, original, { at });

  let reversalRow;
  try {
    reversalRow = await MembershipUsage.create({
      userId: user._id,
      bookingId: original.bookingId,
      washSessionId: session._id,
      kind: 'reverse',
      plate: original.plate,
      serviceKey: original.serviceKey,
      programCode: original.programCode,
      planName: original.planName,
      source: 'system',
      consumedAt: at,
      balanceBefore: original.balanceAfter,
      balanceAfter: original.balanceBefore,
      reversesRow: original._id,
      notes: reason
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return { reversed: false, code: 'ALREADY_REVERSED' };
    }
    throw error;
  }

  if (Object.keys(reversal.set).length) {
    await User.updateOne({ _id: user._id }, { $set: reversal.set });
  }
  await MembershipUsage.updateOne({ _id: original._id }, { $set: { reversedBy: reversalRow._id } });

  return { reversed: true, code: 'OK', reversalRow };
};

// ── notifications ───────────────────────────────────────────────────────────

// Staff must hear about anything automation refused to decide. Failing to raise
// a notification must never fail the event pipeline.
const alertStaff = async ({ title, message, priority = 'high', serviceKey = SERVICE_KEY }) => {
  try {
    await Notification.create({
      title,
      message,
      recipientType: 'staff',
      serviceKey,
      category: 'order_status',
      priority,
      actionUrl: '/staff/bookings'
    });
  } catch (error) {
    console.warn('Could not raise integration alert:', error.message);
  }
};

// ── the pipeline ────────────────────────────────────────────────────────────

// Processes one normalised device event end to end.
//
// Ordering note: the DeviceEvent row is inserted *before* any work is done. Its
// unique eventId is what makes the whole endpoint safe to retry — a connector
// that resends after a timeout gets `duplicate: true` and nothing moves twice.
const ingestEvent = async (rawEvent, ctx = {}) => {
  const occurredAt = new Date(rawEvent.occurredAt);
  const at = Number.isNaN(occurredAt.getTime()) ? new Date() : occurredAt;
  const plate = normalizePlate(rawEvent.plate);

  let eventDoc;
  try {
    eventDoc = await DeviceEvent.create({
      eventId: rawEvent.eventId,
      source: rawEvent.source,
      type: rawEvent.type,
      deviceId: ctx.deviceId || rawEvent.deviceId || '',
      occurredAt: at,
      plate,
      plateRaw: rawEvent.plateRaw || rawEvent.plate || '',
      laneId: rawEvent.laneId || '',
      channelMac: rawEvent.channelMac || '',
      cycleId: rawEvent.cycleId || '',
      programCode: rawEvent.programCode || '',
      photoUrl: rawEvent.photoUrl || '',
      raw: rawEvent.raw || {}
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return { eventId: rawEvent.eventId, duplicate: true, status: 'processed', outcome: 'DUPLICATE' };
    }
    throw error;
  }

  const finish = async (status, outcome, extra = {}) => {
    await DeviceEvent.updateOne(
      { _id: eventDoc._id },
      {
        $set: {
          status,
          outcome,
          processedAt: new Date(),
          ...(extra.washSessionId ? { washSessionId: extra.washSessionId } : {}),
          ...(extra.bookingId ? { bookingId: extra.bookingId } : {}),
          ...(extra.error ? { error: extra.error } : {})
        }
      }
    );
    return { eventId: rawEvent.eventId, duplicate: false, status, outcome, ...extra };
  };

  try {
    if (rawEvent.type === 'heartbeat') {
      return await finish('processed', 'HEARTBEAT');
    }

    const { session } = await resolveSession(rawEvent, at);

    if (!session) {
      return await finish('failed', 'NO_SESSION', { error: 'Could not resolve a wash session.' });
    }

    if (!session.eventIds.includes(rawEvent.eventId)) {
      session.eventIds.push(rawEvent.eventId);
    }
    if (plate && !session.plate) session.plate = plate;
    if (rawEvent.programCode) session.programCode = rawEvent.programCode;
    if (rawEvent.laneId && !session.laneId) session.laneId = rawEvent.laneId;
    if (rawEvent.photoUrl && !session.photos.includes(rawEvent.photoUrl)) {
      session.photos.push(rawEvent.photoUrl);
    }

    // Attach a customer the first time we have a plate to work with.
    if (!session.bookingId && !session.userId && plate) {
      const match = await matchArrival(plate, at);
      session.matchConfidence = match.confidence;
      session.matchedBy = match.matchedBy;

      // Both branches insist on 'exact'. Anything weaker falls through to the
      // review path below, where a person decides.
      if (match.booking && match.confidence === 'exact') {
        session.bookingId = match.booking._id;
        if (match.user) session.userId = match.user._id;
      } else if (match.user && match.confidence === 'exact') {
        // Known customer with no booking — open a walk-in job so the wash is
        // tracked and the customer sees it in their app like any other.
        const staff = await findStaffForService(SERVICE_KEY);
        const now = new Date();
        const walkIn = await createWalkInBooking({
          serviceKey: SERVICE_KEY,
          serviceName: 'Car Wash',
          packageName: 'Walk-in Wash',
          price: 0,
          date: now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
          timeSlot: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
          customerName: match.user.fullName,
          customerEmail: match.user.email,
          vehicleNo: formatPlate(plate),
          vehicleNoNormalized: plate,
          status: 'Pending',
          stepIndex: 0,
          createdVia: 'anpr',
          statusSource: 'anpr',
          assignedStaffId: staff ? staff._id : null,
          assignedStaffName: staff ? staff.fullName : ''
        });
        session.bookingId = walkIn._id;
        session.userId = match.user._id;
        if (staff) await notifyStaffOfBooking(staff, walkIn);
      } else {
        // Unknown or ambiguous plate. Record the wash, flag it, and let a human
        // attach the customer rather than inventing one.
        const staff = await findStaffForService(SERVICE_KEY);
        const now = new Date();
        const unmatched = await createWalkInBooking({
          serviceKey: SERVICE_KEY,
          serviceName: 'Car Wash',
          packageName: 'Unmatched Arrival',
          price: 0,
          date: now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
          timeSlot: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
          customerName: `Unregistered · ${formatPlate(plate)}`,
          customerEmail: '',
          vehicleNo: formatPlate(plate),
          vehicleNoNormalized: plate,
          status: 'Pending',
          stepIndex: 0,
          createdVia: 'anpr',
          statusSource: 'anpr',
          needsReview: true,
          reviewReason: match.review,
          assignedStaffId: staff ? staff._id : null,
          assignedStaffName: staff ? staff.fullName : ''
        });
        session.bookingId = unmatched._id;
        await alertStaff({
          title: `Unmatched arrival · ${formatPlate(plate)}`,
          message: `${match.review} Job ${unmatched.bookingId} is waiting for a customer to be attached.`,
          priority: 'urgent'
        });
      }
    }

    // Advance the session lifecycle.
    const nextState = EVENT_SESSION_STATE[rawEvent.type];
    if (nextState && canTransitionSession(session.state, nextState)) {
      session.state = nextState;
      if (nextState === 'entered') session.enteredAt = at;
      if (nextState === 'washing') session.startedAt = at;
      if (nextState === 'completed') session.completedAt = at;
      if (nextState === 'aborted') {
        session.abortedAt = at;
        session.abortReason = rawEvent.reason || rawEvent.raw?.reason || '';
      }
      if (nextState === 'exited') session.exitedAt = at;
    }

    // Advance the customer-visible booking.
    let booking = session.bookingId ? await Booking.findById(session.bookingId) : null;
    let transitionOutcome = 'NO_BOOKING';

    if (booking) {
      const decision = decideBookingTransition(booking, rawEvent.type);
      transitionOutcome = decision.reason;
      if (decision.apply) {
        booking.status = decision.status;
        booking.stepIndex = decision.stepIndex;
        booking.statusSource = rawEvent.source === 'anpr' ? 'anpr' : 'tunnel';
        booking.washSessionId = session._id;
        await booking.save();
      }
    }

    // Money moves only on a confirmed completion.
    if (rawEvent.type === 'wash.completed') {
      const result = await consumeMembership(session, booking, at);
      session.membershipApplied = !!result.applied;
      session.membershipDenyCode = result.applied ? '' : (result.code || '');
      session.membershipDenyReason = result.applied ? '' : (result.message || '');
      if (result.ledgerRow) session.membershipUsageId = result.ledgerRow._id;

      if (!result.applied && !result.alreadyApplied && booking) {
        // Not entitled: the wash still happened, so it becomes payable rather
        // than silently free.
        booking.notes = [booking.notes, `Membership not applied — ${result.message}`]
          .filter(Boolean)
          .join(' | ');
        await booking.save();
        await alertStaff({
          title: `Wash not covered by membership · ${booking.bookingId}`,
          message: `${formatPlate(session.plate) || 'Vehicle'}: ${result.message} Collect payment at handover.`,
          priority: 'urgent'
        });
      }
    }

    if (rawEvent.type === 'wash.aborted') {
      await reverseMembershipForSession(session, at, rawEvent.reason || 'Cycle aborted');
      session.membershipApplied = false;
    }

    await session.save();

    return await finish('processed', transitionOutcome, {
      washSessionId: session._id,
      bookingId: booking ? booking._id : undefined
    });
  } catch (error) {
    await finish('failed', 'ERROR', { error: error.message });
    throw error;
  }
};

// Processes a batch one event at a time, in order. A failure on one event is
// reported and the rest still run — a single malformed payload from the tunnel
// must not stall every other car on the site.
const ingestBatch = async (events, ctx = {}) => {
  const results = [];
  for (const event of events) {
    try {
      results.push(await ingestEvent(event, ctx));
    } catch (error) {
      results.push({
        eventId: event.eventId,
        duplicate: false,
        status: 'failed',
        outcome: 'ERROR',
        error: error.message
      });
    }
  }
  return results;
};

module.exports = {
  SERVICE_KEY,
  ENTRY_DEBOUNCE_MS,
  BOOKING_MATCH_WINDOW_MS,
  SESSION_STALE_MS,
  OPEN_BOOKING_STATUSES,
  matchArrival,
  resolveSession,
  consumeMembership,
  reverseMembershipForSession,
  createWalkInBooking,
  ingestEvent,
  ingestBatch
};
