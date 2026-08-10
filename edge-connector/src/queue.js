const fs = require('node:fs');
const path = require('node:path');

// A durable, ordered, on-disk queue.
//
// Site internet drops. When it does, cars keep going through the tunnel and
// memberships keep being spent — those events cannot simply be lost. Each event
// is written to its own file named with a monotonic sequence, so ordering
// survives a restart and a partially written file can never be replayed as a
// truncated event (the write is atomic via rename).

class EventQueue {
  constructor({ dir, maxQueuedFiles = 50_000 }) {
    this.dir = path.resolve(dir);
    this.tmpDir = path.join(this.dir, '.tmp');
    this.maxQueuedFiles = maxQueuedFiles;
    this.counter = 0;
    fs.mkdirSync(this.dir, { recursive: true });
    fs.mkdirSync(this.tmpDir, { recursive: true });
    this.#recoverTemps();
  }

  // A crash mid-write leaves a partial file in .tmp. It was never visible to
  // readers, so discarding it is safe and keeps the queue clean.
  #recoverTemps() {
    for (const name of fs.readdirSync(this.tmpDir)) {
      fs.unlinkSync(path.join(this.tmpDir, name));
    }
  }

  #nextName() {
    this.counter += 1;
    // Timestamp first so lexical order is chronological; counter and random
    // suffix break ties within the same millisecond.
    const stamp = String(Date.now()).padStart(14, '0');
    const seq = String(this.counter).padStart(6, '0');
    return `${stamp}-${seq}-${Math.random().toString(36).slice(2, 8)}.json`;
  }

  size() {
    return fs.readdirSync(this.dir).filter((f) => f.endsWith('.json')).length;
  }

  // Returns false when the event was dropped because the queue is full.
  enqueue(event) {
    if (this.size() >= this.maxQueuedFiles) return false;

    const name = this.#nextName();
    const tmpPath = path.join(this.tmpDir, name);
    const finalPath = path.join(this.dir, name);

    // Write then rename: a reader never sees a half-written event.
    fs.writeFileSync(tmpPath, JSON.stringify(event), 'utf8');
    fs.renameSync(tmpPath, finalPath);
    return true;
  }

  // Oldest first, so events reach the server in the order they happened.
  peek(limit) {
    const names = fs.readdirSync(this.dir)
      .filter((f) => f.endsWith('.json'))
      .sort()
      .slice(0, limit);

    const items = [];
    for (const name of names) {
      const filePath = path.join(this.dir, name);
      try {
        items.push({ name, event: JSON.parse(fs.readFileSync(filePath, 'utf8')) });
      } catch {
        // Unparseable file: quarantine rather than blocking the queue forever.
        fs.renameSync(filePath, `${filePath}.corrupt`);
      }
    }
    return items;
  }

  ack(names) {
    for (const name of names) {
      try {
        fs.unlinkSync(path.join(this.dir, name));
      } catch {
        // Already removed — acking twice is not an error.
      }
    }
  }
}

module.exports = { EventQueue };
