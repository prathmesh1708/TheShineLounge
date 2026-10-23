const routes = require('./routes');
const invoiceRoutes = require('./invoiceSend');
const webhook = require('./webhook');
const { startWhatsAppSender, runWhatsAppSenderTick } = require('./sender');

module.exports = { routes, invoiceRoutes, webhook, startWhatsAppSender, runWhatsAppSenderTick };
