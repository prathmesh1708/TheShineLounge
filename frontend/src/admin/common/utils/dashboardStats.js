// Revenue rules shared by AdminContext and the Global Dashboard's month filter,
// so "what counts as a sale" and "which day it belongs to" are decided once.
import { getSaleDate, parseSaleDate } from '../../../common/utils/dateFormat';

export const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// A booking counts as revenue once it is paid or completed; offline sales are
// paid at the counter by definition.
export const isTransactionPaid = (b) => {
  if (!b || b.isDeleted) return false;
  if (b.id === 'OFS-MTJX5GRW-3986' || b.bookingId === 'OFS-MTJX5GRW-3986') return false;
  return (
    b.status === 'Completed' ||
    b.paymentStatus === 'Completed' ||
    b.isOfflineSale === true ||
    (b.bookingId && String(b.bookingId).startsWith('OFS-')) ||
    (b.id && String(b.id).startsWith('OFS-')) ||
    Boolean(b.paymentMode)
  );
};

export const getBookingDate = (b) => {
  if (!b) return null;
  const d = getSaleDate(b) || parseSaleDate(b.bookedAt) || parseSaleDate(b.appointmentDate) || parseSaleDate(b.date) || parseSaleDate(b.createdAt);
  return d && !Number.isNaN(d.getTime()) ? d : null;
};

export const bookingAmount = (b) => Number(b?.total ?? b?.price ?? b?.amount ?? 0) || 0;

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
    if (!isTransactionPaid(b)) return;
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
