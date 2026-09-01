const mongoose = require('mongoose');
const { MONGO_URI, SEED_ON_BOOT } = require('./env');
const seedAdmin = require('../../utils/seedAdmin');
const seedServices = require('../../utils/seedServices');
const seedRealData = require('../../utils/seedRealData');

let mongoMemoryServer = null;

const connectDB = async () => {
  try {
    let uri = MONGO_URI;
    let isMemoryDb = false;
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
        isMemoryDb = true;
      } else {
        throw dbErr;
      }
    }

    // Seed initial admin & initial services catalog on successful connection.
    // If running on ephemeral In-Memory MongoDB or SEED_ON_BOOT is true, seed all services & demo data.
    // In all environments, ensure the admin account exists so login never fails.
    if (SEED_ON_BOOT || isMemoryDb) {
      await seedAdmin();
      await seedServices();
      await seedRealData();
    } else {
      await seedAdmin();
    }
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
