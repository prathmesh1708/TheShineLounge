require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 5000,
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/multi-service-db',
  JWT_SECRET: process.env.JWT_SECRET || 'fallback_secret_key_for_development'
};
