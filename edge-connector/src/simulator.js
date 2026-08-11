#!/usr/bin/env node
const crypto = require('node:crypto');

// Stands in for the site hardware so the whole feature can be built, demonstrated
// and regression-tested before a single camera or tunnel controller is installed.
//
//   node src/simulator.js --plate MH01AB1234
//   node src/simulator.js --plate MH01AB1234 --abort   # fails mid-wash, never charged
//   node src/simulator.js --plate MH01AB1234 --void    # completes, then is voided
//   node src/simulator.js --plate MH01AB1234 --speed 20     # slow it down
//   node src/simulator.js --plate MH01AB1234 --replay       # send everything twice
//
// --abort and --void are different failures and exercise different code:
//   --abort  the cycle never finished, so no wash was ever taken off the plan
//   --void   the cycle finished and was charged, then voided — this is the one
//            that exercises the ledger reversal
//
// Talks to the same signed endpoint as the real connector, so a green run here
// exercises authentication, validation, matching, the state machine and
// membership consumption exactly as production will.

const args = process.argv.slice(2);
const flag = (name, fallback = undefined) => {
  const i = args.indexOf(`--${name}`);
  if (i === -1) return fallback;
  const next = args[i + 1];
  return next && !next.startsWith('--') ? next : true;
};

const baseUrl = flag('url', process.env.TSL_CLOUD_URL || 'http://localhost:5005');
const deviceId = flag('device', process.env.TSL_DEVICE_ID || 'edge-connector-1');
const secret = flag('secret', process.env.TSL_DEVICE_SECRET || '');
const plate = String(flag('plate', 'MH01AB1234'));
const lane = String(flag('lane', 'tunnel-1'));
const program = String(flag('program', 'PREMIUM'));
const stepSeconds = Number(flag('speed', 0)) || 0;
const abort = !!flag('abort', false);
const voidAfterComplete = !!flag('void', false);
const replay = !!flag('replay', false);

if (!secret) {
  console.error('A device secret is required: --secret <value> or TSL_DEVICE_SECRET.');
  process.exit(1);
}

const sign = (timestamp, body) =>
  crypto.createHmac('sha256', secret).update(`${deviceId}.${timestamp}.${body}`).digest('hex');

const send = async (events) => {
  const raw = JSON.stringify({ events });
  const timestamp = String(Date.now());

  const res = await fetch(`${baseUrl}/api/integrations/events`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-tsl-device-id': deviceId,
      'x-tsl-timestamp': timestamp,
      'x-tsl-signature': sign(timestamp, raw)
    },
    body: raw
  });

  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { body = text; }
  return { status: res.status, body };
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const run = async () => {
  const cycleId = `SIM-${Date.now()}`;
  const t0 = Date.now();

  const at = (offsetSeconds) => new Date(t0 + offsetSeconds * 1000).toISOString();
  const event = (type, source, offsetSeconds, extra = {}) => ({
    eventId: `sim:${cycleId}:${type}`,
    source,
    type,
    occurredAt: at(offsetSeconds),
    plate,
    laneId: lane,
    cycleId,
    programCode: program,
    ...extra
  });

  const script = [
    event('vehicle.entered', 'anpr', 0),
    event('wash.started', 'tunnel', 60),
    // A cycle that fails mid-wash never reaches completion, so nothing is ever
    // charged and there is nothing to reverse.
    ...(abort ? [event('wash.aborted', 'tunnel', 300, { reason: 'E-stop pressed' })] : []),
    ...(abort ? [] : [event('wash.completed', 'tunnel', 480)]),
    // A void arrives after the wash was completed and charged — this is what
    // drives a reversal on the membership ledger.
    ...(voidAfterComplete ? [event('wash.aborted', 'tunnel', 540, { reason: 'Wash voided by supervisor' })] : []),
    ...(abort || voidAfterComplete ? [] : [event('vehicle.exited', 'anpr', 600)])
  ];

  const mode = abort ? ' (aborted mid-wash)' : voidAfterComplete ? ' (completed, then voided)' : '';
  console.log(`Simulating cycle ${cycleId} for ${plate} on ${lane}${mode}\n`);

  for (const evt of script) {
    const result = await send([evt]);
    const line = result.body?.results?.[0] || {};
    console.log(
      `  ${evt.type.padEnd(18)} -> HTTP ${result.status}  ${line.duplicate ? 'DUPLICATE' : line.outcome || ''}`
    );
    if (result.status >= 400) {
      console.error('   ', JSON.stringify(result.body));
      process.exit(1);
    }
    if (stepSeconds) await sleep(stepSeconds * 1000);
  }

  if (replay) {
    console.log('\nReplaying the entire cycle — every event should come back DUPLICATE:');
    const result = await send(script);
    for (const line of result.body?.results || []) {
      console.log(`  ${String(line.eventId).padEnd(40)} ${line.duplicate ? 'DUPLICATE' : `NOT DEDUPED (${line.outcome})`}`);
    }
    const allDuplicate = (result.body?.results || []).every((r) => r.duplicate);
    console.log(allDuplicate ? '\nIdempotency holds.' : '\nWARNING: replay was not fully de-duplicated.');
  }

  console.log('\nDone. Check the customer app, the staff queue, and the membership balance.');
};

run().catch((error) => {
  console.error('Simulation failed:', error.message);
  process.exit(1);
});
