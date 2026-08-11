const test = require('node:test');
const assert = require('node:assert/strict');

const {
  fromJsonEvent,
  fromDryContact,
  fromCounter,
  normalize,
  parseTime
} = require('../src/integrations/adapters/tunnelWashAdapter');

const NOW = new Date('2026-08-08T10:00:00.000Z');

// ── mode: json ─────────────────────────────────────────────────────────────

test('common vendor vocabularies all map onto our event types', () => {
  const cases = [
    ['start', 'wash.started'],
    ['STARTED', 'wash.started'],
    ['cycle_start', 'wash.started'],
    ['wash-start', 'wash.started'],
    ['finished', 'wash.completed'],
    ['COMPLETE', 'wash.completed'],
    ['cycle end', 'wash.completed'],
    ['fault', 'wash.aborted'],
    ['eStop', 'wash.aborted'],
    ['heartbeat', 'heartbeat']
  ];
  for (const [vendor, expected] of cases) {
    const e = fromJsonEvent({ event: vendor, cycleId: 'C1', timestamp: NOW.toISOString() }, { now: NOW });
    assert.equal(e && e.type, expected, `${vendor} -> ${expected}`);
  }
});

test('a completion carries plate, program and cycle through', () => {
  const e = fromJsonEvent({
    event: 'complete',
    cycleId: 'CYC-9912',
    carNo: 'mh 01 ab 1234',
    program: 'PREMIUM_WAX',
    lane: 'tunnel-1',
    timestamp: '2026-08-08 15:30:00'
  }, { now: NOW });

  assert.equal(e.source, 'tunnel');
  assert.equal(e.type, 'wash.completed');
  assert.equal(e.plate, 'MH01AB1234');
  assert.equal(e.plateRaw, 'mh 01 ab 1234');
  assert.equal(e.cycleId, 'CYC-9912');
  assert.equal(e.programCode, 'PREMIUM_WAX');
  assert.equal(e.laneId, 'tunnel-1');
});

test('a cycle id makes the event id stable across retries', () => {
  const payload = { event: 'complete', cycleId: 'CYC-1', timestamp: '2026-08-08T15:30:00Z' };
  const a = fromJsonEvent(payload, { now: NOW });
  const b = fromJsonEvent(payload, { now: new Date(NOW.getTime() + 90000) });
  assert.equal(a.eventId, b.eventId, 'a resent webhook must not become a second wash');
});

test('start and complete on the same cycle are distinct events', () => {
  const a = fromJsonEvent({ event: 'start', cycleId: 'CYC-1', timestamp: '2026-08-08T15:30:00Z' });
  const b = fromJsonEvent({ event: 'complete', cycleId: 'CYC-1', timestamp: '2026-08-08T15:30:00Z' });
  assert.notEqual(a.eventId, b.eventId);
});

test('a custom field and type map overrides the defaults', () => {
  const e = fromJsonEvent(
    { zustand: 'fertig', auftragsnummer: 'A-77', kennzeichen: 'MH01AB1234' },
    {
      now: NOW,
      fieldMap: { type: ['zustand'], cycleId: ['auftragsnummer'], plate: ['kennzeichen'] },
      typeMap: { fertig: 'wash.completed' }
    }
  );
  assert.equal(e.type, 'wash.completed');
  assert.equal(e.cycleId, 'A-77');
  assert.equal(e.plate, 'MH01AB1234');
});

test('unrecognised or malformed payloads are dropped, not guessed', () => {
  assert.equal(fromJsonEvent({ event: 'defrosting', cycleId: 'C1' }), null);
  assert.equal(fromJsonEvent({ cycleId: 'C1' }), null, 'no type field');
  assert.equal(fromJsonEvent(null), null);
  assert.equal(fromJsonEvent('a string'), null);
  assert.equal(fromJsonEvent([]), null);
});

test('epoch seconds and milliseconds both parse', () => {
  const fb = new Date('2000-01-01T00:00:00Z');
  assert.equal(parseTime(1785000000, fb).getFullYear(), 2026);
  assert.equal(parseTime(1785000000000, fb).getFullYear(), 2026);
  assert.equal(parseTime('nonsense', fb).toISOString(), fb.toISOString());
});

test('a missing timestamp falls back to now rather than failing validation', () => {
  const e = fromJsonEvent({ event: 'complete', cycleId: 'C1' }, { now: NOW });
  assert.equal(e.occurredAt, NOW.toISOString());
});

// ── mode: dry-contact (the §6 fallback) ────────────────────────────────────

const contactConfig = {
  mode: 'dry-contact',
  channels: { 1: 'wash.started', 2: 'wash.completed' },
  defaultLaneId: 'tunnel-1',
  now: NOW
};

test('a closing relay on a mapped channel becomes the mapped event', () => {
  const e = fromDryContact({ channel: 2, state: 'closed', timestamp: NOW.toISOString() }, contactConfig);
  assert.equal(e.type, 'wash.completed');
  assert.equal(e.laneId, 'tunnel-1');
  assert.equal(e.plate, '', 'no plate exists on a dry contact — the session stitches to the ANPR arrival');
});

test('a relay releasing is not a second wash', () => {
  assert.equal(fromDryContact({ channel: 2, state: 'open' }, contactConfig), null);
  assert.equal(fromDryContact({ channel: 2, state: 0 }, contactConfig), null);
  assert.equal(fromDryContact({ channel: 2, state: false }, contactConfig), null);
});

test('all the truthy closed representations are accepted', () => {
  for (const state of [true, 1, 'closed', 'on']) {
    assert.ok(fromDryContact({ channel: 1, state, timestamp: NOW.toISOString() }, contactConfig), String(state));
  }
  assert.ok(fromDryContact({ channel: 1, value: 1, timestamp: NOW.toISOString() }, contactConfig));
});

test('an unmapped channel is ignored', () => {
  assert.equal(fromDryContact({ channel: 7, state: 'closed' }, contactConfig), null);
  assert.equal(fromDryContact({ state: 'closed' }, contactConfig), null);
  assert.equal(fromDryContact(null, contactConfig), null);
});

test('two closures at the same instant on the same channel collapse to one event', () => {
  const a = fromDryContact({ channel: 2, state: 1, timestamp: NOW.toISOString() }, contactConfig);
  const b = fromDryContact({ channel: 2, state: 1, timestamp: NOW.toISOString() }, contactConfig);
  assert.equal(a.eventId, b.eventId);
});

// ── mode: counter ──────────────────────────────────────────────────────────

test('each counter increment becomes one completion', () => {
  const events = fromCounter(1005, 1002, { laneId: 'tunnel-1', now: NOW });
  assert.equal(events.length, 3);
  assert.ok(events.every((e) => e.type === 'wash.completed'));
  assert.deepEqual(events.map((e) => e.cycleId), ['tunnel-1-1003', 'tunnel-1-1004', 'tunnel-1-1005']);
});

test('counter event ids are stable, so a repeated poll adds nothing', () => {
  const a = fromCounter(1003, 1002, { laneId: 'tunnel-1', now: NOW });
  const b = fromCounter(1003, 1002, { laneId: 'tunnel-1', now: new Date() });
  assert.equal(a[0].eventId, b[0].eventId);
});

test('a static, reset or rolled-over counter manufactures no washes', () => {
  assert.deepEqual(fromCounter(1002, 1002, {}), [], 'unchanged');
  assert.deepEqual(fromCounter(5, 1002, {}), [], 'controller reset — missing washes beats inventing them');
  assert.deepEqual(fromCounter(1005, undefined, {}), [], 'no baseline yet');
  assert.deepEqual(fromCounter('abc', 1002, {}), []);
});

test('an implausible counter jump is capped', () => {
  const events = fromCounter(9999, 0, { maxDelta: 20 });
  assert.equal(events.length, 20);
});

// ── dispatcher ─────────────────────────────────────────────────────────────

test('normalize routes by configured mode', () => {
  assert.equal(normalize({ event: 'complete', cycleId: 'C1' }, { mode: 'json', now: NOW })[0].type, 'wash.completed');
  assert.equal(normalize({ channel: 2, state: 1 }, contactConfig)[0].type, 'wash.completed');
  assert.equal(normalize({ current: 3, previous: 1 }, { mode: 'counter', now: NOW }).length, 2);
});

test('normalize accepts a batch and defaults to json mode', () => {
  const out = normalize(
    [{ event: 'start', cycleId: 'C1' }, { event: 'complete', cycleId: 'C1' }, { event: 'garbage' }],
    { now: NOW }
  );
  assert.equal(out.length, 2);
});
