process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const express = require('express');
const jwt = require('jsonwebtoken');

const db = require('./helpers/testDb');
const Admin = require('../src/models/Admin');
const Booking = require('../src/models/Booking');

const app = express();
app.use(express.json());
app.use('/api/bookings', require('../src/routes/bookingRoutes'));

let server;
let baseUrl;
let token;

const get = async (path) => {
  const res = await fetch(`${baseUrl}${path}`, { headers: { authorization: `Bearer ${token}` } });
  return { status: res.status, body: await res.json().catch(() => null) };
};

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
test.beforeEach(async () => {
  await db.clear();
  const admin = await Admin.create({ email: 'boss@example.com', password: 'secret123' });
  token = jwt.sign({ userId: admin._id.toString() }, process.env.JWT_SECRET);
});

// All 25 share a createdAt so the _id tie-break is what keeps paging stable.
const seed = async (count) => {
  const createdAt = new Date('2026-10-24T10:00:00Z');
  await Booking.insertMany(Array.from({ length: count }, (_v, i) => ({
    bookingId: `BK-${String(i).padStart(3, '0')}`,
    serviceKey: 'car-wash', serviceName: 'Car Wash', packageName: 'Standard', price: 500,
    date: 'October 24, 2026', timeSlot: '09:00 AM - 09:30 AM', customerName: `Customer ${i}`,
    createdAt
  })));
};

test('a request without a limit still returns every booking', async () => {
  await seed(25);
  const res = await get('/api/bookings');
  assert.equal(res.status, 200);
  assert.equal(res.body.bookings.length, 25);
  assert.equal(res.body.hasMore, false);
});

test('a limit returns one chunk plus the cursor for the next', async () => {
  await seed(25);

  const first = await get('/api/bookings?page=1&limit=10');
  assert.equal(first.body.bookings.length, 10);
  assert.equal(first.body.total, 25);
  assert.equal(first.body.page, 1);
  assert.equal(first.body.hasMore, true);

  const last = await get('/api/bookings?page=3&limit=10');
  assert.equal(last.body.bookings.length, 5);
  assert.equal(last.body.hasMore, false, 'the final page reports no more');
});

test('paging covers every booking exactly once', async () => {
  await seed(25);
  const seen = [];
  for (let page = 1; page <= 3; page += 1) {
    const res = await get(`/api/bookings?page=${page}&limit=10`);
    seen.push(...res.body.bookings.map((b) => b.bookingId));
  }
  assert.equal(seen.length, 25);
  assert.equal(new Set(seen).size, 25, 'no booking is repeated or skipped across pages');
});

test('an oversized limit is capped and a bad page falls back to the first', async () => {
  await seed(25);
  const capped = await get('/api/bookings?limit=99999');
  assert.equal(capped.body.limit, 500);

  const bad = await get('/api/bookings?page=-4&limit=10');
  assert.equal(bad.body.page, 1);
});

test('a page past the end is empty rather than an error', async () => {
  await seed(25);
  const res = await get('/api/bookings?page=9&limit=10');
  assert.equal(res.status, 200);
  assert.deepEqual(res.body.bookings, []);
  assert.equal(res.body.hasMore, false);
});
