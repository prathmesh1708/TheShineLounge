const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Integration tests run against a throwaway in-memory mongod, never the project's
// Atlas cluster. Real indexes and real unique-key violations are the entire point
// of these tests — the idempotency guarantees cannot be proven with fakes.

let server = null;

const start = async () => {
  server = await MongoMemoryServer.create();
  await mongoose.connect(server.getUri(), { dbName: 'tsl-integration-test' });
  // Unique and partial indexes are what enforce exactly-once membership
  // consumption, so they must exist before the first assertion.
  await Promise.all(mongoose.modelNames().map((name) => mongoose.model(name).syncIndexes()));
};

const stop = async () => {
  await mongoose.disconnect();
  if (server) await server.stop();
  server = null;
};

const clear = async () => {
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
};

module.exports = { start, stop, clear };
