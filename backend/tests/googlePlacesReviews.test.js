process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'test-password';
process.env.GOOGLE_PLACES_API_KEY = 'test-places-key';
delete process.env.GOOGLE_PLACE_ID;

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const express = require('express');
const jwt = require('jsonwebtoken');

const db = require('./helpers/testDb');
const Staff = require('../src/models/Staff');
const { resetPlacesCache } = require('../src/google-reviews/places');
const googleReviews = require('../src/google-reviews');

const app = express();
app.use('/api/google-reviews', googleReviews.routes);

let server;
let baseUrl;
const realFetch = global.fetch;
const calls = [];
let detailsStatus = 200;

const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

global.fetch = async (url, init = {}) => {
  if (String(url).startsWith(baseUrl)) return realFetch(url, init);
  const u = new URL(url);
  calls.push({ method: init.method || 'GET', path: u.pathname, headers: init.headers, body: init.body });
  if (u.pathname === '/v1/places:searchText') {
    return json(200, { places: [{ id: 'ChIJshine', displayName: { text: 'The Shine Lounge' } }] });
  }
  if (u.pathname === '/v1/places/ChIJshine') {
    if (detailsStatus !== 200) return json(detailsStatus, { error: { message: 'Places API (New) has not been used in project 1 before or it is disabled.' } });
    return json(200, {
      id: 'ChIJshine',
      displayName: { text: 'The Shine Lounge' },
      rating: 5,
      userRatingCount: 61,
      googleMapsUri: 'https://maps.google.com/?cid=1',
      reviews: [
        { name: 'places/ChIJshine/reviews/a', rating: 5, text: { text: 'Friendly staff quick work' }, authorAttribution: { displayName: 'Ravi', photoUri: 'https://p/1' }, publishTime: '2026-11-01T00:00:00Z', relativePublishTimeDescription: '3 weeks ago' },
        { name: 'places/ChIJshine/reviews/b', rating: 4, originalText: { text: 'Halloween theme!' }, text: { text: 'Halloween theme!' }, authorAttribution: { displayName: 'P' }, publishTime: '2026-10-31T00:00:00Z' }
      ]
    });
  }
  throw new Error(`unexpected fetch ${url}`);
};

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
  detailsStatus = 200;
  resetPlacesCache();
});

const staffToken = async () => {
  const staff = await Staff.create({ staffId: 'S1', fullName: 'Aarav', email: 'aarav@example.com', password: 'secret123', mobile: '9000012345' });
  return jwt.sign({ userId: staff._id.toString() }, process.env.JWT_SECRET);
};

const get = async (path, token) => {
  const res = await realFetch(`${baseUrl}${path}`, { headers: { authorization: `Bearer ${token}` } });
  return { status: res.status, body: await res.json() };
};

test('with only an API key, the place is found by name and its rating, count and reviews are shown', async () => {
  const token = await staffToken();
  const res = await get('/api/google-reviews', token);
  assert.equal(res.status, 200);
  assert.equal(res.body.source, 'places');
  assert.equal(res.body.summary.averageRating, 5);
  assert.equal(res.body.summary.totalReviewCount, 61);
  assert.equal(res.body.summary.mapsUri, 'https://maps.google.com/?cid=1');
  assert.deepEqual(res.body.reviews.map((r) => [r.reviewerName, r.starRating, r.comment]), [
    ['Ravi', 5, 'Friendly staff quick work'],
    ['P', 4, 'Halloween theme!']
  ]);
  assert.equal(calls[0].path, '/v1/places:searchText');
  assert.equal(calls[0].headers['X-Goog-Api-Key'], 'test-places-key');

  // Second load is served from memory: no new Google calls.
  const before = calls.length;
  await get('/api/google-reviews', token);
  assert.equal(calls.length, before);

  // Rating filter works on the Places list too.
  const fives = await get('/api/google-reviews?rating=5', token);
  assert.deepEqual(fives.body.reviews.map((r) => r.reviewerName), ['Ravi']);
});

test('a disabled Places API comes back as a clear message', async () => {
  detailsStatus = 403;
  const token = await staffToken();
  const res = await get('/api/google-reviews', token);
  assert.equal(res.status, 502);
  assert.match(res.body.message, /Enable "Places API \(New\)"/);
});
