// One-off catalog/admin sync — run by hand whenever the hardcoded service
// catalog or default admin account changes. Not run automatically on Vercel
// cold starts (see SEED_ON_BOOT in common/config/env.js); that was making
// every cold start pay for 15+ sequential DB round trips and two bcrypt
// hashes before the first real request could be served.
//
//   npm run seed

require('dotenv').config();
const mongoose = require('mongoose');
const { MONGO_URI } = require('../common/config/env');
const seedAdmin = require('./seedAdmin');
const seedServices = require('./seedServices');
const seedRealData = require('./seedRealData');

(async () => {
  try {
    const conn = await mongoose.connect(MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);

    await seedAdmin();
    await seedServices();
    await seedRealData();

    console.log('✅ Seed complete');
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
