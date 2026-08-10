// One-time migration: populate the normalised plate columns on data that
// predates them, and initialise the membership balance fields.
//
// Existing vehicles and bookings were written before plateNormalized existed,
// so an ANPR arrival would match none of them. Run once before enabling the
// integration:
//
//   node src/utils/backfillPlateNormalization.js          # report only
//   node src/utils/backfillPlateNormalization.js --apply  # write changes
//
// Safe to re-run: every write is idempotent.

const mongoose = require('mongoose');
const { MONGO_URI } = require('../common/config/env');
const User = require('../models/User');
const Booking = require('../models/Booking');
const { normalizePlate } = require('../utils/plateNormalizer');

const backfillBookings = async (apply) => {
  const cursor = Booking.find({ serviceKey: 'car-wash' }).cursor();
  let scanned = 0;
  let changed = 0;

  for await (const booking of cursor) {
    scanned += 1;
    const expected = normalizePlate(booking.vehicleNo);
    if (booking.vehicleNoNormalized === expected) continue;
    changed += 1;
    if (apply) {
      await Booking.collection.updateOne(
        { _id: booking._id },
        { $set: { vehicleNoNormalized: expected } }
      );
    }
  }
  return { scanned, changed };
};

const backfillVehicles = async (apply) => {
  const cursor = User.find({ 'vehicles.0': { $exists: true } }).cursor();
  let scanned = 0;
  let changed = 0;

  for await (const user of cursor) {
    scanned += 1;
    const vehicles = (user.vehicles || []).map((v) => ({
      ...(v.toObject ? v.toObject() : v),
      plateNormalized: normalizePlate(v.plateNumber)
    }));
    const drifted = vehicles.some((v, i) => v.plateNormalized !== user.vehicles[i].plateNormalized);
    if (!drifted) continue;
    changed += 1;
    if (apply) {
      await User.collection.updateOne({ _id: user._id }, { $set: { vehicles } });
    }
  }
  return { scanned, changed };
};

// Members created before the balance fields existed have no washesRemaining.
// Seeding it from maxPerMonth is the only defensible default: it is what the
// plan already promised them.
const backfillMembershipBalances = async (apply) => {
  const query = {
    'membership.planName': { $nin: ['', null] },
    'membership.status': { $in: ['Active', 'Due for Renewal'] },
    $or: [
      { 'membership.washesRemaining': null },
      { 'membership.washesRemaining': { $exists: false } }
    ]
  };

  const users = await User.find(query);
  if (apply) {
    for (const user of users) {
      const perMonth = Number(user.membership?.maxPerMonth);
      await User.collection.updateOne(
        { _id: user._id },
        {
          $set: {
            'membership.washesRemaining': Number.isFinite(perMonth) && perMonth > 0 ? perMonth : null,
            'membership.unlimited': !Number.isFinite(perMonth) || perMonth <= 0,
            'membership.usageCountMonth': 0,
            'membership.usageDayKey': '',
            'membership.usageMonthKey': ''
          }
        }
      );
    }
  }
  return { scanned: users.length, changed: users.length };
};

// Plates that resolve to the same normalised value from different accounts will
// make every arrival ambiguous. Better to find them now than at the gate.
const findPlateCollisions = async () => {
  return User.aggregate([
    { $unwind: '$vehicles' },
    { $match: { 'vehicles.plateNormalized': { $nin: ['', null] }, isDeleted: { $ne: true } } },
    { $group: { _id: '$vehicles.plateNormalized', users: { $addToSet: '$email' } } },
    { $match: { 'users.1': { $exists: true } } },
    { $sort: { _id: 1 } }
  ]);
};

const run = async () => {
  const apply = process.argv.includes('--apply');

  await mongoose.connect(MONGO_URI);
  console.log(`Connected. Mode: ${apply ? 'APPLY' : 'DRY RUN'}\n`);

  const bookings = await backfillBookings(apply);
  console.log(`Bookings   scanned ${bookings.scanned}, needing update ${bookings.changed}`);

  const vehicles = await backfillVehicles(apply);
  console.log(`Customers  scanned ${vehicles.scanned}, needing update ${vehicles.changed}`);

  const balances = await backfillMembershipBalances(apply);
  console.log(`Memberships without a balance: ${balances.scanned}`);

  const collisions = await findPlateCollisions();
  if (collisions.length) {
    console.log(`\nWARNING: ${collisions.length} plate(s) registered to more than one account.`);
    console.log('Every arrival on these will be sent for manual review until resolved:');
    for (const c of collisions) console.log(`  ${c._id} -> ${c.users.join(', ')}`);
  } else {
    console.log('\nNo duplicate plate registrations found.');
  }

  if (!apply) console.log('\nDry run only. Re-run with --apply to write changes.');

  await mongoose.disconnect();
};

if (require.main === module) {
  run().catch((error) => {
    console.error('Backfill failed:', error);
    process.exit(1);
  });
}

module.exports = {
  backfillBookings,
  backfillVehicles,
  backfillMembershipBalances,
  findPlateCollisions
};
