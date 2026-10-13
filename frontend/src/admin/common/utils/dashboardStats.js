// Revenue rules shared by AdminContext and the Global Dashboard's month filter,
// so "what counts as a sale" and "which day it belongs to" are decided once.
import { getSaleDate, parseSaleDate } from '../../../common/utils/dateFormat';

export const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Statuses that mean no money was (or stays) collected, whatever else the
// record says — e.g. a cancelled booking that still carries a paymentMode.
const VOID_STATUSES = new Set(['cancelled', 'canceled', 'rejected', 'failed', 'refunded', 'no show', 'no-show']);
const isVoid = (value) => VOID_STATUSES.has(String(value || '').trim().toLowerCase());

// Service statuses that mean the job is finished and paid for at the counter.
// Every department's final step is listed: a salon job ends in "Styling
// Complete", not "Completed", and must still count.
const DONE_STATUSES = new Set([
  'completed', 'delivered', 'wash completed', 'car handover', 'picked up', 'served',
  'ready for owner', 'styling complete', 'service completed', 'pet ready'
]);
const PAID_PAYMENT_STATUSES = new Set(['completed', 'paid', 'success', 'captured']);

// A booking counts as revenue once it is completed or explicitly paid; offline
// (counter) sales are paid at the counter by definition. Cancelled/failed/
// refunded never count.
//
// paymentMode is deliberately NOT a signal: the Booking schema defaults it to
// 'Cash' and the admin mapping to 'UPI', so every booking has one and treating
// it as "paid" counted every pending, unpaid booking as revenue.
export const isTransactionPaid = (b) => {
  if (!b || b.isDeleted) return false;
  if (b.id === 'OFS-MTJX5GRW-3986' || b.bookingId === 'OFS-MTJX5GRW-3986') return false;
  if (isVoid(b.status) || isVoid(b.paymentStatus)) return false;
  return (
    DONE_STATUSES.has(String(b.status || '').trim().toLowerCase()) ||
    PAID_PAYMENT_STATUSES.has(String(b.paymentStatus || '').trim().toLowerCase()) ||
    b.isOfflineSale === true ||
    (b.bookingId && String(b.bookingId).startsWith('OFS-')) ||
    (b.id && String(b.id).startsWith('OFS-'))
  );
};

// Sales that carry money. Membership-pass redemptions are logged as ₹0
// "sales"; they are visits, not revenue, and would otherwise inflate counts
// and drag the average order value down.
export const isRevenueSale = (b) => isTransactionPaid(b) && bookingAmount(b) > 0;

export const getBookingDate = (b) => {
  if (!b) return null;
  const d = getSaleDate(b) || parseSaleDate(b.bookedAt) || parseSaleDate(b.appointmentDate) || parseSaleDate(b.date) || parseSaleDate(b.createdAt);
  return d && !Number.isNaN(d.getTime()) ? d : null;
};

// Never negative: a malformed or refund row must not pull revenue below zero.
export const bookingAmount = (b) => {
  const n = Number(b?.total ?? b?.amount ?? b?.price ?? b?.grandTotal ?? 0);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

// 'YYYY-MM' for a date (local calendar, as the rest of the dashboard uses).
export const monthKeyOf = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

// '2026-09' -> { year: 2026, month: 8 } (month is 0-based like Date)
export const parseMonthKey = (key) => {
  const m = /^(\d{4})-(\d{2})$/.exec(key || '');
  if (!m) return null;
  return { year: Number(m[1]), month: Number(m[2]) - 1 };
};

export const formatMonthKey = (key, style = 'long') => {
  const p = parseMonthKey(key);
  if (!p) return '';
  return new Date(p.year, p.month, 1).toLocaleString('en-US', { month: style, year: 'numeric' });
};

export const shiftMonthKey = (key, delta) => {
  const p = parseMonthKey(key);
  return monthKeyOf(new Date(p.year, p.month + delta, 1));
};

export const isInMonth = (date, key) => !!date && monthKeyOf(date) === key;

export const sumPaid = (bookings, predicate = () => true) => (bookings || []).reduce((sum, b) => {
  if (!isTransactionPaid(b)) return sum;
  const d = getBookingDate(b);
  return predicate(d, b) ? sum + bookingAmount(b) : sum;
}, 0);

// 12 points (Jan–Dec) of paid revenue for one calendar year.
export const buildRevenueTrend = (bookings, year) => {
  const rows = MONTH_NAMES.map((month) => ({ month, revenue: 0, bookings: 0 }));
  (bookings || []).forEach((b) => {
    if (!isTransactionPaid(b)) return;
    const d = getBookingDate(b);
    if (!d || d.getFullYear() !== year) return;
    rows[d.getMonth()].revenue += bookingAmount(b);
    rows[d.getMonth()].bookings += 1;
  });
  return rows;
};

const SERVICE_COLORS = {
  'car-wash': '#e07b2a',
  'car-detailing': '#1e4a7e',
  'cafe': '#f59e0b',
  'drive-through-cafe': '#3b82f6',
  'dog-wash': '#10b981',
  'salon': '#8b5cf6'
};
const SERVICE_TITLES = {
  'car-wash': 'Car Wash',
  'car-detailing': 'Car Detailing',
  'cafe': 'Café',
  'drive-through-cafe': 'Drive-Through Café',
  'dog-wash': 'Dog Bath',
  'salon': "Men's Salon"
};

export const buildServiceRevenue = (bookings) => {
  const map = {};
  (bookings || []).forEach((b) => {
    if (!isTransactionPaid(b)) return;
    const key = b.serviceKey || (b.category ? String(b.category).toLowerCase().replace(/\s+/g, '-') : 'car-wash');
    if (!map[key]) {
      map[key] = { name: SERVICE_TITLES[key] || b.service || b.serviceName || key, value: 0, color: SERVICE_COLORS[key] || '#6366f1' };
    }
    map[key].value += bookingAmount(b);
  });
  const active = Object.values(map).filter((item) => item.value > 0);
  return active.length > 0 ? active : [
    { name: 'Car Wash', value: 0, color: '#e07b2a' },
    { name: 'Car Detailing', value: 0, color: '#1e4a7e' }
  ];
};

export const buildPaymentModes = (bookings) => {
  const map = {};
  (bookings || []).forEach((b) => {
    if (!isRevenueSale(b)) return;
    const mode = b.paymentMode || 'Cash';
    if (!map[mode]) map[mode] = { mode, amount: 0, count: 0 };
    map[mode].amount += bookingAmount(b);
    map[mode].count += 1;
  });
  const result = Object.values(map);
  return result.length > 0 ? result : [
    { mode: 'UPI', amount: 0, count: 0 },
    { mode: 'Cash', amount: 0, count: 0 }
  ];
};

// Month-over-month change in %, rounded; undefined when there is no base.
export const growthPercent = (current, previous) => {
  if (!previous) return undefined;
  return Math.round(((current - previous) / previous) * 1000) / 10;
};

// ── Date ranges ─────────────────────────────────────────────────────────────
// Ranges are inclusive local-calendar days written as 'YYYY-MM-DD'. A null
// start or end means "open" on that side (used by All Time).

const DAY_MS = 24 * 60 * 60 * 1000;

export const toDateKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export const parseDateKey = (key) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key || '');
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
};

const addDays = (date, n) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + n);
const daysInMonthOf = (y, m) => new Date(y, m + 1, 0).getDate();

// Whole calendar days from start to end, inclusive (DST-safe via rounding).
export const countDaysInclusive = (startStr, endStr) => {
  const s = parseDateKey(startStr);
  const e = parseDateKey(endStr);
  if (!s || !e || e < s) return 0;
  return Math.round((e.getTime() - s.getTime()) / DAY_MS) + 1;
};

export const isInDateRange = (date, startStr, endStr) => {
  if (!date || Number.isNaN(date.getTime())) return false;
  const s = parseDateKey(startStr);
  const e = parseDateKey(endStr);
  if (s && date < s) return false;
  if (e && date >= addDays(e, 1)) return false;
  return true;
};

export const DATE_PRESETS = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last7', label: 'Last 7 Days' },
  { value: 'last30', label: 'Last 30 Days' },
  { value: 'thisMonth', label: 'This Month' },
  { value: 'lastMonth', label: 'Last Month' },
  { value: 'last3Months', label: 'Last 3 Months' },
  { value: 'thisYear', label: 'This Year' },
  { value: 'all', label: 'All Time' }
];

// Current-period presets end today, not at the end of the month/year, so
// averages are not diluted by days that have not happened yet.
export const getPresetRange = (preset, now = new Date()) => {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const y = today.getFullYear();
  const m = today.getMonth();
  const k = toDateKey;
  switch (preset) {
    case 'today': return { start: k(today), end: k(today) };
    case 'yesterday': { const d = addDays(today, -1); return { start: k(d), end: k(d) }; }
    case 'last7': return { start: k(addDays(today, -6)), end: k(today) };
    case 'last30': return { start: k(addDays(today, -29)), end: k(today) };
    case 'thisMonth': return { start: k(new Date(y, m, 1)), end: k(today) };
    case 'lastMonth': return { start: k(new Date(y, m - 1, 1)), end: k(new Date(y, m, 0)) };
    case 'last3Months': return { start: k(new Date(y, m - 2, 1)), end: k(today) };
    case 'thisYear': return { start: k(new Date(y, 0, 1)), end: k(today) };
    case 'all':
    default: return { start: null, end: null };
  }
};

// A whole calendar month as a range, clipped to today for the current month.
export const getMonthRange = (monthKey, now = new Date()) => {
  const p = parseMonthKey(monthKey);
  if (!p) return { start: null, end: null };
  const start = new Date(p.year, p.month, 1);
  const monthEnd = new Date(p.year, p.month + 1, 0);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return { start: toDateKey(start), end: toDateKey(monthEnd < today ? monthEnd : today) };
};

const isMonthStart = (d) => d.getDate() === 1;

// The period to compare against:
//  * month-aligned ranges (This Month, Last Month, a picked month, Last 3
//    Months) -> the same day-span one month / N months earlier, so 1–13 Oct is
//    compared with 1–13 Sep rather than the whole of September;
//  * This Year -> the same span last year;
//  * anything else -> the equally long window right before the range.
export const getPreviousDateRange = (startStr, endStr, preset) => {
  const s = parseDateKey(startStr);
  const e = parseDateKey(endStr);
  if (!s || !e || e < s) return null;

  if (preset === 'thisYear') {
    const ps = new Date(s.getFullYear() - 1, s.getMonth(), s.getDate());
    const pe = new Date(e.getFullYear() - 1, e.getMonth(), Math.min(e.getDate(), daysInMonthOf(e.getFullYear() - 1, e.getMonth())));
    return { start: toDateKey(ps), end: toDateKey(pe) };
  }

  if (isMonthStart(s)) {
    const months = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth()) + 1;
    const ps = new Date(s.getFullYear(), s.getMonth() - months, 1);
    const endIsMonthEnd = e.getDate() === daysInMonthOf(e.getFullYear(), e.getMonth());
    const peMonth = new Date(e.getFullYear(), e.getMonth() - months, 1);
    const peLastDay = daysInMonthOf(peMonth.getFullYear(), peMonth.getMonth());
    const pe = new Date(peMonth.getFullYear(), peMonth.getMonth(), endIsMonthEnd ? peLastDay : Math.min(e.getDate(), peLastDay));
    return { start: toDateKey(ps), end: toDateKey(pe) };
  }

  const len = countDaysInclusive(startStr, endStr);
  return { start: toDateKey(addDays(s, -len)), end: toDateKey(addDays(s, -1)) };
};

const SHORT_DATE = { day: 'numeric', month: 'short' };
export const formatDateKey = (key, opts = { day: 'numeric', month: 'short', year: 'numeric' }) => {
  const d = parseDateKey(key);
  return d ? d.toLocaleDateString('en-IN', opts) : '';
};

export const formatRangeLabel = (startStr, endStr) => {
  if (!startStr && !endStr) return 'All Time';
  if (startStr === endStr) return formatDateKey(startStr);
  const s = parseDateKey(startStr);
  const e = parseDateKey(endStr);
  const sameYear = s && e && s.getFullYear() === e.getFullYear();
  return `${formatDateKey(startStr, sameYear ? SHORT_DATE : undefined)} – ${formatDateKey(endStr)}`;
};

// One point per day of the range.
export const buildDailyRevenueTrend = (bookings, startStr, endStr) => {
  const s = parseDateKey(startStr);
  const days = countDaysInclusive(startStr, endStr);
  if (!s || days <= 0) return [];
  const rows = Array.from({ length: days }, (_, i) => {
    const d = addDays(s, i);
    return { key: toDateKey(d), label: d.toLocaleDateString('en-IN', SHORT_DATE), revenue: 0, bookings: 0 };
  });
  const index = new Map(rows.map((r, i) => [r.key, i]));
  (bookings || []).forEach((b) => {
    if (!isTransactionPaid(b)) return;
    const d = getBookingDate(b);
    if (!d) return;
    const i = index.get(toDateKey(d));
    if (i === undefined) return;
    rows[i].revenue += bookingAmount(b);
    rows[i].bookings += 1;
  });
  return rows;
};

// One point per calendar month touched by the range (edge months are clipped).
export const buildMonthlyRevenueTrendForRange = (bookings, startStr, endStr) => {
  const s = parseDateKey(startStr);
  const e = parseDateKey(endStr);
  if (!s || !e || e < s) return [];
  const rows = [];
  for (let d = new Date(s.getFullYear(), s.getMonth(), 1); d <= e; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) {
    rows.push({ key: monthKeyOf(d), label: `${MONTH_NAMES[d.getMonth()]} ${String(d.getFullYear()).slice(-2)}`, revenue: 0, bookings: 0 });
  }
  const index = new Map(rows.map((r, i) => [r.key, i]));
  (bookings || []).forEach((b) => {
    if (!isTransactionPaid(b)) return;
    const d = getBookingDate(b);
    if (!isInDateRange(d, startStr, endStr)) return;
    const i = index.get(monthKeyOf(d));
    if (i === undefined) return;
    rows[i].revenue += bookingAmount(b);
    rows[i].bookings += 1;
  });
  return rows;
};

// Earliest/latest paid sale, to give All Time a concrete span for its chart.
export const getDataSpan = (bookings) => {
  let min = null;
  let max = null;
  (bookings || []).forEach((b) => {
    if (!isTransactionPaid(b)) return;
    const d = getBookingDate(b);
    if (!d) return;
    if (!min || d < min) min = d;
    if (!max || d > max) max = d;
  });
  return min ? { start: toDateKey(min), end: toDateKey(max) } : null;
};

// ₹ axis labels that stay readable from ₹500/day to ₹50L/year.
export const formatCompactRupees = (v) => {
  const n = Number(v) || 0;
  if (n >= 10000000) return `₹${+(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `₹${+(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${+(n / 1000).toFixed(1)}k`;
  return `₹${Math.round(n)}`;
};

// Indian financial year (1 Apr – 31 Mar) containing `now`.
export const getFinancialYear = (now = new Date()) => {
  const startYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return {
    label: `FY ${startYear}-${String(startYear + 1).slice(-2)}`,
    start: `${startYear}-04-01`,
    end: `${startYear + 1}-03-31`
  };
};
