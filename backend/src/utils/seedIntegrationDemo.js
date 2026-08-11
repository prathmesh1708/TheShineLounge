// Creates one self-contained demo customer so the hardware integration can be
// tested by hand without touching anyone's real record.
//
//   node src/utils/seedIntegrationDemo.js          # create / reset the demo
//   node src/utils/seedIntegrationDemo.js --clean  # remove everything it made
//
// Everything it writes is tagged with the demo email and plate below, so
// --clean can take it all back out again. Safe to re-run: it resets the demo
// customer to a known state each time.

require('dotenv').config();
const mongoose = require('mongoose');
const { MONGO_URI } = require('../common/config/env');

const User = require('../models/User');
const Booking = require('../models/Booking');
const MembershipUsage = require('../models/MembershipUsage');
const { DeviceEvent, WashSession } = require('../integrations/integrations.model');
const { normalizePlate, formatPlate } = require('../utils/plateNormalizer');

const DEMO_EMAIL = 'anpr.demo@theshinelounge.test';
const DEMO_PLATE = 'MH01AB1234';
const DEMO_PASSWORD = 'demo1234';
const DEMO_BOOKING_ID = 'B-ANPR-DEMO';

const clean = async () => {
  const user = await User.findOne({ email: DEMO_EMAIL });

  const sessions = await WashSession.find({ plate: DEMO_PLATE });
  const sessionIds = sessions.map((s) => s._id);

  const removed = {
    ledger: (await MembershipUsage.deleteMany({
      $or: [
        ...(user ? [{ userId: user._id }] : []),
        { plate: DEMO_PLATE }
      ]
    })).deletedCount,
    events: (await DeviceEvent.deleteMany({ plate: DEMO_PLATE })).deletedCount,
    sessions: (await WashSession.deleteMany({ _id: { $in: sessionIds } })).deletedCount,
    bookings: (await Booking.deleteMany({ vehicleNoNormalized: DEMO_PLATE })).deletedCount,
    customer: (await User.deleteOne({ email: DEMO_EMAIL })).deletedCount
  };

  console.log('Removed demo data:');
  for (const [what, count] of Object.entries(removed)) console.log(`  ${what.padEnd(10)} ${count}`);
};

const seed = async () => {
  // Start from a clean slate so a re-run always gives the same starting point.
  await clean();

  const now = new Date();
  const user = new User({
    fullName: 'ANPR Demo Customer',
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    mobile: '+91 90000 00000',
    role: 'user',
    city: 'Mumbai',
    vehicles: [{
      plateNumber: formatPlate(DEMO_PLATE),
      model: 'Hyundai Creta',
      category: 'Car',
      isPrimary: true,
      addedVia: 'admin',
      verifiedAt: now
    }],
    membership: {
      planName: 'Shine Club Gold (Demo)',
      serviceKey: 'car-wash',
      startDate: new Date(now.getTime() - 30 * 86400000),
      expiryDate: new Date(now.getTime() + 60 * 86400000),
      status: 'Active',
      maxPerDay: 5,
      maxPerMonth: 20,
      // Cool-off off so the demo can be run repeatedly without being refused.
      coolOffHours: 0,
      boundVehiclesOnly: true,
      boundVehicles: [DEMO_PLATE],
      unlimited: false,
      washesRemaining: 10,
      usageCountToday: 0,
      usageCountMonth: 0
    }
  });
  await user.save();

  const booking = new Booking({
    bookingId: DEMO_BOOKING_ID,
    serviceKey: 'car-wash',
    serviceName: 'Car Wash',
    packageName: 'Premium Foam Wash (Demo)',
    price: 599,
    date: now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    timeSlot: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
    customerName: user.fullName,
    customerEmail: user.email,
    // Deliberately formatted differently from what the camera will send, to
    // prove normalisation is doing its job.
    vehicleNo: 'MH-01-AB-1234',
    vehicleType: 'Hatchback',
    status: 'Confirmed',
    stepIndex: 0
  });
  await booking.save();

  console.log('Demo data ready.\n');
  console.log(`  Customer      ${user.email}  (password: ${DEMO_PASSWORD})`);
  console.log(`  Vehicle       ${user.vehicles[0].plateNumber}  -> normalised ${user.vehicles[0].plateNormalized}`);
  console.log(`  Membership    ${user.membership.planName}, ${user.membership.washesRemaining} washes remaining`);
  console.log(`  Booking       ${booking.bookingId}  status ${booking.status}, step ${booking.stepIndex}`);
  console.log(`  Booking plate ${booking.vehicleNo} -> normalised ${booking.vehicleNoNormalized}`);
  console.log(`\nDrive a cycle with:\n  cd edge-connector && node src/simulator.js --plate ${DEMO_PLATE} --secret <TSL_DEVICE_SECRET> --replay`);
};

const run = async () => {
  await mongoose.connect(MONGO_URI);
  console.log(`Connected to ${mongoose.connection.name}\n`);

  if (process.argv.includes('--clean')) {
    await clean();
  } else {
    await seed();
  }

  await mongoose.disconnect();
};

if (require.main === module) {
  run().catch((error) => {
    console.error('Demo seed failed:', error);
    process.exit(1);
  });
}

module.exports = { seed, clean, DEMO_EMAIL, DEMO_PLATE, DEMO_BOOKING_ID, normalizePlate };
