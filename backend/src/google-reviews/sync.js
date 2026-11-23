const GoogleIntegration = require('../models/GoogleIntegration');
const GoogleReview = require('../models/GoogleReview');
const { GOOGLE_REVIEWS_SYNC_MIN } = require('../common/config/env');
const { decrypt } = require('./crypto');
const api = require('./googleApi');

// Keeps the local GoogleReview collection in step with Google.
//
// Incremental sync pages newest-update-first and stops at the first review not
// newer than the previous sync. A full sync (every FULL_SYNC_MS, or on demand)
// walks every page, which also picks up replies posted from Google Maps and
// marks reviews Google no longer returns as removed.

const FULL_SYNC_MS = 6 * 60 * 60 * 1000;
const LEASE_MS = 2 * 60 * 1000;
const MAX_PAGES = 200; // 10,000 reviews: a guard against a looping pageToken

const STAR = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };

const getIntegration = async () => {
  const existing = await GoogleIntegration.findOne({ key: 'default' });
  if (existing) return existing;
  try {
    return await GoogleIntegration.create({ key: 'default' });
  } catch (e) {
    if (e.code === 11000) return GoogleIntegration.findOne({ key: 'default' });
    throw e;
  }
};

// Access token for the stored connection. A revoked grant flips the
// integration to needs_reconnect so the admin page can say so.
const accessTokenFor = async (integrationId) => {
  const doc = await GoogleIntegration.findById(integrationId).select('+refreshTokenEnc');
  if (!doc || !doc.refreshTokenEnc) {
    throw new api.GoogleApiError('Google Business is not connected.', { code: 'NOT_CONNECTED' });
  }
  try {
    return await api.getAccessToken(decrypt(doc.refreshTokenEnc));
  } catch (err) {
    if (err.code === 'invalid_grant') {
      await GoogleIntegration.updateOne(
        { _id: integrationId },
        { status: 'needs_reconnect', lastSyncError: err.message }
      );
    }
    throw err;
  }
};

const mapReview = (r, locationName) => {
  const reviewId = r.reviewId || String(r.name || '').split('/').pop();
  return {
    reviewId,
    name: r.name || '',
    locationName,
    reviewerName: r.reviewer?.isAnonymous ? 'Google user' : (r.reviewer?.displayName || 'Google user'),
    reviewerPhotoUrl: r.reviewer?.profilePhotoUrl || '',
    isAnonymous: Boolean(r.reviewer?.isAnonymous),
    starRating: STAR[r.starRating] || Number(r.starRating) || 0,
    comment: r.comment || '',
    createTime: new Date(r.createTime),
    updateTime: new Date(r.updateTime || r.createTime),
    removedAt: null
  };
};

// Merge Google's reply into the local one, keeping repliedBy when the text is
// the one an admin posted from here.
const replyUpdate = (r, existing) => {
  const comment = r.reviewReply?.comment || '';
  if (!comment) return { 'reply.comment': '', 'reply.updateTime': null, 'reply.repliedBy': '' };
  const keepBy = existing?.reply?.comment === comment ? existing.reply.repliedBy || '' : '';
  return {
    'reply.comment': comment,
    'reply.updateTime': r.reviewReply.updateTime ? new Date(r.reviewReply.updateTime) : null,
    'reply.repliedBy': keepBy
  };
};

const acquireLease = (now) => GoogleIntegration.findOneAndUpdate(
  {
    key: 'default',
    status: 'connected',
    $or: [{ syncLeaseUntil: null }, { syncLeaseUntil: { $lte: now } }]
  },
  { syncLeaseUntil: new Date(now.getTime() + LEASE_MS) },
  { returnDocument: 'after' }
);

/**
 * Pull reviews from Google into MongoDB.
 * @returns {{ skipped?: string, full?: boolean, pages?: number, upserted?: number, removed?: number }}
 */
const syncReviews = async ({ full = false, now = new Date() } = {}) => {
  const integration = await acquireLease(now);
  if (!integration) {
    const current = await GoogleIntegration.findOne({ key: 'default' }).lean();
    if (!current || current.status !== 'connected') return { skipped: 'not_connected' };
    return { skipped: 'already_running' };
  }
  if (!integration.accountName || !integration.locationName) {
    await GoogleIntegration.updateOne({ _id: integration._id }, { syncLeaseUntil: null });
    return { skipped: 'no_location' };
  }

  const doFull = full
    || !integration.lastFullSyncAt
    || now - integration.lastFullSyncAt >= FULL_SYNC_MS;
  const since = doFull ? null : integration.lastSyncAt;
  const { accountName, locationName } = integration;

  let pages = 0;
  let upserted = 0;
  let removed = 0;
  const seen = [];
  let summary = {};

  try {
    const token = await accessTokenFor(integration._id);
    let pageToken = '';
    let reachedOld = false;

    do {
      const page = await api.listReviews(token, accountName, locationName, pageToken);
      pages += 1;
      if (pages === 1) {
        summary = {
          averageRating: page.averageRating ?? null,
          totalReviewCount: page.totalReviewCount ?? null
        };
      }

      const reviews = page.reviews || [];
      const ids = reviews.map((r) => r.reviewId || String(r.name || '').split('/').pop());
      const existing = await GoogleReview.find({ reviewId: { $in: ids } }).select('reviewId reply').lean();
      const byId = new Map(existing.map((e) => [e.reviewId, e]));

      const ops = [];
      for (const r of reviews) {
        const mapped = mapReview(r, locationName);
        if (!mapped.reviewId || !mapped.starRating || Number.isNaN(mapped.createTime.getTime())) continue;
        seen.push(mapped.reviewId);
        if (since && mapped.updateTime <= since && byId.has(mapped.reviewId)) {
          reachedOld = true;
          continue;
        }
        ops.push({
          updateOne: {
            filter: { reviewId: mapped.reviewId },
            update: { $set: { ...mapped, ...replyUpdate(r, byId.get(mapped.reviewId)) } },
            upsert: true
          }
        });
      }
      if (ops.length) {
        await GoogleReview.bulkWrite(ops, { ordered: false });
        upserted += ops.length;
      }

      pageToken = page.nextPageToken || '';
    } while (pageToken && !reachedOld && pages < MAX_PAGES);

    // Only a complete walk can prove a review is gone.
    if (doFull && !pageToken) {
      const res = await GoogleReview.updateMany(
        { locationName, reviewId: { $nin: seen }, removedAt: null },
        { removedAt: now }
      );
      removed = res.modifiedCount || 0;
    }

    await GoogleIntegration.updateOne(
      { _id: integration._id },
      {
        ...summary,
        lastSyncAt: now,
        ...(doFull ? { lastFullSyncAt: now } : {}),
        lastSyncError: '',
        syncLeaseUntil: null
      }
    );
    return { full: doFull, pages, upserted, removed };
  } catch (err) {
    await GoogleIntegration.updateOne(
      { _id: integration._id },
      { lastSyncError: err.message, syncLeaseUntil: null }
    );
    throw err;
  }
};

// One scheduler step: sync when the last one is older than the interval.
const runGoogleReviewsSyncTick = async (now = new Date()) => {
  const integration = await GoogleIntegration.findOne({ key: 'default' }).lean();
  if (!integration || integration.status !== 'connected' || !integration.locationName) {
    return { skipped: 'not_connected' };
  }
  const dueAt = integration.lastSyncAt
    ? integration.lastSyncAt.getTime() + GOOGLE_REVIEWS_SYNC_MIN * 60 * 1000
    : 0;
  if (now.getTime() < dueAt) return { skipped: 'not_due' };
  return syncReviews({ now });
};

let timer = null;
let running = false;

const startGoogleReviewsSync = () => {
  if (timer) return;
  timer = setInterval(async () => {
    if (running) return;
    running = true;
    try {
      await runGoogleReviewsSyncTick(new Date());
    } catch (err) {
      console.warn('Google reviews sync failed:', err.message);
    } finally {
      running = false;
    }
  }, 60 * 1000);
  if (timer.unref) timer.unref();
  console.log(`Google reviews sync started (every ${GOOGLE_REVIEWS_SYNC_MIN} min)`);
};

const stopGoogleReviewsSync = () => {
  if (timer) clearInterval(timer);
  timer = null;
};

module.exports = {
  getIntegration,
  accessTokenFor,
  mapReview,
  syncReviews,
  runGoogleReviewsSyncTick,
  startGoogleReviewsSync,
  stopGoogleReviewsSync
};
