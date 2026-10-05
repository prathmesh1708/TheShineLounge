import React from 'react';
import { Clock, Sun, Sunrise, Sunset, Moon, Sparkles } from 'lucide-react';

export const SHIFT_PRESETS = [
  {
    id: 'general',
    label: 'General Shift',
    start: '09:00',
    end: '18:00',
    display: '09:00 AM - 06:00 PM',
    icon: Sun,
    badge: '9 Hours'
  },
  {
    id: 'morning',
    label: 'Morning Shift',
    start: '07:00',
    end: '16:00',
    display: '07:00 AM - 04:00 PM',
    icon: Sunrise,
    badge: '9 Hours'
  },
  {
    id: 'evening',
    label: 'Evening Shift',
    start: '13:00',
    end: '22:00',
    display: '01:00 PM - 10:00 PM',
    icon: Sunset,
    badge: '9 Hours'
  },
  {
    id: 'night',
    label: 'Night Shift',
    start: '21:00',
    end: '06:00',
    display: '09:00 PM - 06:00 AM',
    icon: Moon,
    badge: '9 Hours'
  }
];

export const formatTime12h = (time24) => {
  if (!time24) return '';
  const match = String(time24).trim().match(/^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/);
  if (!match) return time24;
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const strHours = hours < 10 ? `0${hours}` : `${hours}`;
  return `${strHours}:${minutes} ${ampm}`;
};

export const calculateShiftHours = (start24, end24) => {
  if (!start24 || !end24) return '';
  const [sH, sM] = start24.split(':').map(Number);
  const [eH, eM] = end24.split(':').map(Number);
  if (isNaN(sH) || isNaN(sM) || isNaN(eH) || isNaN(eM)) return '';

  let diffMinutes = (eH * 60 + eM) - (sH * 60 + sM);
  if (diffMinutes <= 0) {
    diffMinutes += 24 * 60; // Crosses midnight
  }

  const hours = Math.floor(diffMinutes / 60);
  const mins = diffMinutes % 60;
  if (mins === 0) return `${hours} hrs`;
  return `${hours}h ${mins}m`;
};

export default function ShiftTimingFields({
  startTime = '09:00',
  endTime = '18:00',
  onChange
}) {
  const currentStart = startTime || '09:00';
  const currentEnd = endTime || '18:00';
  const formattedTiming = `${formatTime12h(currentStart)} - ${formatTime12h(currentEnd)}`;
  const durationText = calculateShiftHours(currentStart, currentEnd);

  const handleStartChange = (val) => {
    const newTiming = `${formatTime12h(val)} - ${formatTime12h(currentEnd)}`;
    onChange?.({
      shiftStartTime: val,
      shiftEndTime: currentEnd,
      shiftTiming: newTiming
    });
  };

  const handleEndChange = (val) => {
    const newTiming = `${formatTime12h(currentStart)} - ${formatTime12h(val)}`;
    onChange?.({
      shiftStartTime: currentStart,
      shiftEndTime: val,
      shiftTiming: newTiming
    });
  };

  const applyPreset = (preset) => {
    onChange?.({
      shiftStartTime: preset.start,
      shiftEndTime: preset.end,
      shiftTiming: preset.display
    });
  };

  return (
    <div className="space-y-3 bg-gradient-to-br from-amber-50/50 via-white to-orange-50/30 p-3.5 rounded-2xl border border-amber-200/80 shadow-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
            <Clock className="w-3.5 h-3.5" />
          </div>
          <div>
            <label className="block font-black text-xs text-gray-900">
              Staff Working Shift Timing *
            </label>
            <p className="text-[10px] text-gray-500 font-medium">
              Admin configured shift hours (stored directly in MongoDB & synced to staff)
            </p>
          </div>
        </div>

        {durationText && (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200">
            ⏳ {durationText}
          </span>
        )}
      </div>

      {/* Preset Chips */}
      <div>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-500" /> Quick Shift Presets:
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {SHIFT_PRESETS.map((p) => {
            const isSelected = currentStart === p.start && currentEnd === p.end;
            const Icon = p.icon;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => applyPreset(p)}
                className={`p-2 rounded-xl text-left border transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-amber-500 text-white border-amber-600 shadow-xs ring-2 ring-amber-300'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-amber-50/70 hover:border-amber-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] font-black ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                    {p.label}
                  </span>
                  <Icon className={`w-3 h-3 ${isSelected ? 'text-white' : 'text-amber-600'}`} />
                </div>
                <span className={`text-[9px] font-bold ${isSelected ? 'text-amber-100' : 'text-gray-500'}`}>
                  {p.display}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Time Pickers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-amber-100/80">
        <div>
          <label className="block text-[11px] font-bold text-gray-700 mb-1">
            Shift Start Time *
          </label>
          <div className="relative">
            <input
              type="time"
              required
              value={currentStart}
              onChange={(e) => handleStartChange(e.target.value)}
              className="w-full p-2 text-xs border border-gray-300 rounded-xl font-bold text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-none bg-white"
            />
            <span className="text-[10px] text-amber-700 font-semibold mt-0.5 block">
              {formatTime12h(currentStart)}
            </span>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-gray-700 mb-1">
            Shift End Time *
          </label>
          <div className="relative">
            <input
              type="time"
              required
              value={currentEnd}
              onChange={(e) => handleEndChange(e.target.value)}
              className="w-full p-2 text-xs border border-gray-300 rounded-xl font-bold text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-none bg-white"
            />
            <span className="text-[10px] text-amber-700 font-semibold mt-0.5 block">
              {formatTime12h(currentEnd)}
            </span>
          </div>
        </div>
      </div>

      {/* Final Active Preview */}
      <div className="p-2 rounded-xl bg-amber-50 border border-amber-200/90 flex items-center justify-between text-[11px]">
        <span className="font-bold text-gray-600">Assigned Shift Window:</span>
        <span className="font-black text-amber-900 font-mono">
          {formattedTiming}
        </span>
      </div>
    </div>
  );
}
