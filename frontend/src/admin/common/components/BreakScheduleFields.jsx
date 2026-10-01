import React from 'react';
import { Coffee, AlertCircle } from 'lucide-react';
import { DEFAULT_BREAK_SCHEDULE, breakScheduleProblem, scheduleFromStaff } from '../utils/breakSchedule';
import { formatHHmm12 } from '../utils/formatDuration';

export { DEFAULT_BREAK_SCHEDULE };

const PRESET_DURATIONS = [15, 20, 30, 45, 60];

// Three daily break slots for the onboarding / edit forms. At each start time
// the staff member is automatically sent a break they can start.
export default function BreakScheduleFields({ value, onChange }) {
  const rows = scheduleFromStaff({ breakSchedule: value });
  const problem = breakScheduleProblem(rows);

  const update = (slot, patch) => {
    onChange(rows.map((r) => (r.slot === slot ? { ...r, ...patch } : r)));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Coffee className="w-4 h-4 text-amber-600" />
        <div>
          <label className="font-bold text-gray-700 block text-xs">Daily Break Schedule</label>
          <p className="text-[10px] text-gray-500">At each start time the staff app gets a break alert automatically. Leave a time empty to skip it.</p>
        </div>
      </div>

      <div className="space-y-2">
        {rows.map((row) => {
          const isPreset = PRESET_DURATIONS.includes(Number(row.durationMinutes));
          return (
            <div
              key={row.slot}
              className={`grid grid-cols-12 gap-2 items-end p-2.5 rounded-xl border transition-colors ${
                row.enabled ? 'bg-amber-50/60 border-amber-200' : 'bg-gray-50 border-gray-200 opacity-70'
              }`}
            >
              <div className="col-span-12 sm:col-span-4">
                <label className="text-[10px] font-bold text-gray-500 block mb-0.5">Label</label>
                <input
                  type="text"
                  value={row.label}
                  maxLength={40}
                  onChange={(e) => update(row.slot, { label: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 font-semibold"
                />
              </div>
              <div className="col-span-5 sm:col-span-3">
                <label className="text-[10px] font-bold text-gray-500 block mb-0.5">Start time</label>
                <input
                  type="time"
                  value={row.startTime}
                  onChange={(e) => update(row.slot, { startTime: e.target.value })}
                  className="w-full px-2 py-1.5 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 font-semibold"
                />
              </div>
              <div className="col-span-4 sm:col-span-3">
                <label className="text-[10px] font-bold text-gray-500 block mb-0.5">Duration</label>
                <div className="flex gap-1">
                  <select
                    value={isPreset ? String(row.durationMinutes) : 'custom'}
                    onChange={(e) => {
                      if (e.target.value !== 'custom') update(row.slot, { durationMinutes: Number(e.target.value) });
                      else if (isPreset) update(row.slot, { durationMinutes: Number(row.durationMinutes) + 1 });
                    }}
                    className="w-full px-1.5 py-1.5 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 font-semibold"
                  >
                    {PRESET_DURATIONS.map((d) => <option key={d} value={d}>{d} min</option>)}
                    <option value="custom">Custom</option>
                  </select>
                  {!isPreset && (
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={row.durationMinutes}
                      onChange={(e) => update(row.slot, { durationMinutes: Math.min(120, Math.max(1, Math.round(Number(e.target.value)) || 1)) })}
                      className="w-14 px-1.5 py-1.5 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 font-bold"
                    />
                  )}
                </div>
              </div>
              <div className="col-span-3 sm:col-span-2 flex flex-col items-center">
                <label className="text-[10px] font-bold text-gray-500 block mb-1">On</label>
                <button
                  type="button"
                  role="switch"
                  aria-checked={row.enabled}
                  aria-label={`${row.label} enabled`}
                  onClick={() => update(row.slot, { enabled: !row.enabled })}
                  className={`relative w-9 h-5 rounded-full transition-colors ${row.enabled ? 'bg-amber-500' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${row.enabled ? 'translate-x-4' : ''}`} />
                </button>
              </div>
              {row.enabled && row.startTime && (
                <p className="col-span-12 text-[10px] font-semibold text-amber-800">
                  {formatHHmm12(row.startTime)} · {row.durationMinutes} min
                </p>
              )}
            </div>
          );
        })}
      </div>

      {problem && (
        <div className="flex items-center gap-1.5 p-2 bg-red-50 border border-red-200 rounded-xl text-[11px] font-bold text-red-600">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{problem}</span>
        </div>
      )}
    </div>
  );
}
