process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'test-password';

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const express = require('express');
const jwt = require('jsonwebtoken');

// Push must never reach Firebase from a test. The break service looks the
// helper up at call time, so swapping the export is enough.
const pushHelper = require('../src/common/services/pushNotificationHelper');
const pushes = [];
pushHelper.sendNotificationToUser = async (userId, payload) => { pushes.push({ userId: String(userId), ...payload }); };

const db = require('./helpers/testDb');
const Staff = require('../src/models/Staff');
const Admin = require('../src/models/Admin');
const BreakLog = require('../src/models/BreakLog');
const Notification = require('../src/models/Notification');
const { normalizeBreakSchedule } = require('../src/utils/breakSchedule');
const { nowParts, dayKey } = require('../src/utils/siteTime');
const { runBreakSchedulerTick } = require('../src/services/breakScheduler');

// Real routers on a real socket, like dataIsolationApi.test.js: the ownership
// checks are only proven if the whole middleware chain runs.
const app = express();
app.use(express.json());
app.use('/api/users', require('../src/routes/userRoutes'));
app.use('/api/staff', require('../src/routes/staffRoutes'));

let server;
let baseUrl;

test.before(async () => {
  await db.start();
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await db.stop();
});

test.beforeEach(async () => {
  await db.clear();
  pushes.length = 0;
});

const request = async (method, path, { body, token } = {}) => {
  const headers = { 'content-type': 'application/json' };
  if (token) headers.authorization = `Bearer ${token}`;
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* non-JSON error page */ }
  return { status: res.status, body: json, text };
};

const tokenFor = (account) => jwt.sign({ userId: account._id.toString() }, process.env.JWT_SECRET);

let seq = 0;
const makeStaff = (over = {}) => {
  seq += 1;
  return Staff.create({
    staffId: `STF-T${seq}`,
    fullName: `Staff ${seq}`,
    email: `staff${seq}@example.com`,
    password: 'secret123',
    ...over
  });
};

const makeAdmin = () => Admin.create({ email: 'boss@example.com', password: 'secret123' });

const hhmm = (minutesOfDay) => {
  const m = ((minutesOfDay % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};

const scheduleAt = (startTime, durationMinutes = 30) => [
  { slot: 1, label: 'Break 1', startTime, durationMinutes, enabled: true },
  { slot: 2, label: 'Break 2', startTime: '', durationMinutes: 30, enabled: true },
  { slot: 3, label: 'Break 3', startTime: '', durationMinutes: 15, enabled: true }
];

// Moves a running break's clock into the past, as if `minutesOver` minutes of
// overtime had already passed.
const pushBreakIntoOvertime = async (staffId, minutesOver, allowedMinutes = 30) => {
  const now = Date.now();
  const end = new Date(now - minutesOver * 60 * 1000);
  const start = new Date(end.getTime() - allowedMinutes * 60 * 1000);
  const staff = await Staff.findById(staffId);
  await Staff.updateOne({ _id: staffId }, { $set: { breakStartTime: start, breakEndTime: end } });
  await BreakLog.updateOne({ _id: staff.currentBreakLogId }, { $set: { startedAt: start, plannedEndAt: end } });
};

// ─── normalizeBreakSchedule ──────────────────────────────────────────────

test('normalizeBreakSchedule fills the 30/30/15 defaults', () => {
  const { value, error } = normalizeBreakSchedule(undefined);
  assert.equal(error, null);
  assert.deepEqual(value.map((s) => [s.slot, s.label, s.durationMinutes, s.startTime]), [
    [1, 'Break 1', 30, ''],
    [2, 'Break 2', 30, ''],
    [3, 'Break 3', 15, '']
  ]);

  const partial = normalizeBreakSchedule([{ slot: 2, startTime: '15:00', label: '  ' }]);
  assert.equal(partial.error, null);
  assert.equal(partial.value[1].label, 'Break 2');
  assert.equal(partial.value[1].startTime, '15:00');
  assert.equal(partial.value[0].startTime, '');
});

test('normalizeBreakSchedule rejects malformed times', () => {
  for (const bad of ['25:00', '12:60', '9:00', 'noon']) {
    assert.ok(normalizeBreakSchedule([{ slot: 1, startTime: bad, durationMinutes: 30 }]).error, bad);
  }
});

test('normalizeBreakSchedule rejects overlapping enabled breaks only', () => {
  const overlapping = [
    { slot: 1, startTime: '12:00', durationMinutes: 30 },
    { slot: 2, startTime: '12:15', durationMinutes: 30 }
  ];
  assert.match(normalizeBreakSchedule(overlapping).error, /overlaps/);

  const adjacent = [
    { slot: 1, startTime: '12:00', durationMinutes: 30 },
    { slot: 2, startTime: '12:30', durationMinutes: 30 }
  ];
  assert.equal(normalizeBreakSchedule(adjacent).error, null);

  overlapping[1].enabled = false;
  assert.equal(normalizeBreakSchedule(overlapping).error, null);
});

test('normalizeBreakSchedule enforces duration bounds', () => {
  for (const bad of [0, 121, 12.5, 'abc']) {
    assert.ok(normalizeBreakSchedule([{ slot: 1, durationMinutes: bad }]).error, String(bad));
  }
  assert.equal(normalizeBreakSchedule([{ slot: 1, durationMinutes: 120 }]).error, null);
  assert.ok(normalizeBreakSchedule([{ slot: 1 }, { slot: 1 }]).error, 'duplicate slot');
});

// ─── Scheduler ───────────────────────────────────────────────────────────

test('a slot due this minute fires exactly once across ticks', async () => {
  const now = new Date();
  const { minutesOfDay } = nowParts(now);
  const staff = await makeStaff({ breakSchedule: scheduleAt(hhmm(minutesOfDay), 30) });

  await runBreakSchedulerTick(now);
  await runBreakSchedulerTick(new Date(now.getTime() + 30 * 1000));

  const logs = await BreakLog.find({ staff: staff._id });
  assert.equal(logs.length, 1);
  assert.equal(logs[0].source, 'scheduled');
  assert.equal(logs[0].status, 'notified');
  assert.equal(logs[0].slot, 1);
  assert.equal(logs[0].date, dayKey(now));

  const fresh = await Staff.findById(staff._id);
  assert.equal(fresh.breakStatus, 'pending');
  assert.equal(fresh.breakDuration, 30);
  assert.equal(String(fresh.currentBreakLogId), String(logs[0]._id));
  assert.equal(fresh.currentBreakSlot, 1);

  assert.equal(pushes.filter((p) => p.data.type === 'break_due').length, 1);
  assert.equal(await Notification.countDocuments({ targetUserId: staff._id }), 1);
});

test('a slot outside the catch-up window does not fire', async () => {
  const now = new Date();
  const { minutesOfDay } = nowParts(now);
  // Same-day only: skip near midnight, where "30 minutes ago" is yesterday.
  if (minutesOfDay < 31) return;
  const staff = await makeStaff({ breakSchedule: scheduleAt(hhmm(minutesOfDay - 30), 15) });

  await runBreakSchedulerTick(now);

  assert.equal(await BreakLog.countDocuments({ staff: staff._id }), 0);
  assert.equal((await Staff.findById(staff._id)).breakStatus, 'idle');
  assert.equal(pushes.length, 0);
});

test('a due slot while another break is running is logged as missed', async () => {
  const now = new Date();
  const { minutesOfDay } = nowParts(now);
  const staff = await makeStaff({
    breakSchedule: scheduleAt(hhmm(minutesOfDay), 30),
    breakStatus: 'active',
    isOnBreak: true,
    breakStartTime: new Date(now.getTime() - 60 * 1000),
    breakEndTime: new Date(now.getTime() + 10 * 60 * 1000)
  });

  await runBreakSchedulerTick(now);

  const log = await BreakLog.findOne({ staff: staff._id, source: 'scheduled' });
  assert.equal(log.status, 'missed');
  assert.match(log.note, /another break/);
  assert.equal((await Staff.findById(staff._id)).breakStatus, 'active');
});

test('an unstarted scheduled break expires as missed', async () => {
  const now = new Date();
  const { minutesOfDay } = nowParts(now);
  const staff = await makeStaff({ breakSchedule: scheduleAt(hhmm(minutesOfDay), 30) });
  await runBreakSchedulerTick(now);

  await runBreakSchedulerTick(new Date(now.getTime() + 61 * 60 * 1000));

  const log = await BreakLog.findOne({ staff: staff._id });
  assert.equal(log.status, 'missed');
  const fresh = await Staff.findById(staff._id);
  assert.equal(fresh.breakStatus, 'idle');
  assert.equal(fresh.currentBreakLogId, null);
});

// ─── Lifecycle & overtime ────────────────────────────────────────────────

test('a break past its end stays active, reports overtime, and records it on end', async () => {
  const admin = await makeAdmin();
  const staff = await makeStaff();
  const staffToken = tokenFor(staff);

  const assigned = await request('POST', `/api/staff/${staff._id}/break`, {
    token: tokenFor(admin),
    body: { action: 'assign', duration: 30, reason: 'Lunch' }
  });
  assert.equal(assigned.status, 200, assigned.text);

  const started = await request('POST', '/api/staff/me/break', { token: staffToken, body: { action: 'start' } });
  assert.equal(started.status, 200, started.text);

  await pushBreakIntoOvertime(staff._id, 5);

  const status = await request('GET', '/api/staff/me/break', { token: staffToken });
  assert.equal(status.status, 200);
  assert.equal(status.body.breakStatus, 'active');
  assert.equal(status.body.isOnBreak, true);
  assert.equal(status.body.isOvertime, true);
  assert.equal(status.body.remainingSeconds, 0);
  assert.ok(status.body.overtimeSeconds >= 299, `overtime ${status.body.overtimeSeconds}`);
  assert.ok(status.body.serverNow);
  assert.equal(status.body.label, 'Lunch');
  // The lazy scheduler pass sent exactly one "break is over" reminder.
  assert.equal(pushes.filter((p) => p.data.type === 'break_overtime').length, 1);
  await request('GET', '/api/staff/me/break', { token: staffToken });
  assert.equal(pushes.filter((p) => p.data.type === 'break_overtime').length, 1);

  const ended = await request('POST', '/api/staff/me/break', { token: staffToken, body: { action: 'end' } });
  assert.equal(ended.status, 200, ended.text);
  assert.ok(ended.body.overtimeSeconds >= 299);
  assert.ok(ended.body.actualSeconds >= 35 * 60 - 1);

  const log = await BreakLog.findOne({ staff: staff._id });
  assert.equal(log.status, 'completed');
  assert.equal(log.endedBy, 'staff');
  assert.equal(log.allowedMinutes, 30);
  assert.ok(log.overtimeSeconds >= 299);

  const fresh = await Staff.findById(staff._id);
  assert.equal(fresh.breakStatus, 'idle');
  assert.equal(fresh.currentBreakLogId, null);
  assert.equal(fresh.breakHistory.length, 1);
  assert.ok(fresh.breakHistory[0].overtimeSeconds >= 299);
});

test('list and detail endpoints never close an overdue break', async () => {
  const admin = await makeAdmin();
  const staff = await makeStaff();
  await request('POST', `/api/staff/${staff._id}/break`, { token: tokenFor(admin), body: { action: 'assign', duration: 15 } });
  await request('POST', '/api/staff/me/break', { token: tokenFor(staff), body: { action: 'start' } });
  await pushBreakIntoOvertime(staff._id, 3, 15);

  const list = await request('GET', '/api/staff', { token: tokenFor(admin) });
  assert.equal(list.status, 200);
  const row = list.body.staff.find((s) => s._id === String(staff._id));
  assert.equal(row.breakStatus, 'active');
  assert.ok(row.todayBreakSummary.overtimeSeconds >= 179, 'live overtime counted in the summary');

  const detail = await request('GET', `/api/users/staff/${staff._id}`, { token: tokenFor(admin) });
  assert.equal(detail.status, 200);
  assert.equal(detail.body.staff.breakStatus, 'active');

  const fresh = await Staff.findById(staff._id);
  assert.equal(fresh.breakStatus, 'active');
  assert.equal(fresh.isOnBreak, true);
  assert.equal(fresh.breakHistory.length, 0);
});

test('the safety cap closes a forgotten break with full overtime', async () => {
  const admin = await makeAdmin();
  const staff = await makeStaff();
  await request('POST', `/api/staff/${staff._id}/break`, { token: tokenFor(admin), body: { action: 'assign', duration: 30 } });
  await request('POST', '/api/staff/me/break', { token: tokenFor(staff), body: { action: 'start' } });
  await pushBreakIntoOvertime(staff._id, 300);

  await runBreakSchedulerTick(new Date());

  const log = await BreakLog.findOne({ staff: staff._id });
  assert.equal(log.status, 'completed');
  assert.equal(log.endedBy, 'system_cap');
  assert.ok(log.overtimeSeconds >= 300 * 60 - 1);
  assert.equal((await Staff.findById(staff._id)).breakStatus, 'idle');
});

test('break logs endpoint returns rows and an overtime summary', async () => {
  const admin = await makeAdmin();
  const staff = await makeStaff();
  const today = dayKey(new Date());
  await BreakLog.create([
    { staff: staff._id, date: today, source: 'manual', status: 'completed', allowedMinutes: 30, actualSeconds: 1900, overtimeSeconds: 100 },
    { staff: staff._id, date: today, source: 'scheduled', slot: 1, status: 'missed', allowedMinutes: 30 },
    { staff: staff._id, date: '2020-01-01', source: 'manual', status: 'completed', overtimeSeconds: 999 }
  ]);

  const res = await request('GET', `/api/users/staff/${staff._id}/break-logs`, { token: tokenFor(admin) });
  assert.equal(res.status, 200, res.text);
  assert.equal(res.body.logs.length, 2);
  assert.deepEqual(res.body.summary, {
    totalOvertimeSeconds: 100,
    overtimeCount: 1,
    completedCount: 1,
    missedCount: 1,
    totalBreakSeconds: 1900
  });

  const tooWide = await request('GET', `/api/staff/${staff._id}/break-logs?from=2020-01-01&to=${today}`, { token: tokenFor(admin) });
  assert.equal(tooWide.status, 400);
});

test('schedule endpoint validates and saves; onboarding accepts a schedule', async () => {
  const admin = await makeAdmin();
  const created = await request('POST', '/api/users/staff', {
    token: tokenFor(admin),
    body: {
      fullName: 'New Hire',
      email: 'newhire@example.com',
      password: 'secret123',
      breakSchedule: scheduleAt('12:00', 30)
    }
  });
  assert.equal(created.status, 201, created.text);
  assert.equal(created.body.staff.breakSchedule[0].startTime, '12:00');

  const id = created.body.staff._id;
  const bad = await request('PUT', `/api/staff/${id}/break-schedule`, {
    token: tokenFor(admin),
    body: { breakSchedule: [{ slot: 1, startTime: '12:00', durationMinutes: 30 }, { slot: 2, startTime: '12:10', durationMinutes: 30 }] }
  });
  assert.equal(bad.status, 400);

  const ok = await request('PUT', `/api/users/staff/${id}/break-schedule`, {
    token: tokenFor(admin),
    body: { breakSchedule: [{ slot: 1, startTime: '13:00', durationMinutes: 45 }] }
  });
  assert.equal(ok.status, 200, ok.text);
  const fresh = await Staff.findById(id);
  assert.equal(fresh.breakSchedule[0].startTime, '13:00');
  assert.equal(fresh.breakSchedule[0].durationMinutes, 45);
});

// ─── Ownership ───────────────────────────────────────────────────────────

test('staff cannot end, read or assign someone else\'s break', async () => {
  const admin = await makeAdmin();
  const alice = await makeStaff({ permissions: ['bookings', 'orders'] });
  const bob = await makeStaff();

  await request('POST', `/api/staff/${bob._id}/break`, { token: tokenFor(admin), body: { action: 'assign', duration: 30 } });
  await request('POST', '/api/staff/me/break', { token: tokenFor(bob), body: { action: 'start' } });

  for (const prefix of ['/api/staff', '/api/users/staff']) {
    const end = await request('POST', `${prefix}/${bob._id}/break`, { token: tokenFor(alice), body: { action: 'end' } });
    assert.equal(end.status, 403, `${prefix} end`);

    const read = await request('GET', `${prefix}/${bob._id}/break`, { token: tokenFor(alice) });
    assert.equal(read.status, 403, `${prefix} read`);

    const logs = await request('GET', `${prefix}/${bob._id}/break-logs`, { token: tokenFor(alice) });
    assert.equal(logs.status, 403, `${prefix} logs`);
  }

  const assignSelf = await request('POST', '/api/staff/me/break', { token: tokenFor(alice), body: { action: 'assign', duration: 120 } });
  assert.equal(assignSelf.status, 403);
  const cancel = await request('POST', `/api/staff/${bob._id}/break`, { token: tokenFor(alice), body: { action: 'cancel' } });
  assert.equal(cancel.status, 403);

  const schedule = await request('PUT', `/api/staff/${bob._id}/break-schedule`, {
    token: tokenFor(alice),
    body: { breakSchedule: scheduleAt('12:00') }
  });
  assert.equal(schedule.status, 403);

  assert.equal((await Staff.findById(bob._id)).breakStatus, 'active');

  const own = await request('POST', '/api/staff/me/break', { token: tokenFor(bob), body: { action: 'end' } });
  assert.equal(own.status, 200);
});
