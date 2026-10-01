import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Save } from 'lucide-react';
import AdminModal from './AdminModal';
import BreakScheduleFields from './BreakScheduleFields';
import BreakHistoryPanel from './BreakHistoryPanel';
import BreakStatusBadge from './BreakStatusBadge';
import userService from '../../../common/services/userService';
import { breakScheduleProblem, scheduleFromStaff } from '../utils/breakSchedule';
import { formatTimeOfDay } from '../utils/formatDuration';

// One staff member's breaks for the department hubs: live status, the daily
// schedule (editable) and the overtime history.
export default function StaffBreaksModal({ isOpen, onClose, staff, onSaved }) {
  const staffId = staff?._id || staff?.id;
  const [live, setLive] = useState(null);
  const [schedule, setSchedule] = useState(() => scheduleFromStaff(staff));
  const [saving, setSaving] = useState(false);
  const [acting, setActing] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [historyKey, setHistoryKey] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    setSchedule(scheduleFromStaff(staff));
    setMessage({ type: '', text: '' });
    setLive(null);
    // Only reset when a different staff member is opened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, staffId]);

  useEffect(() => {
    if (!isOpen || !staffId) return undefined;
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await userService.getStaffBreakStatus(staffId);
        if (!cancelled && res?.success) setLive(res);
      } catch { /* the badge just keeps its last state */ }
    };
    poll();
    const id = setInterval(poll, 5000);
    return () => { cancelled = true; clearInterval(id); };
  }, [isOpen, staffId]);

  const problem = breakScheduleProblem(schedule);

  const handleSave = async () => {
    if (problem) return;
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await userService.updateStaffBreakSchedule(staffId, schedule);
      setMessage({ type: 'ok', text: res.message || 'Break schedule saved' });
      onSaved?.(res.staff);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to save break schedule' });
    } finally {
      setSaving(false);
    }
  };

  const runAction = async (action) => {
    setActing(true);
    setMessage({ type: '', text: '' });
    try {
      await userService.updateStaffBreak(staffId, { action });
      const res = await userService.getStaffBreakStatus(staffId);
      if (res?.success) setLive(res);
      setHistoryKey((k) => k + 1);
      onSaved?.(res?.staff);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Break action failed' });
    } finally {
      setActing(false);
    }
  };

  const badgeStaff = live
    ? {
        ...live.staff,
        breakStatus: live.breakStatus,
        isOnBreak: live.isOnBreak,
        breakEndTime: live.breakEndTime,
        breakDuration: live.breakDuration,
        todayBreakSummary: staff?.todayBreakSummary
      }
    : staff;

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title="Staff Breaks"
      subtitle={staff?.fullName ? `${staff.fullName} · schedule, live status & overtime` : ''}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-4 text-xs">
        {message.text && (
          <div className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-bold border ${
            message.type === 'ok' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-600'
          }`}>
            {message.type === 'ok' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
            <span>{message.text}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl border border-gray-200 bg-gray-50/60">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-wider text-gray-500">Right now</p>
            {badgeStaff && (badgeStaff.isOnBreak || badgeStaff.breakStatus === 'active' || badgeStaff.breakStatus === 'pending')
              ? <BreakStatusBadge staff={badgeStaff} />
              : <p className="font-bold text-gray-700">Working — no break in progress</p>}
            {live?.breakStatus === 'active' && (
              <p className="text-[10px] text-gray-500 font-semibold">
                {live.label || live.breakReason} · started {formatTimeOfDay(live.breakStartTime)} · due back {formatTimeOfDay(live.breakEndTime)}
              </p>
            )}
          </div>
          {live?.breakStatus === 'active' && (
            <button type="button" disabled={acting} onClick={() => runAction('end')}
              className="px-3 py-2 rounded-xl text-xs font-black text-white bg-gray-900 hover:bg-gray-800 disabled:opacity-60">
              {acting ? 'Ending...' : 'End break now'}
            </button>
          )}
          {live?.breakStatus === 'pending' && (
            <button type="button" disabled={acting} onClick={() => runAction('cancel')}
              className="px-3 py-2 rounded-xl text-xs font-black text-red-700 bg-white border border-red-200 hover:bg-red-50 disabled:opacity-60">
              {acting ? 'Cancelling...' : 'Cancel pending break'}
            </button>
          )}
        </div>

        <div className="p-3 rounded-2xl border border-gray-200 space-y-3">
          <BreakScheduleFields value={schedule} onChange={setSchedule} />
          <div className="flex justify-end">
            <button type="button" disabled={saving || !!problem} onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 font-bold text-white rounded-xl disabled:opacity-60" style={{ backgroundColor: '#e07b2a' }}>
              <Save className="w-3.5 h-3.5" />
              {saving ? 'Saving...' : 'Save schedule'}
            </button>
          </div>
        </div>

        {staffId && <BreakHistoryPanel staffId={staffId} refreshKey={historyKey} />}
      </div>
    </AdminModal>
  );
}
