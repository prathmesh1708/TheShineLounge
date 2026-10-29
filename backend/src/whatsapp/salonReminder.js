// Sends each salon customer a WhatsApp reminder SALON_REMINDER_LEAD_MIN (30)
// minutes before their appointment, and closes conversations nobody answered.
// The reminder is the approved template named in .env, sent as a one-recipient
// campaign exactly like invoice receipts (invoiceSend.js): same provider code,
// opt-outs honoured, and every reminder visible in the WhatsApp Hub history.
// The conversation that follows lives in salonReminderChat.js.
//
// Runs two ways:
//   * a 60s setInterval inside a long-lived server (PM2), and
//   * POST /api/internal/salon-reminders/tick from an external cron (serverless).
// A booking is claimed with an expiring lock and marked sent only after the
// provider accepted the message, so overlapping ticks never double-send and a
// failed send is simply tried again on the next tick.

const env = require('../common/config/env');
const Booking = require('../models/Booking');
const WhatsAppCampaign = require('../models/WhatsAppCampaign');
const WhatsAppContactPref = require('../models/WhatsAppContactPref');
const provider = require('./provider');
const { normalizePhone, formatPhone } = require('./phone');
const { runWhatsAppSenderTick, skipReason } = require('./sender');
const { dayKey } = require('../utils/siteTime');
const avail = require('../salon/salon.availability');

const TICK_MS = 60 * 1000;
const LOCK_MS = 2 * 60 * 1000;
// The reminder goes out while the appointment is lead ± this many minutes away.
const WINDOW_MIN = 1;
// A reschedule chat left mid-way is closed after this long without a reply.
const CHAT_TIMEOUT_MS = 2 * 60 * 60 * 1000;
const REMINDABLE_STATUSES = ['Pending', 'Confirmed'];
const AWAITING = ['awaiting_confirmation', 'awaiting_reschedule_choice', 'awaiting_day', 'awaiting_slot'];
// 'queued'/'sending' means the background sender picked the campaign up first
// and is delivering it; it is on its way, so it counts as sent.
const ACCEPTED = ['sent', 'delivered', 'read', 'queued', 'sending'];

const log = (msg) => console.log(`[salonReminder] ${msg}`);
const warn = (msg) => console.warn(`[salonReminder] ${msg}`);

// Legacy bookings carry the stylist as "Stylist: Name" in vehicleNo.
const stylistOf = (b) => b.assignedStaffName
  || (String(b.vehicleNo || '').startsWith('Stylist:') ? b.vehicleNo.slice(8).trim() : '');

const reminderVars = (b, phone) => {
  const name = String(b.customerName || '').trim();
  const day = avail.bookingDayKey(b);
  return {
    name,
    firstName: name.split(/\s+/)[0] || '',
    phone: formatPhone(phone),
    time: avail.bookingTimeLabel(b),
    date: day ? avail.longDate(day) : '',
    service: b.packageName || b.serviceName || 'your appointment',
    stylist: stylistOf(b),
    bookingId: b.bookingId,
    businessName: 'The Shine Lounge'
  };
};

// What the customer reads; stored on the campaign so the Hub history shows it.
const reminderText = (vars) => `Hi ${vars.name || 'there'}, this is a reminder from Shine Lounge 💇. `
  + `Your salon booking is today at ${vars.time} for ${vars.service}. Are you coming?`;

// Salon bookings starting lead ± WINDOW_MIN minutes from now that have not had their reminder.
const findDue = async (now) => {
  const lead = env.SALON_REMINDER_LEAD_MIN;
  const today = dayKey(now);
  // Tomorrow too: at 23:45 a 00:15 appointment is already due.
  const days = [today, avail.addDays(today, 1)];
  const rows = await Booking.find({
    serviceKey: 'salon',
    isOfflineSale: { $ne: true },
    status: { $in: REMINDABLE_STATUSES },
    reminderSent: { $ne: true },
    $or: days.flatMap((k) => avail.dayFilter(k).$or)
  }).select('-receiptPdfBase64').lean();

  const due = [];
  for (const booking of rows) {
    const startsAt = avail.bookingStartsAt(booking);
    if (!startsAt) continue;
    const minutesAway = (startsAt.getTime() - now.getTime()) / 60000;
    if (minutesAway >= lead - WINDOW_MIN && minutesAway <= lead + WINDOW_MIN) due.push({ booking, startsAt });
  }
  return due;
};

// Booked (or moved) less than the lead time before the slot: the customer has
// only just chosen it, so a reminder would be noise.
const bookedTooLate = (b, startsAt) => {
  const placed = Math.max(new Date(b.createdAt || 0).getTime(), new Date(b.rescheduledAt || 0).getTime());
  return startsAt.getTime() - placed < env.SALON_REMINDER_LEAD_MIN * 60 * 1000;
};

const noteFailure = (b, reason) => Booking.updateOne(
  { _id: b._id },
  { $set: { reminderError: String(reason).slice(0, 300), reminderLockUntil: null } }
);

// Runs the one-recipient campaign now and returns its recipient. If the
// background sender holds the campaign, wait briefly for it to finish.
const deliver = async (campaignId, now) => {
  await runWhatsAppSenderTick(now, { campaignId });
  let campaign = await WhatsAppCampaign.findById(campaignId).lean();
  for (let i = 0; i < 10 && campaign && ['queued', 'sending'].includes(campaign.recipients[0].status); i += 1) {
    await new Promise((r) => setTimeout(r, 300));
    campaign = await WhatsAppCampaign.findById(campaignId).lean();
  }
  return (campaign && campaign.recipients[0]) || {};
};

// Returns 'sent', 'failed' or 'skipped'.
const sendReminder = async (b, now) => {
  const phone = normalizePhone(b.phone);
  if (!phone) {
    await noteFailure(b, 'No valid mobile number on the booking');
    warn(`${b.bookingId}: not sent — no valid mobile number ("${b.phone || ''}")`);
    return 'skipped';
  }
  const pref = await WhatsAppContactPref.findOne({ phone }).lean();
  const reason = skipReason({ mode: 'template' }, pref, now, phone);
  if (reason) {
    await noteFailure(b, reason);
    warn(`${b.bookingId}: not sent to ${formatPhone(phone)} — ${reason}`);
    return 'skipped';
  }

  const claimed = await Booking.findOneAndUpdate(
    {
      _id: b._id,
      reminderSent: { $ne: true },
      $or: [{ reminderLockUntil: null }, { reminderLockUntil: { $lte: now } }]
    },
    { $set: { reminderLockUntil: new Date(now.getTime() + LOCK_MS) } }
  );
  if (!claimed) return 'skipped'; // another tick is sending it

  const vars = reminderVars(b, phone);
  const campaign = await WhatsAppCampaign.create({
    title: `Salon reminder ${b.bookingId}`,
    source: 'reminder',
    provider: provider.providerName(),
    mode: 'template',
    templateName: env.SALON_REMINDER_TEMPLATE_NAME,
    templateCategory: env.SALON_REMINDER_TEMPLATE_CATEGORY,
    templateLanguage: env.SALON_REMINDER_TEMPLATE_LANGUAGE,
    variableMap: env.SALON_REMINDER_TEMPLATE_VARS,
    body: reminderText(vars),
    recipients: [{ phone, name: vars.name, kind: 'customer', vars }],
    scheduledAt: now,
    dryRun: provider.isDryRun(),
    createdBy: 'system'
  });

  const recipient = await deliver(campaign._id, now);
  if (!ACCEPTED.includes(recipient.status)) {
    await noteFailure(b, recipient.error || `Send ${recipient.status || 'failed'}`);
    warn(`${b.bookingId}: send to ${formatPhone(phone)} failed — ${recipient.error || recipient.status}; retrying next minute`);
    return 'failed';
  }

  await Booking.updateOne({ _id: b._id }, {
    $set: {
      reminderSent: true,
      reminderSentAt: now,
      reminderPhone: phone,
      reminderError: '',
      reminderLockUntil: null,
      customerResponse: 'pending',
      chatState: 'awaiting_confirmation',
      chatContext: { updatedAt: now }
    }
  });
  log(`${b.bookingId}: reminder sent to ${formatPhone(phone)} for ${vars.time} (${vars.service})${provider.isDryRun() ? ' [dry run]' : ''}`);
  return 'sent';
};

// awaiting_confirmation past the appointment -> no_response; a reschedule
// abandoned for CHAT_TIMEOUT_MS -> no_response. The booking itself is untouched.
const closeStaleChats = async (now) => {
  let closed = 0;
  const open = await Booking.find({ chatState: { $in: AWAITING } })
    .select('bookingId date timeSlot chatState chatContext')
    .lean();

  for (const b of open) {
    if (b.chatState === 'awaiting_confirmation') {
      const startsAt = avail.bookingStartsAt(b);
      if (startsAt && startsAt > now) continue;
    } else {
      const last = b.chatContext && b.chatContext.updatedAt;
      if (last && now.getTime() - new Date(last).getTime() < CHAT_TIMEOUT_MS) continue;
    }
    const res = await Booking.updateOne(
      { _id: b._id, chatState: b.chatState },
      { $set: { customerResponse: 'no_response', chatState: 'done' } }
    );
    if (res.modifiedCount) {
      closed += 1;
      log(`${b.bookingId}: no reply (${b.chatState}) — marked no_response`);
    }
  }
  return closed;
};

const runSalonReminderTick = async (now = new Date()) => {
  const summary = { sent: 0, failed: 0, skipped: 0, closed: 0 };
  if (!env.SALON_REMINDER_ENABLED) return { ...summary, reason: 'Salon reminders are disabled' };

  summary.closed = await closeStaleChats(now);
  if (!provider.isConfigured()) return { ...summary, reason: 'WhatsApp API not configured' };

  for (const { booking, startsAt } of await findDue(now)) {
    if (bookedTooLate(booking, startsAt)) {
      summary.skipped += 1;
      continue;
    }
    try {
      summary[await sendReminder(booking, now)] += 1;
    } catch (err) {
      await noteFailure(booking, err.message || 'Send failed').catch(() => {});
      warn(`${booking.bookingId}: reminder error — ${err.message}; retrying next minute`);
      summary.failed += 1;
    }
  }
  return summary;
};

let timer = null;
let running = false;

const startSalonReminders = () => {
  if (timer) return;
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      await runSalonReminderTick(new Date());
    } catch (err) {
      warn(`tick failed: ${err.message}`);
    } finally {
      running = false;
    }
  };
  timer = setInterval(tick, TICK_MS);
  // Never keep the process alive just for this timer.
  if (typeof timer.unref === 'function') timer.unref();
  tick();
  console.log(`⏰ Salon WhatsApp reminders started (${env.SALON_REMINDER_LEAD_MIN} min before, 60s interval).`);
};

const stopSalonReminders = () => {
  if (timer) clearInterval(timer);
  timer = null;
};

module.exports = {
  runSalonReminderTick,
  startSalonReminders,
  stopSalonReminders,
  reminderVars,
  reminderText
};
