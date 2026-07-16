const routes = require('./driveThroughCafe.routes');
const controller = require('./driveThroughCafe.controller');
const service = require('./driveThroughCafe.service');
const model = require('./driveThroughCafe.model');
const middleware = require('./driveThroughCafe.middleware');

module.exports = {
  routes,
  controller,
  service,
  model,
  middleware
};
