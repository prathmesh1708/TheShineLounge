/**
 * Per-user localStorage scoping.
 *
 * Bookings, passes and saved vehicles used to live under global keys, so every
 * account signing in on the same browser inherited whatever the previous one
 * left behind — a brand new customer would open /bookings and see someone
 * else's washes and cars. Each of those keys is now written under the owning
 * customer's email, and the old global keys are purged once on start-up.
 */

const SEPARATOR = '__';

// Keys that hold one customer's own data and must never be shared.
export const USER_SCOPED_KEYS = [
  'tsl_user_bookings',
  'tsl_membership_passes',
  'tsl_active_membership',
  'tsl_saved_vehicles',
  'tsl_selected_vehicle_id'
];

const LEGACY_PURGE_FLAG = 'tsl_storage_scoped_v1';

export function normalizeEmail(email) {
  return String(email || '').toLowerCase().trim();
}

/** Identity for callers outside React that cannot reach AuthContext. */
export function currentUserEmail() {
  for (const key of ['tsl_user', 'tsl_customer_user']) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      const email = normalizeEmail(parsed?.email);
      // Staff and admins browse the customer app as themselves; their own
      // scope keeps their test bookings out of every customer's view.
      if (email) return email;
    } catch (e) {}
  }
  return '';
}

export function scopedKey(baseKey, email) {
  return `${baseKey}${SEPARATOR}${normalizeEmail(email) || 'guest'}`;
}

export function readScoped(baseKey, email, fallback = null) {
  try {
    const raw = localStorage.getItem(scopedKey(baseKey, email));
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}

export function writeScoped(baseKey, email, value) {
  try {
    localStorage.setItem(scopedKey(baseKey, email), JSON.stringify(value));
  } catch (e) {}
}

export function removeScoped(baseKey, email) {
  try {
    localStorage.removeItem(scopedKey(baseKey, email));
  } catch (e) {}
}

/**
 * Every customer's copy of a key, for admin screens that need to see local
 * purchases made in this browser regardless of who was signed in.
 */
export function readAllScoped(baseKey) {
  const results = [];
  try {
    const prefix = `${baseKey}${SEPARATOR}`;
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(prefix)) continue;
      try {
        results.push({ email: key.slice(prefix.length), value: JSON.parse(localStorage.getItem(key)) });
      } catch (e) {}
    }
  } catch (e) {}
  return results;
}

/** Wipes one account's local data (used on logout / fresh registration). */
export function clearScopedData(email) {
  USER_SCOPED_KEYS.forEach(key => removeScoped(key, email));
}

/**
 * Drops the pre-scoping global keys. They are caches of server data plus demo
 * seeds, so removing them costs nothing and stops legacy bookings and mock
 * vehicles from following a new account around.
 */
export function purgeLegacyGlobalKeys() {
  try {
    USER_SCOPED_KEYS.forEach(key => localStorage.removeItem(key));
    localStorage.setItem(LEGACY_PURGE_FLAG, new Date().toISOString());
  } catch (e) {}
}
