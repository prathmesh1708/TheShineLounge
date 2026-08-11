// Decides whether a membership may pay for a wash, and computes the counter
// changes when it does. Every function here is pure: it takes a membership
// object and a timestamp and returns a decision or a set of field values. All
// database work happens in integrations.service.js, so these rules can be
// tested exhaustively without a Mongo connection.

const { normalizePlate } = require('./plateNormalizer');

// The site's wall-clock timezone. Daily and monthly caps reset on the site's
// calendar, not UTC's — a 1am wash must not count against the previous day.
const SITE_TIMEZONE = process.env.SITE_TIMEZONE || 'Asia/Kolkata';

const partsIn = (date, timeZone) => {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const parts = {};
  for (const p of fmt.formatToParts(date)) {
    if (p.type !== 'literal') parts[p.type] = p.value;
  }
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

const monthKey = (date, timeZone = SITE_TIMEZONE) => {
  const key = dayKey(date, timeZone);
  return key ? key.slice(0, 7) : '';
};

// Statuses that still entitle the holder to a wash. 'Due for Renewal' is an
// active membership that is merely close to expiry — blocking it would turn a
// renewal reminder into a service refusal.
const ACTIVE_STATUSES = new Set(['Active', 'Due for Renewal']);

const DENY = (code, message) => ({ allowed: false, code, message });
const ALLOW = (meta) => ({ allowed: true, code: 'OK', message: 'Entitled', ...meta });

// How many washes the membership has already used today/this month, discarding
// counters left over from an earlier period.
const effectiveDailyCount = (membership, at, timeZone = SITE_TIMEZONE) => {
  if (!membership) return 0;
  const today = dayKey(at, timeZone);
  const stored = membership.usageDayKey
    || (membership.lastUsedAt ? dayKey(membership.lastUsedAt, timeZone) : '');
  return stored === today ? Number(membership.usageCountToday) || 0 : 0;
};

const effectiveMonthlyCount = (membership, at, timeZone = SITE_TIMEZONE) => {
  if (!membership) return 0;
  const thisMonth = monthKey(at, timeZone);
  const stored = membership.usageMonthKey
    || (membership.usagePeriodStart ? monthKey(membership.usagePeriodStart, timeZone) : '');
  return stored === thisMonth ? Number(membership.usageCountMonth) || 0 : 0;
};

// The single authority on "may this wash be taken off the membership?".
//
// opts: { at, plate, serviceKey, timeZone }
const evaluateEntitlement = (user, opts = {}) => {
  const at = opts.at instanceof Date ? opts.at : new Date(opts.at || Date.now());
  const timeZone = opts.timeZone || SITE_TIMEZONE;
  const serviceKey = opts.serviceKey || 'car-wash';
  const membership = user && user.membership;

  if (Number.isNaN(at.getTime())) {
    return DENY('INVALID_TIME', 'Event timestamp is not a valid date.');
  }
  if (!user) {
    return DENY('NO_CUSTOMER', 'No customer is attached to this wash.');
  }
  if (!membership || !membership.planName || membership.status === 'None') {
    return DENY('NO_MEMBERSHIP', 'Customer has no membership plan.');
  }
  if (membership.status === 'Suspended') {
    return DENY(
      'SUSPENDED',
      membership.suspensionReason
        ? `Membership suspended: ${membership.suspensionReason}`
        : 'Membership is suspended.'
    );
  }
  if (!ACTIVE_STATUSES.has(membership.status)) {
    return DENY('EXPIRED', `Membership status is ${membership.status}.`);
  }
  if (membership.startDate && new Date(membership.startDate) > at) {
    return DENY('NOT_STARTED', 'Membership has not started yet.');
  }
  if (!membership.expiryDate) {
    return DENY('NO_EXPIRY', 'Membership has no expiry date set.');
  }
  if (new Date(membership.expiryDate) < at) {
    return DENY('EXPIRED', 'Membership expired.');
  }

  // A car-wash membership must not silently pay for a salon appointment.
  const planService = membership.serviceKey || 'car-wash';
  if (planService !== serviceKey) {
    return DENY('WRONG_SERVICE', `Membership covers ${planService}, not ${serviceKey}.`);
  }

  if (membership.boundVehiclesOnly) {
    const bound = (membership.boundVehicles || []).map(normalizePlate).filter(Boolean);
    const plate = normalizePlate(opts.plate);
    if (!bound.length) {
      return DENY('NO_BOUND_VEHICLES', 'Membership is vehicle-bound but no vehicle is registered.');
    }
    if (!plate) {
      return DENY('NO_PLATE', 'Membership is vehicle-bound and no plate was captured.');
    }
    if (!bound.includes(plate)) {
      return DENY('VEHICLE_NOT_BOUND', `Vehicle ${plate} is not on this membership.`);
    }
  }

  const unlimited = membership.unlimited === true;
  const remaining = Number(membership.washesRemaining);

  if (!unlimited && Number.isFinite(remaining) && remaining <= 0) {
    return DENY('NO_WASHES_REMAINING', 'No washes remaining on this membership.');
  }

  const usedToday = effectiveDailyCount(membership, at, timeZone);
  const maxPerDay = Number(membership.maxPerDay);
  if (Number.isFinite(maxPerDay) && maxPerDay > 0 && usedToday >= maxPerDay) {
    return DENY('DAILY_LIMIT', `Daily limit of ${maxPerDay} wash(es) already used.`);
  }

  const usedThisMonth = effectiveMonthlyCount(membership, at, timeZone);
  const maxPerMonth = Number(membership.maxPerMonth);
  if (Number.isFinite(maxPerMonth) && maxPerMonth > 0 && usedThisMonth >= maxPerMonth) {
    return DENY('MONTHLY_LIMIT', `Monthly limit of ${maxPerMonth} wash(es) already used.`);
  }

  // Cool-off stops the same car going round the tunnel twice to burn a second
  // wash off the plan.
  const coolOffHours = Number(membership.coolOffHours);
  if (Number.isFinite(coolOffHours) && coolOffHours > 0 && membership.lastUsedAt) {
    const elapsedMs = at.getTime() - new Date(membership.lastUsedAt).getTime();
    const coolOffMs = coolOffHours * 3600 * 1000;
    // A negative elapsed means a clock skew or a replayed old event; treat it as
    // inside the window rather than trusting it.
    if (elapsedMs < coolOffMs) {
      const waitHours = Math.max(0, (coolOffMs - elapsedMs) / 3600000);
      return DENY(
        'COOL_OFF',
        `Cool-off active, ${waitHours.toFixed(1)}h remaining of ${coolOffHours}h.`
      );
    }
  }

  return ALLOW({
    unlimited,
    washesRemaining: Number.isFinite(remaining) ? remaining : null,
    usedToday,
    usedThisMonth
  });
};

// Field values to write when a wash is consumed. Returned rather than applied so
// the caller can persist them atomically alongside the ledger row.
const buildConsumption = (user, opts = {}) => {
  const at = opts.at instanceof Date ? opts.at : new Date(opts.at || Date.now());
  const timeZone = opts.timeZone || SITE_TIMEZONE;
  const membership = (user && user.membership) || {};

  const unlimited = membership.unlimited === true;
  const remaining = Number(membership.washesRemaining);
  const usedToday = effectiveDailyCount(membership, at, timeZone);
  const usedThisMonth = effectiveMonthlyCount(membership, at, timeZone);

  const balanceBefore = unlimited || !Number.isFinite(remaining) ? null : remaining;
  const balanceAfter = balanceBefore === null ? null : Math.max(0, balanceBefore - 1);

  return {
    balanceBefore,
    balanceAfter,
    set: {
      ...(balanceAfter === null ? {} : { 'membership.washesRemaining': balanceAfter }),
      'membership.usageCountToday': usedToday + 1,
      'membership.usageDayKey': dayKey(at, timeZone),
      'membership.usageCountMonth': usedThisMonth + 1,
      'membership.usageMonthKey': monthKey(at, timeZone),
      'membership.usagePeriodStart': membership.usagePeriodStart || at,
      'membership.lastUsedAt': at
    }
  };
};

// Undo a consumption after an aborted cycle. Counters floor at zero — a
// reversal must never manufacture allowance that was not there.
const buildReversal = (user, ledgerRow, opts = {}) => {
  const timeZone = opts.timeZone || SITE_TIMEZONE;
  const at = opts.at instanceof Date ? opts.at : new Date(opts.at || Date.now());
  const membership = (user && user.membership) || {};

  const set = {};

  if (ledgerRow && ledgerRow.balanceBefore !== null && ledgerRow.balanceBefore !== undefined) {
    const current = Number(membership.washesRemaining);
    // Restore by adding one back rather than writing balanceBefore verbatim:
    // other washes may legitimately have been consumed in between.
    set['membership.washesRemaining'] = (Number.isFinite(current) ? current : 0) + 1;
  }

  const consumedAt = ledgerRow && ledgerRow.consumedAt ? new Date(ledgerRow.consumedAt) : at;

  // Only claw back a counter that is still in the same period as the row being
  // reversed; otherwise the counter has already reset on its own.
  if (dayKey(consumedAt, timeZone) === (membership.usageDayKey || '')) {
    set['membership.usageCountToday'] = Math.max(0, (Number(membership.usageCountToday) || 0) - 1);
  }
  if (monthKey(consumedAt, timeZone) === (membership.usageMonthKey || '')) {
    set['membership.usageCountMonth'] = Math.max(0, (Number(membership.usageCountMonth) || 0) - 1);
  }

  return { set };
};

module.exports = {
  SITE_TIMEZONE,
  ACTIVE_STATUSES,
  dayKey,
  monthKey,
  effectiveDailyCount,
  effectiveMonthlyCount,
  evaluateEntitlement,
  buildConsumption,
  buildReversal
};
