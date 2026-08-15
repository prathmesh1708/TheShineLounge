require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 5005,
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/multi-service-db',
  JWT_SECRET: process.env.JWT_SECRET || 'tsl_jwt_secret_key_2026_shine_lounge',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@gmail.com',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'Admin!@#123'
};
