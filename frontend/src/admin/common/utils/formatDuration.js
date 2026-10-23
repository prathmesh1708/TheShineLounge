// Small time formatters shared by the break schedule, status badge and history
// components. Seconds in, display strings out.

// The backend schedules breaks on this clock (SITE_TIMEZONE on the server).
export const SITE_TIMEZONE = 'Asia/Kolkata';

const pad = (n) => String(n).padStart(2, '0');

// 125 -> '02:05', 3725 -> '1:02:05'
export const formatClock = (totalSeconds) => {
  const s = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
};

// Overtime display: '+03:10'
export const formatOvertime = (totalSeconds) => `+${formatClock(totalSeconds)}`;

// Compact summary: 40 -> '40s', 420 -> '7m', 3900 -> '1h 5m'
export const formatShortDuration = (totalSeconds) => {
  const s = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  if (s < 60) return `${s}s`;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h === 0) return `${m}m`;
  return m ? `${h}h ${m}m` : `${h}h`;
};

// '13:05' -> '1:05 PM'; '' -> ''
export const formatHHmm12 = (hhmm) => {
  if (!hhmm || !/^\d{2}:\d{2}$/.test(hhmm)) return '';
  const [h, m] = hhmm.split(':').map(Number);
  return `${h % 12 || 12}:${pad(m)} ${h >= 12 ? 'PM' : 'AM'}`;
};

// A timestamp shown as site-local '1:05 PM'.
export const formatTimeOfDay = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', timeZone: SITE_TIMEZONE });
};

// 'YYYY-MM-DD' for a date on the site's calendar, optionally shifted by days.
export const siteDayKey = (date = new Date(), shiftDays = 0) => {
  const d = new Date(date.getTime() + shiftDays * 86400000);
  return new Intl.DateTimeFormat('en-CA', { timeZone: SITE_TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
};
