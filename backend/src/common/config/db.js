const dns = require('dns');

// Safely configure public DNS servers for Atlas SRV record resolution
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (dnsErr) {
  console.warn('DNS server configuration notice:', dnsErr.message);
}

const mongoose = require('mongoose');
const { MONGO_URI, SEED_ON_BOOT } = require('./env');
const seedAdmin = require('../../utils/seedAdmin');
const seedServices = require('../../utils/seedServices');


const connectDB = async () => {
  try {
    if (!MONGO_URI) {
      throw new Error('MONGO_URI is missing in backend/.env. Atlas database URI is required.');
    }

    console.log('Connecting strictly to MongoDB Atlas...');
    const conn = await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 10000
    });

    console.log(`✅ MongoDB Atlas connected successfully: ${conn.connection.host}`);

    // Ensure the admin account exists so login never fails
    await seedAdmin();

    // Catalog seeding is opt-in only. An empty database is a legitimate state -
    // a fresh cluster should stay empty until someone asks for sample data - so
    // never infer "no services means seed me". Run `npm run seed` by hand, or
    // set SEED_ON_BOOT=true, when you actually want the demo catalog.
    if (SEED_ON_BOOT) {
      console.log('SEED_ON_BOOT=true - loading demo service catalog...');
      await seedServices();
    }
  } catch (error) {
    console.error('❌ MongoDB Atlas connection error:', error.message);
    if (error.message.includes('Authentication failed') || error.message.includes('bad auth')) {
      console.error('👉 Tip: Check your Atlas username and password in backend/.env (MongoDB Atlas > Database Access).');
    } else if (error.message.includes('whitelist') || error.message.includes('server selection')) {
      console.error('👉 Tip: Whitelist your IP in MongoDB Atlas (Network Access > Add IP Address > Allow Access from Anywhere 0.0.0.0/0).');
    }
    process.exit(1);
  }
};

module.exports = connectDB;
