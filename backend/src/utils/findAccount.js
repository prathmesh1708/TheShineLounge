const User = require('../models/User');
const Admin = require('../models/Admin');
const Staff = require('../models/Staff');
const { cached, invalidate } = require('../common/cache/memoryCache');

// One definition of "where a login can live".
//
// Accounts are spread over three collections: customers in `users`, the super
// admin in `admins`, and -- since staff were split out -- employees in `staff`.
// The auth endpoints each walked their own User -> Admin chain and none of them
// learned about Staff, so a staff member created through the admin UI was
// written to a collection that nothing authenticating ever read. They got
// "Invalid email or password" against a row that was sitting right there.
//
// Order matters only for the rare address that exists in more than one
// collection; Admin first preserves the previous behaviour.
const MODELS = [Admin, Staff, User];

// The three collections are searched in parallel, not one after another.
//
// Serially, a staff or customer account cost two or three Atlas round trips
// before the route handler had run a single line -- and authMiddleware runs on
// every protected request, so the admin dashboard's ~20 parallel calls were
// each paying up to ~450ms of pure latency just to establish who was asking.
// In parallel the lookup costs one round trip. Resolving the hit by position in
// MODELS rather than by who replied first keeps the result identical to the old
// serial walk for the rare address that exists in two collections.
const firstMatch = async (buildQuery) => {
  const results = await Promise.all(MODELS.map((Model) => buildQuery(Model)));
  return results.find(Boolean) || null;
};

const findAccountByEmail = async (email, { withPassword = false } = {}) => {
  const cleanEmail = String(email || '').toLowerCase().trim();
  if (!cleanEmail) return null;

  return firstMatch((Model) => {
    const query = Model.findOne({ email: cleanEmail, isDeleted: { $ne: true } });
    if (withPassword) query.select('+password');
    return query.exec();
  });
};

// How long an authenticated identity may be reused without re-reading it.
//
// This is the one cache here with a security edge, so it is kept deliberately
// tight: deactivating or deleting an account takes effect within this window at
// the worst, and permission changes are bounded by it too. Five seconds is long
// enough to collapse a whole dashboard page load into a single lookup and short
// enough that a revoked session cannot be used meaningfully past revocation.
const ACCOUNT_TTL_MS = 5000;

// What is cached is a plain snapshot plus the collection it came from -- never
// a live mongoose document. Handing the same document instance to concurrent
// requests would make req.user shared mutable state: one request assigning a
// field, or calling save(), would be visible to every other request holding it.
// hydrate() rebuilds an independent, fully functional document from the
// snapshot on each call, so callers keep a document that behaves exactly as the
// uncached one did, including save().
//
// Fields the schema marks `select: false` -- `password` on all three models --
// never come back from a find(), and so are absent from the snapshot too.
//
// hydrate() has to be told that, because a document built from a plain object
// otherwise believes every path was loaded. It would then treat the missing
// password as "this account has no password": validation would reject a save()
// for a required field, and an update could write the absence back out. Handing
// hydrate() the same exclusion projection the query effectively used marks
// those paths unselected, exactly as a real find() leaves them.
const UNSELECTED = new Map(MODELS.map((Model) => {
  const projection = {};
  Model.schema.eachPath((pathName, schemaType) => {
    if (schemaType.options && schemaType.options.select === false) {
      projection[pathName] = 0;
    }
  });
  return [Model.modelName, projection];
}));

// Not firstMatch(): a lean row carries no trace of which model produced it, and
// hydrating needs that. Keeping the results positional recovers it for free.
const loadAccountSnapshot = async (id) => {
  const results = await Promise.all(MODELS.map((Model) =>
    Model.findOne({ _id: id, isDeleted: { $ne: true } }).lean().exec()
  ));

  const index = results.findIndex(Boolean);
  if (index === -1) return null;
  return { modelName: MODELS[index].modelName, doc: results[index] };
};

const findAccountById = async (id) => {
  if (!id) return null;

  const snapshot = await cached(
    `account:${String(id)}`,
    ACCOUNT_TTL_MS,
    () => loadAccountSnapshot(id)
  );
  if (!snapshot) return null;

  const Model = MODELS.find((m) => m.modelName === snapshot.modelName);
  if (!Model) return null;
  return Model.hydrate(snapshot.doc, UNSELECTED.get(Model.modelName));
};

// Forget a cached identity immediately. The handlers that deactivate, delete or
// re-permission an account call this so the change bites on the next request
// rather than waiting out the TTL.
const invalidateAccount = (id) => {
  if (id) invalidate(`account:${String(id)}`);
};

module.exports = { findAccountByEmail, findAccountById, invalidateAccount };
