const test = require('node:test');
const assert = require('node:assert/strict');

const {
  dayKey,
  monthKey,
  effectiveDailyCount,
  effectiveMonthlyCount,
  evaluateEntitlement,
  buildConsumption,
  buildReversal
} = require('../src/utils/membershipEntitlement');

const TZ = 'Asia/Kolkata';
const AT = new Date('2026-08-08T06:00:00.000Z'); // 11:30 IST

const makeUser = (overrides = {}) => ({
  _id: 'u1',
  fullName: 'Test Customer',
  membership: {
    planName: 'Shine Club',
    serviceKey: 'car-wash',
    startDate: new Date('2026-07-01T00:00:00.000Z'),
    expiryDate: new Date('2026-12-31T00:00:00.000Z'),
    status: 'Active',
    suspensionReason: '',
    maxPerDay: 1,
    maxPerMonth: 4,
    coolOffHours: 0,
    boundVehiclesOnly: false,
    boundVehicles: [],
    unlimited: false,
    washesRemaining: 4,
    usageCountToday: 0,
    usageDayKey: '',
    usageCountMonth: 0,
    usageMonthKey: '',
    usagePeriodStart: null,
    lastUsedAt: null,
    ...overrides
  }
});

const evaluate = (user, opts = {}) =>
  evaluateEntitlement(user, { at: AT, plate: 'MH01AB1234', serviceKey: 'car-wash', timeZone: TZ, ...opts });

// ── period keys ────────────────────────────────────────────────────────────

test('dayKey uses site-local time, not UTC', () => {
  // 19:00 UTC on the 7th is already the 8th in IST (+05:30).
  assert.equal(dayKey(new Date('2026-08-07T19:00:00.000Z'), TZ), '2026-08-08');
  assert.equal(dayKey(new Date('2026-08-07T19:00:00.000Z'), 'UTC'), '2026-08-07');
});

test('dayKey and monthKey reject invalid dates', () => {
  assert.equal(dayKey(new Date('not-a-date'), TZ), '');
  assert.equal(monthKey(new Date('not-a-date'), TZ), '');
  assert.equal(dayKey('garbage', TZ), '');
});

test('monthKey derives from the site-local day', () => {
  assert.equal(monthKey(new Date('2026-08-08T06:00:00.000Z'), TZ), '2026-08');
  // 20:00 UTC on 31 July is 1 August in IST — a month boundary that naive
  // UTC maths would get wrong.
  assert.equal(monthKey(new Date('2026-07-31T20:00:00.000Z'), TZ), '2026-08');
});

test('counters from an earlier period are treated as zero', () => {
  const stale = makeUser({ usageCountToday: 5, usageDayKey: '2026-08-01', usageCountMonth: 9, usageMonthKey: '2026-07' }).membership;
  assert.equal(effectiveDailyCount(stale, AT, TZ), 0);
  assert.equal(effectiveMonthlyCount(stale, AT, TZ), 0);
});

test('counters from the current period are honoured', () => {
  const fresh = makeUser({ usageCountToday: 2, usageDayKey: '2026-08-08', usageCountMonth: 3, usageMonthKey: '2026-08' }).membership;
  assert.equal(effectiveDailyCount(fresh, AT, TZ), 2);
  assert.equal(effectiveMonthlyCount(fresh, AT, TZ), 3);
});

test('counters fall back to lastUsedAt when no period key is stored yet', () => {
  const legacy = makeUser({ usageCountToday: 1, usageDayKey: '', lastUsedAt: AT }).membership;
  assert.equal(effectiveDailyCount(legacy, AT, TZ), 1);
});

// ── entitlement: allow ─────────────────────────────────────────────────────

test('a healthy active membership is entitled', () => {
  const r = evaluate(makeUser());
  assert.equal(r.allowed, true);
  assert.equal(r.code, 'OK');
});

test('Due for Renewal is still entitled', () => {
  const r = evaluate(makeUser({ status: 'Due for Renewal' }));
  assert.equal(r.allowed, true, 'a renewal reminder must not become a service refusal');
});

test('an unlimited plan is entitled with zero washes remaining', () => {
  const r = evaluate(makeUser({ unlimited: true, washesRemaining: 0 }));
  assert.equal(r.allowed, true);
});

test('a plan with no washesRemaining field set is not blocked by the balance rule', () => {
  const r = evaluate(makeUser({ washesRemaining: undefined }));
  assert.equal(r.allowed, true);
});

test('zero maxPerDay/maxPerMonth means uncapped, not blocked', () => {
  const r = evaluate(makeUser({ maxPerDay: 0, maxPerMonth: 0, usageCountToday: 99, usageDayKey: '2026-08-08' }));
  assert.equal(r.allowed, true);
});

// ── entitlement: deny ──────────────────────────────────────────────────────

test('no customer attached is denied', () => {
  assert.equal(evaluate(null).code, 'NO_CUSTOMER');
});

test('no membership plan is denied', () => {
  assert.equal(evaluate({ membership: null }).code, 'NO_MEMBERSHIP');
  assert.equal(evaluate({ membership: { status: 'None' } }).code, 'NO_MEMBERSHIP');
  assert.equal(evaluate({ membership: { planName: '', status: 'Active' } }).code, 'NO_MEMBERSHIP');
});

test('a suspended membership is denied and surfaces the reason', () => {
  const r = evaluate(makeUser({ status: 'Suspended', suspensionReason: 'Payment failed' }));
  assert.equal(r.allowed, false);
  assert.equal(r.code, 'SUSPENDED');
  assert.match(r.message, /Payment failed/);
});

test('an expired status or a past expiry date is denied', () => {
  assert.equal(evaluate(makeUser({ status: 'Expired' })).code, 'EXPIRED');
  assert.equal(evaluate(makeUser({ expiryDate: new Date('2026-01-01T00:00:00.000Z') })).code, 'EXPIRED');
});

test('a membership expiring later the same day is still entitled', () => {
  const r = evaluate(makeUser({ expiryDate: new Date('2026-08-08T18:00:00.000Z') }));
  assert.equal(r.allowed, true);
});

test('a membership with no expiry date is denied rather than assumed infinite', () => {
  assert.equal(evaluate(makeUser({ expiryDate: null })).code, 'NO_EXPIRY');
});

test('a membership that has not started yet is denied', () => {
  assert.equal(evaluate(makeUser({ startDate: new Date('2026-09-01T00:00:00.000Z') })).code, 'NOT_STARTED');
});

test('a car-wash plan will not pay for another service', () => {
  const r = evaluate(makeUser(), { serviceKey: 'salon' });
  assert.equal(r.code, 'WRONG_SERVICE');
});

test('exhausted balance is denied', () => {
  assert.equal(evaluate(makeUser({ washesRemaining: 0 })).code, 'NO_WASHES_REMAINING');
  assert.equal(evaluate(makeUser({ washesRemaining: -3 })).code, 'NO_WASHES_REMAINING');
});

test('daily and monthly caps are enforced against current-period counters', () => {
  assert.equal(
    evaluate(makeUser({ maxPerDay: 1, usageCountToday: 1, usageDayKey: '2026-08-08' })).code,
    'DAILY_LIMIT'
  );
  assert.equal(
    evaluate(makeUser({ maxPerDay: 5, maxPerMonth: 4, usageCountMonth: 4, usageMonthKey: '2026-08' })).code,
    'MONTHLY_LIMIT'
  );
});

test('a cap breached in a previous period does not block today', () => {
  const r = evaluate(makeUser({ maxPerDay: 1, usageCountToday: 1, usageDayKey: '2026-08-07' }));
  assert.equal(r.allowed, true);
});

test('cool-off blocks a second wash inside the window', () => {
  const r = evaluate(makeUser({
    coolOffHours: 24,
    maxPerDay: 5,
    lastUsedAt: new Date(AT.getTime() - 2 * 3600 * 1000)
  }));
  assert.equal(r.code, 'COOL_OFF');
  assert.match(r.message, /22\.0h/);
});

test('cool-off allows a wash once the window has passed', () => {
  const r = evaluate(makeUser({
    coolOffHours: 24,
    maxPerDay: 5,
    lastUsedAt: new Date(AT.getTime() - 25 * 3600 * 1000)
  }));
  assert.equal(r.allowed, true);
});

test('a lastUsedAt in the future is treated as inside cool-off, not outside it', () => {
  // Clock skew on the device, or a replayed event. Must not become a free pass.
  const r = evaluate(makeUser({
    coolOffHours: 24,
    maxPerDay: 5,
    lastUsedAt: new Date(AT.getTime() + 10 * 3600 * 1000)
  }));
  assert.equal(r.code, 'COOL_OFF');
});

test('an invalid event timestamp is denied outright', () => {
  const r = evaluateEntitlement(makeUser(), { at: new Date('nope'), plate: 'MH01AB1234', timeZone: TZ });
  assert.equal(r.code, 'INVALID_TIME');
});

// ── vehicle binding ────────────────────────────────────────────────────────

test('a bound-vehicle plan matches regardless of plate formatting', () => {
  const r = evaluate(makeUser({ boundVehiclesOnly: true, boundVehicles: ['mh-01-ab-1234'] }), { plate: 'MH01AB1234' });
  assert.equal(r.allowed, true);
});

test('a bound-vehicle plan denies an unlisted plate', () => {
  const r = evaluate(makeUser({ boundVehiclesOnly: true, boundVehicles: ['DL09XY9999'] }), { plate: 'MH01AB1234' });
  assert.equal(r.code, 'VEHICLE_NOT_BOUND');
});

test('a bound-vehicle plan with no bound vehicles is denied, not waved through', () => {
  const r = evaluate(makeUser({ boundVehiclesOnly: true, boundVehicles: [] }));
  assert.equal(r.code, 'NO_BOUND_VEHICLES');
});

test('a bound-vehicle plan denies when no plate was captured', () => {
  const r = evaluate(makeUser({ boundVehiclesOnly: true, boundVehicles: ['MH01AB1234'] }), { plate: '' });
  assert.equal(r.code, 'NO_PLATE');
});

test('an unbound plan ignores the plate entirely', () => {
  const r = evaluate(makeUser({ boundVehiclesOnly: false }), { plate: '' });
  assert.equal(r.allowed, true);
});

// ── consumption ────────────────────────────────────────────────────────────

test('consumption decrements the balance and stamps both period keys', () => {
  const user = makeUser({ washesRemaining: 4 });
  const c = buildConsumption(user, { at: AT, timeZone: TZ });

  assert.equal(c.balanceBefore, 4);
  assert.equal(c.balanceAfter, 3);
  assert.equal(c.set['membership.washesRemaining'], 3);
  assert.equal(c.set['membership.usageCountToday'], 1);
  assert.equal(c.set['membership.usageDayKey'], '2026-08-08');
  assert.equal(c.set['membership.usageCountMonth'], 1);
  assert.equal(c.set['membership.usageMonthKey'], '2026-08');
  assert.deepEqual(c.set['membership.lastUsedAt'], AT);
});

test('consumption on an unlimited plan touches counters but not the balance', () => {
  const c = buildConsumption(makeUser({ unlimited: true, washesRemaining: 0 }), { at: AT, timeZone: TZ });
  assert.equal(c.balanceBefore, null);
  assert.equal(c.balanceAfter, null);
  assert.equal('membership.washesRemaining' in c.set, false);
  assert.equal(c.set['membership.usageCountToday'], 1);
});

test('consumption resets a stale daily counter instead of incrementing it', () => {
  const user = makeUser({ usageCountToday: 7, usageDayKey: '2026-08-01', usageCountMonth: 7, usageMonthKey: '2026-07' });
  const c = buildConsumption(user, { at: AT, timeZone: TZ });
  assert.equal(c.set['membership.usageCountToday'], 1);
  assert.equal(c.set['membership.usageCountMonth'], 1);
});

test('consumption continues a live counter', () => {
  const user = makeUser({ usageCountToday: 1, usageDayKey: '2026-08-08', usageCountMonth: 2, usageMonthKey: '2026-08' });
  const c = buildConsumption(user, { at: AT, timeZone: TZ });
  assert.equal(c.set['membership.usageCountToday'], 2);
  assert.equal(c.set['membership.usageCountMonth'], 3);
});

test('a balance never goes below zero', () => {
  const c = buildConsumption(makeUser({ washesRemaining: 0 }), { at: AT, timeZone: TZ });
  assert.equal(c.balanceAfter, 0);
});

// ── reversal ───────────────────────────────────────────────────────────────

test('reversal adds the wash back and rolls both counters back', () => {
  const user = makeUser({
    washesRemaining: 3,
    usageCountToday: 1, usageDayKey: '2026-08-08',
    usageCountMonth: 1, usageMonthKey: '2026-08'
  });
  const row = { balanceBefore: 4, balanceAfter: 3, consumedAt: AT };
  const r = buildReversal(user, row, { at: AT, timeZone: TZ });

  assert.equal(r.set['membership.washesRemaining'], 4);
  assert.equal(r.set['membership.usageCountToday'], 0);
  assert.equal(r.set['membership.usageCountMonth'], 0);
});

test('reversal adds one back rather than restoring balanceBefore verbatim', () => {
  // Another wash was legitimately consumed between the original and the abort.
  const user = makeUser({ washesRemaining: 2, usageCountToday: 2, usageDayKey: '2026-08-08' });
  const row = { balanceBefore: 4, balanceAfter: 3, consumedAt: AT };
  const r = buildReversal(user, row, { at: AT, timeZone: TZ });
  assert.equal(r.set['membership.washesRemaining'], 3, 'must not resurrect a wash that was spent elsewhere');
});

test('reversal does not claw back a counter that has already reset', () => {
  const user = makeUser({ washesRemaining: 3, usageCountToday: 0, usageDayKey: '2026-08-09', usageCountMonth: 0, usageMonthKey: '2026-09' });
  const row = { balanceBefore: 4, balanceAfter: 3, consumedAt: AT };
  const r = buildReversal(user, row, { at: AT, timeZone: TZ });
  assert.equal('membership.usageCountToday' in r.set, false);
  assert.equal('membership.usageCountMonth' in r.set, false);
  assert.equal(r.set['membership.washesRemaining'], 4);
});

test('reversal of an unlimited-plan row leaves the balance alone', () => {
  const user = makeUser({ unlimited: true, usageCountToday: 1, usageDayKey: '2026-08-08' });
  const row = { balanceBefore: null, balanceAfter: null, consumedAt: AT };
  const r = buildReversal(user, row, { at: AT, timeZone: TZ });
  assert.equal('membership.washesRemaining' in r.set, false);
  assert.equal(r.set['membership.usageCountToday'], 0);
});

test('counters never go negative on repeated reversals', () => {
  const user = makeUser({ usageCountToday: 0, usageDayKey: '2026-08-08', usageCountMonth: 0, usageMonthKey: '2026-08' });
  const row = { balanceBefore: 4, consumedAt: AT };
  const r = buildReversal(user, row, { at: AT, timeZone: TZ });
  assert.equal(r.set['membership.usageCountToday'], 0);
  assert.equal(r.set['membership.usageCountMonth'], 0);
});
