const { config, validate } = require('./config');
const { EventQueue } = require('./queue');
const { Forwarder } = require('./forwarder');
const { AnprPoller } = require('./pollers/anprPoller');
const { TunnelReceiver } = require('./receivers/tunnelReceiver');

// The on-site bridge. Runs on a small box on the same LAN as the cameras and the
// tunnel controller, and is the only thing that ever talks to them. It holds no
// customer data — it reads device events, normalises them, and forwards them to
// the cloud over an authenticated channel.

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const threshold = LEVELS[config.logLevel] ?? LEVELS.info;
const stamp = () => new Date().toISOString();
const logger = {
  error: (...a) => threshold >= 0 && console.error(stamp(), ...a),
  warn: (...a) => threshold >= 1 && console.warn(stamp(), ...a),
  info: (...a) => threshold >= 2 && console.log(stamp(), ...a),
  debug: (...a) => threshold >= 3 && console.log(stamp(), ...a)
};

const main = async () => {
  const problems = validate();
  if (problems.length) {
    logger.error('Configuration is incomplete:');
    for (const p of problems) logger.error(`  - ${p}`);
    process.exit(1);
  }

  logger.info(`TSL edge connector starting as "${config.cloud.deviceId}" -> ${config.cloud.baseUrl}`);

  const queue = new EventQueue(config.queue);
  const backlog = queue.size();
  if (backlog) logger.warn(`${backlog} event(s) carried over from the last run`);

  const forwarder = new Forwarder({
    queue,
    cloud: config.cloud,
    batchSize: config.queue.batchSize,
    logger
  });

  // Fail fast on a bad secret or an unreachable server, rather than silently
  // filling the queue for hours.
  try {
    const probe = await forwarder.health();
    if (probe.status === 200) {
      logger.info('Cloud reachable and device credentials accepted.');
    } else {
      logger.error(`Cloud probe returned ${probe.status}: ${probe.body?.message || probe.text}`);
      logger.error('Continuing anyway — events will queue on disk until this is fixed.');
    }
  } catch (error) {
    logger.error(`Cloud unreachable at startup (${error.message}). Events will queue on disk.`);
  }

  forwarder.start(config.queue.flushIntervalMs);

  const parts = [];

  if (config.anpr.enabled) {
    const poller = new AnprPoller({ config: config.anpr, queue, logger });
    poller.start();
    parts.push(poller);
  } else {
    logger.warn('ANPR poller disabled.');
  }

  if (config.tunnel.enabled) {
    const receiver = new TunnelReceiver({ config: config.tunnel, queue, logger });
    receiver.start();
    parts.push(receiver);
  } else {
    logger.warn('Tunnel receiver disabled — waiting on the controller interface spec.');
  }

  // A regular heartbeat is how the cloud tells "no cars today" apart from
  // "the connector died three hours ago".
  const heartbeat = setInterval(() => {
    queue.enqueue({
      eventId: `heartbeat:${config.cloud.deviceId}:${Date.now()}`,
      source: 'manual',
      type: 'heartbeat',
      occurredAt: new Date().toISOString(),
      deviceId: config.cloud.deviceId,
      raw: { queueDepth: queue.size(), lastSuccessAt: forwarder.lastSuccessAt }
    });
  }, config.heartbeatIntervalMs);
  heartbeat.unref?.();

  const shutdown = async (signal) => {
    logger.info(`${signal} received — draining before exit.`);
    clearInterval(heartbeat);
    for (const part of parts) part.stop();
    forwarder.stop();
    try {
      await forwarder.drain();
    } catch (error) {
      logger.warn(`Final drain failed: ${error.message}`);
    }
    const left = queue.size();
    if (left) logger.warn(`${left} event(s) remain queued on disk and will be sent on next start.`);
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  logger.info('Connector running.');
};

main().catch((error) => {
  logger.error('Fatal startup error:', error);
  process.exit(1);
});
