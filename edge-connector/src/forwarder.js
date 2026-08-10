const crypto = require('node:crypto');

// Drains the queue to the cloud, signing every request the way
// backend/src/integrations/integrations.middleware.js expects.
//
// The contract that makes retrying safe: every event carries a deterministic
// eventId, and the server rejects a repeat by unique index. So on any doubt —
// timeout, 5xx, connection reset — the connector resends rather than risking a
// lost wash. Duplicates are free; losses are not.

const sign = (secret, deviceId, timestamp, body) =>
  crypto.createHmac('sha256', secret).update(`${deviceId}.${timestamp}.${body}`).digest('hex');

class Forwarder {
  constructor({ queue, cloud, batchSize = 50, logger = console }) {
    this.queue = queue;
    this.cloud = cloud;
    this.batchSize = batchSize;
    this.logger = logger;
    this.consecutiveFailures = 0;
    this.lastSuccessAt = null;
    this.draining = false;
  }

  async #post(path, body) {
    const raw = body === undefined ? '' : JSON.stringify(body);
    const timestamp = String(Date.now());

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.cloud.timeoutMs);

    try {
      const res = await fetch(`${this.cloud.baseUrl}${path}`, {
        method: body === undefined ? 'GET' : 'POST',
        headers: {
          'content-type': 'application/json',
          'x-tsl-device-id': this.cloud.deviceId,
          'x-tsl-timestamp': timestamp,
          'x-tsl-signature': sign(this.cloud.deviceSecret, this.cloud.deviceId, timestamp, raw)
        },
        body: body === undefined ? undefined : raw,
        signal: controller.signal
      });
      const text = await res.text();
      let json = null;
      try { json = JSON.parse(text); } catch { /* server returned non-JSON */ }
      return { status: res.status, body: json, text };
    } finally {
      clearTimeout(timer);
    }
  }

  async health() {
    return this.#post('/api/integrations/health', undefined);
  }

  // One drain pass. Returns the number of events acknowledged.
  async drain() {
    if (this.draining) return 0;
    this.draining = true;

    try {
      let sent = 0;

      for (;;) {
        const items = this.queue.peek(this.batchSize);
        if (!items.length) break;

        let response;
        try {
          response = await this.#post('/api/integrations/events', {
            events: items.map((i) => i.event)
          });
        } catch (error) {
          // Network failure — keep everything queued and try again next tick.
          this.consecutiveFailures += 1;
          this.logger.warn(`[forwarder] send failed (${error.name}): ${error.message}`);
          break;
        }

        // 4xx other than 429 means the server will never accept these events;
        // resending forever would wedge the queue behind a poison batch.
        if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          this.logger.error(
            `[forwarder] server rejected a batch (${response.status}): ${response.body?.message || response.text}`
          );
          this.queue.ack(items.map((i) => i.name));
          this.consecutiveFailures = 0;
          continue;
        }

        // 200 = all good, 207 = some events failed server-side. In both cases
        // the events were received and recorded, so they leave the queue; the
        // failures are visible in the DeviceEvent log for an operator.
        if (response.status === 200 || response.status === 207) {
          this.queue.ack(items.map((i) => i.name));
          sent += items.length;
          this.consecutiveFailures = 0;
          this.lastSuccessAt = new Date();
          if (response.body?.failed) {
            this.logger.warn(`[forwarder] ${response.body.failed} event(s) failed server-side`);
          }
          continue;
        }

        // 5xx or 429 — server-side and probably temporary. Hold and retry.
        this.consecutiveFailures += 1;
        this.logger.warn(`[forwarder] server returned ${response.status}, will retry`);
        break;
      }

      return sent;
    } finally {
      this.draining = false;
    }
  }

  start(intervalMs) {
    this.timer = setInterval(() => {
      this.drain().catch((e) => this.logger.error(`[forwarder] ${e.message}`));
    }, intervalMs);
    this.timer.unref?.();
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
  }
}

module.exports = { Forwarder, sign };
