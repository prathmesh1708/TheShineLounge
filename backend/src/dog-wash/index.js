const routes = require('./dogWash.routes');
const controller = require('./dogWash.controller');
const service = require('./dogWash.service');
const model = require('./dogWash.model');
const middleware = require('./dogWash.middleware');

module.exports = {
  routes,
  controller,
  service,
  model,
  middleware
};
