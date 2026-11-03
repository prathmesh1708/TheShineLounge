process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'test-password';
process.env.WHATSAPP_DRY_RUN = 'true';
// Interactive buttons/lists are the Meta path; BhashSMS falls back to plain text.
process.env.WHATSAPP_PROVIDER = 'meta';

const test = require('node:test');
const assert = require('node:assert/strict');

const db = require('./helpers/testDb');
const Booking = require('../src/models/Booking');
const WhatsAppCampaign = require('../src/models/WhatsAppCampaign');
const provider = require('../src/whatsapp/provider');
const { runSalonReminderTick } = require('../src/whatsapp/salonReminder');
const { handleSalonReply, yesNo, looseMinutes } = require('../src/whatsapp/salonReminderChat');
const avail = require('../src/salon/salon.availability');
const { nowParts, zonedDateFromDayKeyAndHHmm } = require('../src/utils/siteTime');

const PHONE = '919876543210';
const realSendMessage = provider.sendMessage;
let outbox = [];
let failNext = 0;

test.before(async () => { await db.start(); });
test.after(async () => {
  provider.sendMessage = realSendMessage;
  await db.stop();
});
test.beforeEach(async () => {
  await db.clear();
  outbox = [];
  failNext = 0;
  provider.sendMessage = async (to, message) => {
    if (failNext > 0) {
      failNext -= 1;
      throw new Error('Template not approved');
    }
    outbox.push({ to, message });
    return { messageId: `wamid.TEST.${outbox.length}` };
  };
});

const MINUTE = 60 * 1000;
const floorMinute = (d) => new Date(Math.floor(d.getTime() / MINUTE) * MINUTE);

let seq = 0;
const makeBooking = (startsAt, fields = {}) => {
  const { dayKey, minutesOfDay } = nowParts(startsAt);
  seq += 1;
  return Booking.create({
    bookingId: `BK-TEST-${seq}`,
    serviceKey: 'salon',
    serviceName: "Men's Salon",
    packageName: 'Premium Hair Cut',
    price: 350,
    date: avail.displayDate(dayKey),
    timeSlot: `${dayKey} | ${avail.timeLabel(minutesOfDay)}`,
    customerName: 'Rahul Sharma',
    phone: '+91 98765 43210',
    status: 'Confirmed',
    ...fields
  });
};

// A booking whose reminder has gone out and which waits on the customer.
const remindedBooking = (startsAt, fields = {}) => makeBooking(startsAt, {
  reminderSent: true,
  reminderSentAt: new Date(startsAt.getTime() - 30 * MINUTE),
  reminderPhone: PHONE,
  customerResponse: 'pending',
  chatState: 'awaiting_confirmation',
  ...fields
});

let msgSeq = 0;
const text = (body) => ({ from: PHONE, id: `wamid.IN.${++msgSeq}`, type: 'text', text: { body } });
const tap = (id, title) => ({ from: PHONE, id: `wamid.IN.${++msgSeq}`, type: 'interactive', interactive: { type: 'list_reply', list_reply: { id, title } } });
const lastOut = () => outbox[outbox.length - 1].message;
const bodyOf = (m) => (m.type === 'text' ? m.text.body : m.interactive.body.text);

test('booking date/time strings are read as IST wall-clock time', () => {
  assert.equal(avail.bookingStartsAt({ date: 'October 23, 2026', timeSlot: '2026-10-23 | 10:00 AM' }).toISOString(), '2026-10-23T04:30:00.000Z');
  assert.equal(avail.bookingStartsAt({ date: 'October 23, 2026', timeSlot: '10:00 AM - 10:30 AM' }).toISOString(), '2026-10-23T04:30:00.000Z');
  assert.equal(avail.bookingStartsAt({ date: '2026-10-23', timeSlot: '12:30 PM' }).toISOString(), '2026-10-23T07:00:00.000Z');
  assert.equal(avail.bookingStartsAt({ date: 'October 23, 2026', timeSlot: '2026-10-24 | 12:15 AM' }).toISOString(), '2026-10-23T18:45:00.000Z');
  assert.equal(avail.bookingStartsAt({ date: 'someday', timeSlot: 'whenever' }), null);
});

test('reply words: yes/no variants and loose times', () => {
  assert.equal(yesNo({ replyId: '', text: 'Haan!' }), 'yes');
  assert.equal(yesNo({ replyId: '', text: 'Coming 👍' }), 'yes');
  assert.equal(yesNo({ replyId: '', text: 'NOT coming.' }), 'no');
  assert.equal(yesNo({ replyId: '', text: 'nahi' }), 'no');
  assert.equal(yesNo({ replyId: 'no', text: 'No' }), 'no');
  assert.equal(yesNo({ replyId: '', text: 'maybe later' }), null);
  assert.equal(looseMinutes('4 pm'), 16 * 60);
  assert.equal(looseMinutes('10:30am'), 10 * 60 + 30);
  assert.equal(looseMinutes('hello'), null);
});

test('reminder goes out once, 30 minutes before, only for live salon bookings', async () => {
  const now = new Date(Date.now() + 60 * MINUTE); // bookings below were created an hour "ago"
  const due = await makeBooking(floorMinute(new Date(now.getTime() + 30 * MINUTE)));
  const later = await makeBooking(floorMinute(new Date(now.getTime() + 45 * MINUTE)));
  const cancelled = await makeBooking(floorMinute(new Date(now.getTime() + 30 * MINUTE)), { status: 'Cancelled' });
  const counterSale = await makeBooking(floorMinute(new Date(now.getTime() + 30 * MINUTE)), { isOfflineSale: true });
  const carWash = await makeBooking(floorMinute(new Date(now.getTime() + 30 * MINUTE)), { serviceKey: 'car-wash' });

  const summary = await runSalonReminderTick(now);
  assert.equal(summary.sent, 1);

  const fresh = await Booking.findById(due._id).lean();
  assert.equal(fresh.reminderSent, true);
  assert.equal(fresh.reminderPhone, PHONE);
  assert.equal(fresh.customerResponse, 'pending');
  assert.equal(fresh.chatState, 'awaiting_confirmation');

  for (const b of [later, cancelled, counterSale, carWash]) {
    assert.equal((await Booking.findById(b._id).lean()).reminderSent, false);
  }

  assert.equal(outbox.length, 1);
  const { message } = outbox[0];
  assert.equal(message.type, 'template');
  assert.equal(message.template.name, 'salon_booking_reminder');
  assert.deepEqual(
    message.template.components[0].parameters.map((p) => p.text),
    ['Rahul Sharma', avail.bookingTimeLabel(fresh), 'Premium Hair Cut']
  );
  const campaign = await WhatsAppCampaign.findOne({ source: 'reminder' }).lean();
  assert.match(campaign.body, /Are you coming\?/);

  // Next minute, still inside the window: nothing is sent twice.
  assert.equal((await runSalonReminderTick(new Date(now.getTime() + MINUTE))).sent, 0);
  assert.equal(outbox.length, 1);
  assert.equal(await WhatsAppCampaign.countDocuments({ source: 'reminder' }), 1);
});

test('no reminder for a booking made less than 30 minutes before its slot', async () => {
  const startsAt = floorMinute(new Date(Date.now() + 25 * MINUTE));
  const booking = await makeBooking(startsAt);
  const summary = await runSalonReminderTick(new Date(startsAt.getTime() - 30 * MINUTE));
  assert.equal(summary.sent, 0);
  assert.equal((await Booking.findById(booking._id).lean()).reminderSent, false);
});

test('a failed send is logged on the booking and retried next minute', async () => {
  const now = new Date(Date.now() + 60 * MINUTE);
  // First seen 31 min out (the window opens at lead + 1), retried at 30.
  const booking = await makeBooking(floorMinute(new Date(now.getTime() + 31 * MINUTE)));

  failNext = 1;
  assert.equal((await runSalonReminderTick(now)).failed, 1);
  let fresh = await Booking.findById(booking._id).lean();
  assert.equal(fresh.reminderSent, false);
  assert.match(fresh.reminderError, /Template not approved/);

  assert.equal((await runSalonReminderTick(new Date(now.getTime() + MINUTE))).sent, 1);
  fresh = await Booking.findById(booking._id).lean();
  assert.equal(fresh.reminderSent, true);
  assert.equal(fresh.reminderError, '');
});

test('YES confirms the booking', async () => {
  const booking = await remindedBooking(floorMinute(new Date(Date.now() + 30 * MINUTE)));
  assert.equal(await handleSalonReply({ from: PHONE, id: 'wamid.BTN', type: 'button', button: { text: 'Yes', payload: 'Yes' } }), true);

  const fresh = await Booking.findById(booking._id).lean();
  assert.equal(fresh.customerResponse, 'confirmed');
  assert.equal(fresh.chatState, 'done');
  assert.equal(bodyOf(lastOut()), `Great! See you at ${avail.bookingTimeLabel(fresh)} at Shine Lounge ✨`);

  // The chat is over: later messages are not ours to answer.
  assert.equal(await handleSalonReply(text('hello')), false);
});

test('NO, then NO to rescheduling, cancels the booking', async () => {
  const booking = await remindedBooking(floorMinute(new Date(Date.now() + 30 * MINUTE)));

  await handleSalonReply(text('No'));
  assert.equal(lastOut().type, 'interactive');
  assert.equal(lastOut().interactive.type, 'button');
  assert.equal(bodyOf(lastOut()), 'No problem. Would you like to reschedule your booking?');

  await handleSalonReply(text('nahi'));
  const fresh = await Booking.findById(booking._id).lean();
  assert.equal(fresh.status, 'Cancelled');
  assert.equal(fresh.statusSource, 'customer');
  assert.equal(fresh.customerResponse, 'cancelled');
  assert.equal(fresh.chatState, 'done');
  assert.equal(bodyOf(lastOut()), 'Your booking has been cancelled. We hope to see you soon!');
});

test('NO, then YES, reschedules into a free slot without double-booking', async () => {
  // A fixed future day keeps the slot maths independent of when the test runs.
  const now = zonedDateFromDayKeyAndHHmm('2030-01-10', '08:00');
  const booking = await remindedBooking(zonedDateFromDayKeyAndHHmm('2030-01-10', '09:00'));
  await makeBooking(zonedDateFromDayKeyAndHHmm('2030-01-10', '10:00'), { customerName: 'Someone Else', phone: '9123456780' });

  await handleSalonReply(text('no'), now);
  await handleSalonReply(text('yes'), now);

  let fresh = await Booking.findById(booking._id).lean();
  assert.equal(fresh.chatState, 'awaiting_day');
  assert.deepEqual(fresh.chatContext.dayOptions, ['2030-01-10', '2030-01-11', '2030-01-12']);
  assert.equal(lastOut().interactive.type, 'list');
  assert.equal(lastOut().interactive.action.sections[0].rows[0].id, 'day:2030-01-10');

  await handleSalonReply(tap('day:2030-01-10', 'Thu, 10 Jan'), now);
  fresh = await Booking.findById(booking._id).lean();
  assert.equal(fresh.chatState, 'awaiting_slot');
  // Own slot (09:00) and the other customer's (10:00) are not offered.
  assert.equal(fresh.chatContext.slotOptions.includes('09:00 AM'), false);
  assert.equal(fresh.chatContext.slotOptions.includes('10:00 AM'), false);
  assert.equal(fresh.chatContext.slotOptions[0], '09:30 AM');

  // Typing a taken time is not a valid choice: the question is asked again.
  await handleSalonReply(text('10 am'), now);
  assert.match(bodyOf(lastOut()), /^Sorry, I didn't understand that/);

  await handleSalonReply(text('1'), now);
  fresh = await Booking.findById(booking._id).lean();
  assert.equal(fresh.date, 'January 10, 2030');
  assert.equal(fresh.timeSlot, '2030-01-10 | 09:30 AM');
  assert.equal(fresh.reminderSent, false);
  assert.equal(fresh.customerResponse, 'rescheduled');
  assert.equal(fresh.chatState, 'done');
  assert.equal(bodyOf(lastOut()), 'Your booking is rescheduled to Thursday, 10 January at 09:30 AM. See you then!');
});

test('unrecognised replies re-ask the question; a retried webhook message is ignored', async () => {
  const booking = await remindedBooking(floorMinute(new Date(Date.now() + 30 * MINUTE)));

  const msg = text('what?');
  await handleSalonReply(msg);
  assert.match(bodyOf(lastOut()), /^Sorry, I didn't understand that\. Your salon booking is today at .* Are you coming\?$/);
  assert.equal((await Booking.findById(booking._id).lean()).chatState, 'awaiting_confirmation');

  const before = outbox.length;
  assert.equal(await handleSalonReply(msg), true);
  assert.equal(outbox.length, before);
});

test('no reply by the appointment time marks no_response and leaves the booking alone', async () => {
  const startsAt = floorMinute(new Date(Date.now() - 5 * MINUTE));
  const booking = await remindedBooking(startsAt);

  const summary = await runSalonReminderTick(new Date());
  assert.equal(summary.closed, 1);
  const fresh = await Booking.findById(booking._id).lean();
  assert.equal(fresh.customerResponse, 'no_response');
  assert.equal(fresh.chatState, 'done');
  assert.equal(fresh.status, 'Confirmed');
});
