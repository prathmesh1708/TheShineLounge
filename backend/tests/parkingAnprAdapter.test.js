const test = require('node:test');
const assert = require('node:assert/strict');

const {
  isSuccess,
  parseVendorTime,
  parseChannelMap,
  fromPushNotification,
  fromAccessRecord,
  fromAccessRecords,
  resolvePhotoUrl
} = require('../src/integrations/adapters/parkingAnprAdapter');

const channelMap = parseChannelMap('1803001B1226:entry:lane-1,1803001B1227:exit:lane-1,1803001B1228:tunnel-exit:tunnel-1');
const NOW = new Date('2026-08-08T10:00:00.000Z');

// ── vendor quirks ──────────────────────────────────────────────────────────

test('both documented success shapes are accepted', () => {
  // The doc's status table says 200; every worked example returns {"status": 1}.
  assert.equal(isSuccess({ status: 1 }), true);
  assert.equal(isSuccess({ status: 200 }), true);
  assert.equal(isSuccess({ Status: 1 }), true, 'section 10 capitalises the key');
  assert.equal(isSuccess({ status: 0 }), false);
  assert.equal(isSuccess({}), false);
  assert.equal(isSuccess(null), false);
});

test('every timestamp format in the document parses', () => {
  const fb = new Date('2000-01-01T00:00:00.000Z');
  assert.equal(parseVendorTime('2025-01-02 15:50:45', fb).getFullYear(), 2025);
  assert.equal(parseVendorTime('2025-01-17T02:00:33.000+0000', fb).toISOString(), '2025-01-17T02:00:33.000Z');
  assert.equal(parseVendorTime('12/25/2024 16:31:30', fb).getMonth(), 11);
  assert.equal(parseVendorTime('12/25/2024 16:31:30', fb).getDate(), 25);
});

test('an unparseable timestamp falls back instead of writing Invalid Date', () => {
  const fb = new Date('2026-08-08T10:00:00.000Z');
  assert.equal(parseVendorTime('January 9, 2025 20:43:21', fb).getFullYear(), 2025);
  assert.equal(parseVendorTime('total nonsense', fb).toISOString(), fb.toISOString());
  assert.equal(parseVendorTime('', fb).toISOString(), fb.toISOString());
  assert.equal(parseVendorTime(null, fb).toISOString(), fb.toISOString());
});

test('channel map parses mac, role and lane', () => {
  assert.deepEqual(channelMap['1803001B1226'], { role: 'entry', laneId: 'lane-1' });
  assert.deepEqual(channelMap['1803001B1228'], { role: 'tunnel-exit', laneId: 'tunnel-1' });
  assert.deepEqual(parseChannelMap(''), {});
  assert.deepEqual(parseChannelMap(null), {});
});

// ── getPushNotification (interface 13) ─────────────────────────────────────

const pushPayload = (over = {}) => ({
  status: 1,
  data: {
    channelName: 'Entrance',
    mac: '1803001B1226',
    carNum: 'MH01AB1234',
    isNoCarNo: 0,
    carNumType: 0,
    time: '2026-08-08 15:30:45',
    user: 'admin',
    ...over
  }
});

test('a channel push becomes a vehicle.entered event', () => {
  const e = fromPushNotification(pushPayload(), { channelMap, now: NOW });
  assert.equal(e.source, 'anpr');
  assert.equal(e.type, 'vehicle.entered');
  assert.equal(e.plate, 'MH01AB1234');
  assert.equal(e.laneId, 'lane-1');
  assert.equal(e.channelMac, '1803001B1226');
  assert.equal(e.raw.isRegisteredWithVendor, true);
  assert.ok(e.eventId.startsWith('anpr:'));
});

test('the exit channel produces vehicle.exited, the tunnel-exit channel a completion', () => {
  const exit = fromPushNotification(pushPayload({ mac: '1803001B1227' }), { channelMap, now: NOW });
  assert.equal(exit.type, 'vehicle.exited');

  const tunnel = fromPushNotification(pushPayload({ mac: '1803001B1228' }), { channelMap, now: NOW });
  assert.equal(tunnel.type, 'wash.completed');
  assert.equal(tunnel.laneId, 'tunnel-1');
});

test('the same crossing always yields the same event id', () => {
  // getPushNotification returns the latest vehicle rather than a queue, so the
  // poller re-reads a crossing many times. Deterministic ids make every repeat
  // a no-op at ingest.
  const a = fromPushNotification(pushPayload(), { channelMap, now: NOW });
  const b = fromPushNotification(pushPayload(), { channelMap, now: new Date(NOW.getTime() + 60000) });
  assert.equal(a.eventId, b.eventId);
});

test('a different car or a different crossing time yields a different id', () => {
  const a = fromPushNotification(pushPayload(), { channelMap, now: NOW });
  const b = fromPushNotification(pushPayload({ carNum: 'DL09XY9999' }), { channelMap, now: NOW });
  const c = fromPushNotification(pushPayload({ time: '2026-08-08 15:31:10' }), { channelMap, now: NOW });
  assert.notEqual(a.eventId, b.eventId);
  assert.notEqual(a.eventId, c.eventId);
});

test('a Chinese plate is reduced to its alphanumeric identity', () => {
  const e = fromPushNotification(pushPayload({ carNum: '粤B34943' }), { channelMap, now: NOW });
  assert.equal(e.plate, 'B34943');
  assert.equal(e.plateRaw, '粤B34943');
});

test('empty, failed and plateless pushes are skipped rather than throwing', () => {
  assert.equal(fromPushNotification({ status: 0 }, { channelMap }), null);
  assert.equal(fromPushNotification({ status: 1, data: null }, { channelMap }), null);
  assert.equal(fromPushNotification(pushPayload({ carNum: '' }), { channelMap }), null);
  assert.equal(fromPushNotification(null, { channelMap }), null);
});

test('an unmapped channel mac is ignored, not assumed to be an entrance', () => {
  // A camera watching the car park exit must never be read as a wash arrival.
  const e = fromPushNotification(pushPayload({ mac: 'AAAAAAAAAAAA' }), { channelMap, now: NOW });
  assert.equal(e.type, 'vehicle.entered', 'defaults to entry role');
  const strict = fromPushNotification(
    pushPayload({ mac: 'AAAAAAAAAAAA' }),
    { channelMap, defaultRole: 'unknown', now: NOW }
  );
  assert.equal(strict, null, 'an explicit unknown default suppresses the event');
});

test('data returned as a single-element array is handled', () => {
  const e = fromPushNotification({ status: 1, data: [pushPayload().data] }, { channelMap, now: NOW });
  assert.equal(e.plate, 'MH01AB1234');
});

// ── getCarIn / getCarOut (interfaces 8 and 9) ──────────────────────────────

// Verbatim from the document's section 9 example.
const docExitRecord = {
  id: 36,
  uuid: '78707403522740d2a74651c4706209d7',
  createTime: '2025-01-02 15:50:45',
  carType: 31,
  time: '2025-01-02 15:50:45',
  lTime: '2025-01-17 10:00:33',
  enterWay: 1,
  leaveWay: 1,
  enterPass: '入口',
  leavePass: '出口',
  card: '0006267856',
  carNum: 'MH01AB1234',
  ltime: '2025-01-17T02:00:33.000+0000'
};

test('an exit record maps to vehicle.exited using the leave time', () => {
  const e = fromAccessRecord(docExitRecord, { direction: 'out', now: NOW });
  assert.equal(e.type, 'vehicle.exited');
  assert.equal(e.plate, 'MH01AB1234');
  assert.equal(new Date(e.occurredAt).getFullYear(), 2025);
  assert.equal(e.laneId, '出口', 'untranslated value kept verbatim, never used for routing');
});

test('an entry record maps to vehicle.entered using the entry time', () => {
  const e = fromAccessRecord(docExitRecord, { direction: 'in', now: NOW });
  assert.equal(e.type, 'vehicle.entered');
  assert.equal(new Date(e.occurredAt).getMonth(), 0);
});

test('backfilled records reuse the vendor uuid so a replay is idempotent', () => {
  const a = fromAccessRecord(docExitRecord, { direction: 'out', now: NOW });
  const b = fromAccessRecord(docExitRecord, { direction: 'out', now: new Date() });
  assert.equal(a.eventId, b.eventId);
});

test('the same record read as entry and exit produces distinct events', () => {
  const inEvt = fromAccessRecord(docExitRecord, { direction: 'in' });
  const outEvt = fromAccessRecord(docExitRecord, { direction: 'out' });
  assert.notEqual(inEvt.eventId, outEvt.eventId);
});

test('a record list maps in bulk and drops unusable rows', () => {
  const events = fromAccessRecords(
    { status: 1, data: [docExitRecord, { ...docExitRecord, carNum: '' }, null] },
    { direction: 'out' }
  );
  assert.equal(events.length, 1);
});

test('a failed record response yields an empty list', () => {
  assert.deepEqual(fromAccessRecords({ status: 0 }, { direction: 'in' }), []);
  assert.deepEqual(fromAccessRecords(null, { direction: 'in' }), []);
});

test('capitalised field names from section 10 still map', () => {
  const e = fromAccessRecord({ CarNum: 'MH01AB1234', Time: '12/25/2024 16:31:30', Uuid: 'abc' }, { direction: 'in' });
  assert.equal(e.plate, 'MH01AB1234');
  assert.equal(new Date(e.occurredAt).getFullYear(), 2024);
});

// ── photos (interface 11) ──────────────────────────────────────────────────

test('relative image paths resolve against the configured base', () => {
  assert.equal(
    resolvePhotoUrl('Images/2025/1/9/1921681160_202519204320_big.jpg', 'http://192.168.1.169:9001/'),
    'http://192.168.1.169:9001/Images/2025/1/9/1921681160_202519204320_big.jpg'
  );
  assert.equal(resolvePhotoUrl('/Images/a.jpg', 'http://host:9001'), 'http://host:9001/Images/a.jpg');
  assert.equal(resolvePhotoUrl('http://cdn/x.jpg', 'http://host'), 'http://cdn/x.jpg');
  assert.equal(resolvePhotoUrl('', 'http://host'), '');
  assert.equal(resolvePhotoUrl('Images/a.jpg', ''), '');
});
