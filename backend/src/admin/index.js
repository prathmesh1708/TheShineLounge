const routes = require('./admin.routes');
const controller = require('./admin.controller');
const service = require('./admin.service');
const model = require('./admin.model');
const middleware = require('./admin.middleware');

module.exports = {
  routes,
  controller,
  service,
  model,
  middleware
};
