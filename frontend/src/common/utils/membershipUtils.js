/**
 * Sequential membership stacking.
 *
 * A customer who upgrades mid-term must not lose the days they already paid for.
 * So a pass bought while another one is still running does not start today and
 * does not replace the running pass — it is queued and starts on the exact day
 * the running pass expires:
 *
 *   Monthly  Aug 13, 2026 -> Sep 12, 2026   (Active)
 *   Yearly   Sep 12, 2026 -> Sep 12, 2027   (Queued)
 *
 * Passes for a different service, or for a different registered vehicle, form
 * their own independent chain, so one customer can hold several passes at once
 * (Car Wash + Dog Spa, or one pass per car).
 */

const MEMBERSHIP_HINTS = ['membership', 'pass', 'monthly', 'yearly', 'annual', 'unlimited', 'vip'];

// Dates seeded by old mock data. Treated as "unknown" so callers fall back to
// the real purchase time instead of scheduling a pass in the past.
const LEGACY_DATE_MARKERS = ['july 18', '2026-07-18'];

const ISO_DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

const LONG_DATE_OPTIONS = { month: 'long', day: 'numeric', year: 'numeric' };
const SHORT_DATE_OPTIONS = { month: 'short', day: 'numeric', year: 'numeric' };

export function isMembershipPackage(name) {
  if (!name) return false;
  const n = String(name).toLowerCase();
  return MEMBERSHIP_HINTS.some(hint => n.includes(hint));
}

/** Parses the many date shapes flowing through the app; null when unusable. */
export function parseFlexibleDate(value) {
  if (!value) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;

  const raw = String(value).trim();
  if (!raw) return null;
  if (LEGACY_DATE_MARKERS.some(marker => raw.toLowerCase().includes(marker))) return null;

  // Bare ISO dates parse as UTC midnight, which can render as the previous day.
  if (ISO_DATE_ONLY.test(raw)) {
    const [y, m, d] = raw.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  const parsed = new Date(raw);
  return isNaN(parsed.getTime()) ? null : parsed;
}

export function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function formatLongDate(date) {
  const d = parseFlexibleDate(date);
  return d ? d.toLocaleDateString('en-US', LONG_DATE_OPTIONS) : '';
}

export function formatShortDate(date) {
  const d = parseFlexibleDate(date);
  return d ? d.toLocaleDateString('en-US', SHORT_DATE_OPTIONS) : '';
}

/** Local-time YYYY-MM-DD (toISOString would shift the day for IST). */
export function toISODateString(date) {
  const d = parseFlexibleDate(date);
  if (!d) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Finds the admin-configured plan behind a purchased package name. */
export function findMembershipMeta(packageName, catalog) {
  if (!packageName || !Array.isArray(catalog)) return null;
  const purchased = String(packageName).toLowerCase().trim();
  return catalog.find(m => {
    const configured = String(m.name || m.title || '').toLowerCase().trim();
    return configured && (purchased.includes(configured) || configured.includes(purchased));
  }) || null;
}

export function isYearlyPass(packageName) {
  const n = String(packageName || '').toLowerCase();
  return n.includes('yearly') || n.includes('annual');
}

/** How long a pass runs — the admin-configured duration wins when present. */
export function getPassDuration(packageName, meta) {
  const configuredDays = Number(meta?.duration);
  if (configuredDays > 0) return { unit: 'days', value: configuredDays };

  const n = String(packageName || '').toLowerCase();
  if (isYearlyPass(packageName)) return { unit: 'years', value: 1 };
  if (n.includes('quarter')) return { unit: 'days', value: 90 };
  if (n.includes('week')) return { unit: 'days', value: 7 };
  return { unit: 'days', value: 30 };
}

export function addPassDuration(start, packageName, meta) {
  const duration = getPassDuration(packageName, meta);
  const end = new Date(start);
  if (duration.unit === 'years') {
    end.setFullYear(end.getFullYear() + duration.value);
  } else {
    end.setDate(end.getDate() + duration.value);
  }
  return end;
}

export function readPackageName(booking) {
  return booking?.packageName || booking?.plan || booking?.planName || '';
}

/**
 * When the pass was bought. `purchasedAt` is stamped by this app on new
 * purchases and `createdAt` comes from Mongo; both carry a time of day, which
 * is what keeps two passes bought on the same day (buy, then upgrade) in order.
 */
export function getPurchaseTime(booking) {
  const stamped = parseFlexibleDate(booking?.purchasedAt || booking?.createdAt);
  if (stamped) return stamped.getTime();
  const dated = parseFlexibleDate(booking?.date);
  return dated ? dated.getTime() : 0;
}

/** Passes stack only against passes for the same customer, service and vehicle. */
export function membershipChainKey(booking) {
  const customer = String(booking?.customerEmail || booking?.customerName || '').toLowerCase().trim();
  const service = String(booking?.serviceKey || booking?.serviceName || 'car-wash').toLowerCase().trim();
  const vehicle = String(booking?.vehicleNo || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  return `${customer}|${service}|${vehicle}`;
}

/**
 * Turns raw bookings into dated, non-overlapping membership records.
 * Nothing is dropped: every purchase comes back with its own period.
 */
export function buildMembershipSchedule(bookings, options = {}) {
  const { now = new Date(), catalog = null } = options;

  const entries = (bookings || [])
    .filter(b => b && isMembershipPackage(readPackageName(b)))
    .map((booking, index) => ({ booking, index, purchasedAt: getPurchaseTime(booking) }))
    .sort((a, b) => (a.purchasedAt - b.purchasedAt) || (a.index - b.index));

  const chainEnds = new Map();

  return entries.map(({ booking, purchasedAt }) => {
    const packageName = readPackageName(booking) || 'Monthly Membership';
    const meta = findMembershipMeta(packageName, catalog);

    const purchaseDate = startOfDay(
      parseFlexibleDate(booking.date) || (purchasedAt ? new Date(purchasedAt) : new Date())
    );

    const chainKey = membershipChainKey(booking);
    const previousEnd = chainEnds.get(chainKey);
    const stacked = !!previousEnd && previousEnd > purchaseDate;
    const startDate = stacked ? new Date(previousEnd) : purchaseDate;
    const expiryDate = addPassDuration(startDate, packageName, meta);
    chainEnds.set(chainKey, expiryDate);

    let status = 'Active';
    if (expiryDate <= now) status = 'Expired';
    else if (startDate > now) status = 'Queued';

    const visitLimit = meta?.visitLimit !== undefined && meta.visitLimit !== null
      ? (Number(meta.visitLimit) === 999 ? 'Unlimited' : Number(meta.visitLimit))
      : null;

    return {
      booking,
      bookingId: booking.bookingId || booking.id || '',
      packageName,
      serviceKey: booking.serviceKey || 'car-wash',
      serviceName: booking.serviceName || 'Car Wash',
      customerName: booking.customerName || 'Customer',
      customerEmail: (booking.customerEmail || '').toLowerCase().trim(),
      phone: booking.phone || booking.mobile || '',
      vehicleNo: booking.vehicleNo || '',
      vehicleType: booking.vehicleType || booking.vehicleModel || '',
      price: booking.price !== undefined ? booking.price : booking.total,
      purchaseDate,
      startDate,
      expiryDate,
      startLabel: formatLongDate(startDate),
      expiryLabel: formatLongDate(expiryDate),
      startISO: toISODateString(startDate),
      expiryISO: toISODateString(expiryDate),
      status,
      statusLabel: status === 'Queued' ? 'Upgraded (Scheduled)' : status,
      isActive: status === 'Active',
      isQueued: status === 'Queued',
      isExpired: status === 'Expired',
      isStacked: stacked,
      isYearly: isYearlyPass(packageName),
      visitLimit,
      chainKey
    };
  });
}

export function groupMembershipSchedule(records) {
  const list = records || [];
  return {
    active: list.filter(r => r.isActive),
    queued: list.filter(r => r.isQueued),
    expired: list.filter(r => r.isExpired)
  };
}

/**
 * Schedules one about-to-be-created pass against what the customer already
 * holds, returning its start/expiry and whether it lands in the queue.
 */
export function scheduleNewMembership(existingBookings, newBooking, options = {}) {
  const stamped = { ...newBooking, purchasedAt: newBooking.purchasedAt || new Date().toISOString() };
  const schedule = buildMembershipSchedule([...(existingBookings || []), stamped], options);
  return schedule.find(r => r.bookingId && r.bookingId === (stamped.bookingId || stamped.id))
    || schedule[schedule.length - 1]
    || null;
}
