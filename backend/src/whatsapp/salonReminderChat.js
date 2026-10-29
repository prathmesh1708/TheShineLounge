// The WhatsApp conversation that follows a salon reminder (salonReminder.js).
// webhook.js hands every inbound message here; it is only taken up when the
// sender's number has a live salon booking waiting on an answer, so ordinary
// chats with the business number are left alone.
//
//   awaiting_confirmation       Yes -> confirmed           No -> offer to reschedule
//   awaiting_reschedule_choice  Yes -> next 3 free days    No -> cancel the booking
//   awaiting_day                day -> that day's free times
//   awaiting_slot               time -> booking moved, reminder re-armed
//
// Anything unrecognised re-asks the current question. Replies are session
// messages (the customer has just written, so WhatsApp's 24h window is open):
// Meta gets interactive buttons and lists, BhashSMS gets numbered plain text.

const Booking = require('../models/Booking');
const provider = require('./provider');
const { normalizePhone, formatPhone } = require('./phone');
const avail = require('../salon/salon.availability');

const OPEN_STATES = ['awaiting_confirmation', 'awaiting_reschedule_choice', 'awaiting_day', 'awaiting_slot'];
// Meta's limit for rows in one list message; longer lists go as numbered text.
const LIST_MAX_ROWS = 10;
const YES_NO = [{ id: 'yes', title: 'Yes' }, { id: 'no', title: 'No' }];

const SORRY = "Sorry, I didn't understand that. ";
const RESCHEDULE_QUESTION = 'No problem. Would you like to reschedule your booking?';

const YES_WORDS = new Set(['yes', 'y', 'yeah', 'yep', 'haan', 'han', 'ha', 'haa', 'ji', 'haan ji', 'ok', 'okay', 'sure',
  'coming', 'i am coming', 'im coming', 'yes coming', 'yes i am coming']);
const NO_WORDS = new Set(['no', 'n', 'nope', 'nahi', 'nahin', 'nai', 'not coming', 'no not coming',
  'i am not coming', 'im not coming', 'cant come', 'cannot come']);

const log = (msg) => console.log(`[salonReminder] ${msg}`);
const warn = (msg) => console.warn(`[salonReminder] ${msg}`);

// "Yes!", "Haan 👍", "  NOT coming. " -> "yes", "haan", "not coming"
const normalizeText = (text) => String(text || '')
  .toLowerCase()
  .replace(/[^a-z0-9: ]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

// Text plus the id of a tapped button or list row. Template quick-reply
// buttons arrive as type "button" with their payload.
const readInbound = (m) => {
  if (m.interactive) {
    const r = m.interactive.button_reply || m.interactive.list_reply || {};
    return { replyId: r.id || '', text: r.title || '' };
  }
  if (m.button) return { replyId: m.button.payload || '', text: m.button.text || '' };
  if (m.text) return { replyId: '', text: m.text.body || '' };
  return { replyId: '', text: '' };
};

const yesNo = ({ replyId, text }) => {
  if (replyId === 'yes' || replyId === 'no') return replyId;
  for (const value of [normalizeText(text), normalizeText(replyId)]) {
    // "not coming" contains "coming": test the negatives first.
    if (NO_WORDS.has(value)) return 'no';
    if (YES_WORDS.has(value)) return 'yes';
  }
  return null;
};

// "10am", "10:30 am", "4 pm", "16:30" -> minutes since midnight.
const looseMinutes = (text) => {
  const m = normalizeText(text).replace(/\s+/g, '').match(/^(\d{1,2})(?::?(\d{2}))?(am|pm|a|p)?$/);
  if (!m) return null;
  let hour = Number(m[1]);
  const minute = Number(m[2] || 0);
  if (minute > 59 || hour > 23) return null;
  if (m[3]) {
    if (hour < 1 || hour > 12) return null;
    hour = (hour % 12) + (m[3].startsWith('p') ? 12 : 0);
  }
  return hour * 60 + minute;
};

// A tapped row ("day:2026-10-24"), a number from the list ("2"), or the option typed out.
const pickOption = ({ replyId, text }, options, prefix, matches) => {
  if (replyId.startsWith(prefix)) {
    const value = replyId.slice(prefix.length);
    return options.includes(value) ? value : null;
  }
  const number = normalizeText(text).match(/^(\d{1,2})$/);
  if (number && Number(number[1]) >= 1 && Number(number[1]) <= options.length) {
    return options[Number(number[1]) - 1];
  }
  return options.find((o) => matches(o, text)) || null;
};

const dayMatches = (key, text) => [avail.shortDate(key), avail.longDate(key)]
  .some((label) => normalizeText(label) === normalizeText(text));

const slotMatches = (label, text) => {
  const minutes = looseMinutes(text);
  return minutes !== null && minutes === avail.parseTime(label);
};

// ── Sending ──────────────────────────────────────────────────────────────────
const sendText = (phone, text) => (provider.isBhashSms()
  ? provider.bhashsms.sendText({ phones: [phone], text })
  : provider.sendMessage(phone, { type: 'text', text: { body: text } }));

const sendButtons = (phone, text, buttons) => {
  if (provider.isBhashSms()) {
    return sendText(phone, `${text}\n\nPlease reply ${buttons.map((b) => b.title.toUpperCase()).join(' or ')}.`);
  }
  return provider.sendMessage(phone, {
    type: 'interactive',
    interactive: {
      type: 'button',
      body: { text },
      action: { buttons: buttons.map((b) => ({ type: 'reply', reply: { id: b.id, title: b.title } })) }
    }
  });
};

// rows: [{ id, title }] — a tappable list on Meta, numbered text otherwise.
const sendChoices = (phone, text, buttonLabel, rows) => {
  if (provider.isBhashSms() || rows.length > LIST_MAX_ROWS) {
    const numbered = rows.map((r, i) => `${i + 1}. ${r.title}`).join('\n');
    return sendText(phone, `${text}\n\n${numbered}\n\nPlease reply with the number.`);
  }
  return provider.sendMessage(phone, {
    type: 'interactive',
    interactive: {
      type: 'list',
      body: { text: `${text}\n\nTap the button below, or reply with the number.` },
      action: {
        button: buttonLabel,
        sections: [{ title: buttonLabel, rows: rows.map((r) => ({ id: r.id, title: r.title.slice(0, 24) })) }]
      }
    }
  });
};

// The conversation state is already saved; a failed reply is logged, and the
// customer's next message re-asks the question.
const reply = async (booking, what, send) => {
  try {
    await send();
    log(`${booking.bookingId}: replied — ${what}`);
  } catch (err) {
    warn(`${booking.bookingId}: could not send "${what}" — ${err.message}`);
  }
};

// updateOne rather than save(): a legacy booking that fails today's schema
// validation must still be able to answer its reminder.
const update = async (booking, $set) => {
  await Booking.updateOne({ _id: booking._id }, { $set });
  for (const [path, value] of Object.entries($set)) booking.set(path, value);
};

// ── Questions ────────────────────────────────────────────────────────────────
const askConfirmation = (booking, phone, prefix = '') => reply(booking, 'asked to confirm', () => sendButtons(
  phone,
  `${prefix}Your salon booking is today at ${avail.bookingTimeLabel(booking)} for ${booking.packageName || booking.serviceName}. Are you coming?`,
  YES_NO
));

const askReschedule = (booking, phone, prefix = '') => reply(booking, 'offered to reschedule', () =>
  sendButtons(phone, `${prefix}${RESCHEDULE_QUESTION}`, YES_NO));

const askDay = (booking, phone, days, prefix = '') => reply(booking, `offered days ${days.join(', ')}`, () => sendChoices(
  phone,
  `${prefix}Please choose a day for your new appointment:`,
  'Choose a day',
  days.map((key) => ({ id: `day:${key}`, title: avail.shortDate(key) }))
));

const askSlot = (booking, phone, day, slots, prefix = '') => reply(booking, `offered ${slots.length} times on ${day}`, () => sendChoices(
  phone,
  `${prefix}Free times on ${avail.shortDate(day)}. Please choose one:`,
  'Choose a time',
  slots.map((label) => ({ id: `slot:${label}`, title: label }))
));

// Moves the chat to awaiting_day with fresh options, or ends it when the salon is full.
const offerDays = async (booking, phone, now, prefix = '') => {
  const days = await avail.nextAvailableDays(booking, now, 3);
  if (!days.length) {
    await update(booking, { chatState: 'done' });
    log(`${booking.bookingId}: no free days to reschedule into`);
    return reply(booking, 'no free days', () => sendText(phone,
      `${prefix}Sorry, we have no free slots in the next two weeks. Please call the salon and we will fit you in.`));
  }
  await update(booking, {
    chatState: 'awaiting_day',
    'chatContext.dayOptions': days,
    'chatContext.selectedDay': '',
    'chatContext.slotOptions': []
  });
  return askDay(booking, phone, days, prefix);
};

// ── States ───────────────────────────────────────────────────────────────────
const onConfirmation = async (booking, phone, input) => {
  const answer = yesNo(input);
  if (answer === 'yes') {
    await update(booking, { customerResponse: 'confirmed', chatState: 'done' });
    log(`${booking.bookingId}: customer confirmed`);
    return reply(booking, 'confirmed', () => sendText(phone,
      `Great! See you at ${avail.bookingTimeLabel(booking)} at Shine Lounge ✨`));
  }
  if (answer === 'no') {
    await update(booking, { chatState: 'awaiting_reschedule_choice' });
    log(`${booking.bookingId}: customer is not coming`);
    return askReschedule(booking, phone);
  }
  return askConfirmation(booking, phone, SORRY);
};

const onRescheduleChoice = async (booking, phone, input, now) => {
  const answer = yesNo(input);
  if (answer === 'yes') return offerDays(booking, phone, now);
  if (answer === 'no') {
    // Cancelling frees the slot: availability only counts live bookings.
    await update(booking, {
      status: 'Cancelled',
      statusSource: 'customer',
      customerResponse: 'cancelled',
      chatState: 'done'
    });
    log(`${booking.bookingId}: cancelled by customer over WhatsApp`);
    return reply(booking, 'cancelled', () => sendText(phone,
      'Your booking has been cancelled. We hope to see you soon!'));
  }
  return askReschedule(booking, phone, SORRY);
};

const onDay = async (booking, phone, input, now) => {
  const options = booking.chatContext.dayOptions || [];
  const day = pickOption(input, options, 'day:', dayMatches);
  if (!day) return askDay(booking, phone, options, SORRY);

  const slots = await avail.availableSlots(day, booking, now);
  if (!slots.length) return offerDays(booking, phone, now, 'Sorry, that day has just filled up. ');

  await update(booking, {
    chatState: 'awaiting_slot',
    'chatContext.selectedDay': day,
    'chatContext.slotOptions': slots
  });
  return askSlot(booking, phone, day, slots);
};

const onSlot = async (booking, phone, input, now) => {
  const day = booking.chatContext.selectedDay;
  const options = booking.chatContext.slotOptions || [];
  const label = pickOption(input, options, 'slot:', slotMatches);
  if (!label) return askSlot(booking, phone, day, options, SORRY);

  // Re-check: someone may have taken it since the list was sent.
  const free = await avail.availableSlots(day, booking, now);
  if (!free.includes(label)) {
    if (!free.length) return offerDays(booking, phone, now, 'Sorry, that time was just taken and the day is now full. ');
    await update(booking, { 'chatContext.slotOptions': free });
    return askSlot(booking, phone, day, free, 'Sorry, that time was just taken. ');
  }

  const previous = booking.timeSlot;
  await update(booking, {
    date: avail.displayDate(day),
    timeSlot: `${day} | ${label}`,
    // Re-armed so the customer is reminded before the new time too.
    reminderSent: false,
    reminderSentAt: null,
    reminderLockUntil: null,
    reminderError: '',
    rescheduledAt: now,
    customerResponse: 'rescheduled',
    chatState: 'done',
    'chatContext.dayOptions': [],
    'chatContext.slotOptions': [],
    'chatContext.selectedDay': ''
  });
  log(`${booking.bookingId}: rescheduled from "${previous}" to "${day} | ${label}"`);
  return reply(booking, 'rescheduled', () => sendText(phone,
    `Your booking is rescheduled to ${avail.longDate(day)} at ${label}. See you then!`));
};

const HANDLERS = {
  awaiting_confirmation: onConfirmation,
  awaiting_reschedule_choice: onRescheduleChoice,
  awaiting_day: onDay,
  awaiting_slot: onSlot
};

/**
 * Handles one inbound WhatsApp message (Meta webhook shape). Returns true when
 * it belonged to a salon reminder conversation.
 */
const handleSalonReply = async (m, now = new Date()) => {
  const phone = normalizePhone(m && m.from);
  if (!phone) return false;

  // The most recently reminded booking wins if one number has several.
  const booking = await Booking.findOne({
    serviceKey: 'salon',
    reminderPhone: phone,
    chatState: { $in: OPEN_STATES },
    status: { $in: ['Pending', 'Confirmed'] }
  }).sort({ reminderSentAt: -1 });
  if (!booking) return false;

  if (m.id && booking.chatContext && booking.chatContext.lastInboundId === m.id) return true;
  await update(booking, { 'chatContext.lastInboundId': m.id || '', 'chatContext.updatedAt': now });

  const input = readInbound(m);
  log(`${booking.bookingId}: reply "${input.text || input.replyId}" from ${formatPhone(phone)} (${booking.chatState})`);
  await HANDLERS[booking.chatState](booking, phone, input, now);
  return true;
};

module.exports = { handleSalonReply, readInbound, yesNo, looseMinutes };
