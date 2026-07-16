const routes = require('./dogWashStaff.routes');
const controller = require('./dogWashStaff.controller');
const service = require('./dogWashStaff.service');
const model = require('./dogWashStaff.model');
const middleware = require('./dogWashStaff.middleware');

module.exports = {
  routes,
  controller,
  service,
  model,
  middleware
};
