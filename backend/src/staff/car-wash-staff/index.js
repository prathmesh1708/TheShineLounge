const routes = require('./carWashStaff.routes');
const controller = require('./carWashStaff.controller');
const service = require('./carWashStaff.service');
const model = require('./carWashStaff.model');
const middleware = require('./carWashStaff.middleware');

module.exports = {
  routes,
  controller,
  service,
  model,
  middleware
};
