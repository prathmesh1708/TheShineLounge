// Validation for Staff.breakSchedule. Admin forms send whatever they have;
// this turns it into exactly three well-formed slots or explains what is wrong.

const { isValidHHmm, hhmmToMinutes } = require('./siteTime');

const DEFAULT_BREAK_SCHEDULE = Object.freeze([
  Object.freeze({ slot: 1, label: 'Break 1', startTime: '', durationMinutes: 30, enabled: true }),
  Object.freeze({ slot: 2, label: 'Break 2', startTime: '', durationMinutes: 30, enabled: true }),
  Object.freeze({ slot: 3, label: 'Break 3', startTime: '', durationMinutes: 15, enabled: true })
]);

const defaultBreakSchedule = () => DEFAULT_BREAK_SCHEDULE.map((s) => ({ ...s }));

// Returns { value, error }. `value` is only meaningful when `error` is null.
const normalizeBreakSchedule = (input) => {
  if (input === undefined || input === null) return { value: defaultBreakSchedule(), error: null };
  if (!Array.isArray(input)) return { value: null, error: 'breakSchedule must be an array' };
  if (input.length > 3) return { value: null, error: 'breakSchedule supports at most 3 breaks' };

  const bySlot = new Map();
  for (let i = 0; i < input.length; i += 1) {
    const raw = input[i] || {};
    // Rows without a slot number are taken positionally (row 0 = Break 1).
    const slot = raw.slot === undefined || raw.slot === null || raw.slot === '' ? i + 1 : Number(raw.slot);
    if (![1, 2, 3].includes(slot)) return { value: null, error: `Invalid break slot "${raw.slot}"` };
    if (bySlot.has(slot)) return { value: null, error: `Break ${slot} appears more than once` };
    bySlot.set(slot, raw);
  }

  const value = [];
  for (const def of DEFAULT_BREAK_SCHEDULE) {
    const raw = bySlot.get(def.slot);
    if (!raw) {
      value.push({ ...def });
      continue;
    }

    const label = String(raw.label ?? '').trim() || `Break ${def.slot}`;

    const startTime = String(raw.startTime ?? '').trim();
    if (startTime && !isValidHHmm(startTime)) {
      return { value: null, error: `Break ${def.slot}: start time must be HH:mm (24h)` };
    }

    const rawDuration = raw.durationMinutes === undefined || raw.durationMinutes === ''
      ? def.durationMinutes
      : Number(raw.durationMinutes);
    if (!Number.isInteger(rawDuration) || rawDuration < 1 || rawDuration > 120) {
      return { value: null, error: `Break ${def.slot}: duration must be a whole number of minutes between 1 and 120` };
    }

    const enabled = raw.enabled === undefined ? true : raw.enabled === true || raw.enabled === 'true';

    value.push({ slot: def.slot, label, startTime, durationMinutes: rawDuration, enabled });
  }

  // Only breaks that will actually fire can collide.
  const windows = value
    .filter((s) => s.enabled && s.startTime)
    .map((s) => ({ s, start: hhmmToMinutes(s.startTime), end: hhmmToMinutes(s.startTime) + s.durationMinutes }))
    .sort((a, b) => a.start - b.start);
  for (let i = 1; i < windows.length; i += 1) {
    if (windows[i].start < windows[i - 1].end) {
      return {
        value: null,
        error: `${windows[i - 1].s.label} (${windows[i - 1].s.startTime}, ${windows[i - 1].s.durationMinutes} min) overlaps ${windows[i].s.label} (${windows[i].s.startTime})`
      };
    }
  }

  return { value, error: null };
};

module.exports = { DEFAULT_BREAK_SCHEDULE, defaultBreakSchedule, normalizeBreakSchedule };
