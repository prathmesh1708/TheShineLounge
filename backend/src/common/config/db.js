const mongoose = require('mongoose');
const { MONGO_URI, SEED_ON_BOOT } = require('./env');
const seedAdmin = require('../../utils/seedAdmin');
const seedServices = require('../../utils/seedServices');
const Service = require('../../models/Service');
const User = require('../../models/User');


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

    // Check if services or data already exist before running initial seeds
    const existingServicesCount = await Service.countDocuments({ isDeleted: { $ne: true } });
    if (existingServicesCount === 0 || SEED_ON_BOOT) {
      console.log('Initializing service catalog on MongoDB Atlas...');
      await seedServices();
    } else {
      console.log(`✅ Kept ${existingServicesCount} existing database services intact on Atlas.`);
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
