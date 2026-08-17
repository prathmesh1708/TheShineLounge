const mongoose = require('mongoose');
const { MONGO_URI, SEED_ON_BOOT } = require('./env');
const seedAdmin = require('../../utils/seedAdmin');
const seedServices = require('../../utils/seedServices');
const seedRealData = require('../../utils/seedRealData');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);

    // Seed initial admin & initial services catalog on successful connection.
    // Skipped on Vercel cold starts (see SEED_ON_BOOT in env.js) — run
    // `npm run seed` once instead when the catalog actually changes.
    if (SEED_ON_BOOT) {
      await seedAdmin();
      await seedServices();
      await seedRealData();
    }
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
