const Booking = require('../models/Booking');
const salonService = require('./salon.service');
const { dayKey, zonedDateFromDayKeyAndHHmm } = require('../utils/siteTime');

// Salon bookings store the appointment as wall-clock strings with no zone:
// `date` "October 23, 2026" (or "2026-10-23") and `timeSlot`
// "2026-10-23 | 10:00 AM" (or "10:00 AM - 10:30 AM"). Those are the shop's
// local times, so they are read in SITE_TIMEZONE (Asia/Kolkata) through
// utils/siteTime — never through new Date(string), which would use whatever
// zone the server happens to run in.

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
  'August', 'September', 'October', 'November', 'December'];
const ISO_DAY = /^(\d{4})-(\d{2})-(\d{2})/;
const DISPLAY_DAY = /^([A-Za-z]+)\.?\s+(\d{1,2}),?\s+(\d{4})$/;
const TIME_12H = /(\d{1,2}):(\d{2})\s*([AaPp])\.?\s*[Mm]/;
const TIME_24H = /\b([01]?\d|2[0-3]):([0-5]\d)\b/;

// Bookings in these states no longer hold a chair.
const RELEASED_STATUSES = ['Cancelled', 'Completed', 'Styling Complete', 'Service Completed'];
// A rescheduled slot must leave time for the reminder to go out first.
const MIN_NOTICE_MIN = 60;
// How far ahead to look for free days.
const SEARCH_DAYS = 14;

const pad = (n) => String(n).padStart(2, '0');

// "2026-10-23 | 10:00 AM", "2026-10-23", "October 23, 2026", "Oct 23, 2026" -> "2026-10-23".
const parseDayKey = (value) => {
  const str = String(value || '').trim();
  const iso = str.match(ISO_DAY);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const display = str.match(DISPLAY_DAY);
  if (display) {
    const prefix = display[1].slice(0, 3).toLowerCase();
    const month = MONTHS.findIndex((m) => m.toLowerCase().startsWith(prefix));
    if (month !== -1) return `${display[3]}-${pad(month + 1)}-${pad(display[2])}`;
  }
  return '';
};

// "10:00 AM" / "4:30pm" / "16:30" -> minutes since midnight; anything else -> null.
const parseTime = (value) => {
  const str = String(value || '');
  const m12 = str.match(TIME_12H);
  if (m12) {
    const hour = Number(m12[1]);
    const minute = Number(m12[2]);
    if (hour < 1 || hour > 12 || minute > 59) return null;
    return ((hour % 12) + (/p/i.test(m12[3]) ? 12 : 0)) * 60 + minute;
  }
  const m24 = str.match(TIME_24H);
  return m24 ? Number(m24[1]) * 60 + Number(m24[2]) : null;
};

const toHHmm = (minutes) => `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;

// 600 -> "10:00 AM", the format the booking page writes into timeSlot.
const timeLabel = (minutes) => {
  const hour = Math.floor(minutes / 60);
  return `${pad(hour % 12 || 12)}:${pad(minutes % 60)} ${hour >= 12 ? 'PM' : 'AM'}`;
};

// The timeSlot's own date wins: it is what the customer picked on the booking page.
const bookingDayKey = (booking) => parseDayKey(booking.timeSlot) || parseDayKey(booking.date);

const bookingMinutes = (booking) => {
  const slot = String(booking.timeSlot || '');
  // Skip the "2026-10-23 |" prefix so its digits are never read as a time.
  return parseTime(slot.includes('|') ? slot.slice(slot.indexOf('|') + 1) : slot);
};

const bookingTimeLabel = (booking) => {
  const minutes = bookingMinutes(booking);
  return minutes === null ? '' : timeLabel(minutes);
};

// The real instant the appointment starts, or null when the strings are unreadable.
const bookingStartsAt = (booking) => {
  const day = bookingDayKey(booking);
  const minutes = bookingMinutes(booking);
  if (!day || minutes === null) return null;
  return zonedDateFromDayKeyAndHHmm(day, toHHmm(minutes));
};

const addDays = (key, n) => {
  const [y, m, d] = key.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
};

const utcNoon = (key) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12));
};

// "October 24, 2026" — the stored display format (utils/dateFormat.toDisplayDate).
const displayDate = (key) => {
  const [y, m, d] = key.split('-').map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
};

// "Sat, 24 Oct" and "Saturday, 24 October" for chat messages.
const shortDate = (key) => utcNoon(key).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
const longDate = (key) => utcNoon(key).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });

// Matches a day's bookings whichever of the stored formats they use.
const dayFilter = (key) => ({
  $or: [{ date: displayDate(key) }, { date: key }, { timeSlot: new RegExp(`^${key}`) }]
});

// The salon's bookable times, from the backend slot list (salon.service.js).
const slotMinutes = async () => {
  const slots = await salonService.fetchTimeSlots();
  const minutes = slots
    .filter((s) => s.status !== 'inactive')
    .map((s) => parseTime(s.time))
    .filter((m) => m !== null);
  return [...new Set(minutes)].sort((a, b) => a - b);
};

// Times already held on `key`. A booking with a stylist only competes for that
// stylist's chair; one without a stylist treats the whole salon slot as taken.
const takenMinutes = async (key, booking) => {
  const filter = {
    serviceKey: 'salon',
    isOfflineSale: { $ne: true },
    status: { $nin: RELEASED_STATUSES },
    ...dayFilter(key)
  };
  if (booking && booking._id) filter._id = { $ne: booking._id };
  if (booking && booking.assignedStaffId) filter.assignedStaffId = booking.assignedStaffId;

  const rows = await Booking.find(filter).select('date timeSlot').lean();
  return new Set(rows
    .filter((r) => bookingDayKey(r) === key)
    .map(bookingMinutes)
    .filter((m) => m !== null));
};

/**
 * Free times on `key` for moving `booking`, as labels ("10:00 AM"). Leaves out
 * slots held by other bookings, the booking's own current slot, and anything
 * starting sooner than MIN_NOTICE_MIN from now.
 */
const availableSlots = async (key, booking, now = new Date()) => {
  const [all, taken] = await Promise.all([slotMinutes(), takenMinutes(key, booking)]);
  const earliest = now.getTime() + MIN_NOTICE_MIN * 60 * 1000;
  const ownDay = booking ? bookingDayKey(booking) : '';
  const ownMinutes = booking ? bookingMinutes(booking) : null;

  return all
    .filter((m) => !taken.has(m))
    .filter((m) => !(key === ownDay && m === ownMinutes))
    .filter((m) => zonedDateFromDayKeyAndHHmm(key, toHHmm(m)).getTime() >= earliest)
    .map(timeLabel);
};

// The next `count` days (from today, site time) with at least one free slot.
const nextAvailableDays = async (booking, now = new Date(), count = 3) => {
  const today = dayKey(now);
  const days = [];
  for (let i = 0; i < SEARCH_DAYS && days.length < count; i += 1) {
    const key = addDays(today, i);
    if ((await availableSlots(key, booking, now)).length) days.push(key);
  }
  return days;
};

module.exports = {
  RELEASED_STATUSES,
  MIN_NOTICE_MIN,
  parseDayKey,
  parseTime,
  timeLabel,
  bookingDayKey,
  bookingMinutes,
  bookingTimeLabel,
  bookingStartsAt,
  addDays,
  displayDate,
  shortDate,
  longDate,
  dayFilter,
  availableSlots,
  nextAvailableDays
};
