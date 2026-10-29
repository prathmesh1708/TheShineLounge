process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const express = require('express');

const db = require('./helpers/testDb');
const Booking = require('../src/models/Booking');
const BookingReceipt = require('../src/models/BookingReceipt');

const app = express();
app.use(express.json({ limit: '25mb' }));
app.use('/api/bookings', require('../src/routes/bookingRoutes'));

let server;
let baseUrl;

const postJson = async (path, body) => {
  const res = await fetch(`${baseUrl}${path}`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body)
  });
  return { status: res.status, body: await res.json().catch(() => null) };
};

const getJson = async (path) => {
  const res = await fetch(`${baseUrl}${path}`);
  return { status: res.status, body: await res.json().catch(() => null) };
};

const getBinary = async (path) => {
  const res = await fetch(`${baseUrl}${path}`);
  return {
    status: res.status,
    contentType: res.headers.get('content-type'),
    base64: Buffer.from(await res.arrayBuffer()).toString('base64')
  };
};

// A stand-in for the ~350 KB base64 blobs the receipt generator produces.
const PDF_A = Buffer.from('%PDF-1.3 receipt A').toString('base64');
const PDF_B = Buffer.from('%PDF-1.3 receipt B').toString('base64');

const makeBooking = (extra = {}) => Booking.create({
  bookingId: 'OFS-TEST-1', serviceKey: 'car-wash', serviceName: 'Car Wash',
  packageName: 'Standard', price: 500, date: 'October 24, 2026',
  timeSlot: '09:00 AM - 09:30 AM', customerName: 'Test Customer', ...extra
});

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
test.beforeEach(db.clear);

test('a saved receipt PDF is stored outside the booking document', async () => {
  const booking = await makeBooking();

  const res = await postJson(`/api/bookings/receipt/${booking.bookingId}/pdf`, { pdfBase64: PDF_A });
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);

  // The blob must not be sitting on the booking, or listing bookings reads it again.
  const stored = await Booking.findById(booking._id).lean();
  assert.ok(!stored.receiptPdfBase64, 'booking carries no inline PDF');

  const receipt = await BookingReceipt.findOne({ booking: booking._id }).lean();
  assert.equal(receipt.pdfBase64, PDF_A);
  assert.equal(receipt.bookingId, 'OFS-TEST-1');
});

test('the PDF downloads from the new collection', async () => {
  const booking = await makeBooking();
  await postJson(`/api/bookings/receipt/${booking.bookingId}/pdf`, { pdfBase64: PDF_A });

  const res = await getBinary(`/api/bookings/receipt/${booking.bookingId}/pdf`);
  assert.equal(res.status, 200);
  assert.equal(res.contentType, 'application/pdf');
  assert.equal(res.base64, PDF_A);
});

test('a receipt saved before the split still downloads', async () => {
  // Written the old way, straight onto the booking, and never migrated.
  const booking = await makeBooking({ bookingId: 'OFS-LEGACY-1', receiptPdfBase64: PDF_B });

  const res = await getBinary('/api/bookings/receipt/OFS-LEGACY-1/pdf');
  assert.equal(res.status, 200);
  assert.equal(res.base64, PDF_B);

  const info = await getJson('/api/bookings/receipt/OFS-LEGACY-1');
  assert.equal(info.body.data.hasPdf, true);
});

test('re-saving a receipt never rewrites the existing booking', async () => {
  const booking = await makeBooking({ bookingId: 'OFS-LEGACY-2', receiptPdfBase64: PDF_A });
  const before = await Booking.findById(booking._id).lean();

  await postJson('/api/bookings/receipt/OFS-LEGACY-2/pdf', { pdfBase64: PDF_B });

  // The stored booking must come back byte for byte: nothing is moved or removed.
  const after = await Booking.findById(booking._id).lean();
  assert.deepEqual(after, before, 'the booking document is left exactly as it was');
  assert.equal(after.receiptPdfBase64, PDF_A, 'the original inline PDF is still there');

  const rows = await BookingReceipt.find({ booking: booking._id }).lean();
  assert.equal(rows.length, 1, 'one receipt row per booking');
  assert.equal(rows[0].pdfBase64, PDF_B);

  // The newer split-out copy is what the customer downloads.
  const res = await getBinary('/api/bookings/receipt/OFS-LEGACY-2/pdf');
  assert.equal(res.base64, PDF_B);
});

test('saving a receipt adds no fields to a booking that had none', async () => {
  const booking = await makeBooking({ bookingId: 'OFS-CLEAN-1' });
  const before = await Booking.findById(booking._id).lean();

  await postJson('/api/bookings/receipt/OFS-CLEAN-1/pdf', { pdfBase64: PDF_A });

  const after = await Booking.findById(booking._id).lean();
  assert.deepEqual(after, before, 'the booking document is untouched');
});

test('a booking with no receipt reports no PDF', async () => {
  await makeBooking({ bookingId: 'OFS-NONE-1' });
  const res = await getJson('/api/bookings/receipt/OFS-NONE-1/pdf');
  assert.equal(res.status, 404);
  const info = await getJson('/api/bookings/receipt/OFS-NONE-1');
  assert.equal(info.body.data.hasPdf, false);
});
