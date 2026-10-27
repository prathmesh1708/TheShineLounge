const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Locate and load .env from all possible directory structures (PM2, subfolder, root, or cwd)
const candidateEnvPaths = [
  path.resolve(__dirname, '../../../.env'), // backend/.env
  path.resolve(__dirname, '../../../../.env'), // root .env
  path.resolve(process.cwd(), 'backend/.env'),
  path.resolve(process.cwd(), '.env')
];

let loadedEnvPath = null;
for (const envPath of candidateEnvPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    loadedEnvPath = envPath;
    break;
  }
}

if (!loadedEnvPath) {
  dotenv.config();
}

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

const positiveInt = (value, fallback) => {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : fallback;
};

module.exports = {
  PORT: process.env.PORT || 5005,
  MONGO_URI: process.env.MONGO_URI || '',
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
  SEED_ON_BOOT: process.env.SEED_ON_BOOT === 'true',

  // ── Scheduled staff breaks (services/breakScheduler.js) ──
  // Set to 'false' to stop the in-process 30s scheduler (it never runs on Vercel).
  BREAK_SCHEDULER_ENABLED: process.env.BREAK_SCHEDULER_ENABLED !== 'false',
  // A slot still fires this many minutes late (e.g. after a restart).
  BREAK_CATCHUP_MIN: positiveInt(process.env.BREAK_CATCHUP_MIN, 10),
  // A scheduled break nobody started is logged as missed after this long.
  BREAK_PENDING_EXPIRY_MIN: positiveInt(process.env.BREAK_PENDING_EXPIRY_MIN, 60),
  // A forgotten break is closed this long after its end; overtime is kept.
  BREAK_MAX_OVERTIME_MIN: positiveInt(process.env.BREAK_MAX_OVERTIME_MIN, 240),
  // Only fire scheduled breaks for staff who are checked in today.
  BREAK_REQUIRE_CHECKIN: process.env.BREAK_REQUIRE_CHECKIN === 'true',
  // Shared secret for POST /api/internal/break-scheduler/tick. Unset = endpoint off.
  BREAK_CRON_SECRET: process.env.BREAK_CRON_SECRET || '',

  // ── WhatsApp provider: 'bhashsms' (reseller HTTP API) or 'meta' (Cloud API) ──
  WHATSAPP_PROVIDER: (process.env.WHATSAPP_PROVIDER || 'meta').toLowerCase(),
  BHASHSMS_BASE_URL: (process.env.BHASHSMS_BASE_URL || 'https://bhashsms.com/api').replace(/\/+$/, ''),
  BHASHSMS_USER: process.env.BHASHSMS_USER || '',
  BHASHSMS_PASS: process.env.BHASHSMS_PASS || '',
  BHASHSMS_SENDER: process.env.BHASHSMS_SENDER || '',
  // BhashSMS bills Utility and Marketing on separate scripts: Utility
  // templates go through sendmsgutil.php, Marketing (and plain text) through sendmsg.php.
  BHASHSMS_UTILITY_SCRIPT: process.env.BHASHSMS_UTILITY_SCRIPT || 'sendmsgutil.php',
  BHASHSMS_MARKETING_SCRIPT: process.env.BHASHSMS_MARKETING_SCRIPT || 'sendmsg.php',
  BHASHSMS_TEXT_SCRIPT: process.env.BHASHSMS_TEXT_SCRIPT || 'sendmsg.php',
  // Template sends without variables go to this many numbers per API call.
  BHASHSMS_MAX_NUMBERS_PER_CALL: positiveInt(process.env.BHASHSMS_MAX_NUMBERS_PER_CALL, 50),

  // ── WhatsApp Hub (Meta WhatsApp Cloud API, src/whatsapp) ──
  // Leave PHONE_NUMBER_ID / ACCESS_TOKEN empty and the hub still works in
  // manual mode: the admin opens each chat through wa.me instead.
  WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
  WHATSAPP_BUSINESS_ACCOUNT_ID: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '',
  WHATSAPP_ACCESS_TOKEN: process.env.WHATSAPP_ACCESS_TOKEN || '',
  // Needed only to submit templates with an image/video/document header.
  WHATSAPP_APP_ID: process.env.WHATSAPP_APP_ID || '',
  WHATSAPP_APP_SECRET: process.env.WHATSAPP_APP_SECRET || '',
  WHATSAPP_API_VERSION: process.env.WHATSAPP_API_VERSION || 'v21.0',
  WHATSAPP_WEBHOOK_VERIFY_TOKEN: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || '',
  WHATSAPP_SEND_BATCH: positiveInt(process.env.WHATSAPP_SEND_BATCH, 50),
  // true = only contacts explicitly marked opted-in receive campaigns.
  WHATSAPP_REQUIRE_OPT_IN: process.env.WHATSAPP_REQUIRE_OPT_IN === 'true',
  // true = run the whole pipeline but never call Meta (fake message ids).
  WHATSAPP_DRY_RUN: process.env.WHATSAPP_DRY_RUN === 'true',
  WHATSAPP_SENDER_ENABLED: process.env.WHATSAPP_SENDER_ENABLED !== 'false',
  // Shared secret for POST /api/internal/whatsapp/tick; falls back to the
  // break scheduler's secret so one cron job can drive both.
  WHATSAPP_CRON_SECRET: process.env.WHATSAPP_CRON_SECRET || process.env.BREAK_CRON_SECRET || '',

  // ── Pine Labs card terminals (Plutus Smart cloud integration, src/payments) ──
  // Leave the credentials empty and the POS simply never offers Pine Labs:
  // staff bill in cash as before. PINELABS_DRY_RUN fakes the whole terminal
  // round-trip so the screens can be used before the credentials arrive.
  PINELABS_BASE_URL: (process.env.PINELABS_BASE_URL || '').replace(/\/+$/, ''),
  PINELABS_MERCHANT_ID: process.env.PINELABS_MERCHANT_ID || '',
  PINELABS_STORE_ID: process.env.PINELABS_STORE_ID || '',
  PINELABS_CLIENT_ID: process.env.PINELABS_CLIENT_ID || '',
  PINELABS_SECURITY_TOKEN: process.env.PINELABS_SECURITY_TOKEN || '',
  // One terminal per department: {"car-wash":"<imei>","salon":"<imei>"}.
  PINELABS_TERMINALS: process.env.PINELABS_TERMINALS || '',
  // The terminal used when a department has no entry of its own.
  PINELABS_DEFAULT_IMEI: process.env.PINELABS_DEFAULT_IMEI || '',
  // How long the bill stays on the terminal before Pine Labs cancels it.
  PINELABS_AUTO_CANCEL_MIN: positiveInt(process.env.PINELABS_AUTO_CANCEL_MIN, 3),
  // How long the POS keeps polling before it gives up on the card.
  PINELABS_POLL_TIMEOUT_MS: positiveInt(process.env.PINELABS_POLL_TIMEOUT_MS, 150000),
  // true = run the full flow without calling Pine Labs (fake approvals).
  PINELABS_DRY_RUN: process.env.PINELABS_DRY_RUN === 'true'
};
