process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'test-password';
process.env.WHATSAPP_PROVIDER = 'bhashsms';
process.env.WHATSAPP_DRY_RUN = 'false';
process.env.BHASHSMS_BASE_URL = 'https://bhash.test/api';
process.env.BHASHSMS_USER = 'Shine_test';
process.env.BHASHSMS_PASS = 'sup3r-secret';
process.env.BHASHSMS_SENDER = 'BUZWAP';
process.env.BHASHSMS_MAX_NUMBERS_PER_CALL = '50';

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const express = require('express');
const jwt = require('jsonwebtoken');

const db = require('./helpers/testDb');
const Admin = require('../src/models/Admin');
const Staff = require('../src/models/Staff');
const Customer = require('../src/models/Customer');
const Invoice = require('../src/models/Invoice');
const OfflineSale = require('../src/models/OfflineSale');
const Booking = require('../src/models/Booking');
const WhatsAppCampaign = require('../src/models/WhatsAppCampaign');
const { invalidateContacts } = require('../src/whatsapp/contacts');
const { runWhatsAppSenderTick } = require('../src/whatsapp/sender');

// Stand-in for bhashsms.com: records every call, answers like the real API
// (plain text, HTTP 200 even for errors).
const realFetch = global.fetch;
let calls = [];
let reply = () => 'S.778899';
let panel = { hidden: [], status: {}, extra: [] };
global.fetch = async (url, opts) => {
  const u = String(url);
  // Stand-in for Cloudinary: "blocked" files answer like a PDF-restricted account.
  if (u.startsWith('https://res.cloudinary.com/demo/')) {
    return u.includes('blocked')
      ? new Response('', { status: 401, headers: { 'x-cld-error': 'deny or ACL failure' } })
      : new Response('', { status: 200, headers: { 'content-type': 'application/pdf' } });
  }
  if (!u.startsWith('https://bhash.test/')) return realFetch(url, opts);
  const parsed = new URL(u);
  // The web panel: login, then the "Manage WA Templates" table. By default it
  // lists every template registered in the hub as APPROVED, like the real
  // panel would once support has approved them.
  if (parsed.pathname === '/loginlanding.php') {
    return { ok: true, status: 200, headers: new Headers({ 'set-cookie': 'PHPSESSID=test-session; path=/' }), text: async () => "window.location = 'index.php'" };
  }
  if (parsed.pathname.endsWith('/vieweditdeletetemplates.php')) {
    const WhatsAppTemplate = require('../src/models/WhatsAppTemplate');
    const local = await WhatsAppTemplate.find({ createdBy: { $ne: 'bhashsms-sync' } }).lean();
    const rows = [
      ...local.filter((t) => !panel.hidden.includes(t.name)).map((t) => ({
        name: t.name, info: t.category, type: `text${t.headerType === 'none' ? '' : t.headerType}`, body: t.body, status: panel.status[t.name] || 'APPROVED'
      })),
      ...panel.extra
    ];
    const tr = (r) => `<tr><td>${r.name}</td><td>${r.info}</td><td>${r.type}</td><td>${r.body}</td>${'<td></td>'.repeat(9)}<td>${r.status} [ ] </td><td><a href='#'><img src='delete.png'></td></tr>`;
    const html = `<table><thead><th>Template Name</th></thead><tbody>${rows.map(tr).join('')}</tbody></table>`;
    return new Response(html, { status: 200, headers: { 'content-type': 'text/html' } });
  }
  calls.push({ script: parsed.pathname.split('/').pop(), q: Object.fromEntries(parsed.searchParams) });
  return new Response(reply(parsed), { status: 200, headers: { 'content-type': 'text/html' } });
};

const app = express();
app.use(express.json());
app.use('/api/whatsapp/invoice', require('../src/whatsapp/invoiceSend'));
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
  global.fetch = realFetch;
});

test.beforeEach(async () => {
  await db.clear();
  invalidateContacts();
  calls = [];
  reply = () => 'S.778899';
  panel = { hidden: [], status: {}, extra: [] };
});

const request = async (method, path, { body, token } = {}) => {
  const headers = { 'content-type': 'application/json' };
  if (token) headers.authorization = `Bearer ${token}`;
  const res = await realFetch(`${baseUrl}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: res.status, body: await res.json().catch(() => null) };
};

const adminToken = async () => {
  const admin = await Admin.create({ email: 'boss@example.com', password: 'secret123' });
  return jwt.sign({ userId: admin._id.toString() }, process.env.JWT_SECRET);
};

const staffToken = async () => {
  const staff = await Staff.create({ staffId: 'S1', fullName: 'Aarav', email: 'aarav@example.com', password: 'secret123', mobile: '9000012345' });
  return jwt.sign({ userId: staff._id.toString() }, process.env.JWT_SECRET);
};

const waitForCampaign = async (id) => {
  for (let i = 0; i < 60; i += 1) {
    const c = await WhatsAppCampaign.findById(id).lean();
    if (['done', 'failed', 'cancelled'].includes(c.status)) return c;
    await runWhatsAppSenderTick(new Date(), { campaignId: id });
    await new Promise((r) => setTimeout(r, 30));
  }
  return WhatsAppCampaign.findById(id).lean();
};

const sendCalls = () => calls.filter((c) => c.script === 'sendmsg.php' || c.script === 'sendmsgutil.php');

test('templates are registered with their exact BhashSMS name and a variable mapping', async () => {
  const token = await adminToken();
  const res = await request('POST', '/api/whatsapp/templates', {
    token,
    body: {
      name: 'Shine_Renewal01',
      displayName: 'Renewal reminder',
      category: 'UTILITY',
      body: 'Hi {{1}}, your pass for {{2}} expires soon.',
      variableMap: ['name', 'vehicle']
    }
  });
  assert.equal(res.status, 201, JSON.stringify(res.body));
  assert.equal(res.body.template.name, 'Shine_Renewal01');
  assert.equal(res.body.template.metaStatus, 'APPROVED');
  assert.equal(res.body.template.provider, 'bhashsms');
  assert.deepEqual(res.body.template.variableMap, ['name', 'vehicle']);

  const submit = await request('POST', `/api/whatsapp/templates/${res.body.template._id}/submit`, { token });
  assert.equal(submit.status, 400);
});

test('personalised templates go one call per person with Params in order and no 91', async () => {
  const token = await adminToken();
  await Customer.create({ customerId: 'C1', fullName: 'Rahul Sharma', mobile: '9876543210' });
  await Customer.create({ customerId: 'C2', fullName: 'Priya, Mehta', mobile: '9811111111' });
  const tpl = await request('POST', '/api/whatsapp/templates', {
    token, body: { name: 'offer_img', body: 'Hi {{1}}, enjoy 20% off this week!', variableMap: ['firstName'], headerType: 'image', headerMediaUrl: 'https://res.cloudinary.com/demo/image/upload/v1/offer.webp' }
  });
  const created = await request('POST', '/api/whatsapp/campaigns', {
    token, body: { mode: 'template', templateId: tpl.body.template._id, recipients: ['9876543210', '9811111111'] }
  });
  assert.equal(created.status, 201, JSON.stringify(created.body));
  const done = await waitForCampaign(created.body.campaign._id);
  assert.equal(done.status, 'done');

  const sends = sendCalls();
  assert.equal(sends.length, 2);
  const byPhone = Object.fromEntries(sends.map((c) => [c.q.phone, c.q]));
  assert.equal(byPhone['9876543210'].Params, 'Rahul');
  assert.equal(byPhone['9811111111'].Params, 'Priya'); // comma in the name cannot split Params
  for (const { q } of sends) {
    assert.equal(q.text, 'offer_img');
    assert.equal(q.priority, 'wa');
    assert.equal(q.stype, 'normal');
    assert.equal(q.sender, 'BUZWAP');
    assert.equal(q.htype, 'image');
    assert.equal(q.url, 'https://res.cloudinary.com/demo/image/upload/v1/offer.jpg'); // webp converted
  }
  assert.ok(done.recipients.every((r) => r.status === 'sent' && r.providerResponse === 'S.778899'));
});

test('identical templates go to many numbers in one comma-separated call', async () => {
  const token = await adminToken();
  const tpl = await request('POST', '/api/whatsapp/templates', { token, body: { name: 'diwali_greeting', body: 'Happy Diwali from The Shine Lounge!' } });
  const created = await request('POST', '/api/whatsapp/campaigns', {
    token, body: { mode: 'template', templateId: tpl.body.template._id, recipients: ['9876543210', '9811111111', '+91 98222 22222'] }
  });
  const done = await waitForCampaign(created.body.campaign._id);
  const sends = sendCalls();
  assert.equal(sends.length, 1);
  assert.equal(sends[0].q.phone, '9876543210,9811111111,9822222222');
  assert.equal(sends[0].q.Params, undefined);
  assert.equal(done.recipients.filter((r) => r.status === 'sent').length, 3);
});

test('a plain-text error reply fails the recipient without leaking the password', async () => {
  const token = await adminToken();
  reply = () => 'API Not Activated1';
  const tpl = await request('POST', '/api/whatsapp/templates', { token, body: { name: 'hello_tpl', body: 'Hi {{1}}, thanks for visiting!', variableMap: ['name'] } });
  const created = await request('POST', '/api/whatsapp/campaigns', {
    token, body: { mode: 'template', templateId: tpl.body.template._id, recipients: ['9876543210'] }
  });
  const done = await waitForCampaign(created.body.campaign._id);
  assert.equal(done.status, 'failed');
  assert.match(done.recipients[0].error, /API Not Activated/);
  assert.doesNotMatch(JSON.stringify(done), /sup3r-secret/);
});

test('free-form messages are text-only with htype=normal', async () => {
  const token = await adminToken();
  const withMedia = await request('POST', '/api/whatsapp/campaigns', {
    token, body: { mode: 'freeform', body: 'Hi', media: { type: 'image', url: 'https://x.test/a.jpg' }, recipients: ['9876543210'] }
  });
  assert.equal(withMedia.status, 400);

  const created = await request('POST', '/api/whatsapp/campaigns', {
    token, body: { mode: 'freeform', body: 'Your car is ready for pickup.', recipients: ['9876543210'] }
  });
  const done = await waitForCampaign(created.body.campaign._id);
  assert.equal(done.recipients[0].status, 'sent');
  assert.equal(sendCalls()[0].q.htype, 'normal');
  assert.equal(sendCalls()[0].q.text, 'Your car is ready for pickup.');
});

test('staff send an invoice PDF through the invoice template', async () => {
  const admin = await adminToken();
  const staff = await staffToken();

  const off = await request('GET', '/api/whatsapp/invoice/config', { token: staff });
  assert.equal(off.body.enabled, false);
  assert.match(off.body.reason, /No invoice template/);

  await request('POST', '/api/whatsapp/templates', {
    token: admin,
    body: {
      name: 'tsl_invoice',
      purpose: 'invoice',
      category: 'UTILITY',
      headerType: 'document',
      body: 'Hello {{1}}, your invoice {{2}} for Rs {{3}} is attached. Thank you!',
      variableMap: ['name', 'invoiceNo', 'invoiceAmount']
    }
  });
  await Invoice.create({ invoiceNo: 'TSL-1042', customerName: 'Rahul Sharma', phone: '98765 43210', total: 12499.5, items: [{ name: 'Ceramic Coat', price: 12499.5, qty: 1 }] });

  const on = await request('GET', '/api/whatsapp/invoice/config', { token: staff });
  assert.equal(on.body.enabled, true);

  const noPdf = await request('POST', '/api/whatsapp/invoice/TSL-1042/send', { token: staff, body: {} });
  assert.equal(noPdf.status, 400);

  const pdfUrl = 'https://res.cloudinary.com/demo/raw/upload/v1/shine-lounge/invoices/Invoice-TSL-1042-abc.pdf';
  const sent = await request('POST', '/api/whatsapp/invoice/TSL-1042/send', { token: staff, body: { pdfUrl } });
  assert.equal(sent.status, 200, JSON.stringify(sent.body));
  assert.equal(sent.body.status, 'sent');

  const q = sendCalls().pop().q;
  assert.equal(q.text, 'tsl_invoice');
  assert.equal(q.phone, '9876543210');
  assert.equal(q.Params, 'Rahul Sharma,TSL-1042,12499.50');
  assert.equal(q.htype, 'document');
  assert.equal(q.url, pdfUrl);

  const inv = await Invoice.findOne({ invoiceNo: 'TSL-1042' }).lean();
  assert.equal(inv.whatsappStatus, 'sent');
  assert.equal(inv.receiptPdfUrl, pdfUrl);
  const campaign = await WhatsAppCampaign.findOne({ source: 'invoice' }).lean();
  assert.equal(campaign.invoiceNo, 'TSL-1042');
});

test('a failed invoice send reports the BhashSMS reason to staff', async () => {
  const admin = await adminToken();
  const staff = await staffToken();
  reply = () => 'Insufficient Balance';
  await request('POST', '/api/whatsapp/templates', {
    token: admin, body: { name: 'tsl_invoice', purpose: 'invoice', body: 'Hello {{1}}, thank you for visiting!', variableMap: ['name'] }
  });
  await Invoice.create({ invoiceNo: 'TSL-7', customerName: 'Rahul', phone: '9876543210', total: 500 });
  const res = await request('POST', '/api/whatsapp/invoice/TSL-7/send', { token: staff, body: {} });
  assert.equal(res.status, 502);
  assert.match(res.body.message, /Insufficient Balance/);
});

test('status shows the BhashSMS account and balance', async () => {
  const token = await adminToken();
  reply = (u) => (u.pathname.endsWith('checkbalance.php') ? '10000' : 'S.1');
  const res = await request('GET', '/api/whatsapp/status', { token });
  assert.equal(res.body.status.provider, 'bhashsms');
  assert.equal(res.body.status.configured, true);
  assert.equal(res.body.status.bhashsms.balance, '10000');
  assert.equal(res.body.status.bhashsms.sender, 'BUZWAP');
  assert.doesNotMatch(JSON.stringify(res.body), /sup3r-secret/);
});

test('admin offline-sale receipts go out as a PDF document, found by sale or booking id', async () => {
  const admin = await adminToken();
  await request('POST', '/api/whatsapp/templates', {
    token: admin,
    body: {
      name: 'tsl_invoice', purpose: 'invoice', headerType: 'document',
      body: 'Hello {{1}}, your receipt {{2}} for Rs {{3}} ({{4}}) is attached.',
      variableMap: ['name', 'invoiceNo', 'invoiceAmount', 'services']
    }
  });
  await OfflineSale.collection.insertOne({
    saleId: 'OFS-TSH-10', customerName: 'amit ji', phone: '+91 98765-43210', price: 824.82,
    packageName: 'Single Wash, Foam', serviceName: 'Car Wash', paymentMode: 'UPI', vehicleNo: 'MP09UU9999', createdAt: new Date()
  });
  // Legacy row known only as a booking, shown on screen under a computed number.
  await Booking.collection.insertOne({ bookingId: 'OFS-MTX-77', customerName: 'Neha', phone: '9811111111', price: 500, packageName: 'Interior', createdAt: new Date() });

  const pdfUrl = 'https://res.cloudinary.com/demo/raw/upload/v1/shine-lounge/invoices/Invoice-OFS-TSH-10-x.pdf';
  const missingPdf = await request('POST', '/api/whatsapp/invoice/sale/OFS-TSH-10/send', { token: admin, body: {} });
  assert.equal(missingPdf.status, 400);

  const sent = await request('POST', '/api/whatsapp/invoice/sale/OFS-TSH-10/send', { token: admin, body: { pdfUrl } });
  assert.equal(sent.status, 200, JSON.stringify(sent.body));
  let q = sendCalls().pop().q;
  assert.equal(q.phone, '9876543210');
  assert.equal(q.htype, 'document');
  assert.equal(q.url, pdfUrl);
  assert.equal(q.Params, 'amit ji,OFS-TSH-10,824.82,Single Wash Foam');

  const legacy = await request('POST', '/api/whatsapp/invoice/sale/OFS-TSH-11/send', {
    token: admin, body: { pdfUrl, lookupIds: ['OFS-MTX-77'] }
  });
  assert.equal(legacy.status, 200, JSON.stringify(legacy.body));
  q = sendCalls().pop().q;
  assert.equal(q.phone, '9811111111');
  assert.equal(q.Params, 'Neha,OFS-TSH-11,500,Interior');

  const unknown = await request('POST', '/api/whatsapp/invoice/sale/OFS-NOPE/send', { token: admin, body: { pdfUrl } });
  assert.equal(unknown.status, 404);
});

test('an inactive BhashSMS account gives a plain explanation', async () => {
  const admin = await adminToken();
  reply = () => 'API Not Activated1';
  await request('POST', '/api/whatsapp/templates', {
    token: admin, body: { name: 'tsl_invoice', purpose: 'invoice', body: 'Hello {{1}}, thank you!', variableMap: ['name'] }
  });
  await Invoice.create({ invoiceNo: 'TSL-9', customerName: 'Rahul', phone: '9876543210', total: 100 });
  const res = await request('POST', '/api/whatsapp/invoice/TSL-9/send', { token: admin, body: {} });
  assert.equal(res.status, 502);
  assert.match(res.body.message, /not activated WhatsApp API access/);
});

test('a PDF Cloudinary refuses to serve is caught before WhatsApp, with the fix', async () => {
  const admin = await adminToken();
  await request('POST', '/api/whatsapp/templates', {
    token: admin, body: { name: 'tsl_invoice', purpose: 'invoice', headerType: 'document', body: 'Hello {{1}}, your invoice is attached.', variableMap: ['name'] }
  });
  await Invoice.create({ invoiceNo: 'TSL-11', customerName: 'Rahul', phone: '9876543210', total: 100 });
  const res = await request('POST', '/api/whatsapp/invoice/TSL-11/send', {
    token: admin, body: { pdfUrl: 'https://res.cloudinary.com/demo/raw/upload/v1/blocked/Invoice-TSL-11.pdf' }
  });
  assert.equal(res.status, 424);
  assert.match(res.body.message, /Allow delivery of PDF and ZIP files/);
  assert.equal(sendCalls().length, 0);
});

test('Utility templates use sendmsgutil.php, Marketing and plain text use sendmsg.php', async () => {
  const token = await adminToken();
  const util = await request('POST', '/api/whatsapp/templates', { token, body: { name: 'shi_bww12', category: 'UTILITY', body: 'Your car is ready.' } });
  const mkt = await request('POST', '/api/whatsapp/templates', { token, body: { name: 'offer_mkt', category: 'MARKETING', body: 'Big offer this week!' } });
  for (const t of [util, mkt]) {
    const c = await request('POST', '/api/whatsapp/campaigns', { token, body: { mode: 'template', templateId: t.body.template._id, recipients: ['9876543210'] } });
    await waitForCampaign(c.body.campaign._id);
  }
  const c = await request('POST', '/api/whatsapp/campaigns', { token, body: { mode: 'freeform', body: 'Hello', recipients: ['9876543210'] } });
  await waitForCampaign(c.body.campaign._id);
  assert.deepEqual(sendCalls().map((x) => [x.script, x.q.text]), [
    ['sendmsgutil.php', 'shi_bww12'],
    ['sendmsg.php', 'offer_mkt'],
    ['sendmsg.php', 'Hello']
  ]);
});

test('templates sync from the BhashSMS panel with their real status', async () => {
  const token = await adminToken();
  panel.extra = [
    { name: 'diwali_16', info: 'MARKETING', type: 'textimage', body: 'Hi everyone,<br>This is a sample message', status: 'APPROVED' },
    { name: 'invoice_pdf', info: '{"id":"165","status":"PENDING","category":"UTILITY"}', type: 'textdocument', body: 'Hello {{1}}, your invoice {{2}} for Rs {{3}} is attached.', status: 'Pending' },
    { name: 'bad,name', info: '{"message":"Invalid parameter","error_user_msg":"The message template name can only have lower-case letters and underscores."}', type: 'text', body: 'x', status: 'Pending' }
  ];
  // Registered in the hub but never created on the panel (the "Hallowen" case).
  panel.hidden = ['Hallowen'];
  await request('POST', '/api/whatsapp/templates', { token, body: { name: 'Hallowen', category: 'MARKETING', body: 'hello test' } });

  const res = await request('GET', '/api/whatsapp/templates?refresh=1', { token });
  assert.equal(res.status, 200, JSON.stringify(res.body));
  const by = Object.fromEntries(res.body.templates.map((t) => [t.name, t]));

  assert.equal(by.diwali_16.metaStatus, 'APPROVED');
  assert.equal(by.diwali_16.category, 'MARKETING');
  assert.equal(by.diwali_16.headerType, 'image');
  assert.equal(by.invoice_pdf.metaStatus, 'PENDING');
  assert.equal(by.invoice_pdf.headerType, 'document');
  assert.equal(by.invoice_pdf.purpose, 'invoice'); // first PDF invoice template is picked for receipts
  assert.deepEqual(by.invoice_pdf.variableMap, ['name', 'invoiceNo', 'invoiceAmount']);
  assert.equal(by['bad,name'].metaStatus, 'REJECTED');
  assert.match(by['bad,name'].rejectedReason, /lower-case letters/);
  assert.equal(by.Hallowen.metaStatus, 'DISABLED');
  assert.match(by.Hallowen.rejectedReason, /Not on the BhashSMS panel/);

  // Only approved templates can be sent.
  const blocked = await request('POST', '/api/whatsapp/campaigns', { token, body: { mode: 'template', templateId: by.Hallowen._id, recipients: ['9876543210'] } });
  assert.equal(blocked.status, 400);
  const ok = await request('POST', '/api/whatsapp/campaigns', { token, body: { mode: 'template', templateId: by.diwali_16._id, media: { type: 'image', url: 'https://res.cloudinary.com/demo/image/upload/v1/poster.jpg' }, recipients: ['9876543210'] } });
  assert.equal(ok.status, 201, JSON.stringify(ok.body));
});

test('a template pending on the panel shows as pending when registered, then approves on sync', async () => {
  const token = await adminToken();
  panel.status = { new_offer: 'Pending' };
  const created = await request('POST', '/api/whatsapp/templates', { token, body: { name: 'new_offer', category: 'MARKETING', body: 'Offer for {{1}}', variableMap: ['firstName'] } });
  assert.equal(created.body.template.metaStatus, 'PENDING');

  panel.status = {};
  const synced = await request('POST', '/api/whatsapp/templates/sync', { token });
  assert.equal(synced.status, 200, JSON.stringify(synced.body));
  const list = await request('GET', '/api/whatsapp/templates', { token });
  assert.equal(list.body.templates.find((t) => t.name === 'new_offer').metaStatus, 'APPROVED');
  assert.deepEqual(list.body.templates.find((t) => t.name === 'new_offer').variableMap, ['firstName']);
});
