import React from 'react';
import { Coffee, Clock, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { useStaff } from '../context/StaffContext';

const pad = (n) => String(n).padStart(2, '0');

// mm : ss (or h : mm : ss once an overtime passes an hour)
export const formatBreakClock = (totalSeconds, sep = ' : ') => {
  const s = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}${sep}${pad(m)}${sep}${pad(s % 60)}` : `${pad(m)}${sep}${pad(s % 60)}`;
};

const formatTimeStr = (isoDate) => {
  if (!isoDate) return '—';
  try {
    return new Date(isoDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '—';
  }
};

export default function StaffBreakTimerWidget() {
  const { breakStatus, endStaffBreak, isEndingBreak } = useStaff();

  if (!breakStatus || breakStatus.status !== 'active') {
    return null;
  }

  const durationMinutes = breakStatus.breakDuration || 30;
  const isOvertime = !!breakStatus.isOvertime;
  const title = breakStatus.breakLabel || breakStatus.breakReason || 'Lunch Break';
  const startTimeStr = formatTimeStr(breakStatus.breakStartTime);
  const endTimeStr = formatTimeStr(breakStatus.breakEndTime);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r p-4 sm:p-5 text-white shadow-xl border border-white/20 animate-fade-in ${
        isOvertime ? 'from-red-700 via-red-600 to-rose-500' : 'from-orange-600 via-amber-600 to-amber-500'
      }`}
    >
      {/* Top Header Row */}
      <div className="flex items-start justify-between relative z-10 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner flex-shrink-0">
            {isOvertime
              ? <AlertTriangle className="w-5 h-5 text-red-100 animate-pulse" />
              : <Coffee className="w-5 h-5 text-amber-100" />}
          </div>
          <div>
            <span className={`text-[10px] font-extrabold uppercase tracking-wider bg-black/25 px-2.5 py-0.5 rounded-full border border-white/15 inline-block ${isOvertime ? 'text-red-100' : 'text-amber-100'}`}>
              {isOvertime ? 'OVER BREAK TIME' : 'STAFF BREAK IN PROGRESS'}
            </span>
            <h3 className="text-base sm:text-lg font-black text-white drop-shadow-sm mt-0.5 leading-tight">
              {title}
            </h3>
          </div>
        </div>

        <span className="text-xs font-black bg-white/20 px-3 py-1 rounded-xl backdrop-blur-sm border border-white/25 text-white flex-shrink-0">
          {durationMinutes}m Break
        </span>
      </div>

      {/* Main Countdown / Overtime Display Card */}
      <div className="bg-black/30 backdrop-blur-md rounded-2xl p-4 border border-white/15 shadow-inner relative z-10 text-center">
        <p className={`text-[11px] font-extrabold uppercase tracking-widest mb-1.5 flex items-center justify-center gap-1.5 ${isOvertime ? 'text-red-200' : 'text-amber-300'}`}>
          <Clock className="w-3.5 h-3.5" />
          {isOvertime ? 'OVERTIME — PLEASE RETURN TO WORK' : 'TIME REMAINING (LIVE REVERSE CLOCK)'}
        </p>

        <div className="text-4xl sm:text-5xl font-black font-mono tracking-wider text-white drop-shadow-md py-1">
          {isOvertime ? `+${formatBreakClock(breakStatus.overtimeSeconds)}` : formatBreakClock(breakStatus.remainingSeconds)}
        </div>

        <div className="flex justify-between items-center text-xs font-semibold text-white/90 pt-1 px-1 border-t border-white/10 mt-2">
          {isOvertime ? (
            <span className="w-full text-center">Allowed {durationMinutes} min · Return was due at {endTimeStr}</span>
          ) : (
            <>
              <span>Started: {startTimeStr}</span>
              <span>Return By: {endTimeStr}</span>
            </>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={endStaffBreak}
        disabled={isEndingBreak}
        className={`relative z-10 mt-3 w-full py-3 rounded-2xl font-black text-sm shadow-md transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2 uppercase tracking-wider ${
          isOvertime ? 'bg-white text-red-700 hover:bg-red-50' : 'bg-white text-orange-900 hover:bg-amber-50'
        }`}
      >
        {isEndingBreak ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
        <span>{isEndingBreak ? 'Ending Break...' : 'End Break & Resume Work'}</span>
      </button>
    </div>
  );
}
