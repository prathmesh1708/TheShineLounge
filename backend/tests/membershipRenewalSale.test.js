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
const MembershipPass = require('../src/models/MembershipPass');

// A sale's date and customer are history. Updating a membership (renewing it in
// particular) once moved old sales into the current month's revenue, and matched
// on phone alongside the id, which rewrote another customer's sale when two
// customers shared a placeholder number.
const app = express();
app.use(express.json());
app.use('/api/memberships', require('../src/routes/membershipRoutes'));

let server;
let baseUrl;
let token;

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
  const staff = await User.create({
    fullName: 'Counter Staff',
    email: 'staff@example.com',
    password: 'not-a-real-hash',
    mobile: '9000000000',
    role: 'staff'
  });
  token = jwt.sign({ userId: staff._id.toString() }, process.env.JWT_SECRET);
});

const putMembership = async (id, body) => {
  const res = await fetch(`${baseUrl}/api/memberships/${id}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify(body)
  });
  assert.equal(res.status, 200, await res.clone().text());
  return res.json();
};

const makeSale = (over = {}) => Booking.create({
  bookingId: 'OFS-TSH-1',
  serviceKey: 'car-wash',
  serviceName: 'Car Wash',
  packageName: 'Monthly Membership',
  membershipName: 'Monthly Membership',
  saleType: 'membership',
  isOfflineSale: true,
  price: 2500,
  paymentMode: 'Cash',
  date: 'September 20, 2026',
  saleDate: '2026-09-20',
  timeSlot: '12:00 PM - 12:30 PM',
  membershipExpiry: 'October 20, 2026',
  customerName: 'HARSH',
  phone: '+91 8800849239',
  vehicleNo: 'HR 26 FD 1009',
  ...over
});

const renewalBody = (over = {}) => ({
  isRenewal: true,
  startDate: '2026-11-04',
  expiryDate: '2026-12-04',
  status: 'Active',
  paymentMode: 'UPI',
  washesUsed: 0,
  customerName: 'HARSH',
  phone: '+91 8800849239',
  vehicleNo: 'HR 26 FD 1009',
  ...over
});

test('renewing leaves the original sale exactly as it was', async () => {
  await makeSale();
  await putMembership('OFS-TSH-1', renewalBody());

  const sale = await Booking.findOne({ bookingId: 'OFS-TSH-1' }).lean();
  assert.equal(sale.saleDate, '2026-09-20');
  assert.equal(sale.date, 'September 20, 2026');
  assert.equal(sale.membershipExpiry, 'October 20, 2026');
  assert.equal(sale.paymentMode, 'Cash');
  assert.equal(sale.membershipStartDate, '');
});

test('renewing still moves the membership pass to the new period and payment mode', async () => {
  await makeSale();
  await putMembership('OFS-TSH-1', renewalBody());

  const pass = await MembershipPass.findOne({ passId: 'MEM-OFS-TSH-1' }).lean();
  assert.equal(pass.startDate.toISOString().slice(0, 10), '2026-11-04');
  assert.equal(pass.expiryDate.toISOString().slice(0, 10), '2026-12-04');
  assert.equal(pass.paymentMode, 'UPI');
});

test('renewing does not touch another customer who shares the phone number', async () => {
  const phone = '+91 9999999999';
  await makeSale({ bookingId: 'OFS-TSH-12', customerName: 'VINOD BOKEN', vehicleNo: 'HR 98 FS 6600', phone });
  await makeSale({ bookingId: 'OFS-TSH-3', customerName: 'ADITYA', vehicleNo: 'HR 98 U 4919', phone });

  await putMembership('OFS-TSH-3', renewalBody({ customerName: 'ADITYA', vehicleNo: 'HR 98 U 4919', phone }));

  const other = await Booking.findOne({ bookingId: 'OFS-TSH-12' }).lean();
  assert.equal(other.customerName, 'VINOD BOKEN');
  assert.equal(other.vehicleNo, 'HR 98 FS 6600');
  assert.equal(other.saleDate, '2026-09-20');
});

test('editing a membership updates its own sale, not one sharing the phone number', async () => {
  const phone = '+91 9999999999';
  await makeSale({ bookingId: 'OFS-TSH-12', customerName: 'VINOD BOKEN', vehicleNo: 'HR 98 FS 6600', phone });
  await makeSale({ bookingId: 'OFS-TSH-3', customerName: 'ADITYA', vehicleNo: 'HR 98 U 4919', phone });

  await putMembership('OFS-TSH-3', { customerName: 'ADITYA K', phone });

  const own = await Booking.findOne({ bookingId: 'OFS-TSH-3' }).lean();
  const other = await Booking.findOne({ bookingId: 'OFS-TSH-12' }).lean();
  assert.equal(own.customerName, 'ADITYA K');
  assert.equal(other.customerName, 'VINOD BOKEN');
});

test('editing the start date changes when the pass starts, not when it was sold', async () => {
  await makeSale();
  await putMembership('OFS-TSH-1', { startDate: '2026-09-25', expiryDate: '2026-10-25' });

  const sale = await Booking.findOne({ bookingId: 'OFS-TSH-1' }).lean();
  assert.equal(sale.membershipStartDate, '2026-09-25');
  assert.equal(sale.saleDate, '2026-09-20');
  assert.equal(sale.date, 'September 20, 2026');
});

test('a pass with no sale under its id still falls back to its vehicle', async () => {
  await makeSale({ bookingId: 'OFS-TSH-7' });
  await putMembership('UNKNOWN-ID', { customerName: 'HARSH S', vehicleNo: 'HR 26 FD 1009' });

  const sale = await Booking.findOne({ bookingId: 'OFS-TSH-7' }).lean();
  assert.equal(sale.customerName, 'HARSH S');
});
