// All configuration comes from the environment so the same build runs on every
// site. Nothing here is site-specific at build time.

const int = (value, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const bool = (value, fallback = false) => {
  if (value === undefined || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
};

const config = {
  // Where events are forwarded.
  cloud: {
    baseUrl: process.env.TSL_CLOUD_URL || 'http://localhost:5005',
    deviceId: process.env.TSL_DEVICE_ID || 'edge-connector-1',
    deviceSecret: process.env.TSL_DEVICE_SECRET || '',
    timeoutMs: int(process.env.TSL_CLOUD_TIMEOUT_MS, 15_000)
  },

  // The parking / ANPR system described in the vendor's interface document.
  anpr: {
    enabled: bool(process.env.ANPR_ENABLED, true),
    baseUrl: process.env.ANPR_BASE_URL || 'http://192.168.1.169:9001',
    // "MAC:role[:laneId]" pairs. Roles: entry, exit, tunnel-entry, tunnel-exit.
    channels: process.env.ANPR_CHANNELS || '',
    // getPushNotification returns only the most recent vehicle rather than a
    // queue, so the interval has to be shorter than the gap between two cars.
    pollIntervalMs: int(process.env.ANPR_POLL_INTERVAL_MS, 1_000),
    // getCarIn/getCarOut replay: catches anything the fast poll missed.
    reconcileIntervalMs: int(process.env.ANPR_RECONCILE_INTERVAL_MS, 5 * 60_000),
    reconcileLookbackMs: int(process.env.ANPR_RECONCILE_LOOKBACK_MS, 30 * 60_000),
    photoBaseUrl: process.env.ANPR_PHOTO_BASE_URL || ''
  },

  // The tunnel controller. Mode is one of json | dry-contact | counter, and is
  // set once the distributor answers §3 of the requirements document.
  tunnel: {
    enabled: bool(process.env.TUNNEL_ENABLED, false),
    mode: process.env.TUNNEL_MODE || 'json',
    // Inbound webhook the controller posts to, when it supports one.
    webhookPort: int(process.env.TUNNEL_WEBHOOK_PORT, 0),
    webhookPath: process.env.TUNNEL_WEBHOOK_PATH || '/tunnel/events',
    webhookToken: process.env.TUNNEL_WEBHOOK_TOKEN || '',
    // Outbound poll, when it does not.
    pollUrl: process.env.TUNNEL_POLL_URL || '',
    pollIntervalMs: int(process.env.TUNNEL_POLL_INTERVAL_MS, 2_000),
    defaultLaneId: process.env.TUNNEL_LANE_ID || 'tunnel-1',
    // dry-contact mode: '1:wash.started,2:wash.completed'
    contactChannels: process.env.TUNNEL_CONTACT_CHANNELS || '1:wash.started,2:wash.completed'
  },

  queue: {
    // Events survive a restart or a WAN outage on disk, and are replayed in
    // order once the cloud is reachable again.
    dir: process.env.TSL_QUEUE_DIR || './queue',
    flushIntervalMs: int(process.env.TSL_FLUSH_INTERVAL_MS, 2_000),
    batchSize: int(process.env.TSL_BATCH_SIZE, 50),
    maxAttempts: int(process.env.TSL_MAX_ATTEMPTS, 0), // 0 = retry forever
    maxQueuedFiles: int(process.env.TSL_MAX_QUEUED, 50_000)
  },

  heartbeatIntervalMs: int(process.env.TSL_HEARTBEAT_INTERVAL_MS, 60_000),
  logLevel: process.env.TSL_LOG_LEVEL || 'info'
};

const parseContactChannels = (raw) => {
  const map = {};
  for (const pair of String(raw || '').split(',')) {
    const [channel, type] = pair.split(':').map((s) => (s || '').trim());
    if (channel && type) map[channel] = type;
  }
  return map;
};

const validate = () => {
  const problems = [];
  if (!config.cloud.deviceSecret) {
    problems.push('TSL_DEVICE_SECRET is required — events cannot be signed without it.');
  }
  if (config.anpr.enabled && !config.anpr.channels) {
    problems.push('ANPR_CHANNELS is required when ANPR_ENABLED is true.');
  }
  if (config.tunnel.enabled && !config.tunnel.webhookPort && !config.tunnel.pollUrl) {
    problems.push('TUNNEL_ENABLED needs either TUNNEL_WEBHOOK_PORT or TUNNEL_POLL_URL.');
  }
  return problems;
};

module.exports = { config, validate, parseContactChannels, int, bool };
