import React from 'react';
import { Coffee, AlertTriangle, Loader2 } from 'lucide-react';
import { useStaff } from '../context/StaffContext';
import { formatBreakClock } from './StaffBreakTimerWidget';

// One-line break timer pinned under the header so the countdown (and the End
// button) stay visible on every staff page, not only the dashboard.
export default function StaffBreakTimerBar() {
  const { breakStatus, endStaffBreak, isEndingBreak } = useStaff();

  if (!breakStatus || breakStatus.status !== 'active') return null;

  const isOvertime = !!breakStatus.isOvertime;

  return (
    <div
      className={`flex items-center gap-2 px-4 py-2 text-white text-xs font-bold shadow-sm ${
        isOvertime ? 'bg-red-600' : 'bg-gradient-to-r from-orange-600 to-amber-500'
      }`}
      role="status"
    >
      {isOvertime ? <AlertTriangle className="w-4 h-4 flex-shrink-0 animate-pulse" /> : <Coffee className="w-4 h-4 flex-shrink-0" />}
      <span className="truncate">
        {isOvertime ? 'Over break time' : (breakStatus.breakLabel || breakStatus.breakReason || 'On break')}
      </span>
      <span className="ml-auto font-mono text-sm font-black tabular-nums">
        {isOvertime
          ? `+${formatBreakClock(breakStatus.overtimeSeconds, ':')}`
          : formatBreakClock(breakStatus.remainingSeconds, ':')}
      </span>
      <button
        type="button"
        onClick={endStaffBreak}
        disabled={isEndingBreak}
        className={`px-2.5 py-1 rounded-lg bg-white font-black text-[11px] uppercase disabled:opacity-60 flex items-center gap-1 ${
          isOvertime ? 'text-red-700' : 'text-orange-800'
        }`}
      >
        {isEndingBreak && <Loader2 className="w-3 h-3 animate-spin" />}
        End
      </button>
    </div>
  );
}
