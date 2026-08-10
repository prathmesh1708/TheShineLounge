const http = require('node:http');
const crypto = require('node:crypto');

const adapter = require('../../../backend/src/integrations/adapters/tunnelWashAdapter');
const { parseContactChannels } = require('../config');

// Accepts wash-cycle events from the tunnel controller by whichever route it
// supports. Until the distributor answers §3 of the requirements document, all
// three paths are wired and selected by TUNNEL_MODE:
//
//   webhook   the controller POSTs to us (preferred — lowest latency)
//   poll      we POST to it on a timer
//   counter   we read a rising wash total and derive completions
//
// Whichever arrives, it goes through tunnelWashAdapter and comes out as the same
// canonical event, so nothing downstream knows or cares which one is in use.

const readBody = (req, limitBytes = 256 * 1024) => new Promise((resolve, reject) => {
  let size = 0;
  const chunks = [];
  req.on('data', (chunk) => {
    size += chunk.length;
    if (size > limitBytes) {
      reject(new Error('Payload too large'));
      req.destroy();
      return;
    }
    chunks.push(chunk);
  });
  req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  req.on('error', reject);
});

const timingSafeEqual = (a, b) => {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  if (x.length !== y.length) return false;
  return crypto.timingSafeEqual(x, y);
};

class TunnelReceiver {
  constructor({ config, queue, logger = console }) {
    this.config = config;
    this.queue = queue;
    this.logger = logger;
    this.previousCounter = null;
    this.stats = { received: 0, accepted: 0, rejected: 0 };

    this.adapterConfig = {
      mode: config.mode,
      defaultLaneId: config.defaultLaneId,
      laneId: config.defaultLaneId,
      channels: parseContactChannels(config.contactChannels),
      fieldMap: config.fieldMap,
      typeMap: config.typeMap
    };
  }

  #accept(payload) {
    const events = adapter.normalize(payload, { ...this.adapterConfig, now: new Date() });
    let queued = 0;
    for (const event of events) {
      if (this.queue.enqueue(event)) {
        queued += 1;
        this.logger.info(`[tunnel] ${event.type} cycle=${event.cycleId || '-'} plate=${event.plate || '-'}`);
      } else {
        this.logger.error('[tunnel] queue is full — event dropped');
      }
    }
    this.stats.accepted += queued;
    return queued;
  }

  startWebhook() {
    this.server = http.createServer(async (req, res) => {
      const reply = (status, body) => {
        res.writeHead(status, { 'content-type': 'application/json' });
        res.end(JSON.stringify(body));
      };

      if (req.method !== 'POST' || !req.url.startsWith(this.config.webhookPath)) {
        return reply(404, { error: 'not found' });
      }

      // A shared token is the most a PLC vendor will usually implement. The
      // listener is bound to the site LAN, never the internet.
      if (this.config.webhookToken) {
        const presented = req.headers['x-auth-token'] || req.headers.authorization || '';
        const bare = String(presented).replace(/^Bearer\s+/i, '');
        if (!timingSafeEqual(bare, this.config.webhookToken)) {
          this.stats.rejected += 1;
          return reply(401, { error: 'unauthorized' });
        }
      }

      let payload;
      try {
        payload = JSON.parse(await readBody(req));
      } catch (error) {
        this.stats.rejected += 1;
        return reply(400, { error: error.message });
      }

      this.stats.received += 1;
      const queued = this.#accept(payload);

      // Always 200 once the event is durably queued: the controller must not
      // retry into a queue that already holds the event.
      return reply(200, { ok: true, queued });
    });

    this.server.listen(this.config.webhookPort, () => {
      this.logger.info(
        `[tunnel] webhook listening on :${this.config.webhookPort}${this.config.webhookPath} (mode=${this.config.mode})`
      );
    });
  }

  async pollOnce() {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const res = await fetch(this.config.pollUrl, { signal: controller.signal });
      const text = await res.text();
      let payload;
      try { payload = JSON.parse(text); } catch { return; }

      if (this.config.mode === 'counter') {
        const current = Number(payload.count ?? payload.total ?? payload.washCount);
        const events = adapter.fromCounter(current, this.previousCounter, {
          laneId: this.config.defaultLaneId,
          now: new Date()
        });
        // Only advance the baseline once the derived events are safely queued,
        // so a crash mid-poll re-derives them rather than skipping them.
        for (const event of events) this.queue.enqueue(event);
        this.previousCounter = Number.isFinite(current) ? current : this.previousCounter;
        this.stats.accepted += events.length;
        return;
      }

      this.#accept(payload);
    } finally {
      clearTimeout(timer);
    }
  }

  startPolling() {
    this.logger.info(`[tunnel] polling ${this.config.pollUrl} every ${this.config.pollIntervalMs}ms (mode=${this.config.mode})`);
    this.pollTimer = setInterval(() => {
      this.pollOnce().catch((e) => this.logger.warn(`[tunnel] poll failed: ${e.message}`));
    }, this.config.pollIntervalMs);
    this.pollTimer.unref?.();
  }

  start() {
    if (this.config.webhookPort) this.startWebhook();
    if (this.config.pollUrl) this.startPolling();
  }

  stop() {
    if (this.pollTimer) clearInterval(this.pollTimer);
    if (this.server) this.server.close();
  }
}

module.exports = { TunnelReceiver };
