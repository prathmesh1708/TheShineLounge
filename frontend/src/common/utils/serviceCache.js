// Offline fallback cache for service documents.
//
// Service records can carry media uploaded as inline base64 `data:` URIs — a
// single hero video runs to several megabytes, and localStorage stores strings
// as UTF-16, so one of those blows the ~5MB quota on its own. The write then
// throws QuotaExceededError in the middle of a save handler and surfaces as
// "Error updating ... settings", even though the server-side save succeeded.
//
// Nothing reads media out of this cache — it exists so the admin hubs and
// public pages can still render pricing when the API is unreachable. So we
// drop inline media before writing, and never let a cache miss break a save.

const MEDIA_KEYS = [
  'heroVideo',
  'bannerImage',
  'thumbnail',
  'icon',
  'posterImage',
  'coverImage',
  'gallery',
  'images'
];

const isInlineData = (val) => typeof val === 'string' && val.startsWith('data:');

// Strip inline base64 payloads wherever they appear, keeping ordinary URLs.
const stripInlineMedia = (value) => {
  if (Array.isArray(value)) {
    return value.map(stripInlineMedia).filter((v) => v !== undefined);
  }
  if (value && typeof value === 'object') {
    const out = {};
    Object.entries(value).forEach(([key, val]) => {
      if (isInlineData(val)) return;
      if (MEDIA_KEYS.includes(key) && Array.isArray(val)) {
        out[key] = val.filter((v) => !isInlineData(v));
        return;
      }
      out[key] = stripInlineMedia(val);
    });
    return out;
  }
  return isInlineData(value) ? undefined : value;
};

export function cacheService(key, service) {
  if (!service) return false;
  try {
    localStorage.setItem(key, JSON.stringify(stripInlineMedia(service)));
    return true;
  } catch (err) {
    // Quota is still exceeded, or storage is unavailable (private mode).
    // Drop the stale entry so we don't serve a half-written value later.
    try {
      localStorage.removeItem(key);
    } catch {
      /* storage unavailable entirely */
    }
    console.warn(`Could not cache ${key} locally:`, err.message);
    return false;
  }
}

export function readCachedService(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.warn(`Could not read cached ${key}:`, err.message);
    return null;
  }
}

export default cacheService;
