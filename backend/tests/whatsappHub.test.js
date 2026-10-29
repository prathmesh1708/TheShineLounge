process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'test-password';
// Run the whole pipeline without calling Meta: fake message ids, instant approval.
process.env.WHATSAPP_DRY_RUN = 'true';
// These cover the Meta Cloud API path; BhashSMS has its own file.
process.env.WHATSAPP_PROVIDER = 'meta';

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const express = require('express');
const jwt = require('jsonwebtoken');

const db = require('./helpers/testDb');
const Admin = require('../src/models/Admin');
const Staff = require('../src/models/Staff');
const Customer = require('../src/models/Customer');
const Booking = require('../src/models/Booking');
const WhatsAppCampaign = require('../src/models/WhatsAppCampaign');
const WhatsAppContactPref = require('../src/models/WhatsAppContactPref');
const { normalizePhone } = require('../src/whatsapp/phone');
const { buildContacts, invalidateContacts } = require('../src/whatsapp/contacts');
const { runWhatsAppSenderTick } = require('../src/whatsapp/sender');
const { applyStatus, applyInbound } = require('../src/whatsapp/webhook');

const app = express();
app.use(express.json());
app.use('/api/whatsapp', require('../src/whatsapp/routes'));
app.use((err, _req, res, _next) => res.status(500).json({ success: false, message: err.message }));

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

test.beforeEach(async () => {
  await db.clear();
  invalidateContacts();
});

const request = async (method, path, { body, token } = {}) => {
  const headers = { 'content-type': 'application/json' };
  if (token) headers.authorization = `Bearer ${token}`;
  const res = await fetch(`${baseUrl}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: res.status, body: await res.json().catch(() => null) };
};

const adminToken = async () => {
  const admin = await Admin.create({ email: 'boss@example.com', password: 'secret123' });
  return jwt.sign({ userId: admin._id.toString() }, process.env.JWT_SECRET);
};

const waitForCampaign = async (id) => {
  for (let i = 0; i < 50; i += 1) {
    const c = await WhatsAppCampaign.findById(id).lean();
    if (['done', 'failed', 'cancelled'].includes(c.status)) return c;
    await new Promise((r) => setTimeout(r, 50));
  }
  return WhatsAppCampaign.findById(id).lean();
};

test('normalizePhone accepts every common Indian format and rejects junk', () => {
  assert.equal(normalizePhone('98765 43210'), '919876543210');
  assert.equal(normalizePhone('+91-98765-43210'), '919876543210');
  assert.equal(normalizePhone('098765 43210'), '919876543210');
  assert.equal(normalizePhone('919876543210'), '919876543210');
  assert.equal(normalizePhone('0091 98765 43210'), '919876543210');
  assert.equal(normalizePhone('+1 415 555 0100'), '14155550100');
  assert.equal(normalizePhone('12345'), '');
  assert.equal(normalizePhone('0221234567'), '');
  assert.equal(normalizePhone('+91 00000 00000'), '');
  assert.equal(normalizePhone(''), '');
});

test('contacts merge customers, bookings and staff on the normalized number', async () => {
  await Customer.create({ customerId: 'C1', fullName: 'Rahul Sharma', mobile: '98765 43210' });
  await Booking.collection.insertOne({
    customerName: 'Rahul', phone: '+91 98765-43210', serviceKey: 'car-wash',
    packageName: 'Premium Foam Wash', vehicleNo: 'mh12ab1234', createdAt: new Date()
  });
  await Staff.create({
    staffId: 'S1', fullName: 'Aarav Patil', email: 'aarav@example.com', password: 'secret123',
    mobile: '9000012345', department: 'Car Wash'
  });

  const contacts = await buildContacts();
  assert.equal(contacts.length, 2);

  const rahul = contacts.find((c) => c.phone === '919876543210');
  assert.equal(rahul.name, 'Rahul Sharma'); // CRM name beats the booking's
  assert.equal(rahul.kind, 'customer');
  assert.deepEqual(rahul.sources.sort(), ['booking', 'crm']);
  assert.equal(rahul.vars.vehicle, 'MH12AB1234');
  assert.equal(rahul.vars.lastService, 'Premium Foam Wash');

  const aarav = contacts.find((c) => c.phone === '919000012345');
  assert.equal(aarav.kind, 'staff');
  assert.equal(aarav.vars.department, 'Car Wash');
});

// Booking.date is stored as "October 24, 2026", so the reminder variables can
// only work if that text is parsed rather than compared as a string.
test('booking variables use the soonest booking that is still ahead', async () => {
  const day = (offsetDays) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };
  let seq = 0;
  const booking = (extra) => ({
    bookingId: `BK-TEST-${seq += 1}`,
    customerName: 'Meera', phone: '9876500011', serviceKey: 'salon', createdAt: new Date(), ...extra
  });

  await Booking.collection.insertMany([
    booking({ date: day(-3), timeSlot: '09:00 AM - 09:30 AM', serviceName: 'Old Haircut', status: 'Completed' }),
    booking({ date: day(5), timeSlot: '04:00 PM - 05:00 PM', serviceName: 'Later Facial', status: 'Confirmed' }),
    booking({ date: day(1), timeSlot: '11:00 AM - 11:30 AM', serviceName: 'Beard Trim', status: 'Confirmed' }),
    booking({ date: day(2), timeSlot: '10:00 AM - 10:30 AM', serviceName: 'Cancelled One', status: 'Cancelled' })
  ]);

  const meera = (await buildContacts()).find((c) => c.phone === '919876500011');
  assert.equal(meera.vars.bookingTime, '11:00 AM - 11:30 AM'); // soonest upcoming, not the past or later one
  assert.equal(meera.vars.bookingService, 'Beard Trim');
  assert.ok(meera.vars.bookingDate, 'booking date is filled in');
});

test('a contact with only past bookings has no booking variables', async () => {
  await Booking.collection.insertOne({
    bookingId: 'BK-TEST-OLD', customerName: 'Old', phone: '9876500022', serviceKey: 'salon', createdAt: new Date(),
    date: 'October 24, 2020', timeSlot: '09:00 AM - 09:30 AM', serviceName: 'Ancient', status: 'Completed'
  });
  const old = (await buildContacts()).find((c) => c.phone === '919876500022');
  assert.equal(old.booking, null);
  assert.equal(old.vars.bookingTime, '');
});

test('a template campaign sends each recipient once and skips opted-out numbers', async () => {
  const token = await adminToken();
  await Customer.create({ customerId: 'C1', fullName: 'Rahul Sharma', mobile: '9876543210' });
  await WhatsAppContactPref.create({ phone: '919811111111', optedOut: true });

  const tpl = await request('POST', '/api/whatsapp/templates', {
    token,
    body: { displayName: 'Pass Reminder', body: 'Hi {{name}}, your pass for {{vehicle}} is expiring soon.', category: 'UTILITY' }
  });
  assert.equal(tpl.status, 201, JSON.stringify(tpl.body));
  assert.equal(tpl.body.template.name, 'pass_reminder');
  assert.deepEqual(tpl.body.template.variableMap, ['name', 'vehicle']);

  const submitted = await request('POST', `/api/whatsapp/templates/${tpl.body.template._id}/submit`, { token });
  assert.equal(submitted.body.template.metaStatus, 'APPROVED');

  const created = await request('POST', '/api/whatsapp/campaigns', {
    token,
    body: {
      mode: 'template',
      templateId: tpl.body.template._id,
      recipients: ['9876543210', '+91 98765 43210', '9811111111', { phone: '9822222222', name: 'Walk-in Priya' }]
    }
  });
  assert.equal(created.status, 201, JSON.stringify(created.body));
  assert.equal(created.body.campaign.total, 3); // duplicate number collapsed

  // The tick normally runs in the background; run one explicitly too — the
  // lock and per-recipient claims must stop anything being sent twice.
  await runWhatsAppSenderTick(new Date());
  const done = await waitForCampaign(created.body.campaign._id);
  assert.equal(done.status, 'done');

  const byPhone = Object.fromEntries(done.recipients.map((r) => [r.phone, r]));
  assert.equal(byPhone['919876543210'].status, 'sent');
  assert.match(byPhone['919876543210'].waMessageId, /^wamid\.DRYRUN\./);
  assert.equal(byPhone['919876543210'].vars.name, 'Rahul Sharma');
  assert.equal(byPhone['919811111111'].status, 'skipped');
  assert.equal(byPhone['919822222222'].status, 'sent');
  assert.equal(byPhone['919822222222'].name, 'Walk-in Priya');
});

test('free-form messages only go to people who wrote in within 24 hours', async () => {
  const token = await adminToken();
  await applyInbound({ from: '919876543210', timestamp: String(Math.floor(Date.now() / 1000)), type: 'text', text: { body: 'Hi' } }, []);
  await WhatsAppContactPref.create({ phone: '919811111111', lastInboundAt: new Date(Date.now() - 2 * 24 * 3600 * 1000) });

  const created = await request('POST', '/api/whatsapp/campaigns', {
    token,
    body: {
      mode: 'freeform',
      body: 'Here is your voice note',
      media: { type: 'audio', url: 'https://res.cloudinary.com/demo/video/upload/v1/note.webm' },
      recipients: ['9876543210', '9811111111']
    }
  });
  assert.equal(created.status, 201, JSON.stringify(created.body));
  const done = await waitForCampaign(created.body.campaign._id);
  const byPhone = Object.fromEntries(done.recipients.map((r) => [r.phone, r]));
  assert.equal(byPhone['919876543210'].status, 'sent');
  assert.equal(byPhone['919811111111'].status, 'skipped');
  assert.match(byPhone['919811111111'].error, /24-hour/);
});

test('webhook statuses only move forward and STOP opts the number out', async () => {
  const campaign = await WhatsAppCampaign.create({
    mode: 'freeform', body: 'x', status: 'done',
    recipients: [{ phone: '919876543210', status: 'sent', waMessageId: 'wamid.A' }]
  });
  await applyStatus({ id: 'wamid.A', status: 'read', timestamp: '1700000000' });
  await applyStatus({ id: 'wamid.A', status: 'delivered', timestamp: '1699999999' }); // late, out of order
  const after = await WhatsAppCampaign.findById(campaign._id).lean();
  assert.equal(after.recipients[0].status, 'read');

  await applyInbound({ from: '919876543210', type: 'text', text: { body: 'STOP' } }, [{ wa_id: '919876543210', profile: { name: 'Rahul' } }]);
  const pref = await WhatsAppContactPref.findOne({ phone: '919876543210' }).lean();
  assert.equal(pref.optedOut, true);
  assert.equal(pref.profileName, 'Rahul');
});

test('templates that start with a variable are refused before reaching Meta', async () => {
  const token = await adminToken();
  const res = await request('POST', '/api/whatsapp/templates', {
    token,
    body: { displayName: 'Bad', body: '{{name}} your car is ready' }
  });
  assert.equal(res.status, 400);
  assert.match(res.body.message, /start or end with a variable/);
});

test('non-admin accounts cannot use the hub', async () => {
  const staff = await Staff.create({
    staffId: 'S1', fullName: 'Aarav', email: 'aarav@example.com', password: 'secret123', mobile: '9000012345'
  });
  const token = jwt.sign({ userId: staff._id.toString() }, process.env.JWT_SECRET);
  const res = await request('GET', '/api/whatsapp/contacts', { token });
  assert.equal(res.status, 403);
});
