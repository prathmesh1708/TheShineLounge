const { GOOGLE_PLACES_API_KEY, GOOGLE_PLACE_ID, GOOGLE_PLACE_QUERY } = require('../common/config/env');

// Read-only source: Places API (New). Needs only an API key; no owner sign-in.
// Google returns the real rating and review count but at most 5 reviews, and
// no owner replies. Places content may not be stored long-term, so it is only
// held in memory for up to an hour, never written to MongoDB.
//
// GOOGLE_PLACE_ID is optional: without it the place is found once by name
// (GOOGLE_PLACE_QUERY) and the id kept in memory.

const PLACES_API = 'https://places.googleapis.com/v1';
// One Google call per hour at most (about 720 a month), which keeps the
// reviews SKU inside Google's free monthly usage.
const CACHE_MS = 60 * 60 * 1000;
let cache = null;
let resolvedPlaceId = '';

const isPlacesConfigured = () => Boolean(GOOGLE_PLACES_API_KEY);

const placesError = (status, json) => {
  const raw = json?.error?.message || `HTTP ${status}`;
  if (/has not been used|is disabled|SERVICE_DISABLED/i.test(raw)) {
    return new Error('Places API (New) is not enabled for this API key\'s Google Cloud project. Enable "Places API (New)" in Google Cloud Console → APIs & Services → Library.');
  }
  if (/billing/i.test(raw)) {
    return new Error('Google requires a billing account on the Cloud project for the Places API. Link one in Google Cloud Console → Billing (normal use stays inside the free monthly credit).');
  }
  if (/API key not valid|API_KEY_INVALID/i.test(raw)) {
    return new Error('GOOGLE_PLACES_API_KEY is not a valid Google API key.');
  }
  return new Error(`Places API error: ${raw}`);
};

const call = async (url, { method = 'GET', fieldMask, body } = {}) => {
  const res = await fetch(url, {
    method,
    headers: {
      'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
      'X-Goog-FieldMask': fieldMask,
      ...(body ? { 'content-type': 'application/json' } : {})
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15000)
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw placesError(res.status, json);
  return json;
};

const getPlaceId = async () => {
  if (GOOGLE_PLACE_ID) return GOOGLE_PLACE_ID;
  if (resolvedPlaceId) return resolvedPlaceId;
  const json = await call(`${PLACES_API}/places:searchText`, {
    method: 'POST',
    // IDs-only field mask: the free Text Search tier.
    fieldMask: 'places.id',
    body: { textQuery: GOOGLE_PLACE_QUERY, pageSize: 1 }
  });
  const place = json.places?.[0];
  if (!place?.id) {
    throw new Error(`No Google place found for "${GOOGLE_PLACE_QUERY}". Set GOOGLE_PLACE_ID in backend/.env.`);
  }
  resolvedPlaceId = place.id;
  return resolvedPlaceId;
};

const fetchPlaceReviews = async ({ force = false } = {}) => {
  if (!isPlacesConfigured()) return null;
  if (!force && cache && cache.expiresAt > Date.now()) return cache.data;

  const placeId = await getPlaceId();
  const json = await call(`${PLACES_API}/places/${encodeURIComponent(placeId)}`, {
    fieldMask: 'id,displayName,formattedAddress,rating,userRatingCount,googleMapsUri,reviews'
  });

  const data = {
    placeId,
    title: json.displayName?.text || '',
    address: json.formattedAddress || '',
    averageRating: json.rating ?? null,
    totalReviewCount: json.userRatingCount ?? null,
    mapsUri: json.googleMapsUri || '',
    reviews: (json.reviews || []).map((r, i) => ({
      reviewId: r.name || `places-${i}`,
      reviewerName: r.authorAttribution?.displayName || 'Google user',
      reviewerPhotoUrl: r.authorAttribution?.photoUri || '',
      reviewerProfileUrl: r.authorAttribution?.uri || '',
      starRating: r.rating || 0,
      comment: r.originalText?.text || r.text?.text || '',
      createTime: r.publishTime || null,
      updateTime: r.publishTime || null,
      relativeTime: r.relativePublishTimeDescription || '',
      googleMapsUri: r.googleMapsUri || '',
      reply: { comment: '', updateTime: null }
    }))
  };
  cache = { data, expiresAt: Date.now() + CACHE_MS };
  return data;
};

const resetPlacesCache = () => { cache = null; resolvedPlaceId = ''; };

module.exports = { isPlacesConfigured, fetchPlaceReviews, resetPlacesCache };
