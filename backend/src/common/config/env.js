require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;

// Fail loudly in production rather than silently falling back to a shared
// cluster or a well-known secret. Locally a missing MONGO_URI is fine — db.js
// starts an in-memory MongoDB instead, so a fresh clone still boots.
const required = (name, devFallback) => {
  const value = process.env[name];
  if (value) return value;
  if (isProduction) {
    throw new Error(`${name} is not set. Configure it in the deployment environment.`);
  }
  return devFallback;
};

module.exports = {
  PORT: process.env.PORT || 5005,
  MONGO_URI: required('MONGO_URI', undefined),
  JWT_SECRET: required('JWT_SECRET', 'dev-only-insecure-jwt-secret'),
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@gmail.com',
  ADMIN_PASSWORD: required('ADMIN_PASSWORD', 'Admin!@#123'),
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
  FIREBASE_SERVICE_ACCOUNT_PATH: process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './src/common/config/firebase-service-account.json',
  FIREBASE_CONFIG: process.env.FIREBASE_CONFIG || '',
  // Opt-in only. Seeding rewrites the service catalog, the default admin and
  // the demo staff/customer rows over whatever is already in the database, so
  // running it on every boot means every nodemon restart silently discards
  // catalog and staff edits made through the admin UI. Run `npm run seed` by
  // hand when the hardcoded catalog actually changes.
  SEED_ON_BOOT: process.env.SEED_ON_BOOT === 'true'
};
