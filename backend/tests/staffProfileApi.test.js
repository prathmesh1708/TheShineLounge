process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'test-password';

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const express = require('express');
const jwt = require('jsonwebtoken');

const pushHelper = require('../src/common/services/pushNotificationHelper');
pushHelper.sendNotificationToUser = async () => {};

const db = require('./helpers/testDb');
const Staff = require('../src/models/Staff');
const Admin = require('../src/models/Admin');

// The staff profile page shows what the department hub saved. These pin the
// two payloads it reads: /api/auth/me on load, and the break poll that keeps
// it current after an admin edit.
const app = express();
app.use(express.json());
app.use('/api/auth', require('../src/routes/authRoutes'));
app.use('/api/staff', require('../src/routes/staffRoutes'));

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
  const res = await fetch(`${baseUrl}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: res.status, body: await res.json().catch(() => null) };
};

const tokenFor = (account) => jwt.sign({ userId: account._id.toString() }, process.env.JWT_SECRET);

const makeStaff = () => Staff.create({
  staffId: 'STF-417',
  fullName: 'Aarav Patil',
  email: 'aarav@example.com',
  password: 'secret123',
  mobile: '+91 90000 12345',
  department: 'Car Wash',
  serviceKey: 'car-wash',
  staffRole: 'Car Wash Specialist',
  photo: 'https://example.com/aarav.jpg',
  monthlySalary: 30000
});

test('/api/auth/me returns the staff record the profile page shows, without salary', async () => {
  const staff = await makeStaff();
  const res = await request('GET', '/api/auth/me', { token: tokenFor(staff) });

  assert.equal(res.status, 200);
  const u = res.body.user;
  assert.equal(u.fullName, 'Aarav Patil');
  assert.equal(u.mobile, '+91 90000 12345');
  assert.equal(u.staffId, 'STF-417');
  assert.equal(u.staffRole, 'Car Wash Specialist');
  assert.equal(u.serviceKey, 'car-wash');
  assert.equal(u.department, 'Car Wash');
  assert.equal(u.photo, 'https://example.com/aarav.jpg');
  assert.equal(u.monthlySalary, undefined);
  assert.equal(u.salary, undefined);
});

test('an admin edit to the mobile number reaches the staff break poll', async () => {
  const staff = await makeStaff();
  const admin = await Admin.create({ email: 'boss@example.com', password: 'secret123' });

  const saved = await request('PUT', `/api/staff/${staff._id}`, {
    token: tokenFor(admin),
    body: { mobile: '+91 98888 77777' }
  });
  assert.equal(saved.status, 200);

  const poll = await request('GET', '/api/staff/me/break', { token: tokenFor(staff) });
  assert.equal(poll.body.staff.mobile, '+91 98888 77777');
  assert.equal(poll.body.staff.staffId, 'STF-417');
  assert.equal(poll.body.staff.monthlySalary, undefined);
});
