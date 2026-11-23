const { router, oauthRouter } = require('./routes');
const { startGoogleReviewsSync, runGoogleReviewsSyncTick } = require('./sync');

module.exports = {
  routes: router,
  oauthRoutes: oauthRouter,
  startGoogleReviewsSync,
  runGoogleReviewsSyncTick
};
