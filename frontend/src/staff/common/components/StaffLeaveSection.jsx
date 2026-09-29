import React, { useEffect, useRef, useState } from 'react';
import { CalendarDays, Plus, Send, X, Loader2, CalendarCheck, Hourglass, CheckCircle2, XCircle, Ban } from 'lucide-react';
import userService from '../../../common/services/userService';
import { useStaff } from '../context/StaffContext';

const LEAVE_TYPES = ['Casual', 'Sick', 'Earned', 'Unpaid', 'Emergency'];
const POLL_MS = 15000;

const STATUS_STYLES = {
  pending: { label: 'Pending', className: 'bg-amber-50 text-amber-700 border-amber-200', Icon: Hourglass },
  approved: { label: 'Approved', className: 'bg-emerald-50 text-emerald-700 border-emerald-200', Icon: CheckCircle2 },
  rejected: { label: 'Rejected', className: 'bg-rose-50 text-rose-700 border-rose-200', Icon: XCircle },
  cancelled: { label: 'Cancelled', className: 'bg-gray-100 text-gray-500 border-gray-200', Icon: Ban }
};

// Local calendar date as YYYY-MM-DD
const localDateStr = (date = new Date()) => date.toLocaleDateString('en-CA');

const countDays = (from, to, isHalfDay) => {
  if (!from || !to || to < from) return 0;
  const span = Math.round((new Date(`${to}T00:00:00Z`) - new Date(`${from}T00:00:00Z`)) / 86400000) + 1;
  return isHalfDay && span === 1 ? 0.5 : span;
};

const formatRange = (leave) => {
  const fmt = (d) => new Date(`${d}T00:00:00`).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
  return leave.fromDate === leave.toDate ? fmt(leave.fromDate) : `${fmt(leave.fromDate)} → ${fmt(leave.toDate)}`;
};

const emptyForm = () => ({
  leaveType: 'Casual',
  fromDate: localDateStr(),
  toDate: localDateStr(),
  isHalfDay: false,
  reason: ''
});

export default function StaffLeaveSection() {
  const { currentStaff, showToast } = useStaff();

  const [leaves, setLeaves] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [summary, setSummary] = useState({ pending: 0, approvedDaysThisYear: 0 });
  const [loadError, setLoadError] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);

  // Last seen status per request, to announce admin decisions once
  const knownStatusRef = useRef(null);

  const fetchLeaves = async () => {
    try {
      const res = await userService.getMyLeaves();
      if (!res?.success) return;

      if (knownStatusRef.current) {
        res.leaves.forEach((leave) => {
          const before = knownStatusRef.current.get(leave._id);
          if (before === 'pending' && leave.status === 'approved') {
            showToast(`✅ Your ${leave.leaveType} leave (${formatRange(leave)}) was approved`, 'success');
          } else if (before === 'pending' && leave.status === 'rejected') {
            showToast(`❌ Your ${leave.leaveType} leave (${formatRange(leave)}) was rejected`, 'error');
          }
        });
      }
      knownStatusRef.current = new Map(res.leaves.map((l) => [l._id, l.status]));

      setLeaves(res.leaves);
      setLeaveBalance(res.leaveBalance);
      setSummary(res.summary);
      setLoadError('');
    } catch (err) {
      setLoadError(err.response?.data?.message || 'Could not load your leave records.');
    }
  };

  useEffect(() => {
    if (!currentStaff) return;
    knownStatusRef.current = null;
    fetchLeaves();
    const poller = setInterval(fetchLeaves, POLL_MS);
    return () => clearInterval(poller);
  }, [currentStaff?.id, currentStaff?._id]);

  const requestedDays = countDays(form.fromDate, form.toDate, form.isHalfDay);
  const isSingleDay = form.fromDate && form.fromDate === form.toDate;
  const exceedsBalance = leaveBalance !== null && requestedDays > leaveBalance;

  const updateForm = (patch) => {
    setForm((prev) => {
      const next = { ...prev, ...patch };
      if (next.toDate < next.fromDate) next.toDate = next.fromDate;
      if (next.fromDate !== next.toDate) next.isHalfDay = false;
      return next;
    });
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.reason.trim()) {
      setFormError('Please enter a reason for your leave.');
      return;
    }
    setIsSubmitting(true);
    setFormError('');
    try {
      const res = await userService.applyLeave(form);
      if (res.success) {
        showToast('Leave request sent to admin for approval', 'success');
        setForm(emptyForm());
        setIsFormOpen(false);
        fetchLeaves();
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to submit leave request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async (leaveId) => {
    setCancellingId(leaveId);
    try {
      await userService.cancelLeave(leaveId);
      showToast('Leave request cancelled', 'info');
      fetchLeaves();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to cancel leave request', 'error');
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-xs space-y-3 text-xs">
      <div className="flex items-center justify-between border-b border-gray-100 pb-2">
        <h3 className="font-extrabold text-xs text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
          <CalendarDays className="w-3.5 h-3.5 text-amber-600" /> My Leave
        </h3>
        {!isFormOpen && (
          <button
            type="button"
            onClick={() => setIsFormOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-[11px] flex items-center gap-1 active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Apply for Leave
          </button>
        )}
      </div>

      {/* Balance chips */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-2 rounded-xl bg-amber-50 border border-amber-100">
          <p className="text-[9px] font-bold text-amber-600 uppercase">Available</p>
          <p className="font-black text-base text-amber-800">{leaveBalance ?? '—'}</p>
        </div>
        <div className="p-2 rounded-xl bg-gray-50 border border-gray-100">
          <p className="text-[9px] font-bold text-gray-500 uppercase">Pending</p>
          <p className="font-black text-base text-gray-800">{summary.pending}</p>
        </div>
        <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-100">
          <p className="text-[9px] font-bold text-emerald-600 uppercase">Taken (Year)</p>
          <p className="font-black text-base text-emerald-800">{summary.approvedDaysThisYear}</p>
        </div>
      </div>

      {loadError && <p className="text-[11px] font-bold text-rose-600">{loadError}</p>}

      {/* Apply form */}
      {isFormOpen && (
        <form onSubmit={handleSubmit} className="bg-amber-50/60 border border-amber-200 rounded-xl p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-black text-amber-900">New Leave Request</span>
            <button type="button" onClick={() => { setIsFormOpen(false); setFormError(''); }} className="p-1 rounded-md hover:bg-amber-100" aria-label="Close leave form">
              <X className="w-3.5 h-3.5 text-amber-800" />
            </button>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Leave Type</label>
            <select
              value={form.leaveType}
              onChange={(e) => updateForm({ leaveType: e.target.value })}
              className="w-full p-2 bg-white border border-gray-200 rounded-lg font-bold text-gray-800 focus:outline-none focus:border-amber-500"
            >
              {LEAVE_TYPES.map((t) => <option key={t} value={t}>{t} Leave</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">From</label>
              <input
                type="date"
                min={localDateStr()}
                value={form.fromDate}
                onChange={(e) => updateForm({ fromDate: e.target.value })}
                className="w-full p-2 bg-white border border-gray-200 rounded-lg font-bold text-gray-800 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">To</label>
              <input
                type="date"
                min={form.fromDate || localDateStr()}
                value={form.toDate}
                onChange={(e) => updateForm({ toDate: e.target.value })}
                className="w-full p-2 bg-white border border-gray-200 rounded-lg font-bold text-gray-800 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {isSingleDay && (
            <label className="flex items-center gap-2 font-bold text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isHalfDay}
                onChange={(e) => updateForm({ isHalfDay: e.target.checked })}
                className="accent-amber-500"
              />
              Half day only
            </label>
          )}

          <div>
            <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Reason</label>
            <textarea
              rows={2}
              maxLength={500}
              value={form.reason}
              onChange={(e) => updateForm({ reason: e.target.value })}
              placeholder="e.g. Family function, not feeling well"
              className="w-full p-2 bg-white border border-gray-200 rounded-lg font-semibold text-gray-800 focus:outline-none focus:border-amber-500 resize-none"
            />
          </div>

          <div className={`flex items-center justify-between p-2 rounded-lg font-bold ${exceedsBalance ? 'bg-rose-50 text-rose-700' : 'bg-white text-gray-700'}`}>
            <span>{requestedDays} day{requestedDays === 1 ? '' : 's'} requested</span>
            {exceedsBalance && <span>Exceeds balance of {leaveBalance}</span>}
          </div>

          {formError && <p className="text-[11px] font-bold text-rose-600">{formError}</p>}

          <button
            type="submit"
            disabled={isSubmitting || exceedsBalance || requestedDays === 0}
            className="w-full py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white font-black uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed active:scale-95 transition-all"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span>{isSubmitting ? 'Submitting...' : 'Submit to Admin'}</span>
          </button>
        </form>
      )}

      {/* History */}
      <div className="space-y-2">
        {leaves.length === 0 ? (
          <div className="text-center py-4 text-gray-400 font-semibold">
            <CalendarCheck className="w-6 h-6 mx-auto mb-1 text-gray-300" />
            No leave requests yet
          </div>
        ) : (
          leaves.map((leave) => {
            const style = STATUS_STYLES[leave.status] || STATUS_STYLES.pending;
            return (
              <div key={leave._id} className="p-2.5 rounded-xl border border-gray-100 bg-gray-50/70 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-extrabold text-gray-900">
                      {leave.leaveType} Leave · {leave.days} day{leave.days === 1 ? '' : 's'}{leave.isHalfDay ? ' (half)' : ''}
                    </p>
                    <p className="text-[11px] text-gray-500 font-semibold">{formatRange(leave)}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full border text-[10px] font-black uppercase flex items-center gap-1 flex-shrink-0 ${style.className}`}>
                    <style.Icon className="w-3 h-3" /> {style.label}
                  </span>
                </div>
                <p className="text-[11px] text-gray-600">{leave.reason}</p>
                {leave.adminNote && (
                  <p className="text-[11px] font-semibold text-gray-700 bg-white border border-gray-100 rounded-lg p-1.5">
                    Admin note: {leave.adminNote}
                  </p>
                )}
                {leave.status === 'pending' && (
                  <button
                    type="button"
                    disabled={cancellingId === leave._id}
                    onClick={() => handleCancel(leave._id)}
                    className="text-[11px] font-extrabold text-rose-600 hover:text-rose-700 disabled:opacity-60"
                  >
                    {cancellingId === leave._id ? 'Cancelling...' : 'Cancel request'}
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
