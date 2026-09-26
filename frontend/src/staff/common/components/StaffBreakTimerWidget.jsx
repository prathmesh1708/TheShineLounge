import React from 'react';
import { Coffee, Clock } from 'lucide-react';
import { useStaff } from '../context/StaffContext';

export default function StaffBreakTimerWidget() {
  const { breakStatus } = useStaff();

  if (!breakStatus || !breakStatus.isOnBreak) {
    return null;
  }

  const durationMinutes = breakStatus.breakDuration || 30;
  const remainingSeconds = Math.max(0, breakStatus.remainingSeconds || 0);

  const mins = Math.floor(remainingSeconds / 60);
  const secs = remainingSeconds % 60;
  const formattedMins = String(mins).padStart(2, '0');
  const formattedSecs = String(secs).padStart(2, '0');

  const formatTimeStr = (isoDate) => {
    if (!isoDate) return '—';
    try {
      return new Date(isoDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '—';
    }
  };

  const startTimeStr = formatTimeStr(breakStatus.breakStartTime);
  const endTimeStr = formatTimeStr(breakStatus.breakEndTime);

  return (
    <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-orange-600 via-amber-600 to-amber-500 p-4 sm:p-5 text-white shadow-xl border border-white/20 animate-fade-in">
      {/* Top Header Row */}
      <div className="flex items-start justify-between relative z-10 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner flex-shrink-0">
            <Coffee className="w-5 h-5 text-amber-100" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-black/25 px-2.5 py-0.5 rounded-full border border-white/15 inline-block text-amber-100">
              STAFF BREAK IN PROGRESS
            </span>
            <h3 className="text-base sm:text-lg font-black text-white drop-shadow-sm mt-0.5 leading-tight">
              {breakStatus.breakReason || 'Lunch Break'}
            </h3>
          </div>
        </div>

        <span className="text-xs font-black bg-white/20 px-3 py-1 rounded-xl backdrop-blur-sm border border-white/25 text-white flex-shrink-0">
          {durationMinutes}m Break
        </span>
      </div>

      {/* Main Countdown Display Card */}
      <div className="bg-black/30 backdrop-blur-md rounded-2xl p-4 border border-white/15 shadow-inner relative z-10 text-center">
        <p className="text-[11px] font-extrabold text-amber-300 uppercase tracking-widest mb-1.5 flex items-center justify-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-amber-300" />
          TIME REMAINING (LIVE REVERSE CLOCK)
        </p>

        <div className="text-4xl sm:text-5xl font-black font-mono tracking-wider text-white drop-shadow-md py-1">
          {formattedMins} : {formattedSecs}
        </div>

        <div className="flex justify-between items-center text-xs font-semibold text-white/90 pt-1 px-1 border-t border-white/10 mt-2">
          <span>Started: {startTimeStr}</span>
          <span>Return By: {endTimeStr}</span>
        </div>
      </div>
    </div>
  );
}
