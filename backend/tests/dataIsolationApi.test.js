process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'test-password';

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const express = require('express');
const jwt = require('jsonwebtoken');

const db = require('./helpers/testDb');
const User = require('../src/models/User');
const Booking = require('../src/models/Booking');
const Feedback = require('../src/models/Feedback');

// The whole point of these tests is the middleware chain, so they mount the
// real routers on a real socket. Asserting on the controllers directly would
// pass even if a route lost its `authMiddleware` — which is exactly the bug
// class this suite exists to catch.
const app = express();
app.use(express.json());
app.use('/api/users', require('../src/routes/userRoutes'));
app.use('/api/bookings', require('../src/routes/bookingRoutes'));
app.use('/api/car-wash', require('../src/car-wash').routes);
app.use('/api/car-detailing', require('../src/car-detailing').routes);
app.use('/api/dog-wash', require('../src/dog-wash').routes);
app.use('/api/salon', require('../src/salon').routes);
app.use('/api/cafe', require('../src/cafe').routes);
app.use('/api/drive-through-cafe', require('../src/drive-through-cafe').routes);

let server;
let baseUrl;

test.before(async () => {
  await db.start();
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await db.stop();
});

test.beforeEach(async () => { await db.clear(); });

const request = async (method, path, { body, token } = {}) => {
  const headers = { 'content-type': 'application/json' };
  if (token) headers.authorization = `Bearer ${token}`;

  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* non-JSON error page */ }
  return { status: res.status, body: json, text };
};

const tokenFor = (user) => jwt.sign({ userId: user._id.toString() }, process.env.JWT_SECRET);

const makeUser = (over = {}) => User.create({
  fullName: over.fullName || 'Test Person',
  email: over.email || 'person@example.com',
  password: 'secret123',
  role: over.role || 'user',
  ...over
});

const makeBooking = (over = {}) => Booking.create({
  bookingId: over.bookingId || `B-${Math.random().toString(36).slice(2, 9)}`,
  serviceKey: 'car-wash',
  serviceName: 'Car Wash',
  packageName: 'Express Foam Wash',
  price: 699,
  date: 'September 1, 2026',
  timeSlot: '10:00 AM - 10:30 AM',
  customerName: 'Test Person',
  ...over
});

// ─── Unauthenticated guests ───────────────────────────────────────────────

const GUEST_FORBIDDEN = [
  ['GET', '/api/bookings'],
  ['GET', '/api/bookings/my-bookings'],
  ['GET', '/api/users/vehicles'],
  ['POST', '/api/users/vehicles'],
  ['DELETE', '/api/users/vehicles/64b7f9b2c8d4e1a2b3c4d5e6'],
  ['GET', '/api/users/membership'],
  ['GET', '/api/users/my-feedback'],
  ['GET', '/api/users/customers'],
  ['GET', '/api/car-wash'],
  ['GET', '/api/car-detailing'],
  ['GET', '/api/dog-wash'],
  ['GET', '/api/salon'],
  ['GET', '/api/cafe'],
  ['GET', '/api/drive-through-cafe']
];

for (const [method, path] of GUEST_FORBIDDEN) {
  test(`guest gets 401 from ${method} ${path}`, async () => {
    await makeBooking({ customerEmail: 'someone@example.com' });

    const res = await request(method, path, {
      body: method === 'GET' ? undefined : {}
    });

    assert.equal(res.status, 401, `${method} ${path} returned ${res.status}`);
    // Nothing about the data may come back on the rejection path.
    assert.ok(!res.text.includes('someone@example.com'));
  });
}

test('a bad token is rejected exactly like no token', async () => {
  const res = await request('GET', '/api/users/vehicles', { token: 'not-a-real-token' });
  assert.equal(res.status, 401);
});

// ─── Cross-account isolation ──────────────────────────────────────────────

test('a customer never sees another customer\'s bookings', async () => {
  const alice = await makeUser({ email: 'alice@example.com' });
  const bob = await makeUser({ email: 'bob@example.com' });

  await makeBooking({ bookingId: 'B-ALICE', customerEmail: 'alice@example.com', vehicleNo: 'MH02TX9999' });
  await makeBooking({ bookingId: 'B-BOB', customerEmail: 'bob@example.com', vehicleNo: 'MH03QQ1111' });

  const res = await request('GET', '/api/bookings', { token: tokenFor(bob) });

  assert.equal(res.status, 200);
  assert.deepEqual(res.body.bookings.map(b => b.bookingId), ['B-BOB']);
  assert.ok(!res.text.includes('MH02TX9999'));
  assert.ok(!res.text.includes('alice@example.com'));
  assert.ok(alice);
});

test('booking ownership is matched regardless of stored email casing', async () => {
  const alice = await makeUser({ email: 'alice@example.com' });
  // Legacy rows were written with whatever casing the client sent.
  await makeBooking({ bookingId: 'B-LEGACY', customerEmail: 'Alice@Example.COM' });

  const res = await request('GET', '/api/bookings', { token: tokenFor(alice) });

  assert.equal(res.status, 200);
  assert.deepEqual(res.body.bookings.map(b => b.bookingId), ['B-LEGACY']);
});

test('a customer with no email address owns nothing rather than everything', async () => {
  // Guest bookings taken at the counter are stored with customerEmail: ''.
  await makeBooking({ bookingId: 'B-WALKIN', customerEmail: '' });
  const ghost = await makeUser({ email: 'ghost@example.com' });
  await User.updateOne({ _id: ghost._id }, { $set: { email: '' } });

  const res = await request('GET', '/api/bookings', { token: tokenFor(ghost) });

  assert.equal(res.status, 200);
  assert.deepEqual(res.body.bookings, []);
});

test('my-bookings stays scoped even for a staff member', async () => {
  const staff = await makeUser({ email: 'staff@example.com', role: 'staff' });

  await makeBooking({ bookingId: 'B-CUSTOMER', customerEmail: 'alice@example.com' });
  await makeBooking({ bookingId: 'B-STAFF-OWN', customerEmail: 'staff@example.com' });

  const mine = await request('GET', '/api/bookings/my-bookings', { token: tokenFor(staff) });
  assert.deepEqual(mine.body.bookings.map(b => b.bookingId), ['B-STAFF-OWN']);

  // The operations view is still the full queue for staff.
  const all = await request('GET', '/api/bookings', { token: tokenFor(staff) });
  assert.equal(all.body.bookings.length, 2);
});

test('a customer cannot drive another customer\'s booking through the workflow', async () => {
  const bob = await makeUser({ email: 'bob@example.com' });
  const booking = await makeBooking({ bookingId: 'B-ALICE', customerEmail: 'alice@example.com' });

  const res = await request('PUT', `/api/bookings/${booking._id}`, {
    token: tokenFor(bob),
    body: { status: 'Delivered' }
  });

  assert.equal(res.status, 403);
  const reloaded = await Booking.findById(booking._id);
  assert.notEqual(reloaded.status, 'Delivered');
});

test('a customer may cancel their own booking but not mark it delivered', async () => {
  const alice = await makeUser({ email: 'alice@example.com' });
  const booking = await makeBooking({ bookingId: 'B-ALICE', customerEmail: 'alice@example.com' });

  const delivered = await request('PUT', `/api/bookings/${booking._id}`, {
    token: tokenFor(alice),
    body: { status: 'Delivered' }
  });
  assert.equal(delivered.status, 403);

  const cancelled = await request('PUT', `/api/bookings/${booking._id}`, {
    token: tokenFor(alice),
    body: { status: 'Cancelled' }
  });
  assert.equal(cancelled.status, 200);
  assert.equal((await Booking.findById(booking._id)).status, 'Cancelled');
});

test('a customer token cannot read the CRM or the support inbox', async () => {
  const alice = await makeUser({ email: 'alice@example.com' });
  await makeUser({ email: 'bob@example.com', mobile: '+91 9820012345' });

  const customers = await request('GET', '/api/users/customers', { token: tokenFor(alice) });
  assert.equal(customers.status, 403);
  assert.ok(!customers.text.includes('9820012345'));

  const inbox = await request('GET', '/api/users/admin/feedback', { token: tokenFor(alice) });
  assert.equal(inbox.status, 403);

  const queue = await request('GET', '/api/car-wash', { token: tokenFor(alice) });
  assert.equal(queue.status, 403);
});

test('my-feedback no longer accepts an email in the query string', async () => {
  const alice = await makeUser({ email: 'alice@example.com' });
  await Feedback.create({ name: 'Bob', email: 'bob@example.com', message: 'Bob private ticket' });
  await Feedback.create({ name: 'Alice', email: 'alice@example.com', message: 'Alice ticket' });

  const spoof = await request('GET', '/api/users/my-feedback?email=bob@example.com', {
    token: tokenFor(alice)
  });

  assert.equal(spoof.status, 200);
  assert.deepEqual(spoof.body.feedbacks.map(f => f.message), ['Alice ticket']);
  assert.ok(!spoof.text.includes('Bob private ticket'));

  const guest = await request('GET', '/api/users/my-feedback?email=bob@example.com');
  assert.equal(guest.status, 401);
});

// ─── Vehicle self-service ─────────────────────────────────────────────────

test('vehicles are read and written only on the caller\'s own account', async () => {
  const alice = await makeUser({ email: 'alice@example.com' });
  const bob = await makeUser({
    email: 'bob@example.com',
    vehicles: [{ plateNumber: 'MH03QQ1111', model: 'Creta' }]
  });

  // A brand new account has an empty garage — no demo fleet.
  const empty = await request('GET', '/api/users/vehicles', { token: tokenFor(alice) });
  assert.equal(empty.status, 200);
  assert.deepEqual(empty.body.vehicles, []);
  assert.ok(!empty.text.includes('MH03QQ1111'));

  const added = await request('POST', '/api/users/vehicles', {
    token: tokenFor(alice),
    body: { plateNumber: 'mh02tx9999', brand: 'Tata', model: 'Nexon', year: '2024' }
  });
  assert.equal(added.status, 201);
  assert.equal(added.body.vehicles.length, 1);
  assert.equal(added.body.vehicles[0].plateNumber, 'MH02TX9999');
  // The ANPR lookup key is maintained by the model's pre-save hook.
  assert.equal(added.body.vehicles[0].plateNormalized, 'MH02TX9999');
  assert.equal(added.body.vehicles[0].isPrimary, true);

  // Bob's garage is untouched by Alice's write.
  const bobGarage = await request('GET', '/api/users/vehicles', { token: tokenFor(bob) });
  assert.deepEqual(bobGarage.body.vehicles.map(v => v.plateNumber), ['MH03QQ1111']);
});

test('a vehicle id from another account cannot be deleted', async () => {
  const alice = await makeUser({ email: 'alice@example.com' });
  const bob = await makeUser({
    email: 'bob@example.com',
    vehicles: [{ plateNumber: 'MH03QQ1111', model: 'Creta' }]
  });
  const bobsVehicleId = bob.vehicles[0]._id.toString();

  const res = await request('DELETE', `/api/users/vehicles/${bobsVehicleId}`, {
    token: tokenFor(alice)
  });

  assert.equal(res.status, 404);
  const reloaded = await User.findById(bob._id);
  assert.equal(reloaded.vehicles.length, 1);
});

test('deleting a vehicle drops its membership plate binding', async () => {
  const alice = await makeUser({
    email: 'alice@example.com',
    vehicles: [
      { plateNumber: 'MH02TX9999', model: 'Nexon' },
      { plateNumber: 'MH03QQ1111', model: 'Creta' }
    ],
    membership: {
      planName: 'Unlimited Monthly',
      status: 'Active',
      boundVehicles: ['MH02TX9999 (Nexon)', 'MH03QQ1111 (Creta)']
    }
  });

  const res = await request('DELETE', `/api/users/vehicles/${alice.vehicles[0]._id}`, {
    token: tokenFor(alice)
  });

  assert.equal(res.status, 200);
  const reloaded = await User.findById(alice._id);
  assert.deepEqual(reloaded.vehicles.map(v => v.plateNumber), ['MH03QQ1111']);
  assert.deepEqual(reloaded.membership.boundVehicles, ['MH03QQ1111 (Creta)']);
  // The remaining car is promoted so the account still has a primary.
  assert.equal(reloaded.vehicles[0].isPrimary, true);
});

test('an unusable plate is refused rather than stored', async () => {
  const alice = await makeUser({ email: 'alice@example.com' });

  for (const plateNumber of ['', 'NA', 'AB', 'REGPENDING', 'UNKNOWN']) {
    const res = await request('POST', '/api/users/vehicles', {
      token: tokenFor(alice),
      body: { plateNumber }
    });
    assert.equal(res.status, 400, `plate ${JSON.stringify(plateNumber)} was accepted`);
  }

  const reloaded = await User.findById(alice._id);
  assert.deepEqual(reloaded.vehicles, []);
});

test('the same plate cannot be registered twice on one account', async () => {
  const alice = await makeUser({ email: 'alice@example.com' });

  const first = await request('POST', '/api/users/vehicles', {
    token: tokenFor(alice),
    body: { plateNumber: 'MH02TX9999' }
  });
  assert.equal(first.status, 201);

  // Same vehicle, the way a customer would actually retype it.
  const second = await request('POST', '/api/users/vehicles', {
    token: tokenFor(alice),
    body: { plateNumber: 'mh-02-tx-9999' }
  });
  assert.equal(second.status, 400);

  const reloaded = await User.findById(alice._id);
  assert.equal(reloaded.vehicles.length, 1);
});

// ─── Membership self-service ──────────────────────────────────────────────

test('membership reports what is stored, with no stand-in plan', async () => {
  const plain = await makeUser({ email: 'plain@example.com' });

  const res = await request('GET', '/api/users/membership', { token: tokenFor(plain) });

  assert.equal(res.status, 200);
  assert.equal(res.body.membership.planName, '');
  assert.equal(res.body.membership.status, 'None');
  assert.equal(res.body.membership.isActive, false);
});

test('an expired plan reads as expired even while status still says Active', async () => {
  const member = await makeUser({
    email: 'member@example.com',
    membership: {
      planName: 'Unlimited Monthly',
      status: 'Active',
      expiryDate: new Date(Date.now() - 24 * 3600 * 1000)
    }
  });

  const res = await request('GET', '/api/users/membership', { token: tokenFor(member) });

  assert.equal(res.body.membership.segment, 'Expired Member');
  assert.equal(res.body.membership.isActive, false);
});

test('the admin-side misuse audit trail is not exposed to the customer', async () => {
  const member = await makeUser({
    email: 'member@example.com',
    membership: {
      planName: 'Unlimited Monthly',
      status: 'Suspended',
      suspensionReason: 'Plate sharing',
      misuseAlerts: [{ alertType: 'Limit Breach', description: 'Internal investigation note' }]
    }
  });

  const res = await request('GET', '/api/users/membership', { token: tokenFor(member) });

  assert.equal(res.body.membership.segment, 'Suspended Member');
  assert.equal(res.body.membership.suspensionReason, 'Plate sharing');
  assert.equal(res.body.membership.misuseAlerts, undefined);
  assert.ok(!res.text.includes('Internal investigation note'));
});
