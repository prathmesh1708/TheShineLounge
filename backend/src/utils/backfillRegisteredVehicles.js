// Backfills the registeredvehicles collection from plates that already exist
// on bookings and offline sales.
//
// New bookings and POS sales register their vehicle as they are created (see
// services/vehicleRegistry.js), but rows written before that was wired up left
// no vehicle behind. This is the one-off catch-up for them. It is idempotent --
// the upsert keys on the normalised plate -- so running it twice is harmless.
//
//   npm run backfill:vehicles

require('dotenv').config();
const mongoose = require('mongoose');
const { MONGO_URI } = require('../common/config/env');
const Booking = require('../models/Booking');
const { upsertRegisteredVehicle } = require('../services/vehicleRegistry');

const run = async () => {
  const conn = await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 15000 });
  console.log(`MongoDB connected: ${conn.connection.host} (db: ${conn.connection.name})`);

  const sources = [
    { label: 'bookings', docs: await Booking.find({ isDeleted: { $ne: true } }).lean() }
  ];

  // Offline sales live in their own collection on deployments that have been
  // migrated; older ones keep them as bookings. Read it only if it is there.
  const collections = await conn.connection.db.listCollections({ name: 'offlinesales' }).toArray();
  if (collections.length > 0) {
    const sales = await conn.connection.db.collection('offlinesales').find({}).toArray();
    sources.push({ label: 'offline sales', docs: sales });
  }

  let created = 0;
  let skipped = 0;

  for (const { label, docs } of sources) {
    console.log(`\nScanning ${docs.length} ${label}...`);
    for (const d of docs) {
      const plate = d.vehicleNo || d.vehiclePlate || '';
      if (!plate) {
        skipped++;
        continue;
      }
      const vehicle = await upsertRegisteredVehicle({
        plateNumber: plate,
        brand: d.vehicleType || '',
        model: d.vehicleModel || d.vehicleType || '',
        ownerName: d.customerName || '',
        ownerEmail: d.customerEmail || '',
        ownerPhone: d.phone || d.mobile || '',
        addedVia: d.saleId ? 'pos' : 'staff'
      });
      if (vehicle) {
        created++;
        console.log(`  ✓ ${vehicle.plateNumber.padEnd(12)} ${d.customerName || ''}`);
      } else {
        skipped++;
      }
    }
  }

  const total = await mongoose.connection.db.collection('registeredvehicles').countDocuments();
  console.log(`\n✅ Processed ${created} vehicle(s), skipped ${skipped} row(s) with no usable plate.`);
  console.log(`   registeredvehicles now holds ${total} document(s).`);
};

run()
  .catch(err => {
    console.error('❌ Backfill failed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
