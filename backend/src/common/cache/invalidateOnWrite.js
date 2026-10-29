const { invalidate } = require('./memoryCache');

// Attach "drop these cache keys whenever this collection is written" to a
// schema.
//
// It has to be called on the schema *before* mongoose.model() compiles it --
// middleware registered after compilation never runs -- which is why this is
// wired up inside the model files rather than next to the caches themselves.
//
// Putting invalidation on the model instead of in the handlers means a write
// from anywhere refreshes the cached views: a counter sale, a customer booking,
// the POS, a backfill script. No caller has to know a cache exists.
const WRITE_HOOKS = [
  'save', 'insertMany', 'findOneAndUpdate', 'findOneAndDelete',
  'updateOne', 'updateMany', 'deleteOne', 'deleteMany'
];

const invalidateOnWrite = (schema, ...keys) => {
  const drop = () => keys.forEach(invalidate);
  for (const hook of WRITE_HOOKS) {
    // `post` so the cache is dropped once the write has actually landed; a
    // reader racing in between simply re-reads and re-populates.
    schema.post(hook, drop);
  }
  return schema;
};

module.exports = invalidateOnWrite;
