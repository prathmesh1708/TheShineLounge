import React, { useCallback, useEffect, useState } from 'react';
import { History, AlertCircle, RefreshCw } from 'lucide-react';
import userService from '../../../common/services/userService';
import { formatClock, formatOvertime, formatShortDuration, formatHHmm12, formatTimeOfDay, siteDayKey } from '../utils/formatDuration';

const RANGES = [
  { id: 'today', label: 'Today', days: 1 },
  { id: '7d', label: '7 days', days: 7 },
  { id: '30d', label: '30 days', days: 30 }
];

const STATUS_STYLES = {
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  active: 'bg-amber-100 text-amber-800 border-amber-300',
  notified: 'bg-amber-50 text-amber-700 border-amber-200',
  missed: 'bg-red-50 text-red-700 border-red-200',
  cancelled: 'bg-gray-100 text-gray-600 border-gray-200'
};

const STATUS_LABELS = {
  completed: 'Completed',
  active: 'On break',
  notified: 'Pending',
  missed: 'Missed',
  cancelled: 'Cancelled'
};

// Per-staff break history: what was allowed, what was taken, and how far over.
export default function BreakHistoryPanel({ staffId, refreshKey = 0 }) {
  const [range, setRange] = useState('7d');
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!staffId) return;
    const days = RANGES.find((r) => r.id === range)?.days || 7;
    setLoading(true);
    setError('');
    try {
      const res = await userService.getStaffBreakLogs(staffId, {
        from: siteDayKey(new Date(), -(days - 1)),
        to: siteDayKey(new Date())
      });
      setLogs(res.logs || []);
      setSummary(res.summary || null);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load break history');
    } finally {
      setLoading(false);
    }
  }, [staffId, range]);

  useEffect(() => { load(); }, [load, refreshKey]);

  return (
    <div className="border border-gray-200 rounded-2xl bg-white overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50/60">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-amber-600" />
          <h4 className="text-xs font-black text-gray-900">Break History</h4>
        </div>
        <div className="flex items-center gap-1">
          {RANGES.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRange(r.id)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors ${
                range === r.id ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {r.label}
            </button>
          ))}
          <button type="button" onClick={load} className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100" title="Refresh">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {summary && (
        <div className="flex flex-wrap gap-2 px-4 pt-3">
          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black border ${summary.totalOvertimeSeconds > 0 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
            Total overtime: {summary.totalOvertimeSeconds > 0 ? `+${formatShortDuration(summary.totalOvertimeSeconds)}` : 'none'}
          </span>
          <span className="px-2.5 py-1 rounded-lg text-[10px] font-black border bg-white text-gray-700 border-gray-200">
            Overtime breaks: {summary.overtimeCount}
          </span>
          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black border ${summary.missedCount > 0 ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-white text-gray-700 border-gray-200'}`}>
            Missed: {summary.missedCount}
          </span>
        </div>
      )}

      <div className="p-4 pt-3">
        {error ? (
          <div className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded-xl text-[11px] font-bold text-red-600">
            <AlertCircle className="w-3.5 h-3.5" /><span>{error}</span>
          </div>
        ) : loading && logs.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-6 text-[11px] text-gray-400 font-semibold">
            <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            Loading breaks...
          </div>
        ) : logs.length === 0 ? (
          <p className="text-center py-6 text-[11px] text-gray-400 font-semibold">No breaks recorded in this period.</p>
        ) : (
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-[11px] min-w-[640px]">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  {['Date', 'Break', 'Scheduled', 'Started', 'Ended', 'Allowed', 'Actual', 'Overtime', 'Status'].map((h) => (
                    <th key={h} className="px-1.5 py-2 font-extrabold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id} className="border-b border-gray-50 last:border-0">
                    <td className="px-1.5 py-2 font-semibold text-gray-700 whitespace-nowrap">{log.date}</td>
                    <td className="px-1.5 py-2 font-bold text-gray-900 whitespace-nowrap">
                      {log.label || (log.slot ? `Break ${log.slot}` : 'Break')}
                      {log.source === 'manual' && <span className="ml-1 text-[9px] font-bold text-gray-400">(manual)</span>}
                    </td>
                    <td className="px-1.5 py-2 text-gray-600 whitespace-nowrap">{log.scheduledTime ? formatHHmm12(log.scheduledTime) : '—'}</td>
                    <td className="px-1.5 py-2 text-gray-600 whitespace-nowrap">{formatTimeOfDay(log.startedAt)}</td>
                    <td className="px-1.5 py-2 text-gray-600 whitespace-nowrap">{formatTimeOfDay(log.endedAt)}</td>
                    <td className="px-1.5 py-2 text-gray-700 font-semibold whitespace-nowrap">{log.allowedMinutes ? `${log.allowedMinutes} min` : '—'}</td>
                    <td className="px-1.5 py-2 text-gray-700 font-mono whitespace-nowrap">{log.endedAt ? formatClock(log.actualSeconds) : '—'}</td>
                    <td className="px-1.5 py-2 whitespace-nowrap">
                      {!log.endedAt ? (
                        <span className="text-gray-400">—</span>
                      ) : log.overtimeSeconds > 0 ? (
                        <span className="font-mono font-black text-red-600">{formatOvertime(log.overtimeSeconds)}</span>
                      ) : (
                        <span className="font-bold text-emerald-600">On time</span>
                      )}
                    </td>
                    <td className="px-1.5 py-2 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border ${STATUS_STYLES[log.status] || STATUS_STYLES.cancelled}`}>
                        {STATUS_LABELS[log.status] || log.status}
                      </span>
                      {log.endedBy === 'system_cap' && <span className="ml-1 text-[9px] font-bold text-gray-400">auto-closed</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
