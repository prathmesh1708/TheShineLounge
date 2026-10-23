// Client-side mirror of backend/src/utils/breakSchedule.js, used for instant
// form feedback. The server re-validates everything.

export const DEFAULT_BREAK_SCHEDULE = [
  { slot: 1, label: 'Break 1', startTime: '', durationMinutes: 30, enabled: true },
  { slot: 2, label: 'Break 2', startTime: '', durationMinutes: 30, enabled: true },
  { slot: 3, label: 'Break 3', startTime: '', durationMinutes: 15, enabled: true }
];

export const defaultBreakSchedule = () => DEFAULT_BREAK_SCHEDULE.map((s) => ({ ...s }));

// Whatever a staff record carries (possibly nothing, for older staff) as three
// editable rows.
export const scheduleFromStaff = (staff) => {
  const saved = Array.isArray(staff?.breakSchedule) ? staff.breakSchedule : [];
  return DEFAULT_BREAK_SCHEDULE.map((def) => {
    const row = saved.find((s) => Number(s.slot) === def.slot);
    return row
      ? { slot: def.slot, label: row.label || def.label, startTime: row.startTime || '', durationMinutes: Number(row.durationMinutes) || def.durationMinutes, enabled: row.enabled !== false }
      : { ...def };
  });
};

const toMinutes = (hhmm) => {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(hhmm || '')) return null;
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

// First problem found, or '' when the schedule is fine.
export const breakScheduleProblem = (schedule) => {
  for (const s of schedule || []) {
    const d = Number(s.durationMinutes);
    if (!Number.isInteger(d) || d < 1 || d > 120) return `${s.label || `Break ${s.slot}`}: duration must be 1–120 minutes`;
    if (s.startTime && toMinutes(s.startTime) === null) return `${s.label || `Break ${s.slot}`}: invalid start time`;
  }
  const windows = (schedule || [])
    .filter((s) => s.enabled && s.startTime)
    .map((s) => ({ s, start: toMinutes(s.startTime), end: toMinutes(s.startTime) + Number(s.durationMinutes) }))
    .sort((a, b) => a.start - b.start);
  for (let i = 1; i < windows.length; i += 1) {
    if (windows[i].start < windows[i - 1].end) {
      return `${windows[i - 1].s.label} overlaps ${windows[i].s.label}`;
    }
  }
  return '';
};
