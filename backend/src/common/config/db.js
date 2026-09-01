const mongoose = require('mongoose');
const { MONGO_URI, SEED_ON_BOOT } = require('./env');
const seedAdmin = require('../../utils/seedAdmin');
const seedServices = require('../../utils/seedServices');
const seedRealData = require('../../utils/seedRealData');

let mongoMemoryServer = null;

const connectDB = async () => {
  try {
    let uri = MONGO_URI;
    try {
      const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
      console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    } catch (dbErr) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`⚠️ Primary MongoDB connection failed (${dbErr.message}). Starting local In-Memory MongoDB for development...`);
        const { MongoMemoryServer } = require('mongodb-memory-server');
        mongoMemoryServer = await MongoMemoryServer.create();
        uri = mongoMemoryServer.getUri();
        const conn = await mongoose.connect(uri);
        console.log(`✅ Local Development In-Memory MongoDB connected at ${conn.connection.host}`);
      } else {
        throw dbErr;
      }
    }

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
