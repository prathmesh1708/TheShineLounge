const test = require('node:test');
const assert = require('node:assert/strict');

process.env.INTEGRATION_DEVICE_KEYS = JSON.stringify({ 'edge-1': 'super-secret-value' });

const {
  signPayload,
  safeEqual,
  authenticateDevice,
  validateEvent,
  validateEventBatch,
  loadDeviceKeys,
  MAX_CLOCK_SKEW_MS
} = require('../src/integrations/integrations.middleware');

const mockRes = () => {
  const res = { statusCode: null, body: null };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (payload) => { res.body = payload; return res; };
  return res;
};

const mockReq = (headers = {}, rawBody = '') => ({
  headers,
  rawBody,
  get(name) { return this.headers[name.toLowerCase()]; }
});

const signedReq = ({
  deviceId = 'edge-1',
  secret = 'super-secret-value',
  timestamp = Date.now(),
  body = '{"events":[]}'
} = {}) => mockReq({
  'x-tsl-device-id': deviceId,
  'x-tsl-timestamp': String(timestamp),
  'x-tsl-signature': signPayload(secret, deviceId, String(timestamp), body)
}, body);

const run = (req) => {
  const res = mockRes();
  let nexted = false;
  authenticateDevice(req, res, () => { nexted = true; });
  return { res, nexted };
};

// ── key loading ────────────────────────────────────────────────────────────

test('device keys parse from the environment', () => {
  assert.deepEqual(loadDeviceKeys(), { 'edge-1': 'super-secret-value' });
});

test('a missing key config yields no devices rather than crashing', () => {
  const saved = process.env.INTEGRATION_DEVICE_KEYS;
  delete process.env.INTEGRATION_DEVICE_KEYS;
  assert.deepEqual(loadDeviceKeys(), {});
  process.env.INTEGRATION_DEVICE_KEYS = saved;
});

test('a malformed key config fails loudly at load, not silently at runtime', () => {
  const saved = process.env.INTEGRATION_DEVICE_KEYS;
  process.env.INTEGRATION_DEVICE_KEYS = '{not json';
  assert.throws(() => loadDeviceKeys(), /INTEGRATION_DEVICE_KEYS is invalid/);
  process.env.INTEGRATION_DEVICE_KEYS = '["array"]';
  assert.throws(() => loadDeviceKeys(), /JSON object/);
  process.env.INTEGRATION_DEVICE_KEYS = saved;
});

test('safeEqual compares without throwing on unequal lengths', () => {
  assert.equal(safeEqual('abc', 'abc'), true);
  assert.equal(safeEqual('abc', 'abd'), false);
  assert.equal(safeEqual('abc', 'abcdef'), false);
  assert.equal(safeEqual('', ''), true);
});

// ── authentication ─────────────────────────────────────────────────────────

test('a correctly signed request is admitted', () => {
  const { res, nexted } = run(signedReq());
  assert.equal(nexted, true);
  assert.equal(res.statusCode, null);
});

test('the device id is attached for downstream attribution', () => {
  const req = signedReq();
  run(req);
  assert.deepEqual(req.device, { id: 'edge-1' });
});

test('missing credentials are rejected', () => {
  const { res, nexted } = run(mockReq({}, ''));
  assert.equal(nexted, false);
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.code, 'MISSING_CREDENTIALS');
});

test('an unknown device is rejected with the same error as a bad signature', () => {
  // Distinguishing the two would let an attacker enumerate valid device ids.
  const { res } = run(signedReq({ deviceId: 'ghost-device' }));
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.code, 'BAD_SIGNATURE');
});

test('a wrong secret is rejected', () => {
  const { res, nexted } = run(signedReq({ secret: 'wrong-secret' }));
  assert.equal(nexted, false);
  assert.equal(res.body.code, 'BAD_SIGNATURE');
});

test('a tampered body invalidates the signature', () => {
  // Sign one payload, send another — the classic forgery attempt.
  const req = signedReq({ body: '{"events":[{"amount":1}]}' });
  req.rawBody = '{"events":[{"amount":9999}]}';
  const { res } = run(req);
  assert.equal(res.body.code, 'BAD_SIGNATURE');
});

test('a captured request replayed later is rejected', () => {
  const stale = Date.now() - (MAX_CLOCK_SKEW_MS + 60_000);
  const { res, nexted } = run(signedReq({ timestamp: stale }));
  assert.equal(nexted, false);
  assert.equal(res.body.code, 'STALE_REQUEST');
});

test('a timestamp too far in the future is rejected', () => {
  const { res } = run(signedReq({ timestamp: Date.now() + MAX_CLOCK_SKEW_MS + 60_000 }));
  assert.equal(res.body.code, 'STALE_REQUEST');
});

test('a request just inside the skew window is admitted', () => {
  const { nexted } = run(signedReq({ timestamp: Date.now() - (MAX_CLOCK_SKEW_MS - 5_000) }));
  assert.equal(nexted, true);
});

test('a non-numeric timestamp is rejected', () => {
  const req = mockReq({
    'x-tsl-device-id': 'edge-1',
    'x-tsl-timestamp': 'yesterday',
    'x-tsl-signature': 'deadbeef'
  }, '');
  const { res } = run(req);
  assert.equal(res.body.code, 'BAD_TIMESTAMP');
});

test('a signature valid for one device does not work for another', () => {
  const ts = String(Date.now());
  const body = '{}';
  const req = mockReq({
    'x-tsl-device-id': 'edge-1',
    'x-tsl-timestamp': ts,
    'x-tsl-signature': signPayload('super-secret-value', 'edge-2', ts, body)
  }, body);
  const { res } = run(req);
  assert.equal(res.body.code, 'BAD_SIGNATURE');
});

test('an empty body still signs and verifies', () => {
  const ts = String(Date.now());
  const req = mockReq({
    'x-tsl-device-id': 'edge-1',
    'x-tsl-timestamp': ts,
    'x-tsl-signature': signPayload('super-secret-value', 'edge-1', ts, '')
  });
  delete req.rawBody;
  const { nexted } = run(req);
  assert.equal(nexted, true);
});

// ── event validation ───────────────────────────────────────────────────────

const goodEvent = (over = {}) => ({
  eventId: 'anpr:abc123',
  source: 'anpr',
  type: 'vehicle.entered',
  occurredAt: '2026-08-08T10:00:00.000Z',
  plate: 'MH01AB1234',
  ...over
});

test('a well-formed event passes validation', () => {
  assert.equal(validateEvent(goodEvent()), null);
});

test('an event with no plate is valid — heartbeats and dry contacts have none', () => {
  assert.equal(validateEvent(goodEvent({ plate: '', type: 'heartbeat' })), null);
  assert.equal(validateEvent(goodEvent({ plate: undefined })), null);
  assert.equal(validateEvent(goodEvent({ plate: null })), null);
});

test('structural problems are named precisely', () => {
  assert.match(validateEvent(null), /must be an object/);
  assert.match(validateEvent([]), /must be an object/);
  assert.match(validateEvent(goodEvent({ eventId: '' })), /eventId is required/);
  assert.match(validateEvent(goodEvent({ eventId: '  ' })), /eventId is required/);
  assert.match(validateEvent(goodEvent({ eventId: 'x'.repeat(300) })), /too long/);
  assert.match(validateEvent(goodEvent({ source: 'hacker' })), /source must be one of/);
  assert.match(validateEvent(goodEvent({ type: 'wash.exploded' })), /type must be one of/);
  assert.match(validateEvent(goodEvent({ occurredAt: 'never' })), /valid date/);
  assert.match(validateEvent(goodEvent({ plate: '入口' })), /no alphanumeric/);
  assert.match(validateEvent(goodEvent({ plate: {} })), /must be a string/);
});

test('the index of the offending event is reported', () => {
  assert.match(validateEvent(goodEvent({ source: 'nope' }), 4), /^event\[4\]/);
});

// ── batch validation ───────────────────────────────────────────────────────

const runBatch = (body) => {
  const req = { body };
  const res = mockRes();
  let nexted = false;
  validateEventBatch(req, res, () => { nexted = true; });
  return { req, res, nexted };
};

test('a batch of valid events is accepted', () => {
  const { req, nexted } = runBatch({ events: [goodEvent(), goodEvent({ eventId: 'b' })] });
  assert.equal(nexted, true);
  assert.equal(req.events.length, 2);
});

test('a bare single event is accepted as a batch of one', () => {
  const { req, nexted } = runBatch(goodEvent());
  assert.equal(nexted, true);
  assert.equal(req.events.length, 1);
});

test('empty, absent and oversized batches are refused', () => {
  assert.equal(runBatch({}).res.body.code, 'NO_EVENTS');
  assert.equal(runBatch({ events: [] }).res.body.code, 'EMPTY_BATCH');

  const huge = { events: Array.from({ length: 5000 }, (_, i) => goodEvent({ eventId: `e${i}` })) };
  const { res } = runBatch(huge);
  assert.equal(res.statusCode, 413);
  assert.equal(res.body.code, 'BATCH_TOO_LARGE');
});

test('one bad event rejects the whole batch with its position', () => {
  const { res, nexted } = runBatch({
    events: [goodEvent(), goodEvent({ eventId: 'b', type: 'nonsense' })]
  });
  assert.equal(nexted, false);
  assert.equal(res.statusCode, 400);
  assert.match(res.body.message, /^event\[1\]/);
});
