const Booking = require('../models/Booking');
const Customer = require('../models/Customer');
const { cached } = require('../common/cache/memoryCache');
const { BOOKINGS_ROLLUP, CUSTOMER_DIRECTORY } = require('../common/cache/keys');
const { normalizePlate } = require('../utils/plateNormalizer');
const { isSaleOrCustomerBooking } = require('../utils/bookingKinds');

// Shared, short-lived views over whole collections.
//
// Several admin endpoints are defined in terms of "every booking there is":
// the registered-vehicle list filters the fleet down to cars with a real
// transaction behind them, and the customer list rolls bookings up into
// lifetime spend and garage contents. Each was independently pulling the entire
// collection across the wire on every request, so opening the dashboard --
// which fires both at once, and twice over under React StrictMode -- dragged
// the same collection down four times.
//
// Two things fix that without changing what any query means:
//
//   * a projection, so only the fields these rollups actually read travel;
//   * cached(), so simultaneous callers share one read.
//
// Freshness is not left to the TTL. The models carry invalidateOnWrite() hooks
// on these same keys, so a booking taken at the counter clears the view the
// moment it lands and the next refresh shows it exactly as before. The TTL is
// only a backstop for writes made by another process.
const SNAPSHOT_TTL_MS = 15000;

// Every field the rollups below read, and nothing else. Notably absent:
// receiptPdfBase64, an entire PDF per row, which was being dragged down with
// the customer rollup's copy of the collection and then thrown away.
const ROLLUP_FIELDS = [
  'bookingId', 'vehicleNo', 'vehicleType', 'vehicleDeregistered',
  'saleType', 'paymentMode', 'packageName', 'membershipName',
  'membershipExpiry', 'notes', 'customerName', 'customerEmail', 'phone',
  'price', 'location', 'date', 'createdAt'
].join(' ');

// Bookings as the rollups want them: newest first, lean, projected.
const getRollupBookings = () => cached(BOOKINGS_ROLLUP, SNAPSHOT_TTL_MS, () =>
  Booking.find({ isDeleted: { $ne: true } })
    .select(ROLLUP_FIELDS)
    .sort({ createdAt: -1 })
    .lean()
);

// The standalone customer records the admin list merges in alongside User rows.
const getCustomerDirectory = () => cached(CUSTOMER_DIRECTORY, SNAPSHOT_TTL_MS, () =>
  Customer.find({ isDeleted: { $ne: true } })
    .select('customerId fullName name email mobile phone city segment totalSpent loyaltyPoints createdAt updatedAt')
    .sort({ createdAt: -1 })
    .lean()
);

// The set of normalised plates with a real transaction behind them. Derived
// from the booking snapshot, so asking for both costs one read rather than two.
const getTransactedPlates = async () => {
  const bookings = await getRollupBookings();
  return new Set(
    bookings
      .filter(isSaleOrCustomerBooking)
      .map((b) => normalizePlate(b.vehicleNo))
      .filter(Boolean)
  );
};

module.exports = { getRollupBookings, getCustomerDirectory, getTransactedPlates };
