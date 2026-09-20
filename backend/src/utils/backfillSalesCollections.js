// Backfills the offlinesales and memberships collections from bookings that
// already carry isOfflineSale / saleType: 'membership'.
//
// New sales mirror themselves as they are created (see services/salesRegistry.js);
// this is the one-off catch-up for rows written before that existed. Idempotent --
// both mirrors key off the booking id -- so running it twice changes nothing.
//
//   npm run backfill:sales

require('dotenv').config();
const mongoose = require('mongoose');
const { MONGO_URI } = require('../common/config/env');
const Booking = require('../models/Booking');
const {
  mirrorOfflineSale,
  mirrorMembershipPass,
  isOfflineSaleBooking,
  isMembershipBooking
} = require('../services/salesRegistry');

const run = async () => {
  const conn = await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 15000 });
  console.log(`MongoDB connected: ${conn.connection.host} (db: ${conn.connection.name})`);

  const bookings = await Booking.find({ isDeleted: { $ne: true } }).lean();
  console.log(`\nScanning ${bookings.length} booking(s)...\n`);

  let sales = 0;
  let passes = 0;

  for (const b of bookings) {
    const label = (b.bookingId || b._id).toString().padEnd(14);

    if (isOfflineSaleBooking(b)) {
      const sale = await mirrorOfflineSale(b);
      if (sale) {
        sales++;
        console.log(`  sale  ${label}${(b.customerName || '').padEnd(14)}₹${sale.price}`);
      }
    }

    if (isMembershipBooking(b)) {
      const pass = await mirrorMembershipPass(b);
      if (pass) {
        passes++;
        console.log(`  pass  ${label}${(b.customerName || '').padEnd(14)}${pass.planName} -> ${pass.expiryDate.toDateString()}`);
      }
    }
  }

  const db = conn.connection.db;
  console.log(`\n✅ Mirrored ${sales} offline sale(s) and ${passes} membership pass(es).`);
  console.log(`   offlinesales now holds ${await db.collection('offlinesales').countDocuments()} document(s).`);
  console.log(`   memberships  now holds ${await db.collection('memberships').countDocuments()} document(s).`);
};

run()
  .catch(err => {
    console.error('❌ Backfill failed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
