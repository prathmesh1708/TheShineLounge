// Process-local caching for reads that are expensive only because they cross
// the wire. Every query in this app goes to Atlas, so the cost of a read is
// dominated by round-trip latency, not by the work Mongo does. The admin
// dashboard opens ~20 requests at once and several of them re-read the same
// collections, which turns one page load into dozens of serial round trips.
//
// Two distinct problems, two tools:
//
//   dedupe()  — single-flight. Concurrent callers asking for the same key share
//               one in-flight promise. Nothing is ever held past the moment the
//               promise settles, so this cannot serve stale data at all. It is
//               what collapses React StrictMode's double-fired effects, and the
//               dashboard's parallel widgets, into one query.
//
//   cached()  — dedupe() plus a short TTL. Only for reads where a value a few
//               seconds old is indistinguishable from a fresh one, and always
//               paired with an invalidate() on the writes that would change it.
//
// Deliberately in-process: no Redis, no extra service, and on a serverless
// instance it simply starts empty. The TTLs are short enough that several
// instances disagreeing for a second or two does not matter.

const store = new Map();
const inFlight = new Map();

const now = () => Date.now();

// Single-flight only. Never retains a settled value.
const dedupe = (key, loader) => {
  const pending = inFlight.get(key);
  if (pending) return pending;

  // Via Promise.resolve so a loader that throws synchronously still rejects
  // the shared promise rather than blowing up the caller that got there first.
  const promise = Promise.resolve().then(loader).finally(() => {
    inFlight.delete(key);
  });
  inFlight.set(key, promise);
  return promise;
};

// Single-flight plus a TTL window, in milliseconds.
const cached = (key, ttlMs, loader) => {
  const hit = store.get(key);
  if (hit && hit.expiresAt > now()) return Promise.resolve(hit.value);

  return dedupe(key, async () => {
    const value = await loader();
    store.set(key, { value, expiresAt: now() + ttlMs });
    return value;
  });
};

// Drop one key, or every key under a `namespace:` prefix. Writes call this so
// the next read is guaranteed fresh rather than waiting out the TTL.
const invalidate = (keyOrPrefix) => {
  if (!keyOrPrefix) return;
  if (store.delete(keyOrPrefix)) return;
  const prefix = `${keyOrPrefix}:`;
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
};

const clearAll = () => {
  store.clear();
  inFlight.clear();
};

module.exports = { dedupe, cached, invalidate, clearAll };
