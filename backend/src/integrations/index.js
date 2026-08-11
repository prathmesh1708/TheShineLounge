const routes = require('./integrations.routes');
const controller = require('./integrations.controller');
const service = require('./integrations.service');
const model = require('./integrations.model');
const middleware = require('./integrations.middleware');
const washStateMachine = require('./washStateMachine');

module.exports = {
  routes,
  controller,
  service,
  model,
  middleware,
  washStateMachine
};
