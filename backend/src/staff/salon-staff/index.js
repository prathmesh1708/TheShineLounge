const routes = require('./salonStaff.routes');
const controller = require('./salonStaff.controller');
const service = require('./salonStaff.service');
const model = require('./salonStaff.model');
const middleware = require('./salonStaff.middleware');

module.exports = {
  routes,
  controller,
  service,
  model,
  middleware
};
