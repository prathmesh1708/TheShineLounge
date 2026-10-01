import React, { useEffect, useState } from 'react';
import { AlertCircle, Lock, MinusCircle, Undo2, CheckCircle2, History, Loader2, IndianRupee } from 'lucide-react';
import AdminModal from './AdminModal';
import userService from '../../../common/services/userService';
import { useAdmin } from '../context/AdminContext';
import { formatRupees, formatPayMonth, recentPayMonths } from '../../../common/utils/salaryFormat';

const emptyDeduction = { amount: '', category: 'Late Arrival', reason: '' };

// Salary management for one staff member. Every action is a MongoDB write via
// /api/salary, and the modal re-reads the month from the server afterwards.
export default function AdminStaffSalaryModal({ isOpen, onClose, staffId, staffName, onChanged }) {
  const { showToast } = useAdmin() || {};

  const [month, setMonth] = useState(null);
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState('');
  const [actionError, setActionError] = useState('');

  const [deduction, setDeduction] = useState(emptyDeduction);
  const [reversingId, setReversingId] = useState(null);
  const [reversalReason, setReversalReason] = useState('');
  const [payment, setPayment] = useState({ paymentMode: 'Bank Transfer', note: '', confirming: false });
  const [baseForm, setBaseForm] = useState({ monthlySalary: '', reason: '' });

  const load = async (targetMonth = month) => {
    if (!staffId) return;
    try {
      const res = await userService.getStaffSalary(staffId, targetMonth);
      if (res?.success) {
        setData(res);
        setLoadError('');
      }
    } catch (err) {
      setLoadError(err.response?.data?.message || 'Could not load salary details.');
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    setMonth(null);
    setData(null);
    setActionError('');
    setDeduction(emptyDeduction);
    setReversingId(null);
    setPayment({ paymentMode: 'Bank Transfer', note: '', confirming: false });
    setBaseForm({ monthlySalary: '', reason: '' });
    load(null);
  }, [isOpen, staffId]);

  const changeMonth = (m) => {
    setMonth(m);
    setActionError('');
    setReversingId(null);
    setPayment((p) => ({ ...p, confirming: false }));
    load(m);
  };

  const runAction = async (key, action, successFallback) => {
    setBusy(key);
    setActionError('');
    try {
      const res = await action();
      showToast?.(res.message || successFallback, 'success');
      await load(data?.month);
      onChanged?.();
      return true;
    } catch (err) {
      setActionError(err.response?.data?.message || 'Something went wrong. Please try again.');
      await load(data?.month);
      return false;
    } finally {
      setBusy('');
    }
  };

  const statement = data?.statement;
  const isPaid = statement?.status === 'paid';
  const hasBase = (statement?.baseSalary || 0) > 0;
  const deductionAmount = Number(deduction.amount);
  const exceedsRemaining = statement && deductionAmount > statement.netPayable;

  const submitDeduction = async (e) => {
    e.preventDefault();
    if (!Number.isInteger(deductionAmount) || deductionAmount <= 0) {
      setActionError('Enter the deduction as a whole rupee amount.');
      return;
    }
    if (!deduction.reason.trim()) {
      setActionError('Please give a reason for the deduction.');
      return;
    }
    const ok = await runAction(
      'deduct',
      () => userService.addSalaryDeduction(staffId, { month: data.month, amount: deductionAmount, category: deduction.category, reason: deduction.reason.trim() }),
      'Deduction added'
    );
    if (ok) setDeduction(emptyDeduction);
  };

  const submitReversal = async (deductionId) => {
    if (!reversalReason.trim()) {
      setActionError('Please give a reason for reversing the deduction.');
      return;
    }
    const ok = await runAction('reverse', () => userService.reverseSalaryDeduction(deductionId, reversalReason.trim()), 'Deduction reversed');
    if (ok) {
      setReversingId(null);
      setReversalReason('');
    }
  };

  const submitPayment = async () => {
    const ok = await runAction(
      'pay',
      () => userService.markSalaryPaid(staffId, data.month, { paymentMode: payment.paymentMode, note: payment.note.trim() }),
      'Salary marked paid'
    );
    if (ok) setPayment({ paymentMode: 'Bank Transfer', note: '', confirming: false });
  };

  const submitBase = async (e) => {
    e.preventDefault();
    const amount = Number(baseForm.monthlySalary);
    if (!Number.isInteger(amount) || amount < 0 || baseForm.monthlySalary === '') {
      setActionError('Enter the monthly salary as a whole rupee amount.');
      return;
    }
    const ok = await runAction(
      'base',
      () => userService.changeBaseSalary(staffId, { monthlySalary: amount, reason: baseForm.reason.trim() }),
      'Monthly salary updated'
    );
    if (ok) setBaseForm({ monthlySalary: '', reason: '' });
  };

  const inputClass = 'w-full p-2.5 bg-white border border-gray-200 rounded-xl font-semibold text-gray-800 focus:outline-none focus:border-amber-500';

  return (
    <AdminModal isOpen={isOpen} onClose={onClose} title="Salary & Deductions" subtitle={staffName ? `Managing: ${staffName}` : undefined} maxWidth="max-w-2xl">
      <div className="space-y-4 text-xs">
        {loadError && (
          <div className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded-xl font-bold text-red-600">
            <AlertCircle className="w-3.5 h-3.5" /> <span>{loadError}</span>
          </div>
        )}

        {!data && !loadError && (
          <div className="py-8 flex justify-center text-gray-400"><Loader2 className="w-5 h-5 animate-spin" /></div>
        )}

        {data && statement && (
          <>
            {/* Month + status */}
            <div className="flex items-center justify-between gap-2">
              <select
                value={data.month}
                onChange={(e) => changeMonth(e.target.value)}
                className="px-3 py-2 bg-white border border-gray-200 rounded-xl font-bold text-gray-800 focus:outline-none focus:border-amber-500"
                aria-label="Pay month"
              >
                {recentPayMonths(data.currentMonth, 12).map((m) => <option key={m} value={m}>{formatPayMonth(m)}</option>)}
              </select>
              <span className={`px-2.5 py-1 rounded-full border text-[10px] font-black uppercase flex items-center gap-1 ${isPaid ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                {isPaid ? <Lock className="w-3 h-3" /> : null}
                {isPaid ? 'Paid · Locked' : 'Open'}
              </span>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                <p className="text-[9px] font-bold text-gray-500 uppercase">Base Salary</p>
                <p className="font-black text-base text-gray-900">{formatRupees(statement.baseSalary)}</p>
              </div>
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-100">
                <p className="text-[9px] font-bold text-rose-500 uppercase">Deductions</p>
                <p className="font-black text-base text-rose-700">− {formatRupees(statement.totalDeductions)}</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                <p className="text-[9px] font-bold text-emerald-600 uppercase">{isPaid ? 'Paid' : 'Remaining'}</p>
                <p className="font-black text-base text-emerald-800">{formatRupees(statement.netPayable)}</p>
              </div>
            </div>

            {isPaid && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 font-semibold text-emerald-900">
                Paid on {new Date(statement.paidAt).toLocaleString()} via {statement.paymentMode} by {statement.paidByName}
                {statement.paymentNote ? ` · ${statement.paymentNote}` : ''}. This month can no longer be changed.
              </div>
            )}

            {!hasBase && (
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 font-bold text-amber-900">
                No monthly salary is set for {staffName || 'this staff member'}. Set it below before adding deductions.
              </div>
            )}

            {actionError && (
              <div className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded-xl font-bold text-red-600">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> <span>{actionError}</span>
              </div>
            )}

            {/* Deduct */}
            {!isPaid && hasBase && (
              <form onSubmit={submitDeduction} className="p-3 rounded-xl border border-rose-200 bg-rose-50/40 space-y-2.5">
                <h4 className="font-black text-rose-900 flex items-center gap-1.5"><MinusCircle className="w-4 h-4" /> Deduct Salary</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Amount (₹)</label>
                    <input type="number" min="1" step="1" value={deduction.amount} onChange={(e) => setDeduction({ ...deduction, amount: e.target.value })} placeholder="e.g. 500" className={inputClass} />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Category</label>
                    <select value={deduction.category} onChange={(e) => setDeduction({ ...deduction, category: e.target.value })} className={inputClass}>
                      {(data.categories || []).map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Reason (visible to staff)</label>
                  <input type="text" maxLength={500} value={deduction.reason} onChange={(e) => setDeduction({ ...deduction, reason: e.target.value })} placeholder="e.g. Late by 45 minutes on 12 Sep" className={inputClass} />
                </div>
                {deductionAmount > 0 && (
                  <p className={`font-bold ${exceedsRemaining ? 'text-rose-700' : 'text-gray-600'}`}>
                    {exceedsRemaining
                      ? `Exceeds the remaining ${formatRupees(statement.netPayable)}.`
                      : `Remaining after deduction: ${formatRupees(statement.netPayable - deductionAmount)}`}
                  </p>
                )}
                <button type="submit" disabled={busy === 'deduct' || exceedsRemaining} className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
                  {busy === 'deduct' ? <Loader2 className="w-4 h-4 animate-spin" /> : <MinusCircle className="w-4 h-4" />}
                  {busy === 'deduct' ? 'Saving…' : 'Deduct & Notify Staff'}
                </button>
              </form>
            )}

            {/* Deduction list */}
            <div className="space-y-2">
              <h4 className="font-black text-gray-900">Deductions in {formatPayMonth(data.month)} ({data.deductions.length})</h4>
              {data.deductions.length === 0 ? (
                <p className="py-3 text-center text-gray-400 font-semibold border border-dashed border-gray-200 rounded-xl">No deductions this month</p>
              ) : (
                data.deductions.map((d) => {
                  const reversed = d.status === 'reversed';
                  return (
                    <div key={d._id} className={`p-2.5 rounded-xl border space-y-1.5 ${reversed ? 'bg-gray-50 border-gray-100' : 'bg-white border-gray-200'}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className={`font-extrabold ${reversed ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{d.category}</p>
                          <p className="text-[10px] text-gray-400">
                            {new Date(d.createdAt).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} · by {d.createdByName}
                          </p>
                        </div>
                        <span className={`font-black ${reversed ? 'text-gray-400 line-through' : 'text-rose-700'}`}>− {formatRupees(d.amount)}</span>
                      </div>
                      <p className={reversed ? 'text-gray-400' : 'text-gray-700'}>{d.reason}</p>
                      {reversed && (
                        <p className="font-semibold text-emerald-700 flex items-center gap-1">
                          <Undo2 className="w-3 h-3" /> Reversed by {d.reversedByName}: {d.reversalReason}
                        </p>
                      )}
                      {!reversed && !isPaid && (
                        reversingId === d._id ? (
                          <div className="flex gap-2">
                            <input type="text" autoFocus maxLength={500} value={reversalReason} onChange={(e) => setReversalReason(e.target.value)} placeholder="Why is this being reversed?" className={`${inputClass} flex-1`} />
                            <button type="button" disabled={busy === 'reverse'} onClick={() => submitReversal(d._id)} className="px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black disabled:opacity-60">
                              {busy === 'reverse' ? 'Saving…' : 'Confirm'}
                            </button>
                            <button type="button" onClick={() => { setReversingId(null); setReversalReason(''); }} className="px-3 rounded-xl border border-gray-200 font-bold text-gray-600">Cancel</button>
                          </div>
                        ) : (
                          <button type="button" onClick={() => { setReversingId(d._id); setReversalReason(''); }} className="font-extrabold text-emerald-700 hover:text-emerald-800 flex items-center gap-1">
                            <Undo2 className="w-3 h-3" /> Reverse this deduction
                          </button>
                        )
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Mark as paid */}
            {!isPaid && hasBase && (
              <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-2.5">
                <h4 className="font-black text-emerald-900 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> Mark {formatPayMonth(data.month)} as Paid</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select value={payment.paymentMode} onChange={(e) => setPayment({ ...payment, paymentMode: e.target.value, confirming: false })} className={inputClass} aria-label="Payment mode">
                    {(data.paymentModes || []).map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <input type="text" maxLength={500} value={payment.note} onChange={(e) => setPayment({ ...payment, note: e.target.value })} placeholder="Reference / note (optional)" className={inputClass} />
                </div>
                {payment.confirming ? (
                  <div className="space-y-2">
                    <p className="font-bold text-emerald-900">
                      Pay {formatRupees(statement.netPayable)} via {payment.paymentMode}? The month will be locked and no further deductions can be made.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => setPayment({ ...payment, confirming: false })} className="py-2.5 rounded-xl border border-gray-200 bg-white font-bold text-gray-700">Go Back</button>
                      <button type="button" disabled={busy === 'pay'} onClick={submitPayment} className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black disabled:opacity-60">
                        {busy === 'pay' ? 'Saving…' : 'Confirm Payment'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button type="button" onClick={() => setPayment({ ...payment, confirming: true })} className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-wider">
                    Mark as Paid ({formatRupees(statement.netPayable)})
                  </button>
                )}
              </div>
            )}

            {/* Base salary */}
            <form onSubmit={submitBase} className="p-3 rounded-xl border border-gray-200 space-y-2.5">
              <h4 className="font-black text-gray-900 flex items-center gap-1.5">
                <IndianRupee className="w-4 h-4 text-amber-600" /> Monthly Salary: {formatRupees(data.monthlySalary)}
              </h4>
              <p className="text-[11px] text-gray-500">A change applies from {formatPayMonth(data.currentMonth)} onwards. Paid months keep the amount they were paid at.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input type="number" min="0" step="1" value={baseForm.monthlySalary} onChange={(e) => setBaseForm({ ...baseForm, monthlySalary: e.target.value })} placeholder="New monthly salary (₹)" className={inputClass} />
                <input type="text" maxLength={500} value={baseForm.reason} onChange={(e) => setBaseForm({ ...baseForm, reason: e.target.value })} placeholder="Reason (e.g. Annual appraisal)" className={inputClass} />
              </div>
              <button type="submit" disabled={busy === 'base' || baseForm.monthlySalary === ''} className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black uppercase tracking-wider disabled:opacity-60 disabled:cursor-not-allowed">
                {busy === 'base' ? 'Saving…' : 'Update Monthly Salary'}
              </button>

              {data.revisions?.length > 0 && (
                <div className="space-y-1 pt-1">
                  <p className="font-bold text-gray-600 flex items-center gap-1"><History className="w-3.5 h-3.5" /> Salary History</p>
                  {data.revisions.map((r) => (
                    <div key={r._id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-100">
                      <span className="text-gray-700">
                        {formatRupees(r.previousSalary)} → <b>{formatRupees(r.newSalary)}</b>
                        {r.reason ? ` · ${r.reason}` : ''}
                      </span>
                      <span className="text-[10px] text-gray-400 text-right">
                        from {formatPayMonth(r.effectiveFrom)}<br />{r.changedByName}, {new Date(r.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </form>
          </>
        )}
      </div>
    </AdminModal>
  );
}
