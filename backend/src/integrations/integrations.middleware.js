const crypto = require('crypto');
const { EVENT_TYPES } = require('./integrations.model');
const { normalizePlate } = require('../utils/plateNormalizer');

// Site hardware has no user account and no JWT. It authenticates as a device:
// a shared secret plus a signature over the exact bytes of the request. A bare
// API key would be enough to authenticate, but not to stop a captured request
// being replayed later — hence the timestamp and the signature.

const MAX_CLOCK_SKEW_MS = Number(process.env.INTEGRATION_MAX_SKEW_MS || 5 * 60 * 1000);

// { "edge-connector-1": "<secret>", ... } in the environment. Parsed once at
// load so a malformed value fails loudly at boot rather than at 3am.
const loadDeviceKeys = () => {
  const raw = process.env.INTEGRATION_DEVICE_KEYS;
  if (!raw || !raw.trim()) return {};
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('must be a JSON object of deviceId -> secret');
    }
    return parsed;
  } catch (error) {
    throw new Error(`INTEGRATION_DEVICE_KEYS is invalid: ${error.message}`);
  }
};

const DEVICE_KEYS = loadDeviceKeys();

const signPayload = (secret, deviceId, timestamp, body) =>
  crypto
    .createHmac('sha256', secret)
    .update(`${deviceId}.${timestamp}.${body}`)
    .digest('hex');

// Constant-time compare that tolerates unequal lengths without throwing.
const safeEqual = (a, b) => {
  const bufA = Buffer.from(String(a), 'utf8');
  const bufB = Buffer.from(String(b), 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
};

const deny = (res, message, code) =>
  res.status(401).json({ success: false, message, code });

const authenticateDevice = (req, res, next) => {
  const deviceId = req.get('x-tsl-device-id');
  const timestamp = req.get('x-tsl-timestamp');
  const signature = req.get('x-tsl-signature');

  if (!deviceId || !timestamp || !signature) {
    return deny(res, 'Device credentials missing.', 'MISSING_CREDENTIALS');
  }

  const secret = DEVICE_KEYS[deviceId];
  // Sign against a dummy secret for unknown devices so the response time does
  // not reveal which device ids exist.
  const effectiveSecret = secret || 'unknown-device-placeholder-secret';

  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) {
    return deny(res, 'Invalid timestamp header.', 'BAD_TIMESTAMP');
  }
  if (Math.abs(Date.now() - ts) > MAX_CLOCK_SKEW_MS) {
    return deny(res, 'Request timestamp outside the accepted window.', 'STALE_REQUEST');
  }

  // req.rawBody is captured by the express.json verify hook in the router. If
  // another parser ran first the stream is already consumed and rawBody is
  // gone — say so plainly instead of reporting a bogus signature mismatch.
  if (req.rawBody === undefined && req.body && Object.keys(req.body).length > 0) {
    return res.status(500).json({
      success: false,
      code: 'RAW_BODY_UNAVAILABLE',
      message: 'Raw request body was consumed before signature verification. '
        + 'Mount /api/integrations ahead of any global body parser.'
    });
  }

  const body = req.rawBody === undefined ? '' : req.rawBody;
  const expected = signPayload(effectiveSecret, deviceId, timestamp, body);

  if (!secret || !safeEqual(expected, signature)) {
    return deny(res, 'Signature verification failed.', 'BAD_SIGNATURE');
  }

  req.device = { id: deviceId };
  return next();
};

const isIsoish = (value) => {
  if (typeof value !== 'string' && !(value instanceof Date)) return false;
  const d = value instanceof Date ? value : new Date(value);
  return !Number.isNaN(d.getTime());
};

// Rejecting a malformed event at the door keeps garbage out of the ledger and
// gives the connector a precise reason to log.
const validateEvent = (event, index = 0) => {
  const at = (msg) => `event[${index}]: ${msg}`;

  if (!event || typeof event !== 'object' || Array.isArray(event)) {
    return at('must be an object');
  }
  if (typeof event.eventId !== 'string' || !event.eventId.trim()) {
    return at('eventId is required');
  }
  if (event.eventId.length > 200) {
    return at('eventId is too long');
  }
  if (!['anpr', 'tunnel', 'simulator', 'manual'].includes(event.source)) {
    return at(`source must be one of anpr, tunnel, simulator, manual (got ${event.source})`);
  }
  if (!EVENT_TYPES.includes(event.type)) {
    return at(`type must be one of ${EVENT_TYPES.join(', ')} (got ${event.type})`);
  }
  if (!isIsoish(event.occurredAt)) {
    return at('occurredAt must be a valid date');
  }
  // A plate is optional (heartbeats and dry-contact sites have none) but if one
  // is present it must be usable rather than a fragment.
  if (event.plate !== undefined && event.plate !== null && event.plate !== '') {
    if (typeof event.plate !== 'string' && typeof event.plate !== 'number') {
      return at('plate must be a string');
    }
    if (!normalizePlate(event.plate)) {
      return at('plate contains no alphanumeric characters');
    }
  }
  return null;
};

const MAX_BATCH = Number(process.env.INTEGRATION_MAX_BATCH || 200);

const validateEventBatch = (req, res, next) => {
  const body = req.body || {};
  const events = Array.isArray(body.events)
    ? body.events
    : (body.eventId ? [body] : null);

  if (!events) {
    return res.status(400).json({
      success: false,
      message: 'Request must contain an events array or a single event object.',
      code: 'NO_EVENTS'
    });
  }
  if (events.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'events array is empty.',
      code: 'EMPTY_BATCH'
    });
  }
  if (events.length > MAX_BATCH) {
    return res.status(413).json({
      success: false,
      message: `Batch too large: ${events.length} events, limit is ${MAX_BATCH}.`,
      code: 'BATCH_TOO_LARGE'
    });
  }

  for (let i = 0; i < events.length; i += 1) {
    const problem = validateEvent(events[i], i);
    if (problem) {
      return res.status(400).json({ success: false, message: problem, code: 'INVALID_EVENT' });
    }
  }

  req.events = events;
  return next();
};

module.exports = {
  DEVICE_KEYS,
  MAX_CLOCK_SKEW_MS,
  MAX_BATCH,
  loadDeviceKeys,
  signPayload,
  safeEqual,
  authenticateDevice,
  validateEvent,
  validateEventBatch
};
