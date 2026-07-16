const routes = require('./driveThroughCafeStaff.routes');
const controller = require('./driveThroughCafeStaff.controller');
const service = require('./driveThroughCafeStaff.service');
const model = require('./driveThroughCafeStaff.model');
const middleware = require('./driveThroughCafeStaff.middleware');

module.exports = {
  routes,
  controller,
  service,
  model,
  middleware
};
