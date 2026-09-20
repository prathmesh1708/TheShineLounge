const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
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
      console.log(`✅ MongoDB Atlas connected: ${conn.connection.host}`);
    } catch (dbErr) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`⚠️ Primary MongoDB Atlas connection failed (${dbErr.message}).`);
        console.warn(`👉 To connect directly to MongoDB Atlas, whitelist your IP in Atlas Network Access (0.0.0.0/0).`);
        console.warn(`📁 Starting local persistent MongoDB instance on disk for development...`);
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const localDbDir = path.resolve(__dirname, '../../../data/local_db');
        if (!fs.existsSync(localDbDir)) {
          fs.mkdirSync(localDbDir, { recursive: true });
        } else {
          // Clean up stale lock files if previous mongod was terminated abruptly
          for (const lf of ['mongod.lock', 'WiredTiger.lock']) {
            const lockFile = path.join(localDbDir, lf);
            if (fs.existsSync(lockFile)) {
              try {
                fs.unlinkSync(lockFile);
              } catch (e) {
                console.warn(`Could not remove stale ${lf}:`, e.message);
              }
            }
          }
        }
        mongoMemoryServer = await MongoMemoryServer.create({
          instance: {
            dbPath: localDbDir,
            storageEngine: 'wiredTiger'
          }
        });
        uri = mongoMemoryServer.getUri();
        const conn = await mongoose.connect(uri);
        console.log(`✅ Local Persistent MongoDB connected at ${conn.connection.host} (persisted at ${localDbDir})`);
        isMemoryDb = true;

        // Graceful shutdown hooks
        const cleanup = async () => {
          if (mongoMemoryServer) {
            try {
              await mongoose.disconnect();
              await mongoMemoryServer.stop();
            } catch (_) {}
          }
        };
        process.once('SIGINT', async () => { await cleanup(); process.exit(0); });
        process.once('SIGTERM', async () => { await cleanup(); process.exit(0); });
        process.once('SIGUSR2', async () => { await cleanup(); process.kill(process.pid, 'SIGUSR2'); });
      } else {
        throw dbErr;
      }
    }

    // Ensure the admin account exists so login never fails.
    await seedAdmin();

    // Demo seeding is opt-in only. An empty database is a legitimate state -
    // a fresh cluster should stay empty until someone asks for sample data -
    // so never infer "empty means seed me". Run `npm run seed` by hand, or
    // set SEED_ON_BOOT=true, when you actually want the demo catalog/staff.
    if (SEED_ON_BOOT) {
      console.log('SEED_ON_BOOT=true - loading demo service catalog and sample data...');
      await seedServices();
      await seedRealData();
    }
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
