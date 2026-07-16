const routes = require('./carDetailing.routes');
const controller = require('./carDetailing.controller');
const service = require('./carDetailing.service');
const model = require('./carDetailing.model');
const middleware = require('./carDetailing.middleware');

module.exports = {
  routes,
  controller,
  service,
  model,
  middleware
};
