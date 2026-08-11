const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { EventQueue } = require('../src/queue');
const { Forwarder, sign } = require('../src/forwarder');

const tmpDir = () => fs.mkdtempSync(path.join(os.tmpdir(), 'tsl-queue-'));

const anEvent = (id) => ({
  eventId: id,
  source: 'anpr',
  type: 'vehicle.entered',
  occurredAt: new Date().toISOString(),
  plate: 'MH01AB1234'
});

// ── queue durability ───────────────────────────────────────────────────────

test('events come back in the order they were written', () => {
  const q = new EventQueue({ dir: tmpDir() });
  for (let i = 1; i <= 5; i += 1) q.enqueue(anEvent(`e${i}`));

  const items = q.peek(10);
  assert.deepEqual(items.map((i) => i.event.eventId), ['e1', 'e2', 'e3', 'e4', 'e5']);
});

test('acking removes only what was acked', () => {
  const q = new EventQueue({ dir: tmpDir() });
  q.enqueue(anEvent('a'));
  q.enqueue(anEvent('b'));

  const [first] = q.peek(1);
  q.ack([first.name]);

  assert.equal(q.size(), 1);
  assert.equal(q.peek(1)[0].event.eventId, 'b');
});

test('acking the same file twice is not an error', () => {
  const q = new EventQueue({ dir: tmpDir() });
  q.enqueue(anEvent('a'));
  const [item] = q.peek(1);
  q.ack([item.name]);
  q.ack([item.name]);
  assert.equal(q.size(), 0);
});

test('a queue survives the process restarting', () => {
  const dir = tmpDir();
  const first = new EventQueue({ dir });
  first.enqueue(anEvent('survivor'));

  // A whole new instance, as if the box had rebooted.
  const second = new EventQueue({ dir });
  assert.equal(second.size(), 1);
  assert.equal(second.peek(1)[0].event.eventId, 'survivor');
});

test('a crash mid-write leaves no partial event behind', () => {
  const dir = tmpDir();
  const q = new EventQueue({ dir });
  q.enqueue(anEvent('good'));

  // Simulate a process killed between writeFile and rename.
  fs.writeFileSync(path.join(dir, '.tmp', 'partial.json'), '{"eventId":"trunc');

  const recovered = new EventQueue({ dir });
  assert.equal(recovered.size(), 1, 'only the completed event is visible');
  assert.equal(recovered.peek(1)[0].event.eventId, 'good');
  assert.equal(fs.readdirSync(path.join(dir, '.tmp')).length, 0, 'the partial file is cleaned up');
});

test('a corrupt file is quarantined instead of blocking the queue forever', () => {
  const dir = tmpDir();
  const q = new EventQueue({ dir });
  q.enqueue(anEvent('first'));
  q.enqueue(anEvent('second'));

  const [head] = q.peek(1);
  fs.writeFileSync(path.join(dir, head.name), 'not json at all');

  const items = q.peek(10);
  assert.equal(items.length, 1);
  assert.equal(items[0].event.eventId, 'second');
  assert.ok(fs.existsSync(path.join(dir, `${head.name}.corrupt`)));
});

test('the queue refuses to grow without bound', () => {
  const q = new EventQueue({ dir: tmpDir(), maxQueuedFiles: 3 });
  assert.equal(q.enqueue(anEvent('1')), true);
  assert.equal(q.enqueue(anEvent('2')), true);
  assert.equal(q.enqueue(anEvent('3')), true);
  assert.equal(q.enqueue(anEvent('4')), false, 'reports the drop rather than failing silently');
  assert.equal(q.size(), 3);
});

test('events written in the same millisecond do not overwrite each other', () => {
  const q = new EventQueue({ dir: tmpDir() });
  for (let i = 0; i < 200; i += 1) q.enqueue(anEvent(`burst-${i}`));
  assert.equal(q.size(), 200);
});

// ── forwarder retry policy ─────────────────────────────────────────────────

const withStubbedFetch = async (impl, fn) => {
  const original = global.fetch;
  const calls = [];
  global.fetch = async (url, options) => {
    calls.push({ url, options });
    return impl(calls.length, { url, options });
  };
  try {
    return await fn(calls);
  } finally {
    global.fetch = original;
  }
};

const jsonResponse = (status, body) => ({
  status,
  text: async () => JSON.stringify(body)
});

const makeForwarder = (queue) => new Forwarder({
  queue,
  cloud: {
    baseUrl: 'http://cloud.test',
    deviceId: 'edge-1',
    deviceSecret: 'secret',
    timeoutMs: 1000
  },
  batchSize: 10,
  logger: { info() {}, warn() {}, error() {} }
});

test('a successful send clears the queue', async () => {
  const q = new EventQueue({ dir: tmpDir() });
  q.enqueue(anEvent('a'));
  q.enqueue(anEvent('b'));

  await withStubbedFetch(
    () => jsonResponse(200, { success: true, accepted: 2, duplicates: 0, failed: 0 }),
    async () => {
      const sent = await makeForwarder(q).drain();
      assert.equal(sent, 2);
    }
  );
  assert.equal(q.size(), 0);
});

test('a network failure keeps every event queued for the next attempt', async () => {
  const q = new EventQueue({ dir: tmpDir() });
  q.enqueue(anEvent('a'));

  await withStubbedFetch(
    () => { throw new Error('ECONNREFUSED'); },
    async () => {
      const sent = await makeForwarder(q).drain();
      assert.equal(sent, 0);
    }
  );
  assert.equal(q.size(), 1, 'a wash must never be lost to a dropped link');
});

test('a 5xx is retried rather than discarded', async () => {
  const q = new EventQueue({ dir: tmpDir() });
  q.enqueue(anEvent('a'));

  await withStubbedFetch(
    () => jsonResponse(503, { message: 'maintenance' }),
    async () => { await makeForwarder(q).drain(); }
  );
  assert.equal(q.size(), 1);
});

test('a 429 is retried rather than discarded', async () => {
  const q = new EventQueue({ dir: tmpDir() });
  q.enqueue(anEvent('a'));

  await withStubbedFetch(
    () => jsonResponse(429, { message: 'slow down' }),
    async () => { await makeForwarder(q).drain(); }
  );
  assert.equal(q.size(), 1);
});

test('a 400 is dropped so one poison batch cannot wedge the queue', async () => {
  const q = new EventQueue({ dir: tmpDir() });
  q.enqueue(anEvent('malformed'));
  q.enqueue(anEvent('fine'));

  await withStubbedFetch(
    (call) => (call === 1
      ? jsonResponse(400, { message: 'INVALID_EVENT' })
      : jsonResponse(200, { accepted: 2 })),
    async () => { await makeForwarder(q).drain(); }
  );
  assert.equal(q.size(), 0);
});

test('a 207 partial success still clears the batch', async () => {
  // The events were received and recorded; the failures are visible server-side.
  const q = new EventQueue({ dir: tmpDir() });
  q.enqueue(anEvent('a'));

  await withStubbedFetch(
    () => jsonResponse(207, { success: false, accepted: 0, failed: 1, results: [] }),
    async () => { await makeForwarder(q).drain(); }
  );
  assert.equal(q.size(), 0);
});

test('a recovered link drains the whole backlog in order', async () => {
  const q = new EventQueue({ dir: tmpDir() });
  for (let i = 1; i <= 25; i += 1) q.enqueue(anEvent(`e${i}`));

  await withStubbedFetch(
    () => jsonResponse(200, { accepted: 10 }),
    async (calls) => {
      const sent = await makeForwarder(q).drain();
      assert.equal(sent, 25);
      const order = calls.flatMap((c) => JSON.parse(c.options.body).events.map((e) => e.eventId));
      assert.equal(order[0], 'e1');
      assert.equal(order.at(-1), 'e25');
    }
  );
  assert.equal(q.size(), 0);
});

test('every request carries a signature over the exact bytes sent', async () => {
  const q = new EventQueue({ dir: tmpDir() });
  q.enqueue(anEvent('a'));

  await withStubbedFetch(
    () => jsonResponse(200, { accepted: 1 }),
    async (calls) => {
      await makeForwarder(q).drain();
      const { options } = calls[0];
      const expected = sign('secret', 'edge-1', options.headers['x-tsl-timestamp'], options.body);
      assert.equal(options.headers['x-tsl-signature'], expected);
      assert.equal(options.headers['x-tsl-device-id'], 'edge-1');
    }
  );
});

test('overlapping drains do not send the same event twice', async () => {
  const q = new EventQueue({ dir: tmpDir() });
  for (let i = 0; i < 5; i += 1) q.enqueue(anEvent(`e${i}`));

  await withStubbedFetch(
    async () => {
      await new Promise((r) => setTimeout(r, 20));
      return jsonResponse(200, { accepted: 5 });
    },
    async (calls) => {
      const forwarder = makeForwarder(q);
      await Promise.all([forwarder.drain(), forwarder.drain()]);
      const ids = calls.flatMap((c) => JSON.parse(c.options.body).events.map((e) => e.eventId));
      assert.equal(new Set(ids).size, ids.length, 'no event appears in two requests');
    }
  );
});
