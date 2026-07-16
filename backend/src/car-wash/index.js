const routes = require('./carWash.routes');
const controller = require('./carWash.controller');
const service = require('./carWash.service');
const model = require('./carWash.model');
const middleware = require('./carWash.middleware');

module.exports = {
  routes,
  controller,
  service,
  model,
  middleware
};
