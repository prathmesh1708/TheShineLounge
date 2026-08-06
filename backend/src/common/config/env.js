require('dotenv').config();

const requiredVars = ['JWT_SECRET', 'ADMIN_PASSWORD'];
const missingVars = requiredVars.filter((key) => !process.env[key]);
if (missingVars.length > 0) {
  throw new Error(`Missing required environment variable(s): ${missingVars.join(', ')}`);
}

module.exports = {
  PORT: process.env.PORT || 5005,
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/multi-service-db',
  JWT_SECRET: process.env.JWT_SECRET,
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@gmail.com',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD
};
