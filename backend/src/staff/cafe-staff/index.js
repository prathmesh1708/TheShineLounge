const routes = require('./cafeStaff.routes');
const controller = require('./cafeStaff.controller');
const service = require('./cafeStaff.service');
const model = require('./cafeStaff.model');
const middleware = require('./cafeStaff.middleware');

module.exports = {
  routes,
  controller,
  service,
  model,
  middleware
};
