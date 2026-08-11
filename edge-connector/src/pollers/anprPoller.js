const adapter = require('../../../backend/src/integrations/adapters/parkingAnprAdapter');

// Polls the parking/ANPR system and enqueues canonical events.
//
// Two loops, deliberately:
//
//   fast    getPushNotification per channel, roughly once a second. This is the
//           live path — it is what makes a booking flip to "Vehicle Received"
//           while the driver is still at the barrier.
//
//   sweep   getCarIn / getCarOut over the last half hour, every few minutes.
//           getPushNotification reports only the most recent vehicle at a
//           channel rather than a queue, so two cars arriving inside one poll
//           interval lose one. The sweep backfills it. Deterministic event ids
//           mean a crossing already forwarded is dropped server-side, so the
//           overlap costs nothing.

const postJson = async (url, body, timeoutMs = 8000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal
    });
    const text = await res.text();
    try { return JSON.parse(text); } catch { return null; }
  } finally {
    clearTimeout(timer);
  }
};

// The vendor's documented format: "2025-01-02 15:50:45", device-local.
const vendorTimestamp = (date) => {
  const p = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())} `
    + `${p(date.getHours())}:${p(date.getMinutes())}:${p(date.getSeconds())}`;
};

class AnprPoller {
  constructor({ config, queue, logger = console }) {
    this.config = config;
    this.queue = queue;
    this.logger = logger;
    this.channelMap = adapter.parseChannelMap(config.channels);
    this.macs = Object.keys(this.channelMap);
    // Last event id seen per channel, so a stationary car parked over the loop
    // is not re-enqueued every second.
    this.lastSeen = new Map();
    this.stats = { pushed: 0, swept: 0, errors: 0 };
  }

  #enqueue(event) {
    if (!event) return false;
    if (this.queue.enqueue(event)) return true;
    this.logger.error('[anpr] queue is full — event dropped');
    return false;
  }

  async pollChannel(mac) {
    const url = `${this.config.baseUrl}/yard/third/getPushNotification?channelMac=${encodeURIComponent(mac)}`;
    const payload = await postJson(url);
    if (!payload) return;

    const event = adapter.fromPushNotification(payload, {
      channelMap: this.channelMap,
      channelMac: mac,
      now: new Date()
    });
    if (!event) return;

    if (this.lastSeen.get(mac) === event.eventId) return;
    this.lastSeen.set(mac, event.eventId);

    if (this.#enqueue(event)) {
      this.stats.pushed += 1;
      this.logger.info(`[anpr] ${event.type} ${event.plate} at ${event.laneId}`);
    }
  }

  async pollOnce() {
    for (const mac of this.macs) {
      try {
        await this.pollChannel(mac);
      } catch (error) {
        this.stats.errors += 1;
        this.logger.warn(`[anpr] poll ${mac} failed: ${error.message}`);
      }
    }
  }

  async sweepOnce() {
    const now = new Date();
    const since = new Date(now.getTime() - this.config.reconcileLookbackMs);

    for (const [endpoint, direction] of [['getCarIn', 'in'], ['getCarOut', 'out']]) {
      try {
        const payload = await postJson(`${this.config.baseUrl}/yard/third/${endpoint}`, {
          pageNum: 1,
          pageSize: 100,
          startTime: vendorTimestamp(since),
          endTime: vendorTimestamp(now)
        });
        if (!payload) continue;

        const events = adapter.fromAccessRecords(payload, { direction, now });
        for (const event of events) {
          if (this.#enqueue(event)) this.stats.swept += 1;
        }
      } catch (error) {
        this.stats.errors += 1;
        this.logger.warn(`[anpr] sweep ${endpoint} failed: ${error.message}`);
      }
    }
  }

  start() {
    if (!this.macs.length) {
      this.logger.warn('[anpr] no channels configured — poller idle');
      return;
    }
    this.logger.info(`[anpr] polling ${this.macs.length} channel(s) every ${this.config.pollIntervalMs}ms`);

    this.pollTimer = setInterval(() => {
      this.pollOnce().catch((e) => this.logger.error(`[anpr] ${e.message}`));
    }, this.config.pollIntervalMs);

    this.sweepTimer = setInterval(() => {
      this.sweepOnce().catch((e) => this.logger.error(`[anpr] ${e.message}`));
    }, this.config.reconcileIntervalMs);

    this.pollTimer.unref?.();
    this.sweepTimer.unref?.();
  }

  stop() {
    if (this.pollTimer) clearInterval(this.pollTimer);
    if (this.sweepTimer) clearInterval(this.sweepTimer);
  }
}

module.exports = { AnprPoller, vendorTimestamp };
