process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'test-password';

const test = require('node:test');
const assert = require('node:assert/strict');

const db = require('./helpers/testDb');
const Booking = require('../src/models/Booking');
const User = require('../src/models/User');
const MembershipUsage = require('../src/models/MembershipUsage');
const Notification = require('../src/models/Notification');
const { DeviceEvent, WashSession } = require('../src/integrations/integrations.model');
const service = require('../src/integrations/integrations.service');

test.before(async () => { await db.start(); });
test.after(async () => { await db.stop(); });
test.beforeEach(async () => { await db.clear(); });

const AT = new Date('2026-08-08T10:00:00.000Z');
const later = (mins) => new Date(AT.getTime() + mins * 60_000);

let seq = 0;
const evt = (type, over = {}) => ({
  eventId: over.eventId || `test-${type}-${seq += 1}`,
  source: over.source || (type.startsWith('vehicle') ? 'anpr' : 'tunnel'),
  type,
  occurredAt: (over.occurredAt || AT).toISOString(),
  plate: over.plate === undefined ? 'MH01AB1234' : over.plate,
  laneId: over.laneId || 'tunnel-1',
  cycleId: over.cycleId || '',
  programCode: over.programCode || '',
  ...over,
  occurredAtDate: undefined
});

const makeCustomer = (over = {}, membershipOver = {}) => User.create({
  fullName: 'Asha Menon',
  email: over.email || 'asha@example.com',
  password: 'secret123',
  role: 'user',
  vehicles: [{ plateNumber: over.plateNumber || 'MH 01 AB 1234', model: 'Creta', isPrimary: true }],
  membership: {
    planName: 'Shine Club',
    serviceKey: 'car-wash',
    startDate: new Date('2026-07-01'),
    expiryDate: new Date('2026-12-31'),
    status: 'Active',
    maxPerDay: 1,
    maxPerMonth: 8,
    coolOffHours: 0,
    boundVehiclesOnly: false,
    boundVehicles: [],
    unlimited: false,
    washesRemaining: 4,
    ...membershipOver
  },
  ...over
});

const makeBooking = (over = {}) => Booking.create({
  bookingId: over.bookingId || `B-${Math.random().toString(36).slice(2, 8)}`,
  serviceKey: 'car-wash',
  serviceName: 'Car Wash',
  packageName: 'Premium Wash',
  price: 499,
  date: 'August 8, 2026',
  timeSlot: '10:00 AM - 10:30 AM',
  customerName: 'Asha Menon',
  customerEmail: 'asha@example.com',
  vehicleNo: 'MH 01 AB 1234',
  status: 'Confirmed',
  stepIndex: 0,
  ...over
});

const reload = (b) => Booking.findById(b._id);
const reloadUser = (u) => User.findById(u._id);

// ── schema plumbing ────────────────────────────────────────────────────────

test('plate normalisation is applied on save for bookings and vehicles', async () => {
  const booking = await makeBooking({ vehicleNo: 'mh-01-ab-1234' });
  assert.equal(booking.vehicleNoNormalized, 'MH01AB1234');

  const user = await makeCustomer({ plateNumber: 'mh 01 ab 1234' });
  assert.equal(user.vehicles[0].plateNormalized, 'MH01AB1234');
});

// ── the happy path ─────────────────────────────────────────────────────────

test('a full cycle advances the booking and takes exactly one wash off the plan', async () => {
  const user = await makeCustomer();
  const booking = await makeBooking();

  await service.ingestEvent(evt('vehicle.entered', { cycleId: 'C1' }));
  assert.equal((await reload(booking)).status, 'Vehicle Received');
  assert.equal((await reload(booking)).statusSource, 'anpr');

  await service.ingestEvent(evt('wash.started', { cycleId: 'C1', occurredAt: later(2) }));
  assert.equal((await reload(booking)).status, 'Wash Started');

  await service.ingestEvent(evt('wash.completed', { cycleId: 'C1', occurredAt: later(8) }));
  const afterWash = await reload(booking);
  assert.equal(afterWash.status, 'Wash Completed');
  assert.equal(afterWash.stepIndex, 3);
  assert.equal(afterWash.statusSource, 'tunnel');

  await service.ingestEvent(evt('vehicle.exited', { cycleId: 'C1', occurredAt: later(12) }));
  assert.equal((await reload(booking)).status, 'Delivered');

  const fresh = await reloadUser(user);
  assert.equal(fresh.membership.washesRemaining, 3);
  assert.equal(fresh.membership.usageCountToday, 1);
  assert.equal(fresh.membership.usageCountMonth, 1);

  const ledger = await MembershipUsage.find({ userId: user._id });
  assert.equal(ledger.length, 1);
  assert.equal(ledger[0].kind, 'consume');
  assert.equal(ledger[0].balanceBefore, 4);
  assert.equal(ledger[0].balanceAfter, 3);

  const session = await WashSession.findOne({ cycleId: 'C1' });
  assert.equal(session.state, 'exited');
  assert.equal(session.membershipApplied, true);
  assert.equal(session.matchConfidence, 'exact');
});

test('the camera plate matches a booking typed with spaces and dashes', async () => {
  await makeCustomer();
  const booking = await makeBooking({ vehicleNo: 'MH-01-AB-1234' });
  await service.ingestEvent(evt('vehicle.entered', { plate: 'MH01AB1234' }));
  assert.equal((await reload(booking)).status, 'Vehicle Received');
});

// ── idempotency: the money-critical guarantees ─────────────────────────────

test('replaying the identical event changes nothing', async () => {
  const user = await makeCustomer();
  const booking = await makeBooking();
  const completion = evt('wash.completed', { eventId: 'fixed-id', cycleId: 'C1' });

  const first = await service.ingestEvent(completion);
  const second = await service.ingestEvent(completion);

  assert.equal(first.duplicate, false);
  assert.equal(second.duplicate, true);
  assert.equal((await reloadUser(user)).membership.washesRemaining, 3);
  assert.equal(await MembershipUsage.countDocuments({ userId: user._id }), 1);
  assert.equal((await reload(booking)).status, 'Wash Completed');
});

test('two distinct completion events for one cycle still consume only one wash', async () => {
  // A tunnel that reports completion on both its own webhook and a polled
  // status endpoint produces two different event ids for one physical wash.
  // The ledger's unique index on (washSessionId, kind) is the backstop.
  const user = await makeCustomer();
  await makeBooking();

  await service.ingestEvent(evt('wash.completed', { eventId: 'webhook-1', cycleId: 'C1' }));
  const second = await service.ingestEvent(
    evt('wash.completed', { eventId: 'poll-1', cycleId: 'C1', occurredAt: later(1) })
  );

  assert.equal(second.duplicate, false, 'the event itself is new');
  assert.equal((await reloadUser(user)).membership.washesRemaining, 3, 'but the wash is not charged twice');
  assert.equal(await MembershipUsage.countDocuments({ kind: 'consume' }), 1);
});

test('concurrent duplicate deliveries do not double-charge', async () => {
  const user = await makeCustomer();
  await makeBooking();

  const results = await Promise.allSettled([
    service.ingestEvent(evt('wash.completed', { eventId: 'race-a', cycleId: 'C1' })),
    service.ingestEvent(evt('wash.completed', { eventId: 'race-b', cycleId: 'C1' }))
  ]);

  assert.ok(results.some((r) => r.status === 'fulfilled'));
  assert.equal((await reloadUser(user)).membership.washesRemaining, 3);
  assert.equal(await MembershipUsage.countDocuments({ kind: 'consume' }), 1);
});

// ── ordering ───────────────────────────────────────────────────────────────

test('a late start event never drags a finished booking backwards', async () => {
  await makeCustomer();
  const booking = await makeBooking();

  await service.ingestEvent(evt('wash.completed', { cycleId: 'C1' }));
  const result = await service.ingestEvent(evt('wash.started', { cycleId: 'C1', occurredAt: later(1) }));

  assert.equal(result.outcome, 'WOULD_REGRESS');
  assert.equal((await reload(booking)).status, 'Wash Completed');
});

test('a cancelled booking stays cancelled; the drive-in becomes a new job', async () => {
  // The customer cancelled and then turned up anyway. Reviving the cancelled
  // booking would be wrong; a fresh walk-in is the honest record.
  await makeCustomer();
  const booking = await makeBooking({ status: 'Cancelled' });
  await service.ingestEvent(evt('vehicle.entered'));

  assert.equal((await reload(booking)).status, 'Cancelled');
  const walkIn = await Booking.findOne({ createdVia: 'anpr' });
  assert.ok(walkIn);
  assert.equal(walkIn.status, 'Vehicle Received');
});

test('an in-flight booking is never regressed by a stray entry event', async () => {
  await makeCustomer();
  const booking = await makeBooking({ status: 'Wash Completed', stepIndex: 3 });
  const result = await service.ingestEvent(evt('vehicle.entered'));

  assert.equal(result.outcome, 'WOULD_REGRESS');
  assert.equal((await reload(booking)).status, 'Wash Completed');
});

test('a missed start event does not stall the flow', async () => {
  await makeCustomer();
  const booking = await makeBooking();
  await service.ingestEvent(evt('vehicle.entered', { cycleId: 'C1' }));
  await service.ingestEvent(evt('wash.completed', { cycleId: 'C1', occurredAt: later(9) }));
  assert.equal((await reload(booking)).status, 'Wash Completed');
});

// ── matching ───────────────────────────────────────────────────────────────

test('a known customer with no booking gets a walk-in job', async () => {
  const user = await makeCustomer();
  await service.ingestEvent(evt('vehicle.entered'));

  const booking = await Booking.findOne({ createdVia: 'anpr' });
  assert.ok(booking);
  assert.equal(booking.customerEmail, 'asha@example.com');
  assert.equal(booking.packageName, 'Walk-in Wash');
  assert.equal(booking.needsReview, false);
  assert.equal(booking.status, 'Vehicle Received');

  const session = await WashSession.findOne({ plate: 'MH01AB1234' });
  assert.equal(String(session.userId), String(user._id));
  assert.equal(session.matchedBy, 'vehicle');
});

test('an unregistered plate is flagged for review, never guessed at', async () => {
  await service.ingestEvent(evt('vehicle.entered', { plate: 'XX99ZZ0001' }));

  const booking = await Booking.findOne({ needsReview: true });
  assert.ok(booking);
  assert.equal(booking.packageName, 'Unmatched Arrival');
  assert.match(booking.reviewReason, /not registered/);

  const session = await WashSession.findOne({ plate: 'XX99ZZ0001' });
  assert.equal(session.userId, null);
  assert.equal(session.matchConfidence, 'none');

  const alert = await Notification.findOne({ title: /Unmatched arrival/ });
  assert.ok(alert, 'staff must be told');
});

test('an unmatched wash never consumes anyone\'s membership', async () => {
  const user = await makeCustomer();
  await service.ingestEvent(evt('wash.completed', { plate: 'XX99ZZ0001', cycleId: 'C1' }));

  assert.equal((await reloadUser(user)).membership.washesRemaining, 4);
  assert.equal(await MembershipUsage.countDocuments({}), 0);
});

test('two open bookings on one plate go to review rather than picking one', async () => {
  await makeCustomer();
  await makeBooking({ bookingId: 'B-AAA' });
  await makeBooking({ bookingId: 'B-BBB' });

  await service.ingestEvent(evt('vehicle.entered'));

  const session = await WashSession.findOne({ plate: 'MH01AB1234' });
  assert.equal(session.matchConfidence, 'none');
  assert.equal(session.userId, null);

  const flagged = await Booking.findOne({ needsReview: true });
  assert.match(flagged.reviewReason, /2 open bookings/);
});

test('a plate registered to two accounts goes to review', async () => {
  await makeCustomer({ email: 'a@example.com' });
  await makeCustomer({ email: 'b@example.com' });

  await service.ingestEvent(evt('vehicle.entered'));

  const flagged = await Booking.findOne({ needsReview: true });
  assert.match(flagged.reviewReason, /registered to 2 accounts/);
});

test('a booking outside the match window is not claimed', async () => {
  await makeCustomer();
  const old = await makeBooking();
  // Mongoose guards createdAt, so age the row through the driver directly.
  await Booking.collection.updateOne(
    { _id: old._id },
    { $set: { createdAt: new Date(AT.getTime() - 48 * 3600 * 1000) } }
  );

  await service.ingestEvent(evt('vehicle.entered'));

  assert.equal((await reload(old)).status, 'Confirmed');
  assert.ok(await Booking.findOne({ createdVia: 'anpr' }), 'a fresh walk-in is opened instead');
});

test('an unreadable plate is recorded for review instead of dropped', async () => {
  const result = await service.ingestEvent(evt('vehicle.entered', { plate: 'A1' }));
  assert.equal(result.status, 'processed');
  const flagged = await Booking.findOne({ needsReview: true });
  assert.match(flagged.reviewReason, /could not be read/);
});

// ── debounce ───────────────────────────────────────────────────────────────

test('a car seen twice on the entry loop does not open two jobs', async () => {
  await makeCustomer();
  await makeBooking();

  await service.ingestEvent(evt('vehicle.entered', { eventId: 'e1' }));
  const second = await service.ingestEvent(evt('vehicle.entered', { eventId: 'e2', occurredAt: later(1) }));

  assert.equal(second.outcome, 'ALREADY_AT_STATE');
  assert.equal(await WashSession.countDocuments({}), 1);
});

test('a genuine second visit after the debounce window opens a new session', async () => {
  await makeCustomer({}, { maxPerDay: 5 });
  await makeBooking();

  await service.ingestEvent(evt('vehicle.entered', { eventId: 'v1' }));
  await service.ingestEvent(evt('wash.completed', { eventId: 'v1c', occurredAt: later(8) }));
  await service.ingestEvent(evt('vehicle.exited', { eventId: 'v1x', occurredAt: later(12) }));

  await service.ingestEvent(evt('vehicle.entered', { eventId: 'v2', occurredAt: later(300) }));

  assert.equal(await WashSession.countDocuments({}), 2);
});

// ── membership refusals ────────────────────────────────────────────────────

const expectRefusal = async (membershipOver, pattern) => {
  const user = await makeCustomer({}, membershipOver);
  const booking = await makeBooking();
  await service.ingestEvent(evt('wash.completed', { cycleId: `C-${seq}` }));

  const session = await WashSession.findOne({ plate: 'MH01AB1234' });
  assert.equal(session.membershipApplied, false);
  assert.match(session.membershipDenyReason, pattern);

  assert.equal((await reload(booking)).status, 'Wash Completed', 'the wash still happened');
  assert.match((await reload(booking)).notes, /Membership not applied/);
  assert.equal(await MembershipUsage.countDocuments({}), 0);

  const alert = await Notification.findOne({ title: /not covered by membership/ });
  assert.ok(alert, 'staff must be told to collect payment');
  return user;
};

test('an expired membership does not pay, and the wash becomes payable', async () => {
  await expectRefusal({ expiryDate: new Date('2026-01-01') }, /expired/i);
});

test('a suspended membership does not pay', async () => {
  await expectRefusal({ status: 'Suspended', suspensionReason: 'Chargeback' }, /Chargeback/);
});

test('an exhausted balance does not pay', async () => {
  await expectRefusal({ washesRemaining: 0 }, /No washes remaining/);
});

test('the daily cap is enforced', async () => {
  await expectRefusal(
    { maxPerDay: 1, usageCountToday: 1, usageDayKey: '2026-08-08' },
    /Daily limit/
  );
});

test('a vehicle not on the plan does not pay', async () => {
  await expectRefusal(
    { boundVehiclesOnly: true, boundVehicles: ['DL09XY9999'] },
    /not on this membership/
  );
});

test('cool-off blocks a second wash the same day', async () => {
  await expectRefusal(
    { coolOffHours: 24, maxPerDay: 5, lastUsedAt: new Date(AT.getTime() - 3600 * 1000) },
    /Cool-off/
  );
});

test('an unlimited plan is charged without touching a balance', async () => {
  const user = await makeCustomer({}, { unlimited: true, washesRemaining: 0 });
  await makeBooking();
  await service.ingestEvent(evt('wash.completed', { cycleId: 'C1' }));

  const session = await WashSession.findOne({ cycleId: 'C1' });
  assert.equal(session.membershipApplied, true);

  const fresh = await reloadUser(user);
  assert.equal(fresh.membership.washesRemaining, 0);
  assert.equal(fresh.membership.usageCountToday, 1);
});

// ── aborts and reversal ────────────────────────────────────────────────────

test('an aborted cycle after completion puts the wash back', async () => {
  const user = await makeCustomer();
  await makeBooking();

  await service.ingestEvent(evt('wash.completed', { eventId: 'ok', cycleId: 'C1' }));
  assert.equal((await reloadUser(user)).membership.washesRemaining, 3);

  await service.ingestEvent(evt('wash.aborted', { eventId: 'abort', cycleId: 'C1', occurredAt: later(1) }));

  const fresh = await reloadUser(user);
  assert.equal(fresh.membership.washesRemaining, 4, 'balance restored');
  assert.equal(fresh.membership.usageCountToday, 0);

  const rows = await MembershipUsage.find({}).sort({ createdAt: 1 });
  assert.equal(rows.length, 2);
  assert.equal(rows[0].kind, 'consume');
  assert.equal(rows[1].kind, 'reverse');
  assert.ok(rows[0].reversedBy, 'the original row is annotated, never deleted');
});

test('a repeated abort reverses only once', async () => {
  const user = await makeCustomer();
  await makeBooking();
  await service.ingestEvent(evt('wash.completed', { eventId: 'c', cycleId: 'C1' }));
  await service.ingestEvent(evt('wash.aborted', { eventId: 'a1', cycleId: 'C1', occurredAt: later(1) }));
  await service.ingestEvent(evt('wash.aborted', { eventId: 'a2', cycleId: 'C1', occurredAt: later(2) }));

  assert.equal((await reloadUser(user)).membership.washesRemaining, 4);
  assert.equal(await MembershipUsage.countDocuments({ kind: 'reverse' }), 1);
});

test('aborting a cycle that never consumed anything is harmless', async () => {
  const user = await makeCustomer();
  await makeBooking();
  await service.ingestEvent(evt('vehicle.entered', { cycleId: 'C1' }));
  await service.ingestEvent(evt('wash.aborted', { cycleId: 'C1', occurredAt: later(3) }));

  assert.equal((await reloadUser(user)).membership.washesRemaining, 4);
  assert.equal(await MembershipUsage.countDocuments({}), 0);
});

// ── batching and durability ────────────────────────────────────────────────

test('one failing event does not stop the rest of the batch', async () => {
  await makeCustomer();
  const booking = await makeBooking();

  const results = await service.ingestBatch([
    evt('vehicle.entered', { eventId: 'b1', cycleId: 'C1' }),
    { eventId: 'b2', source: 'tunnel', type: 'wash.started', occurredAt: 'not-a-date', cycleId: 'C1' },
    evt('wash.completed', { eventId: 'b3', cycleId: 'C1', occurredAt: later(9) })
  ]);

  assert.equal(results.length, 3);
  assert.equal((await reload(booking)).status, 'Wash Completed');
});

test('every event is persisted with its outcome for forensics', async () => {
  await makeCustomer();
  await makeBooking();
  await service.ingestEvent(evt('vehicle.entered', { eventId: 'audit-1', cycleId: 'C1' }));

  const stored = await DeviceEvent.findOne({ eventId: 'audit-1' });
  assert.equal(stored.status, 'processed');
  assert.equal(stored.plate, 'MH01AB1234');
  assert.ok(stored.processedAt);
  assert.ok(stored.washSessionId);
  assert.ok(stored.bookingId);
});

test('a heartbeat is recorded and touches nothing else', async () => {
  await makeCustomer();
  const booking = await makeBooking();
  const result = await service.ingestEvent(evt('heartbeat', { plate: '' }));

  assert.equal(result.outcome, 'HEARTBEAT');
  assert.equal((await reload(booking)).status, 'Confirmed');
  assert.equal(await WashSession.countDocuments({}), 0);
});

test('a dry-contact completion with no plate still records the wash', async () => {
  // The §6 fallback: no plate is available, so no membership is charged, but the
  // cycle is never lost.
  const result = await service.ingestEvent(evt('wash.completed', { plate: '', cycleId: 'DC-1' }));
  assert.equal(result.status, 'processed');

  const session = await WashSession.findOne({ cycleId: 'DC-1' });
  assert.equal(session.state, 'completed');
  assert.equal(session.membershipApplied, false);
  assert.equal(await MembershipUsage.countDocuments({}), 0);
});
