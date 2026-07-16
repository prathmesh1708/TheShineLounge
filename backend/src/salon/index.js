const routes = require('./salon.routes');
const controller = require('./salon.controller');
const service = require('./salon.service');
const model = require('./salon.model');
const middleware = require('./salon.middleware');

module.exports = {
  routes,
  controller,
  service,
  model,
  middleware
};
