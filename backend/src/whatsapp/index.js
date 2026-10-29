const routes = require('./routes');
const invoiceRoutes = require('./invoiceSend');
const webhook = require('./webhook');
const { startWhatsAppSender, runWhatsAppSenderTick } = require('./sender');
const { startSalonReminders, runSalonReminderTick } = require('./salonReminder');

module.exports = {
  routes,
  invoiceRoutes,
  webhook,
  startWhatsAppSender,
  runWhatsAppSenderTick,
  startSalonReminders,
  runSalonReminderTick
};
