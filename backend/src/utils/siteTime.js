// Wall-clock helpers for the site's timezone. Everything here goes through Intl
// so there is no date library and no dependence on the server's own TZ — a
// Vercel box in UTC and a PM2 box in IST must agree on "12:00 today".

// The site's wall-clock timezone. Daily and monthly caps (and staff break
// schedules) follow the site's calendar, not UTC's.
const SITE_TIMEZONE = process.env.SITE_TIMEZONE || 'Asia/Kolkata';

const formatters = new Map();
const formatterFor = (timeZone) => {
  if (!formatters.has(timeZone)) {
    formatters.set(timeZone, new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23'
    }));
  }
  return formatters.get(timeZone);
};

// { year, month, day, hour, minute, second } as zero-padded strings.
const partsIn = (date, timeZone = SITE_TIMEZONE) => {
  const parts = {};
  for (const p of formatterFor(timeZone).formatToParts(date)) {
    if (p.type !== 'literal') parts[p.type] = p.value;
  }
  // Some ICU builds still render midnight as "24" despite h23.
  if (parts.hour === '24') parts.hour = '00';
  return parts;
};

// "2026-08-08" in site-local time. Comparing these strings is exact and immune
// to DST, unlike subtracting timestamps.
const dayKey = (date, timeZone = SITE_TIMEZONE) => {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  const { year, month, day } = partsIn(d, timeZone);
  return `${year}-${month}-${day}`;
};

const nowParts = (now = new Date(), timeZone = SITE_TIMEZONE) => {
  const d = now instanceof Date ? now : new Date(now);
  const p = partsIn(d, timeZone);
  return {
    dayKey: `${p.year}-${p.month}-${p.day}`,
    minutesOfDay: Number(p.hour) * 60 + Number(p.minute)
  };
};

const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;
const isValidHHmm = (value) => typeof value === 'string' && HHMM.test(value);

// '12:00' -> 720; anything malformed -> null.
const hhmmToMinutes = (value) => {
  if (!isValidHHmm(value)) return null;
  const [h, m] = value.split(':').map(Number);
  return h * 60 + m;
};

// The instant at which the site's wall clock reads `hhmm` on `key`. Solved by
// guessing UTC and correcting by the zone offset observed at the guess; the
// second pass settles the rare case where the guess straddles a DST change.
const zonedDateFromDayKeyAndHHmm = (key, hhmm, timeZone = SITE_TIMEZONE) => {
  const [y, mo, d] = String(key).split('-').map(Number);
  const minutes = hhmmToMinutes(hhmm);
  if (!y || !mo || !d || minutes === null) return null;
  const wallAsUtc = Date.UTC(y, mo - 1, d, Math.floor(minutes / 60), minutes % 60);

  const offsetAt = (ms) => {
    const p = partsIn(new Date(ms), timeZone);
    return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - ms;
  };

  let guess = wallAsUtc - offsetAt(wallAsUtc);
  guess = wallAsUtc - offsetAt(guess);
  return new Date(guess);
};

module.exports = {
  SITE_TIMEZONE,
  partsIn,
  dayKey,
  nowParts,
  isValidHHmm,
  hhmmToMinutes,
  zonedDateFromDayKeyAndHHmm
};
