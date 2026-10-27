process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'test-password';
process.env.PINELABS_DRY_RUN = 'false';
process.env.PINELABS_BASE_URL = 'https://plutus.test/API/CloudBasedIntegration/V1';
process.env.PINELABS_MERCHANT_ID = 'M123';
process.env.PINELABS_STORE_ID = 'S456';
process.env.PINELABS_CLIENT_ID = 'C789';
process.env.PINELABS_SECURITY_TOKEN = 'tok-secret';
process.env.PINELABS_TERMINALS = '{"car-wash":"111111111111111","salon":"222222222222222"}';
process.env.PINELABS_POLL_TIMEOUT_MS = '150000';

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const express = require('express');
const jwt = require('jsonwebtoken');

const db = require('./helpers/testDb');
const Staff = require('../src/models/Staff');
const Invoice = require('../src/models/Invoice');
const OfflineSale = require('../src/models/OfflineSale');
const PineLabsTransaction = require('../src/models/PineLabsTransaction');

// Stand-in for the Plutus cloud: records what we send and answers with the
// shapes the real API uses — the Tag/Value list included, since parsing that
// wrongly is how card details end up blank on a receipt.
const realFetch = global.fetch;
let calls = [];
let uploadReply = () => ({ ResponseCode: 0, ResponseMessage: 'APPROVED', PlutusTransactionReferenceID: 9001 });
let statusReply = () => ({ ResponseCode: 1001, ResponseMessage: 'Transaction is in progress' });

global.fetch = async (url, opts) => {
  const u = String(url);
  if (!u.startsWith('https://plutus.test/')) return realFetch(url, opts);
  const body = JSON.parse(opts.body);
  calls.push({ url: u, body });
  const endpoint = u.split('/').pop();
  const reply =
    endpoint === 'UploadBilledTransaction' ? uploadReply(body)
      : endpoint === 'GetCloudBasedTxnStatus' ? statusReply(body)
        : { ResponseCode: 0, ResponseMessage: 'CANCELLED' };
  return new Response(JSON.stringify(reply), { status: 200, headers: { 'content-type': 'application/json' } });
};

const approvedReply = () => ({
  ResponseCode: 0,
  ResponseMessage: 'APPROVED',
  TransactionData: [
    { Tag: 'Card Type', Value: 'VISA CREDIT' },
    { Tag: 'Card Number', Value: '4111 XXXX XXXX 4242' },
    { Tag: 'Approval Code', Value: '123456' },
    { Tag: 'Retrieval Reference Number', Value: '987654321012' },
    { Tag: 'Acquirer Name', Value: 'HDFC BANK' }
  ]
});

const app = express();
app.use(express.json());
app.use('/api/payments/pinelabs', require('../src/payments/pinelabs').routes);
app.use('/api/invoices', require('../src/routes/invoiceRoutes'));
app.use('/api/offline-sales', require('../src/routes/offlineSaleRoutes'));
app.use((err, _req, res, _next) => res.status(500).json({ success: false, message: err.message }));

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
  global.fetch = realFetch;
});

test.beforeEach(async () => {
  await db.clear();
  calls = [];
  uploadReply = () => ({ ResponseCode: 0, ResponseMessage: 'APPROVED', PlutusTransactionReferenceID: 9001 });
  statusReply = () => ({ ResponseCode: 1001, ResponseMessage: 'Transaction is in progress' });
  const staff = await Staff.create({
    staffId: 'S1', fullName: 'Aarav', email: 'aarav@example.com', password: 'secret123', mobile: '9000012345'
  });
  token = jwt.sign({ userId: staff._id.toString() }, process.env.JWT_SECRET);
});

const request = async (method, path, body) => {
  const res = await realFetch(`${baseUrl}${path}`, {
    method,
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  return { status: res.status, body: await res.json().catch(() => null) };
};

const initiate = (over = {}) =>
  request('POST', '/api/payments/pinelabs/initiate', {
    amount: 500, source: 'invoice', departmentKey: 'car-wash', customerName: 'Riya', ...over
  });

const payFor = async (amount, source = 'invoice', departmentKey = 'car-wash') => {
  const started = await initiate({ amount, source, departmentKey });
  statusReply = approvedReply;
  const done = await request('GET', `/api/payments/pinelabs/${started.body.payment.txnRef}`);
  return done.body.payment;
};

const invoiceBody = (over = {}) => ({
  customerName: 'Riya',
  items: [{ name: 'Foam Wash', price: 500, qty: 1 }],
  subtotal: 500,
  total: 500,
  departmentKey: 'car-wash',
  ...over
});

const saleBody = (over = {}) => ({
  customerName: 'Riya', packageName: 'Single Wash', price: 500, serviceKey: 'car-wash', ...over
});

test('the bill goes to the department\'s own terminal, in paise', async () => {
  const res = await initiate({ amount: 1234.5, departmentKey: 'salon' });
  assert.equal(res.status, 201);
  assert.equal(res.body.payment.status, 'pending');

  const upload = calls.find((c) => c.url.endsWith('UploadBilledTransaction'));
  assert.equal(upload.body.ImeiNumber, '222222222222222');
  assert.equal(upload.body.Amount, '123450');
  assert.equal(upload.body.MerchantID, 'M123');
  assert.equal(upload.body.BillingRefNo, res.body.payment.txnRef);
});

test('a department with no terminal is refused rather than billed elsewhere', async () => {
  const res = await initiate({ departmentKey: 'cafe' });
  assert.equal(res.status, 400);
  assert.match(res.body.message, /no pine labs terminal/i);
  assert.equal(calls.length, 0, 'nothing may be pushed to a machine');
});

test('a pending card keeps the attempt open, an approval closes it with the card details', async () => {
  const started = await initiate({ amount: 500 });
  const ref = started.body.payment.txnRef;

  const pending = await request('GET', `/api/payments/pinelabs/${ref}`);
  assert.equal(pending.body.payment.status, 'pending');

  statusReply = approvedReply;
  const done = await request('GET', `/api/payments/pinelabs/${ref}`);
  assert.equal(done.body.payment.status, 'success');
  assert.equal(done.body.payment.cardType, 'VISA CREDIT');
  assert.equal(done.body.payment.cardLast4, '4242');
  assert.equal(done.body.payment.approvalCode, '123456');
  assert.equal(done.body.payment.rrn, '987654321012');

  // Settled attempts are answered from our own row, not from Pine Labs again.
  const before = calls.length;
  await request('GET', `/api/payments/pinelabs/${ref}`);
  assert.equal(calls.length, before);
});

test('a declined card is recorded as an attempt and bills nothing', async () => {
  const started = await initiate();
  statusReply = () => ({ ResponseCode: 4, ResponseMessage: 'DECLINED BY ISSUER' });
  const done = await request('GET', `/api/payments/pinelabs/${started.body.payment.txnRef}`);

  assert.equal(done.body.payment.status, 'failed');
  assert.match(done.body.payment.failureReason, /DECLINED/);

  const row = await PineLabsTransaction.findOne({ txnRef: started.body.payment.txnRef }).lean();
  assert.equal(row.status, 'failed');
  assert.equal(row.sourceId, '', 'a declined card may never be attached to a sale');
});

test('a Pine Labs push that fails still leaves the attempt on record', async () => {
  uploadReply = () => ({ ResponseCode: 7, ResponseMessage: 'INVALID IMEI' });
  const res = await initiate();

  assert.equal(res.status, 502);
  assert.match(res.body.message, /terminal/i);
  const rows = await PineLabsTransaction.find().lean();
  assert.equal(rows.length, 1);
  assert.equal(rows[0].status, 'failed');
});

test('a network blip while polling is not read as a decline', async () => {
  const started = await initiate();
  statusReply = () => { throw new Error('socket hang up'); };
  const res = await request('GET', `/api/payments/pinelabs/${started.body.payment.txnRef}`);
  assert.equal(res.body.payment.status, 'pending');
});

test('cancelling takes the bill off the terminal', async () => {
  const started = await initiate();
  const res = await request('POST', `/api/payments/pinelabs/${started.body.payment.txnRef}/cancel`);
  assert.equal(res.body.payment.status, 'cancelled');
  assert.ok(calls.some((c) => c.url.endsWith('CancelTransaction')));
});

test('an invoice can only be billed to an approved payment, for its own amount', async () => {
  const paid = await payFor(500);

  const noRef = await request('POST', '/api/invoices', invoiceBody({ paymentMethod: 'Pine Labs' }));
  assert.equal(noRef.status, 400);

  const wrongAmount = await request('POST', '/api/invoices', invoiceBody({
    paymentMethod: 'Pine Labs', pineLabsTxnRef: paid.txnRef, total: 5000
  }));
  assert.equal(wrongAmount.status, 400);
  assert.match(wrongAmount.body.message, /charged/i);

  assert.equal(await Invoice.countDocuments(), 0, 'no invoice number may be burnt on a refused card');

  const ok = await request('POST', '/api/invoices', invoiceBody({
    paymentMethod: 'Pine Labs', pineLabsTxnRef: paid.txnRef
  }));
  assert.equal(ok.status, 201);
  assert.equal(ok.body.invoice.pineLabsTxnRef, paid.txnRef);
  assert.equal(ok.body.invoice.cardDetails.last4, '4242');

  // The same approval cannot be quoted on a second invoice.
  const reuse = await request('POST', '/api/invoices', invoiceBody({
    paymentMethod: 'Pine Labs', pineLabsTxnRef: paid.txnRef
  }));
  assert.equal(reuse.status, 400);
  assert.match(reuse.body.message, /already billed/i);
  assert.equal(await Invoice.countDocuments(), 1);
});

test('a pending payment cannot be billed as a sale', async () => {
  const started = await initiate({ source: 'offline-sale' });
  const res = await request('POST', '/api/offline-sales', saleBody({
    paymentMode: 'Pine Labs', pineLabsTxnRef: started.body.payment.txnRef
  }));
  assert.equal(res.status, 400);
  assert.match(res.body.message, /not approved/i);
  assert.equal(await OfflineSale.countDocuments(), 0);
});

test('an offline sale records the card it was paid with', async () => {
  const paid = await payFor(500, 'offline-sale');
  const res = await request('POST', '/api/offline-sales', saleBody({
    paymentMode: 'Pine Labs', pineLabsTxnRef: paid.txnRef
  }));

  assert.equal(res.status, 201);
  assert.equal(res.body.sale.pineLabsTxnRef, paid.txnRef);
  assert.equal(res.body.sale.cardDetails.approvalCode, '123456');

  const row = await PineLabsTransaction.findOne({ txnRef: paid.txnRef }).lean();
  assert.equal(row.sourceId, res.body.sale.saleId);
});

test("an invoice may not spend a sale's payment", async () => {
  const paid = await payFor(500, 'offline-sale');
  const res = await request('POST', '/api/invoices', invoiceBody({
    paymentMethod: 'Pine Labs', pineLabsTxnRef: paid.txnRef
  }));
  assert.equal(res.status, 400);
  assert.match(res.body.message, /different kind of sale/i);
});

test('cash is unaffected by any of this', async () => {
  const res = await request('POST', '/api/invoices', invoiceBody({ paymentMethod: 'Cash' }));
  assert.equal(res.status, 201);
  assert.equal(res.body.invoice.pineLabsTxnRef, '');
  assert.equal(calls.length, 0);
});
