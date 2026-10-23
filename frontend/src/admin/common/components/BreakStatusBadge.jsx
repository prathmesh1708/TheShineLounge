import React, { useEffect, useState } from 'react';
import { Coffee, Hourglass, AlertTriangle } from 'lucide-react';
import { formatClock, formatOvertime, formatShortDuration } from '../utils/formatDuration';

const isActiveBreak = (staff) => !!staff && (staff.isOnBreak || staff.breakStatus === 'active');

// Live break state for a staff row: countdown while on break, a red overtime
// count-up once the break is over but not ended, plus today's overtime total.
export default function BreakStatusBadge({ staff, showTodayOvertime = true }) {
  const active = isActiveBreak(staff);
  const endMs = staff?.breakEndTime ? new Date(staff.breakEndTime).getTime() : null;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!active || !endMs) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active, endMs]);

  const signed = active && endMs ? Math.floor((endMs - now) / 1000) : 0;
  const isOvertime = active && endMs !== null && signed < 0;

  // Stored overtime from finished breaks today, plus the live overtime of a
  // break still running past its end (the server's figure is a snapshot).
  const summary = staff?.todayBreakSummary;
  const storedOvertime = summary
    ? Math.max(0, (summary.overtimeSeconds || 0) - (summary.liveOvertimeSeconds || 0))
    : 0;
  const todayOvertime = storedOvertime + (isOvertime ? -signed : 0);

  let badge = null;
  if (active && isOvertime) {
    badge = (
      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-red-600 text-white flex items-center gap-1 animate-pulse shadow-xs whitespace-nowrap">
        <AlertTriangle className="w-3 h-3" /> OVERTIME {formatOvertime(-signed)}
      </span>
    );
  } else if (active) {
    badge = (
      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white flex items-center gap-1 shadow-xs whitespace-nowrap">
        <Coffee className="w-3 h-3" /> On Break · {endMs ? `${formatClock(signed)} left` : `${staff.breakDuration || 30}m`}
      </span>
    );
  } else if (staff?.breakStatus === 'pending') {
    badge = (
      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-800 border border-amber-400 flex items-center gap-1 whitespace-nowrap">
        <Hourglass className="w-3 h-3" /> Break pending ({staff.breakDuration || 30}m)
      </span>
    );
  }

  const showOt = showTodayOvertime && todayOvertime > 0;
  if (!badge && !showOt) return null;

  return (
    <div className="flex flex-col gap-1 items-start">
      {badge}
      {showOt && (
        <span
          className="px-2 py-0.5 rounded-md text-[9px] font-black bg-red-50 text-red-700 border border-red-200 whitespace-nowrap"
          title="Total break overtime today"
        >
          Today OT +{formatShortDuration(todayOvertime)}
        </span>
      )}
    </div>
  );
}
