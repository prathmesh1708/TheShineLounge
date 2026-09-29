import React, { useEffect, useRef, useState } from 'react';
import { Wallet, CheckCircle2, Clock, Undo2, ReceiptText } from 'lucide-react';
import userService from '../../../common/services/userService';
import { formatRupees, formatPayMonth, recentPayMonths } from '../../../common/utils/salaryFormat';
import { useStaff } from '../context/StaffContext';

const POLL_MS = 30000;

// Read-only salary view for the logged-in staff member. Every figure is loaded
// from MongoDB via /api/salary/me on each visit and poll; nothing is cached.
export default function StaffSalarySection() {
  const { currentStaff, showToast } = useStaff();

  const [month, setMonth] = useState(null); // null = let the server pick the current pay month
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState('');

  // Active deduction ids already seen, to announce new ones once
  const seenDeductionsRef = useRef(null);

  const fetchSalary = async (targetMonth = month) => {
    try {
      const res = await userService.getMySalary(targetMonth);
      if (!res?.success) return;

      const activeIds = res.deductions.filter((d) => d.status === 'active').map((d) => d._id);
      if (seenDeductionsRef.current && res.month === res.currentMonth) {
        res.deductions
          .filter((d) => d.status === 'active' && !seenDeductionsRef.current.has(d._id))
          .forEach((d) => showToast(`💸 ${formatRupees(d.amount)} deducted from your salary: ${d.reason}`, 'error'));
      }
      if (res.month === res.currentMonth) seenDeductionsRef.current = new Set(activeIds);

      setData(res);
      setLoadError('');
    } catch (err) {
      setLoadError(err.response?.data?.message || 'Could not load your salary details.');
    }
  };

  useEffect(() => {
    if (!currentStaff) return;
    fetchSalary(month);
    const poller = setInterval(() => fetchSalary(month), POLL_MS);
    return () => clearInterval(poller);
  }, [currentStaff?.id, currentStaff?._id, month]);

  const statement = data?.statement;
  const isPaid = statement?.status === 'paid';
  const months = recentPayMonths(data?.currentMonth, 12);

  return (
    <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-xs space-y-3 text-xs">
      <div className="flex items-center justify-between border-b border-gray-100 pb-2 gap-2">
        <h3 className="font-extrabold text-xs text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
          <Wallet className="w-3.5 h-3.5 text-emerald-600" /> My Salary
        </h3>
        {months.length > 0 && (
          <select
            value={data?.month || ''}
            onChange={(e) => setMonth(e.target.value)}
            className="px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg font-bold text-gray-700 text-[11px] focus:outline-none focus:border-emerald-500"
            aria-label="Salary month"
          >
            {months.map((m) => <option key={m} value={m}>{formatPayMonth(m)}</option>)}
          </select>
        )}
      </div>

      {loadError && <p className="text-[11px] font-bold text-rose-600">{loadError}</p>}

      {!data && !loadError && <p className="text-center py-4 text-gray-400 font-semibold">Loading salary…</p>}

      {statement && (
        <>
          {statement.baseSalary <= 0 ? (
            <div className="text-center py-4 text-gray-500 font-semibold bg-gray-50 rounded-xl border border-dashed border-gray-200">
              Your monthly salary hasn't been set yet. Please contact your admin.
            </div>
          ) : (
            <>
              {/* Net payable */}
              <div className="rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 p-4 text-white text-center relative">
                <span className={`absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase flex items-center gap-1 ${isPaid ? 'bg-white text-emerald-700' : 'bg-black/20 text-white'}`}>
                  {isPaid ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                  {isPaid ? 'Paid' : 'Pending'}
                </span>
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-100">
                  {isPaid ? 'Paid' : 'Remaining'} for {formatPayMonth(data.month)}
                </p>
                <p className="text-3xl font-black tracking-tight mt-0.5">{formatRupees(statement.netPayable)}</p>
                {isPaid && statement.paidAt && (
                  <p className="text-[10px] text-emerald-100 font-semibold mt-1">
                    Paid on {new Date(statement.paidAt).toLocaleDateString()} via {statement.paymentMode}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-2 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="text-[9px] font-bold text-gray-500 uppercase">Monthly Salary</p>
                  <p className="font-black text-sm text-gray-900">{formatRupees(statement.baseSalary)}</p>
                </div>
                <div className="p-2 rounded-xl bg-rose-50 border border-rose-100">
                  <p className="text-[9px] font-bold text-rose-500 uppercase">Deductions</p>
                  <p className="font-black text-sm text-rose-700">− {formatRupees(statement.totalDeductions)}</p>
                </div>
              </div>
            </>
          )}

          {/* Deductions for the month */}
          <div className="space-y-2">
            <h4 className="font-extrabold text-[11px] text-gray-700 uppercase flex items-center gap-1">
              <ReceiptText className="w-3.5 h-3.5 text-gray-400" /> Deduction Details
            </h4>
            {data.deductions.length === 0 ? (
              <p className="text-center py-3 text-gray-400 font-semibold">No deductions this month</p>
            ) : (
              data.deductions.map((d) => {
                const reversed = d.status === 'reversed';
                return (
                  <div key={d._id} className={`p-2.5 rounded-xl border space-y-1 ${reversed ? 'bg-gray-50 border-gray-100' : 'bg-rose-50/50 border-rose-100'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className={`font-extrabold ${reversed ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{d.category}</p>
                        <p className="text-[10px] text-gray-400">{new Date(d.createdAt).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      </div>
                      <span className={`font-black ${reversed ? 'text-gray-400 line-through' : 'text-rose-700'}`}>− {formatRupees(d.amount)}</span>
                    </div>
                    <p className={`text-[11px] ${reversed ? 'text-gray-400' : 'text-gray-700'}`}>{d.reason}</p>
                    {reversed && (
                      <p className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                        <Undo2 className="w-3 h-3" /> Reversed: {d.reversalReason}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Recent months */}
          {data.recentStatements.length > 0 && (
            <div className="space-y-1.5">
              <h4 className="font-extrabold text-[11px] text-gray-700 uppercase">Recent Months</h4>
              {data.recentStatements.map((s) => (
                <button
                  type="button"
                  key={s._id}
                  onClick={() => setMonth(s.payMonth)}
                  className="w-full flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-100 hover:bg-gray-100 text-left"
                >
                  <span className="font-bold text-gray-800">{formatPayMonth(s.payMonth)}</span>
                  <span className="flex items-center gap-2">
                    {s.totalDeductions > 0 && <span className="text-rose-600 font-bold">− {formatRupees(s.totalDeductions)}</span>}
                    <span className="font-black text-gray-900">{formatRupees(s.netPayable)}</span>
                    <span className={`text-[9px] font-black uppercase ${s.status === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {s.status === 'paid' ? 'Paid' : 'Pending'}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
