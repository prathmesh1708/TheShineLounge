process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'test-password';
process.env.INTEGRATION_DEVICE_KEYS = JSON.stringify({ 'edge-1': 'edge-1-secret' });

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const express = require('express');
const jwt = require('jsonwebtoken');

const db = require('./helpers/testDb');
const Booking = require('../src/models/Booking');
const User = require('../src/models/User');
const MembershipUsage = require('../src/models/MembershipUsage');
const { signPayload } = require('../src/integrations/integrations.middleware');

// Exercises the real router, real middleware chain and real controllers over a
// real socket — the unit tests prove the rules, this proves they are wired up.
const app = express();
app.use('/api/integrations', require('../src/integrations').routes);

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

const request = async (method, path, { body, headers = {} } = {}) => {
  const payload = body === undefined ? undefined : JSON.stringify(body);
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: { 'content-type': 'application/json', ...headers },
    body: payload
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* non-JSON error page */ }
  return { status: res.status, body: json, text };
};

// Signs exactly the bytes that will be sent, the way the edge connector does.
const devicePost = (path, body, { deviceId = 'edge-1', secret = 'edge-1-secret' } = {}) => {
  const raw = JSON.stringify(body);
  const timestamp = String(Date.now());
  return request('POST', path, {
    body,
    headers: {
      'x-tsl-device-id': deviceId,
      'x-tsl-timestamp': timestamp,
      'x-tsl-signature': signPayload(secret, deviceId, timestamp, raw)
    }
  });
};

const tokenFor = (user) => jwt.sign({ userId: user._id.toString() }, process.env.JWT_SECRET);

const makeUser = (role, over = {}) => User.create({
  fullName: `${role} user`,
  email: over.email || `${role}@example.com`,
  password: 'secret123',
  role,
  ...over
});

const anEvent = (over = {}) => ({
  eventId: `api-${Math.random().toString(36).slice(2)}`,
  source: 'anpr',
  type: 'vehicle.entered',
  occurredAt: new Date().toISOString(),
  plate: 'MH01AB1234',
  laneId: 'tunnel-1',
  ...over
});

// ── device endpoint ────────────────────────────────────────────────────────

test('a signed batch is accepted and processed', async () => {
  const res = await devicePost('/api/integrations/events', { events: [anEvent()] });
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.accepted, 1);
  assert.equal(res.body.duplicates, 0);
});

test('an unsigned request is refused', async () => {
  const res = await request('POST', '/api/integrations/events', { body: { events: [anEvent()] } });
  assert.equal(res.status, 401);
  assert.equal(res.body.code, 'MISSING_CREDENTIALS');
});

test('a request signed with the wrong secret is refused', async () => {
  const res = await devicePost('/api/integrations/events', { events: [anEvent()] }, { secret: 'guess' });
  assert.equal(res.status, 401);
  assert.equal(res.body.code, 'BAD_SIGNATURE');
});

test('a body altered after signing is refused', async () => {
  const signedBody = { events: [anEvent({ plate: 'MH01AB1234' })] };
  const raw = JSON.stringify(signedBody);
  const timestamp = String(Date.now());
  const signature = signPayload('edge-1-secret', 'edge-1', timestamp, raw);

  const res = await request('POST', '/api/integrations/events', {
    body: { events: [anEvent({ plate: 'DL09XY9999' })] },
    headers: {
      'x-tsl-device-id': 'edge-1',
      'x-tsl-timestamp': timestamp,
      'x-tsl-signature': signature
    }
  });
  assert.equal(res.status, 401);
  assert.equal(res.body.code, 'BAD_SIGNATURE');
});

test('a customer JWT cannot reach the device endpoint', async () => {
  const customer = await makeUser('user');
  const res = await request('POST', '/api/integrations/events', {
    body: { events: [anEvent()] },
    headers: { authorization: `Bearer ${tokenFor(customer)}` }
  });
  assert.equal(res.status, 401);
});

test('a malformed event is rejected with its position', async () => {
  const res = await devicePost('/api/integrations/events', {
    events: [anEvent(), anEvent({ type: 'wash.exploded' })]
  });
  assert.equal(res.status, 400);
  assert.match(res.body.message, /^event\[1\]/);
});

test('a resent batch reports duplicates rather than reprocessing', async () => {
  const batch = { events: [anEvent({ eventId: 'stable-id' })] };
  await devicePost('/api/integrations/events', batch);
  const again = await devicePost('/api/integrations/events', batch);

  assert.equal(again.status, 200);
  assert.equal(again.body.duplicates, 1);
  assert.equal(again.body.accepted, 0);
});

test('the health probe requires device credentials', async () => {
  const unauthed = await request('GET', '/api/integrations/health');
  assert.equal(unauthed.status, 401);

  const timestamp = String(Date.now());
  const authed = await request('GET', '/api/integrations/health', {
    headers: {
      'x-tsl-device-id': 'edge-1',
      'x-tsl-timestamp': timestamp,
      'x-tsl-signature': signPayload('edge-1-secret', 'edge-1', timestamp, '')
    }
  });
  assert.equal(authed.status, 200);
  assert.equal(authed.body.deviceId, 'edge-1');
});

test('mounting behind a global body parser fails with a diagnostic, not a bogus signature error', async () => {
  // server.js mounts /api/integrations ahead of its global express.json() for
  // exactly this reason: once the stream is consumed the raw bytes are gone and
  // no signature can be verified. If someone reorders it, the error must say so.
  const brokenApp = express();
  brokenApp.use(express.json());
  brokenApp.use('/api/integrations', require('../src/integrations').routes);

  const brokenServer = http.createServer(brokenApp);
  await new Promise((resolve) => brokenServer.listen(0, resolve));
  const url = `http://127.0.0.1:${brokenServer.address().port}/api/integrations/events`;

  const body = { events: [anEvent()] };
  const raw = JSON.stringify(body);
  const timestamp = String(Date.now());

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-tsl-device-id': 'edge-1',
      'x-tsl-timestamp': timestamp,
      'x-tsl-signature': signPayload('edge-1-secret', 'edge-1', timestamp, raw)
    },
    body: raw
  });
  const payload = await res.json();

  assert.equal(res.status, 500);
  assert.equal(payload.code, 'RAW_BODY_UNAVAILABLE');
  assert.match(payload.message, /ahead of any global body parser/);

  await new Promise((resolve) => brokenServer.close(resolve));
});

// ── operator endpoints ─────────────────────────────────────────────────────

test('operator endpoints reject anonymous and customer callers', async () => {
  const customer = await makeUser('user');

  for (const path of ['/api/integrations/sessions', '/api/integrations/unmatched', '/api/integrations/events']) {
    assert.equal((await request('GET', path)).status, 401, `${path} anonymous`);
    const asCustomer = await request('GET', path, {
      headers: { authorization: `Bearer ${tokenFor(customer)}` }
    });
    assert.equal(asCustomer.status, 403, `${path} as customer`);
  }
});

test('the raw event log is admin-only', async () => {
  const staff = await makeUser('staff');
  const admin = await makeUser('admin');

  assert.equal(
    (await request('GET', '/api/integrations/events', { headers: { authorization: `Bearer ${tokenFor(staff)}` } })).status,
    403
  );
  assert.equal(
    (await request('GET', '/api/integrations/events', { headers: { authorization: `Bearer ${tokenFor(admin)}` } })).status,
    200
  );
});

test('staff can list sessions and unmatched arrivals', async () => {
  const staff = await makeUser('staff');
  const auth = { authorization: `Bearer ${tokenFor(staff)}` };

  await devicePost('/api/integrations/events', { events: [anEvent({ plate: 'ZZ88YY7777' })] });

  const sessions = await request('GET', '/api/integrations/sessions', { headers: auth });
  assert.equal(sessions.status, 200);
  assert.equal(sessions.body.sessions.length, 1);

  const unmatched = await request('GET', '/api/integrations/unmatched', { headers: auth });
  assert.equal(unmatched.status, 200);
  assert.equal(unmatched.body.bookings.length, 1);
  assert.match(unmatched.body.bookings[0].reviewReason, /not registered/);
});

test('attaching a customer clears the flag and registers the plate for next time', async () => {
  const staff = await makeUser('staff');
  const auth = { authorization: `Bearer ${tokenFor(staff)}` };
  const customer = await makeUser('user', { email: 'walkin@example.com' });

  await devicePost('/api/integrations/events', { events: [anEvent({ plate: 'ZZ88YY7777' })] });

  const sessions = await request('GET', '/api/integrations/sessions', { headers: auth });
  const sessionId = sessions.body.sessions[0]._id;

  const attached = await request('POST', `/api/integrations/sessions/${sessionId}/attach`, {
    body: { userId: customer._id.toString() },
    headers: auth
  });

  assert.equal(attached.status, 200);
  assert.equal(attached.body.booking.needsReview, false);
  assert.equal(attached.body.booking.customerEmail, 'walkin@example.com');

  const updated = await User.findById(customer._id);
  assert.equal(updated.vehicles[0].plateNormalized, 'ZZ88YY7777');
  assert.equal(updated.vehicles[0].addedVia, 'staff');

  // Close out the first visit, then come back tomorrow. The plate is now
  // registered, so the arrival is identified with no human involved.
  const t0 = Date.now();
  await devicePost('/api/integrations/events', {
    events: [
      anEvent({ eventId: 'x1', type: 'vehicle.exited', plate: 'ZZ88YY7777', occurredAt: new Date(t0 + 600_000).toISOString() })
    ]
  });

  const followUp = await devicePost('/api/integrations/events', {
    events: [anEvent({ eventId: 'x2', plate: 'ZZ88YY7777', occurredAt: new Date(t0 + 86_400_000).toISOString() })]
  });
  assert.equal(followUp.body.accepted, 1);

  const secondVisit = await Booking.findOne({
    vehicleNoNormalized: 'ZZ88YY7777',
    _id: { $ne: attached.body.booking._id }
  });
  assert.ok(secondVisit, 'a fresh job was opened for the return visit');
  assert.equal(secondVisit.needsReview, false, 'no review needed — the plate is known now');
  assert.equal(secondVisit.customerEmail, 'walkin@example.com');
  assert.equal(secondVisit.packageName, 'Walk-in Wash');
  assert.equal(await Booking.countDocuments({ needsReview: true }), 0, 'nothing is left for review');
});

test('a car that returns while its previous job is still open reuses that job', async () => {
  // Two open jobs for one plate would make every later arrival ambiguous.
  const staff = await makeUser('staff');
  const auth = { authorization: `Bearer ${tokenFor(staff)}` };
  const t0 = Date.now();

  await devicePost('/api/integrations/events', {
    events: [anEvent({ eventId: 'r1', plate: 'QQ11WW2222', occurredAt: new Date(t0).toISOString() })]
  });
  await devicePost('/api/integrations/events', {
    events: [anEvent({ eventId: 'r2', plate: 'QQ11WW2222', occurredAt: new Date(t0 + 3_600_000).toISOString() })]
  });

  assert.equal(await Booking.countDocuments({ vehicleNoNormalized: 'QQ11WW2222' }), 1);

  // The stalled first cycle is retired so it cannot swallow the new visit's
  // wash events.
  const sessions = await request('GET', '/api/integrations/sessions', { headers: auth });
  const states = sessions.body.sessions.map((s) => s.state).sort();
  assert.deepEqual(states, ['abandoned', 'entered']);
});

test('attach validates its inputs', async () => {
  const staff = await makeUser('staff');
  const auth = { authorization: `Bearer ${tokenFor(staff)}` };

  const badSession = await request('POST', '/api/integrations/sessions/not-an-id/attach', {
    body: { userId: staff._id.toString() }, headers: auth
  });
  assert.equal(badSession.status, 400);

  const badUser = await request('POST', `/api/integrations/sessions/${staff._id}/attach`, {
    body: { userId: 'nope' }, headers: auth
  });
  assert.equal(badUser.status, 400);
});

test('the customer usage endpoint returns the ledger and a live entitlement', async () => {
  const staff = await makeUser('staff');
  const auth = { authorization: `Bearer ${tokenFor(staff)}` };

  const customer = await User.create({
    fullName: 'Asha',
    email: 'asha@example.com',
    password: 'secret123',
    role: 'user',
    vehicles: [{ plateNumber: 'MH01AB1234', isPrimary: true }],
    membership: {
      planName: 'Shine Club',
      serviceKey: 'car-wash',
      startDate: new Date(Date.now() - 86400_000),
      expiryDate: new Date(Date.now() + 30 * 86400_000),
      status: 'Active',
      washesRemaining: 3,
      maxPerDay: 2,
      coolOffHours: 0,
      boundVehiclesOnly: false
    }
  });

  await MembershipUsage.create({
    userId: customer._id,
    kind: 'consume',
    plate: 'MH01AB1234',
    source: 'tunnel',
    consumedAt: new Date(),
    balanceBefore: 4,
    balanceAfter: 3
  });

  const res = await request('GET', `/api/integrations/customers/${customer._id}/usage`, { headers: auth });
  assert.equal(res.status, 200);
  assert.equal(res.body.membership.washesRemaining, 3);
  assert.equal(res.body.ledger.length, 1);
  assert.equal(res.body.entitlement.allowed, true);
});

test('a full drive-through over HTTP updates the booking the customer sees', async () => {
  const customer = await User.create({
    fullName: 'Asha',
    email: 'asha@example.com',
    password: 'secret123',
    role: 'user',
    vehicles: [{ plateNumber: 'MH 01 AB 1234', isPrimary: true }],
    membership: {
      planName: 'Shine Club',
      serviceKey: 'car-wash',
      startDate: new Date(Date.now() - 86400_000),
      expiryDate: new Date(Date.now() + 30 * 86400_000),
      status: 'Active',
      washesRemaining: 4,
      maxPerDay: 2,
      coolOffHours: 0,
      boundVehiclesOnly: false
    }
  });

  const booking = await Booking.create({
    bookingId: 'B-HTTP-1',
    serviceKey: 'car-wash',
    serviceName: 'Car Wash',
    packageName: 'Premium',
    price: 499,
    date: 'August 8, 2026',
    timeSlot: '10:00 AM - 10:30 AM',
    customerName: 'Asha',
    customerEmail: 'asha@example.com',
    vehicleNo: 'MH-01-AB-1234',
    status: 'Confirmed'
  });

  const now = Date.now();
  const res = await devicePost('/api/integrations/events', {
    events: [
      anEvent({ eventId: 'h1', type: 'vehicle.entered', cycleId: 'H1', occurredAt: new Date(now).toISOString() }),
      anEvent({ eventId: 'h2', source: 'tunnel', type: 'wash.started', cycleId: 'H1', occurredAt: new Date(now + 60_000).toISOString() }),
      anEvent({ eventId: 'h3', source: 'tunnel', type: 'wash.completed', cycleId: 'H1', occurredAt: new Date(now + 480_000).toISOString() }),
      anEvent({ eventId: 'h4', type: 'vehicle.exited', cycleId: 'H1', occurredAt: new Date(now + 600_000).toISOString() })
    ]
  });

  assert.equal(res.status, 200);
  assert.equal(res.body.accepted, 4);

  const finished = await Booking.findById(booking._id);
  assert.equal(finished.status, 'Delivered');
  assert.equal(finished.stepIndex, 4);

  const updated = await User.findById(customer._id);
  assert.equal(updated.membership.washesRemaining, 3);
});
