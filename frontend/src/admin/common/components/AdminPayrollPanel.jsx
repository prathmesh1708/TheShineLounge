import React, { useEffect, useState } from 'react';
import { Wallet, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import userService from '../../../common/services/userService';
import { formatRupees, formatPayMonth, recentPayMonths } from '../../../common/utils/salaryFormat';
import AdminStaffSalaryModal from './AdminStaffSalaryModal';

const POLL_MS = 30000;

// Month payroll for a service's staff: base, deductions, remaining and paid status.
// Omit serviceKey to cover every department (global Manage Staff page).
export default function AdminPayrollPanel({ serviceKey }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [month, setMonth] = useState(null);
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [selected, setSelected] = useState(null);

  const load = async (targetMonth = month) => {
    try {
      const res = await userService.getSalaryOverview({ serviceKey: serviceKey || 'all', ...(targetMonth ? { month: targetMonth } : {}) });
      if (res?.success) {
        setData(res);
        setLoadError('');
      }
    } catch (err) {
      setLoadError(err.response?.data?.message || 'Could not load payroll.');
    }
  };

  // Totals in the header are useful even while collapsed, so load once up front
  useEffect(() => {
    load(month);
    if (!isExpanded) return;
    const poller = setInterval(() => load(month), POLL_MS);
    return () => clearInterval(poller);
  }, [serviceKey, month, isExpanded]);

  const rows = data?.rows || [];
  const totals = data?.totals;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm text-xs overflow-hidden">
      <button
        type="button"
        onClick={() => setIsExpanded((v) => !v)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50/70 transition-colors"
      >
        <div className="flex items-center gap-3 text-left">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-base font-black text-gray-900">
              Staff Salary & Deductions{data ? ` · ${formatPayMonth(data.month)}` : ''}
            </h3>
            <p className="text-xs text-gray-500">
              {totals
                ? `${formatRupees(totals.baseSalary)} payroll − ${formatRupees(totals.totalDeductions)} deductions = ${formatRupees(totals.netPayable)} payable · ${totals.paidCount}/${rows.length} paid`
                : 'Deduct salary with a reason; staff see the remaining amount in their app.'}
            </p>
          </div>
        </div>
        {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>

      {isExpanded && (
        <div className="border-t border-gray-100 p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <select
              value={data?.month || ''}
              onChange={(e) => setMonth(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-xl font-bold text-gray-800 focus:outline-none focus:border-emerald-500"
              aria-label="Pay month"
            >
              {recentPayMonths(data?.currentMonth, 12).map((m) => <option key={m} value={m}>{formatPayMonth(m)}</option>)}
            </select>
          </div>

          {loadError && <p className="font-bold text-rose-600">{loadError}</p>}

          {!data && !loadError ? (
            <div className="py-6 flex justify-center text-gray-400"><Loader2 className="w-5 h-5 animate-spin" /></div>
          ) : rows.length === 0 ? (
            <p className="py-6 text-center text-gray-400 font-semibold border border-dashed border-gray-200 rounded-xl">No staff in this department</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-left min-w-[560px]">
                <thead className="bg-gray-50 text-[10px] uppercase text-gray-500 font-black">
                  <tr>
                    <th className="px-3 py-2">Staff</th>
                    <th className="px-3 py-2 text-right">Base</th>
                    <th className="px-3 py-2 text-right">Deductions</th>
                    <th className="px-3 py-2 text-right">Remaining</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map((r) => (
                    <tr key={r.staffId} className="hover:bg-gray-50/60">
                      <td className="px-3 py-2">
                        <p className="font-extrabold text-gray-900">{r.fullName}</p>
                        <p className="text-[10px] text-gray-500">{r.staffRole}{!serviceKey && r.serviceKey ? ` · ${r.serviceKey}` : ''}</p>
                      </td>
                      <td className="px-3 py-2 text-right font-bold text-gray-800">
                        {r.baseSalary > 0 ? formatRupees(r.baseSalary) : <span className="text-amber-600">Not set</span>}
                      </td>
                      <td className="px-3 py-2 text-right font-bold text-rose-700">{r.totalDeductions > 0 ? `− ${formatRupees(r.totalDeductions)}` : '—'}</td>
                      <td className="px-3 py-2 text-right font-black text-emerald-800">{formatRupees(r.netPayable)}</td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-black uppercase ${r.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                          {r.status === 'paid' ? 'Paid' : 'Open'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => setSelected(r)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <AdminStaffSalaryModal
        isOpen={Boolean(selected)}
        onClose={() => setSelected(null)}
        staffId={selected?.staffId}
        staffName={selected?.fullName}
        onChanged={() => load(month)}
      />
    </div>
  );
}
