// Cache keys that more than one module has to agree on.
//
// A model and the service that caches reads of it both need the key, and the
// service necessarily requires the model -- so the key cannot live in either
// without a require cycle. It lives here instead, where both can reach it.
module.exports = {
  // Whole-collection views used by the admin rollups. See services/*Snapshot.js.
  BOOKINGS_ROLLUP: 'bookings:rollup',
  CUSTOMER_DIRECTORY: 'customers:directory'
};
