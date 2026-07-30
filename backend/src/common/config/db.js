const mongoose = require('mongoose');
const { MONGO_URI } = require('./env');
const seedAdmin = require('../../utils/seedAdmin');
const seedServices = require('../../utils/seedServices');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);

    // Seed initial admin & initial services catalog on successful connection
    await seedAdmin();
    await seedServices();
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
