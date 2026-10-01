import React, { useEffect, useState } from 'react';
import { CalendarDays, ChevronDown, ChevronUp, CheckCircle2, XCircle, Hourglass, Ban, AlertTriangle, Loader2, Plane, Edit3, RotateCcw, Check, X } from 'lucide-react';
import userService from '../../../common/services/userService';
import { useAdmin } from '../context/AdminContext';

const POLL_MS = 10000;
const FILTERS = [
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'cancelled', label: 'Cancelled' },
  { id: 'all', label: 'All' }
];

const STATUS_STYLES = {
  pending: { label: 'Pending', className: 'bg-amber-50 text-amber-700 border-amber-200', Icon: Hourglass },
  approved: { label: 'Approved', className: 'bg-emerald-50 text-emerald-700 border-emerald-200', Icon: CheckCircle2 },
  rejected: { label: 'Rejected', className: 'bg-rose-50 text-rose-700 border-rose-200', Icon: XCircle },
  cancelled: { label: 'Cancelled', className: 'bg-gray-100 text-gray-500 border-gray-200', Icon: Ban }
};

const fmtDate = (d) => new Date(`${d}T00:00:00`).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
const formatRange = (leave) => (leave.fromDate === leave.toDate ? fmtDate(leave.fromDate) : `${fmtDate(leave.fromDate)} → ${fmtDate(leave.toDate)}`);

// Leave requests raised from the staff app, with approve/reject and edit decision capabilities.
export default function AdminLeaveRequestsPanel({ serviceKey }) {
  const { showToast } = useAdmin() || {};

  const [isExpanded, setIsExpanded] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [leaves, setLeaves] = useState([]);
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0, cancelled: 0 });
  const [onLeaveToday, setOnLeaveToday] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notes, setNotes] = useState({});
  const [actingId, setActingId] = useState(null);
  const [rowError, setRowError] = useState({});

  // Decision editing state for reviewed cards
  const [editingId, setEditingId] = useState(null);
  const [editDecision, setEditDecision] = useState('approved');
  const [editNote, setEditNote] = useState('');

  const fetchLeaves = async () => {
    try {
      const res = await userService.getLeaveRequests({ serviceKey: serviceKey || 'all', status: filter });
      if (res?.success) {
        setLeaves(res.leaves);
        setCounts(res.counts);
        setOnLeaveToday(res.onLeaveToday || []);
      }
    } catch (err) {
      console.warn('Could not fetch leave requests:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetchLeaves();
    const poller = setInterval(fetchLeaves, POLL_MS);
    return () => clearInterval(poller);
  }, [serviceKey, filter]);

  const handleReview = async (leave, decision, explicitNote = null) => {
    const note = explicitNote !== null ? explicitNote : (notes[leave._id] || '').trim();
    if (decision === 'rejected' && !note) {
      setRowError((prev) => ({ ...prev, [leave._id]: 'Add a note explaining the rejection reason.' }));
      return;
    }
    setActingId(leave._id);
    setRowError((prev) => ({ ...prev, [leave._id]: '' }));
    try {
      const res = await userService.reviewLeave(leave._id, decision, note);
      showToast?.(res.message || `Leave decision updated to ${decision}`, decision === 'approved' ? 'success' : 'info');
      setNotes((prev) => ({ ...prev, [leave._id]: '' }));
      setEditingId(null);
      fetchLeaves();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('tsl_staff_updated'));
      }
    } catch (err) {
      setRowError((prev) => ({ ...prev, [leave._id]: err.response?.data?.message || `Failed to update leave decision` }));
      fetchLeaves();
    } finally {
      setActingId(null);
    }
  };

  const startEditing = (leave) => {
    setEditingId(leave._id);
    setEditDecision(leave.status);
    setEditNote(leave.adminNote || '');
    setRowError((prev) => ({ ...prev, [leave._id]: '' }));
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditNote('');
  };

  const totalCount = counts.pending + counts.approved + counts.rejected + counts.cancelled;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm text-xs overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsExpanded((v) => !v)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50/70 transition-colors"
      >
        <div className="flex items-center gap-3 text-left">
          <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center">
            <CalendarDays className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
              Staff Leave Requests
              {counts.pending > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black animate-pulse">
                  {counts.pending} pending
                </span>
              )}
            </h3>
            <p className="text-xs text-gray-500">Requests raised from the staff app. Approving deducts leave balance and marks attendance.</p>
          </div>
        </div>
        {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>

      {isExpanded && (
        <div className="border-t border-gray-100 p-4 space-y-3">
          {/* On leave today */}
          {onLeaveToday.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl bg-sky-50 border border-sky-200">
              <span className="font-black text-sky-900 flex items-center gap-1">
                <Plane className="w-3.5 h-3.5" /> On leave today:
              </span>
              {onLeaveToday.map((l) => (
                <span key={l._id} className="px-2 py-0.5 rounded-full bg-white border border-sky-200 font-bold text-sky-800">
                  {l.staffName}{l.isHalfDay ? ' (half day)' : ''} · {l.leaveType}
                </span>
              ))}
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => {
              const count = f.id === 'all' ? totalCount : counts[f.id];
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    setFilter(f.id);
                    setEditingId(null);
                  }}
                  className={`px-3 py-1.5 rounded-lg font-bold border transition-all ${
                    filter === f.id ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {f.label} ({count || 0})
                </button>
              );
            })}
          </div>

          {/* List */}
          {isLoading ? (
            <div className="py-6 flex justify-center text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : leaves.length === 0 ? (
            <div className="py-6 text-center text-gray-400 font-semibold border border-dashed border-gray-200 rounded-xl">
              No {filter === 'all' ? '' : `${filter} `}leave requests
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {leaves.map((leave) => {
                const style = STATUS_STYLES[leave.status] || STATUS_STYLES.pending;
                const staff = leave.staff || {};
                const balance = staff.leaveBalance;
                const isCurrentlyApproved = leave.status === 'approved';
                const effectiveBalance = isCurrentlyApproved ? (balance ?? 0) + leave.days : (balance ?? 0);
                const exceedsBalanceOnApprove = leave.days > effectiveBalance;
                const photo = staff.photo || staff.profileImage;
                const isEditingThis = editingId === leave._id;

                return (
                  <div key={leave._id} className="p-3 rounded-xl border border-gray-200 bg-gray-50/50 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {photo ? (
                          <img src={photo} alt={leave.staffName} className="w-9 h-9 rounded-full object-cover border border-gray-200 flex-shrink-0" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 font-black flex items-center justify-center flex-shrink-0">
                            {(leave.staffName || '?').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-extrabold text-gray-900 truncate">{staff.fullName || leave.staffName}</p>
                          <p className="text-[11px] text-gray-500 truncate">
                            {staff.staffRole || leave.department || 'Staff'}{!serviceKey && leave.serviceKey ? ` · ${leave.serviceKey}` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-black uppercase flex items-center gap-1 ${style.className}`}>
                          <style.Icon className="w-3 h-3" /> {style.label}
                        </span>
                        {leave.status !== 'pending' && !isEditingThis && (
                          <button
                            type="button"
                            onClick={() => startEditing(leave)}
                            className="p-1 rounded-md bg-white border border-gray-200 text-gray-600 hover:text-amber-600 hover:border-amber-300 transition-colors shadow-2xs"
                            title="Change Admin Decision"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-1.5 rounded-lg bg-white border border-gray-100">
                        <p className="text-[9px] font-bold text-gray-400 uppercase">Type</p>
                        <p className="font-black text-gray-800">{leave.leaveType}</p>
                      </div>
                      <div className="p-1.5 rounded-lg bg-white border border-gray-100">
                        <p className="text-[9px] font-bold text-gray-400 uppercase">Days</p>
                        <p className="font-black text-gray-800">{leave.days}{leave.isHalfDay ? ' (half)' : ''}</p>
                      </div>
                      <div className={`p-1.5 rounded-lg border bg-white border-gray-100`}>
                        <p className="text-[9px] font-bold text-gray-400 uppercase">Balance</p>
                        <p className="font-black text-gray-800">{balance ?? '—'}</p>
                      </div>
                    </div>

                    <p className="font-bold text-gray-800">{formatRange(leave)}</p>
                    <p className="text-gray-600">{leave.reason}</p>
                    <p className="text-[10px] text-gray-400">
                      Applied {new Date(leave.createdAt).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      {leave.reviewedAt && ` · ${leave.status} by ${leave.reviewedByName || 'admin'} on ${new Date(leave.reviewedAt).toLocaleDateString()}`}
                    </p>

                    {leave.adminNote && leave.status !== 'pending' && !isEditingThis && (
                      <p className="text-[11px] font-semibold text-gray-700 bg-white border border-gray-100 rounded-lg p-1.5">Note: {leave.adminNote}</p>
                    )}

                    {/* Pending Decision Mode */}
                    {leave.status === 'pending' && !isEditingThis && (
                      <div className="space-y-2 pt-1">
                        <input
                          type="text"
                          value={notes[leave._id] || ''}
                          onChange={(e) => setNotes((prev) => ({ ...prev, [leave._id]: e.target.value }))}
                          placeholder="Note to staff (required to reject)"
                          maxLength={500}
                          className="w-full p-2 bg-white border border-gray-200 rounded-lg font-semibold text-gray-800 focus:outline-none focus:border-amber-500"
                        />
                        {rowError[leave._id] && <p className="text-[11px] font-bold text-rose-600">{rowError[leave._id]}</p>}
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            disabled={actingId === leave._id}
                            onClick={() => handleReview(leave, 'rejected')}
                            className="py-2 rounded-lg bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 font-black flex items-center justify-center gap-1 disabled:opacity-60 cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Reject
                          </button>
                          <button
                            type="button"
                            disabled={actingId === leave._id || exceedsBalanceOnApprove}
                            onClick={() => handleReview(leave, 'approved')}
                            className="py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black flex items-center justify-center gap-1 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                          >
                            {actingId === leave._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />} Approve
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Change Decision / Edit Mode */}
                    {isEditingThis && (
                      <div className="p-3 bg-white border border-amber-200 rounded-xl space-y-2.5 shadow-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-black uppercase tracking-wider text-amber-800 flex items-center gap-1">
                            <Edit3 className="w-3.5 h-3.5" /> Change Decision
                          </span>
                          <button
                            type="button"
                            onClick={cancelEditing}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Decision Selector Pills */}
                        <div className="grid grid-cols-3 gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditDecision('approved')}
                            className={`py-1.5 px-2 rounded-lg font-extrabold border text-center transition-all ${
                              editDecision === 'approved'
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-emerald-50 hover:text-emerald-700'
                            }`}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditDecision('rejected')}
                            className={`py-1.5 px-2 rounded-lg font-extrabold border text-center transition-all ${
                              editDecision === 'rejected'
                                ? 'bg-rose-600 text-white border-rose-600'
                                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-rose-50 hover:text-rose-700'
                            }`}
                          >
                            Reject
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditDecision('pending')}
                            className={`py-1.5 px-2 rounded-lg font-extrabold border text-center transition-all ${
                              editDecision === 'pending'
                                ? 'bg-amber-500 text-white border-amber-500'
                                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-amber-50 hover:text-amber-700'
                            }`}
                          >
                            Reopen
                          </button>
                        </div>

                        {/* Note field */}
                        <div>
                          <input
                            type="text"
                            value={editNote}
                            onChange={(e) => setEditNote(e.target.value)}
                            placeholder={editDecision === 'rejected' ? 'Note to staff (required to reject)' : 'Admin note / remarks (optional)'}
                            maxLength={500}
                            className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg font-semibold text-gray-800 text-xs focus:outline-none focus:bg-white focus:border-amber-500"
                          />
                        </div>

                        {rowError[leave._id] && <p className="text-[11px] font-bold text-rose-600">{rowError[leave._id]}</p>}

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={cancelEditing}
                            className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 font-bold"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={actingId === leave._id || (editDecision === 'approved' && exceedsBalanceOnApprove)}
                            onClick={() => handleReview(leave, editDecision, editNote)}
                            className="px-3 py-1.5 rounded-lg bg-gray-900 hover:bg-black text-white font-extrabold flex items-center gap-1 disabled:opacity-60"
                          >
                            {actingId === leave._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Save Decision
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
