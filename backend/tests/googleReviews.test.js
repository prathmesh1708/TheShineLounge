process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'test-password';
process.env.GOOGLE_OAUTH_CLIENT_ID = 'test-client.apps.googleusercontent.com';
process.env.GOOGLE_OAUTH_CLIENT_SECRET = 'test-client-secret';
process.env.GOOGLE_OAUTH_REDIRECT_URI = 'http://localhost:5005/api/integrations/google/callback,https://app.example.com/api/integrations/google/callback';
process.env.ADMIN_APP_URL = 'http://localhost:5175';
process.env.BREAK_CRON_SECRET = 'cron-secret';

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const express = require('express');
const jwt = require('jsonwebtoken');

const db = require('./helpers/testDb');
const Admin = require('../src/models/Admin');
const Staff = require('../src/models/Staff');
const GoogleIntegration = require('../src/models/GoogleIntegration');
const GoogleReview = require('../src/models/GoogleReview');
const { encrypt, decrypt } = require('../src/google-reviews/crypto');
const { syncReviews } = require('../src/google-reviews/sync');
const googleReviews = require('../src/google-reviews');

const app = express();
app.use('/api/integrations/google', googleReviews.oauthRoutes);
app.use(express.json());
app.use('/api/google-reviews', googleReviews.routes);
app.use('/api/internal', require('../src/routes/internalRoutes'));
app.use((err, _req, res, _next) => res.status(500).json({ success: false, message: err.message }));

let server;
let baseUrl;

// ── fake Google ────────────────────────────────────────────────────────────
const realFetch = global.fetch;
let google; // per-test state
const calls = [];

const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

const review = (id, stars, updated, extra = {}) => ({
  name: `accounts/1/locations/2/reviews/${id}`,
  reviewId: id,
  reviewer: { displayName: `Person ${id}`, profilePhotoUrl: `https://photo/${id}` },
  starRating: stars,
  comment: `Comment ${id}`,
  createTime: updated,
  updateTime: updated,
  ...extra
});

const fakeGoogle = async (url, init = {}) => {
  const u = new URL(url);
  calls.push({ method: init.method || 'GET', url: u.pathname + u.search, body: init.body });

  if (u.host === 'oauth2.googleapis.com' && u.pathname === '/token') {
    const form = new URLSearchParams(init.body);
    if (form.get('grant_type') === 'refresh_token') {
      if (google.revoked) return json(400, { error: 'invalid_grant', error_description: 'Token has been expired or revoked.' });
      return json(200, { access_token: 'access-1', expires_in: 3600 });
    }
    const idPayload = Buffer.from(JSON.stringify({ email: 'owner@example.com' })).toString('base64url');
    return json(200, { access_token: 'access-1', refresh_token: 'refresh-1', expires_in: 3600, id_token: `x.${idPayload}.y` });
  }
  if (u.host === 'oauth2.googleapis.com' && u.pathname === '/revoke') return json(200, {});
  if (u.host === 'mybusinessaccountmanagement.googleapis.com') {
    if (google.quotaZero) return json(429, { error: { status: 'RESOURCE_EXHAUSTED', message: "Quota exceeded for quota metric 'Requests' ... limit 0" } });
    return json(200, { accounts: [{ name: 'accounts/1', accountName: 'Shine' }] });
  }
  if (u.host === 'mybusinessbusinessinformation.googleapis.com') {
    return json(200, { locations: [{ name: 'locations/2', title: 'The Shine Lounge', metadata: { mapsUri: 'https://maps/x' } }] });
  }
  if (u.host === 'mybusiness.googleapis.com') {
    if (u.pathname.endsWith('/reply')) {
      // Keep the reply on the fake review, as Google does.
      const id = u.pathname.split('/').slice(-2)[0];
      const target = google.pages.flatMap((p) => p.reviews || []).find((r) => r.reviewId === id);
      if ((init.method || 'GET') === 'PUT') {
        const { comment } = JSON.parse(init.body);
        if (target) target.reviewReply = { comment, updateTime: '2026-11-20T10:00:00Z' };
        return json(200, { comment, updateTime: '2026-11-20T10:00:00Z' });
      }
      if (target) delete target.reviewReply;
      return json(200, {});
    }
    const token = u.searchParams.get('pageToken') || '0';
    const page = google.pages[Number(token)];
    return json(200, page);
  }
  throw new Error(`unexpected fetch ${url}`);
};

global.fetch = (url, init) => (String(url).startsWith(baseUrl) ? realFetch(url, init) : fakeGoogle(String(url), init));

test.before(async () => {
  await db.start();
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  global.fetch = realFetch;
  await new Promise((resolve) => server.close(resolve));
  await db.stop();
});

test.beforeEach(async () => {
  await db.clear();
  calls.length = 0;
  google = {
    revoked: false,
    quotaZero: false,
    pages: [{
      averageRating: 4.5,
      totalReviewCount: 3,
      reviews: [
        review('r3', 'FIVE', '2026-11-03T00:00:00Z', { reviewReply: { comment: 'Thanks!', updateTime: '2026-11-04T00:00:00Z' } }),
        review('r2', 'FOUR', '2026-11-02T00:00:00Z')
      ],
      nextPageToken: '1'
    }, {
      reviews: [review('r1', 'ONE', '2026-11-01T00:00:00Z')]
    }]
  };
});

const request = async (method, path, { body, token, headers: extra = {} } = {}) => {
  const headers = { 'content-type': 'application/json', ...extra };
  if (token) headers.authorization = `Bearer ${token}`;
  const res = await realFetch(`${baseUrl}${path}`, { method, headers, redirect: 'manual', body: body === undefined ? undefined : JSON.stringify(body) });
  const text = await res.text();
  let parsed = text;
  try { parsed = JSON.parse(text); } catch (_) { /* html/plain */ }
  return { status: res.status, body: parsed, location: res.headers.get('location') };
};

const adminToken = async () => {
  const admin = await Admin.create({ email: 'boss@example.com', password: 'secret123' });
  return jwt.sign({ userId: admin._id.toString() }, process.env.JWT_SECRET);
};

const staffToken = async () => {
  const staff = await Staff.create({ staffId: 'S1', fullName: 'Aarav', email: 'aarav@example.com', password: 'secret123', mobile: '9000012345' });
  return jwt.sign({ userId: staff._id.toString() }, process.env.JWT_SECRET);
};

const connect = (extra = {}) => GoogleIntegration.create({
  key: 'default',
  status: 'connected',
  refreshTokenEnc: encrypt('refresh-1'),
  accountName: 'accounts/1',
  locationName: 'locations/2',
  locationTitle: 'The Shine Lounge',
  ...extra
});

test('refresh token encryption round-trips and is not plain text', () => {
  const packed = encrypt('1//secret-refresh');
  assert.ok(!packed.includes('secret-refresh'));
  assert.equal(decrypt(packed), '1//secret-refresh');
  assert.throws(() => decrypt(packed.replace(/.$/, (c) => (c === 'A' ? 'B' : 'A'))));
});

test('full sync pages through every review, maps stars and replies, stores Google totals', async () => {
  await connect();
  const result = await syncReviews({ full: true });
  assert.equal(result.full, true);
  assert.equal(result.pages, 2);
  assert.equal(result.upserted, 3);

  const r3 = await GoogleReview.findOne({ reviewId: 'r3' }).lean();
  assert.equal(r3.starRating, 5);
  assert.equal(r3.reviewerName, 'Person r3');
  assert.equal(r3.reply.comment, 'Thanks!');
  assert.equal((await GoogleReview.findOne({ reviewId: 'r1' })).starRating, 1);

  const integration = await GoogleIntegration.findOne().lean();
  assert.equal(integration.averageRating, 4.5);
  assert.equal(integration.totalReviewCount, 3);
  assert.equal(integration.lastSyncError, '');
  assert.equal(integration.syncLeaseUntil, null);
});

test('incremental sync stops at already-synced reviews; full sync marks vanished ones removed', async () => {
  await connect();
  await syncReviews({ full: true, now: new Date('2026-11-11T00:00:00Z') });

  // A new review arrives; the incremental pass should not need page 2.
  google.pages[0].reviews.unshift(review('r4', 'FIVE', '2026-11-11T00:30:00Z'));
  calls.length = 0;
  const inc = await syncReviews({ now: new Date('2026-11-11T01:00:00Z') });
  assert.equal(inc.full, false);
  assert.equal(inc.pages, 1);
  assert.equal(inc.upserted, 1);
  assert.equal(await GoogleReview.countDocuments(), 4);

  // r1 disappears from Google.
  google.pages[1].reviews = [];
  const full = await syncReviews({ full: true, now: new Date('2026-11-12T00:00:00Z') });
  assert.equal(full.removed, 1);
  assert.ok((await GoogleReview.findOne({ reviewId: 'r1' })).removedAt);
});

test('a revoked Google grant flips the connection to needs_reconnect', async () => {
  await connect({ refreshTokenEnc: encrypt('refresh-revoked') });
  google.revoked = true;
  await assert.rejects(syncReviews({ full: true }), /Reconnect/);
  const integration = await GoogleIntegration.findOne().lean();
  assert.equal(integration.status, 'needs_reconnect');
  assert.match(integration.lastSyncError, /Reconnect/);
});

test('GET /api/google-reviews filters, sorts and returns stats; staff may read', async () => {
  await connect();
  await syncReviews({ full: true });
  const token = await staffToken();

  const all = await request('GET', '/api/google-reviews?sort=lowest', { token });
  assert.equal(all.status, 200);
  assert.equal(all.body.source, 'gbp');
  assert.deepEqual(all.body.reviews.map((r) => r.reviewId), ['r1', 'r2', 'r3']);
  assert.deepEqual(all.body.summary.distribution, { 1: 1, 2: 0, 3: 0, 4: 1, 5: 1 });
  assert.equal(all.body.summary.unreplied, 2);
  assert.equal(all.body.summary.averageRating, 4.5);

  const unreplied = await request('GET', '/api/google-reviews?replied=no', { token });
  assert.deepEqual(unreplied.body.reviews.map((r) => r.reviewId).sort(), ['r1', 'r2']);

  const five = await request('GET', '/api/google-reviews?rating=5', { token });
  assert.deepEqual(five.body.reviews.map((r) => r.reviewId), ['r3']);

  const search = await request('GET', '/api/google-reviews?search=person%20r2', { token });
  assert.deepEqual(search.body.reviews.map((r) => r.reviewId), ['r2']);

  // The status payload never carries the token.
  const status = await request('GET', '/api/google-reviews/status', { token });
  assert.equal(status.status, 200);
  assert.ok(!JSON.stringify(status.body).includes('refresh'));
});

test('replying is admin-only and posts to Google before saving locally', async () => {
  await connect();
  await syncReviews({ full: true });

  const staff = await staffToken();
  const denied = await request('PUT', '/api/google-reviews/r2/reply', { token: staff, body: { comment: 'hi' } });
  assert.equal(denied.status, 403);

  const admin = await adminToken();
  const empty = await request('PUT', '/api/google-reviews/r2/reply', { token: admin, body: { comment: '  ' } });
  assert.equal(empty.status, 400);

  const ok = await request('PUT', '/api/google-reviews/r2/reply', { token: admin, body: { comment: 'Thank you for visiting!' } });
  assert.equal(ok.status, 200);
  const put = calls.find((c) => c.method === 'PUT');
  assert.equal(put.url, '/v4/accounts/1/locations/2/reviews/r2/reply');
  assert.equal(JSON.parse(put.body).comment, 'Thank you for visiting!');
  const saved = await GoogleReview.findOne({ reviewId: 'r2' }).lean();
  assert.equal(saved.reply.comment, 'Thank you for visiting!');
  assert.equal(saved.reply.repliedBy, 'boss@example.com');

  // A later sync keeps who replied; a reply edited on Google Maps drops it.
  await syncReviews({ full: true });
  assert.equal((await GoogleReview.findOne({ reviewId: 'r2' })).reply.repliedBy, 'boss@example.com');
  google.pages[0].reviews[1].reviewReply = { comment: 'Edited on Maps', updateTime: '2026-11-21T10:00:00Z' };
  await syncReviews({ full: true });
  const edited = await GoogleReview.findOne({ reviewId: 'r2' }).lean();
  assert.equal(edited.reply.comment, 'Edited on Maps');
  assert.equal(edited.reply.repliedBy, '');

  const del = await request('DELETE', '/api/google-reviews/r2/reply', { token: admin });
  assert.equal(del.status, 200);
  assert.equal((await GoogleReview.findOne({ reviewId: 'r2' })).reply.comment, '');

  const missing = await request('PUT', '/api/google-reviews/nope/reply', { token: admin, body: { comment: 'x' } });
  assert.equal(missing.status, 404);
});

test('OAuth: auth URL carries a signed state; callback stores encrypted token, picks the location and syncs', async () => {
  const admin = await adminToken();
  const auth = await request('GET', '/api/google-reviews/auth-url', { token: admin, headers: { host: 'localhost:5005' } });
  assert.equal(auth.status, 200);
  const url = new URL(auth.body.url);
  assert.equal(url.searchParams.get('redirect_uri'), 'http://localhost:5005/api/integrations/google/callback');
  assert.equal(url.searchParams.get('access_type'), 'offline');
  assert.match(url.searchParams.get('scope'), /business\.manage/);

  const state = url.searchParams.get('state');
  const cb = await request('GET', `/api/integrations/google/callback?code=abc&state=${encodeURIComponent(state)}`);
  assert.equal(cb.status, 302);
  assert.equal(cb.location, 'http://localhost:5175/admin/feedback?tab=google&connected=1');

  const doc = await GoogleIntegration.findOne().select('+refreshTokenEnc').lean();
  assert.equal(doc.status, 'connected');
  assert.equal(doc.connectedEmail, 'owner@example.com');
  assert.equal(doc.locationName, 'locations/2');
  assert.equal(decrypt(doc.refreshTokenEnc), 'refresh-1');
  assert.equal(await GoogleReview.countDocuments(), 3);
});

test('OAuth callback rejects a forged state and records an unapproved API quota', async () => {
  const forged = jwt.sign({ purpose: 'google-reviews-oauth', redirectUri: 'x' }, 'wrong-secret');
  const bad = await request('GET', `/api/integrations/google/callback?code=abc&state=${forged}`);
  assert.equal(bad.status, 400);
  assert.equal(await GoogleIntegration.countDocuments(), 0);

  const wrongPurpose = jwt.sign({ userId: 'x' }, process.env.JWT_SECRET);
  assert.equal((await request('GET', `/api/integrations/google/callback?code=abc&state=${wrongPurpose}`)).status, 400);

  google.quotaZero = true;
  const state = jwt.sign({ purpose: 'google-reviews-oauth', redirectUri: 'http://localhost:5005/api/integrations/google/callback' }, process.env.JWT_SECRET);
  const cb = await request('GET', `/api/integrations/google/callback?code=abc&state=${state}`);
  assert.equal(cb.status, 302);
  const doc = await GoogleIntegration.findOne().lean();
  assert.equal(doc.status, 'connected');
  assert.equal(doc.locationName, '');
  assert.match(doc.lastSyncError, /access request form/);
});

test('staff cannot start OAuth, sync or disconnect', async () => {
  const token = await staffToken();
  assert.equal((await request('GET', '/api/google-reviews/auth-url', { token })).status, 403);
  assert.equal((await request('POST', '/api/google-reviews/sync', { token, body: {} })).status, 403);
  assert.equal((await request('DELETE', '/api/google-reviews/connection', { token })).status, 403);
  assert.equal((await request('GET', '/api/google-reviews')).status, 401);
});

test('disconnect revokes the grant and clears stored reviews', async () => {
  await connect();
  await syncReviews({ full: true });
  const admin = await adminToken();
  const res = await request('DELETE', '/api/google-reviews/connection', { token: admin });
  assert.equal(res.status, 200);
  assert.ok(calls.some((c) => c.url.startsWith('/revoke')));
  assert.equal(await GoogleReview.countDocuments(), 0);
  const list = await request('GET', '/api/google-reviews', { token: admin });
  assert.equal(list.body.source, 'none');
});

test('cron tick needs the secret and only syncs when due', async () => {
  assert.equal((await request('POST', '/api/internal/google-reviews/tick', { body: {} })).status, 401);
  await connect({ lastSyncAt: new Date() });
  const notDue = await request('POST', '/api/internal/google-reviews/tick', { body: {}, headers: { 'x-cron-secret': 'cron-secret' } });
  assert.equal(notDue.status, 200);
  assert.equal(notDue.body.skipped, 'not_due');

  await GoogleIntegration.updateOne({}, { lastSyncAt: new Date(Date.now() - 2 * 60 * 60 * 1000) });
  const due = await request('POST', '/api/internal/google-reviews/tick', { body: {}, headers: { 'x-cron-secret': 'cron-secret' } });
  assert.equal(due.status, 200);
  assert.equal(due.body.upserted, 3);
});
