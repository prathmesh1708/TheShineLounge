const routes = require('./cafe.routes');
const controller = require('./cafe.controller');
const service = require('./cafe.service');
const model = require('./cafe.model');
const middleware = require('./cafe.middleware');

module.exports = {
  routes,
  controller,
  service,
  model,
  middleware
};
