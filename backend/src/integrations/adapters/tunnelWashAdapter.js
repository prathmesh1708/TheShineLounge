const crypto = require('crypto');
const { normalizePlate } = require('../../utils/plateNormalizer');

// The tunnel controller's protocol is not yet known — it is the open question in
// §3 of docs/integration/01-distributor-requirements.md. Rather than block, this
// adapter is written against the three shapes the answer can realistically take,
// selected by configuration:
//
//   json          the controller (or its middleware) speaks JSON with named
//                 fields; a field map converts its vocabulary to ours
//   dry-contact   no protocol at all, just relays closing on start and finish
//                 (the §6 fallback) — an I/O module reports channel edges
//   counter       the controller exposes only a rising wash counter, polled
//
// When the distributor answers, the work is to fill in a field map, not to
// rewrite the pipeline.

const buildEventId = (parts) => {
  const digest = crypto.createHash('sha1').update(parts.filter(Boolean).join('|')).digest('hex').slice(0, 16);
  return `tunnel:${digest}`;
};

// Vendor event names we already know how to read. Extend as the spec lands.
const DEFAULT_TYPE_MAP = {
  start: 'wash.started',
  started: 'wash.started',
  wash_start: 'wash.started',
  cycle_start: 'wash.started',
  running: 'wash.started',

  stage: 'wash.stage_changed',
  progress: 'wash.stage_changed',

  end: 'wash.completed',
  done: 'wash.completed',
  finish: 'wash.completed',
  finished: 'wash.completed',
  complete: 'wash.completed',
  completed: 'wash.completed',
  cycle_end: 'wash.completed',

  abort: 'wash.aborted',
  aborted: 'wash.aborted',
  cancel: 'wash.aborted',
  cancelled: 'wash.aborted',
  fault: 'wash.aborted',
  error: 'wash.aborted',
  estop: 'wash.aborted',

  entered: 'vehicle.entered',
  entry: 'vehicle.entered',
  exit: 'vehicle.exited',
  exited: 'vehicle.exited',

  heartbeat: 'heartbeat',
  keepalive: 'heartbeat',
  ping: 'heartbeat'
};

const DEFAULT_FIELD_MAP = {
  type: ['type', 'event', 'eventType', 'status', 'state', 'action'],
  cycleId: ['cycleId', 'cycle_id', 'washId', 'wash_id', 'transactionId', 'txnId', 'sessionId', 'id'],
  plate: ['plate', 'carNo', 'carNum', 'licensePlate', 'plateNumber', 'vrn'],
  programCode: ['program', 'programCode', 'wash_program', 'packageCode', 'mode', 'recipe'],
  laneId: ['lane', 'laneId', 'bay', 'bayId', 'machineId', 'deviceId'],
  occurredAt: ['timestamp', 'time', 'occurredAt', 'eventTime', 'datetime'],
  reason: ['reason', 'faultCode', 'errorCode', 'message']
};

const pick = (payload, keys) => {
  for (const key of keys) {
    if (payload[key] !== undefined && payload[key] !== null && payload[key] !== '') {
      return payload[key];
    }
  }
  return undefined;
};

const parseTime = (value, fallback) => {
  if (!value) return fallback;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? fallback : value;
  // Epoch seconds and milliseconds both show up in PLC middleware.
  if (typeof value === 'number') {
    const ms = value < 1e12 ? value * 1000 : value;
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? fallback : d;
  }
  const str = String(value).trim();
  const d = new Date(str.includes('T') ? str : str.replace(' ', 'T'));
  return Number.isNaN(d.getTime()) ? fallback : d;
};

// Mode: json. `config.typeMap` and `config.fieldMap` override the defaults once
// the real vocabulary is known.
const fromJsonEvent = (payload, config = {}) => {
  if (!payload || typeof payload !== 'object') return null;

  const fieldMap = { ...DEFAULT_FIELD_MAP, ...(config.fieldMap || {}) };
  const typeMap = { ...DEFAULT_TYPE_MAP, ...(config.typeMap || {}) };

  const rawType = pick(payload, fieldMap.type);
  if (rawType === undefined) return null;

  const type = typeMap[String(rawType).toLowerCase().replace(/[\s-]+/g, '_')]
    || typeMap[String(rawType).toLowerCase()];
  if (!type) return null;

  const now = config.now || new Date();
  const occurredAt = parseTime(pick(payload, fieldMap.occurredAt), now);
  const cycleId = pick(payload, fieldMap.cycleId);
  const plateRaw = pick(payload, fieldMap.plate) || '';
  const plate = normalizePlate(plateRaw);
  const laneId = String(pick(payload, fieldMap.laneId) || config.defaultLaneId || 'tunnel-1');

  return {
    // A vendor cycle id makes the event id stable across retries. Without one,
    // lane + type + timestamp is the best available identity — which is exactly
    // why A2 of the distributor request insists on a unique event id.
    eventId: buildEventId([
      'json',
      cycleId ? `cycle:${cycleId}` : `lane:${laneId}`,
      type,
      occurredAt.toISOString()
    ]),
    source: 'tunnel',
    type,
    occurredAt: occurredAt.toISOString(),
    plate,
    plateRaw: String(plateRaw),
    cycleId: cycleId ? String(cycleId) : '',
    laneId,
    programCode: String(pick(payload, fieldMap.programCode) || ''),
    reason: String(pick(payload, fieldMap.reason) || ''),
    raw: payload
  };
};

// Mode: dry-contact. An I/O module reports a channel changing state; the channel
// number is all the meaning there is. `config.channels` maps channel -> event
// type, e.g. { "1": "wash.started", "2": "wash.completed" }.
//
// There is no plate here, so the session is stitched to the ANPR arrival on the
// same lane by the debounce window in integrations.service.
const fromDryContact = (signal, config = {}) => {
  if (!signal) return null;

  const channels = config.channels || {};
  const channel = String(signal.channel ?? signal.input ?? signal.id ?? '');
  const type = channels[channel];
  if (!type) return null;

  // Only a rising edge is an event; the relay releasing is not a second wash.
  const closed = signal.state === true
    || signal.state === 1
    || signal.state === 'closed'
    || signal.state === 'on'
    || signal.value === 1;
  if (!closed) return null;

  const now = config.now || new Date();
  const occurredAt = parseTime(signal.timestamp || signal.time, now);
  const laneId = String(signal.lane || config.defaultLaneId || 'tunnel-1');

  return {
    eventId: buildEventId(['contact', laneId, channel, occurredAt.toISOString()]),
    source: 'tunnel',
    type,
    occurredAt: occurredAt.toISOString(),
    plate: '',
    plateRaw: '',
    cycleId: '',
    laneId,
    programCode: '',
    raw: { ...signal, channel, derivedFrom: 'dry-contact' }
  };
};

// Mode: counter. The controller exposes a monotonically rising wash total and
// nothing else. Each increment since the last poll becomes one completion.
// Coarse, but it keeps membership balances honest on a machine with no API.
const fromCounter = (current, previous, config = {}) => {
  const now = config.now || new Date();
  const laneId = String(config.laneId || config.defaultLaneId || 'tunnel-1');

  const currentCount = Number(current);
  const previousCount = Number(previous);

  if (!Number.isFinite(currentCount)) return [];
  // A counter that goes backwards means the controller was reset or rolled
  // over. Manufacturing washes from that would be worse than missing them.
  if (!Number.isFinite(previousCount) || currentCount <= previousCount) return [];

  const delta = Math.min(currentCount - previousCount, Number(config.maxDelta || 20));

  return Array.from({ length: delta }, (_, i) => {
    const index = previousCount + i + 1;
    return {
      eventId: buildEventId(['counter', laneId, String(index)]),
      source: 'tunnel',
      type: 'wash.completed',
      occurredAt: now.toISOString(),
      plate: '',
      plateRaw: '',
      cycleId: `${laneId}-${index}`,
      laneId,
      programCode: '',
      raw: { counter: index, previousCount, currentCount, derivedFrom: 'counter' }
    };
  });
};

const normalize = (input, config = {}) => {
  switch (config.mode) {
    case 'dry-contact':
      return [fromDryContact(input, config)].filter(Boolean);
    case 'counter':
      return fromCounter(input?.current, input?.previous, config);
    case 'json':
    default: {
      const rows = Array.isArray(input) ? input : [input];
      return rows.map((r) => fromJsonEvent(r, config)).filter(Boolean);
    }
  }
};

module.exports = {
  DEFAULT_TYPE_MAP,
  DEFAULT_FIELD_MAP,
  buildEventId,
  parseTime,
  fromJsonEvent,
  fromDryContact,
  fromCounter,
  normalize
};
