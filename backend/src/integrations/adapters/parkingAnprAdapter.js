const crypto = require('crypto');
const { normalizePlate } = require('../../utils/plateNormalizer');

// Translates the "Smart parking — External development interface" payloads
// (/yard/third/*) into the canonical event envelope. Everything vendor-specific
// about that system lives here, so a second camera vendor costs one more file
// and nothing downstream changes.
//
// Reference: docs/integration/01-distributor-requirements.md

// The vendor's documented status table says "200 request successful" but every
// worked example in the document returns a body of {"status": 1}. Both are
// treated as success until they clarify (raised as §B4 with the distributor).
const SUCCESS_STATUSES = new Set([1, 200, '1', '200']);

const isSuccess = (payload) => !!payload && SUCCESS_STATUSES.has(payload.status ?? payload.Status);

// Timestamps arrive in at least three shapes across the document:
//   "2025-01-02 15:50:45"      (no timezone — device local)
//   "2025-01-17T02:00:33.000+0000"
//   "12/25/2024 16:31:30"
// Anything unparseable falls back to the caller's clock rather than writing an
// Invalid Date into the ledger.
const parseVendorTime = (value, fallback = new Date()) => {
  if (!value) return fallback;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? fallback : value;

  const str = String(value).trim();

  const iso = new Date(str.includes('T') ? str : str.replace(' ', 'T'));
  if (!Number.isNaN(iso.getTime())) return iso;

  const us = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})[ T](\d{1,2}):(\d{2}):(\d{2})$/);
  if (us) {
    const [, m, d, y, hh, mm, ss] = us;
    const parsed = new Date(Number(y), Number(m) - 1, Number(d), Number(hh), Number(mm), Number(ss));
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  const plain = new Date(str);
  return Number.isNaN(plain.getTime()) ? fallback : plain;
};

// The vendor supplies no event id of its own, so one is derived from the fields
// that identify a physical crossing. Deterministic on purpose: if the poller
// sees the same crossing twice — which it will, since getPushNotification
// returns the latest vehicle rather than a queue — both attempts produce the
// same id and the second is rejected by the unique index at ingest.
const buildEventId = (parts) => {
  const basis = parts.filter(Boolean).join('|');
  const digest = crypto.createHash('sha1').update(basis).digest('hex').slice(0, 16);
  return `anpr:${digest}`;
};

// Channels have to be told apart: the same camera platform watches the car park
// entrance and the tunnel lane, and only one of those means "a wash is starting".
// Configured as CHANNEL_MAC:role pairs, e.g. "1803001B1226:entry,1803001B1227:exit".
const parseChannelMap = (raw) => {
  const map = {};
  if (!raw) return map;
  for (const pair of String(raw).split(',')) {
    const [mac, role, laneId] = pair.split(':').map((s) => (s || '').trim());
    if (!mac) continue;
    map[mac.toUpperCase()] = { role: role || 'entry', laneId: laneId || mac };
  }
  return map;
};

const roleToEventType = {
  entry: 'vehicle.entered',
  exit: 'vehicle.exited',
  'tunnel-entry': 'vehicle.entered',
  'tunnel-exit': 'wash.completed'
};

// getPushNotification (interface 13) — "vehicle now at this channel".
// Returns null when there is nothing to report, so the poller can skip quietly.
const fromPushNotification = (payload, opts = {}) => {
  if (!isSuccess(payload)) return null;

  const data = payload.data || payload.Data || {};
  const record = Array.isArray(data) ? data[0] : data;
  if (!record) return null;

  const plateRaw = record.carNum || record.CarNum || record.carNo || '';
  const plate = normalizePlate(plateRaw);
  if (!plate) return null;

  const mac = String(record.mac || opts.channelMac || '').toUpperCase();
  const channel = opts.channelMap?.[mac] || { role: opts.defaultRole || 'entry', laneId: mac };
  const type = roleToEventType[channel.role];
  if (!type) return null;

  const occurredAt = parseVendorTime(record.time || record.Time, opts.now || new Date());

  return {
    eventId: buildEventId(['push', mac, plate, occurredAt.toISOString()]),
    source: 'anpr',
    type,
    occurredAt: occurredAt.toISOString(),
    plate,
    plateRaw: String(plateRaw),
    laneId: channel.laneId,
    channelMac: mac,
    // isNoCarNo: 0 = registered vehicle, 1 = unregistered (vendor doc §13).
    raw: {
      ...record,
      channelRole: channel.role,
      isRegisteredWithVendor: Number(record.isNoCarNo) === 0
    }
  };
};

// getCarIn (interface 8) / getCarOut (interface 9) — the reconciliation sweep.
// Polling getPushNotification alone loses a crossing whenever two cars pass
// inside one poll interval, so these paged history endpoints are replayed every
// few minutes to backfill. Identical event ids mean a backfilled crossing that
// was already seen is dropped rather than double-counted.
const fromAccessRecord = (record, opts = {}) => {
  if (!record) return null;

  const direction = opts.direction === 'out' ? 'out' : 'in';
  const plateRaw = record.carNum || record.CarNum || record.carNo || record.CarNo || '';
  const plate = normalizePlate(plateRaw);
  if (!plate) return null;

  const timeField = direction === 'out'
    ? (record.lTime || record.ltime || record.leaveTime || record.outTime)
    : (record.time || record.Time || record.inTime || record.enterTime);

  const occurredAt = parseVendorTime(timeField, opts.now || new Date());
  const laneId = direction === 'out'
    ? (record.leavePass || record.LeavePass || 'exit')
    : (record.enterPass || record.EnterPass || 'entry');

  return {
    eventId: buildEventId(['record', direction, record.uuid || record.Uuid || '', plate, occurredAt.toISOString()]),
    source: 'anpr',
    type: direction === 'out' ? 'vehicle.exited' : 'vehicle.entered',
    occurredAt: occurredAt.toISOString(),
    plate,
    plateRaw: String(plateRaw),
    // enterPass/leavePass come back untranslated ("入口"/"出口"); kept verbatim
    // in raw and not relied on for routing.
    laneId: String(laneId),
    raw: { ...record, direction }
  };
};

const fromAccessRecords = (payload, opts = {}) => {
  if (!isSuccess(payload)) return [];
  const data = payload.data || payload.Data || payload.dataList || payload.DataList || [];
  const rows = Array.isArray(data) ? data : [data];
  return rows.map((r) => fromAccessRecord(r, opts)).filter(Boolean);
};

// find (interface 11) returns a path relative to the vendor's image root.
const resolvePhotoUrl = (relativePath, baseUrl) => {
  if (!relativePath) return '';
  if (/^https?:\/\//i.test(relativePath)) return relativePath;
  if (!baseUrl) return '';
  return `${String(baseUrl).replace(/\/+$/, '')}/${String(relativePath).replace(/^\/+/, '')}`;
};

module.exports = {
  SUCCESS_STATUSES,
  isSuccess,
  parseVendorTime,
  buildEventId,
  parseChannelMap,
  roleToEventType,
  fromPushNotification,
  fromAccessRecord,
  fromAccessRecords,
  resolvePhotoUrl
};
