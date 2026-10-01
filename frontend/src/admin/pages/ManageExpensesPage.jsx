import React, { useEffect, useMemo, useState } from 'react';
import {
  Wallet, Plus, Search, Trash2, Edit2, X, Loader2,
  TrendingDown, CalendarDays, Receipt
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';
import {
  EXPENSE_RANGES,
  getExpenses,
  getExpenseSummary,
  createExpense,
  updateExpense,
  deleteExpense,
  formatExpenseDate,
  toDateInput
} from '../services/expenseApi';

const money = (n) => `₹${Math.round(Number(n) || 0).toLocaleString('en-IN')}`;

const BLANK = {
  title: '',
  amount: '',
  spentOn: toDateInput(new Date()),
  paymentMode: 'Cash',
  vendor: '',
  notes: ''
};

export default function ManageExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [rangeTotal, setRangeTotal] = useState(0);
  const [summary, setSummary] = useState({});
  const [monthly, setMonthly] = useState([]);

  const [range, setRange] = useState('month');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [search, setSearch] = useState('');

  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadSummary = async () => {
    try {
      const s = await getExpenseSummary();
      setSummary(s.summary);
      setMonthly(s.monthly);
    } catch (err) {
      console.warn('Could not load expense summary:', err.message);
    }
  };

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const params = { range, search };
      if (range === 'custom') { params.from = from; params.to = to; }
      const res = await getExpenses(params);
      setExpenses(res.expenses);
      setRangeTotal(res.total);
    } catch (err) {
      console.warn('Could not load expenses:', err.message);
      setExpenses([]);
      setRangeTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSummary(); }, []);

  // Re-query the server on every filter change rather than slicing a cached
  // list: the period totals have to come from the whole ledger, not a page of it.
  useEffect(() => {
    const t = setTimeout(loadExpenses, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [range, from, to, search]);

  const openAdd = () => { setEditing(null); setForm(BLANK); setError(''); setModalOpen(true); };
  const openEdit = (e) => {
    setEditing(e);
    setForm({
      title: e.title || '',
      amount: e.amount ?? '',
      spentOn: toDateInput(e.spentOn),
      paymentMode: e.paymentMode || 'Cash',
      vendor: e.vendor || '',
      notes: e.notes || ''
    });
    setError('');
    setModalOpen(true);
  };

  const handleSave = async (ev) => {
    ev.preventDefault();
    setError('');
    if (!form.title.trim()) return setError('Give the expense a title');
    if (form.amount === '' || Number(form.amount) < 0) return setError('Enter a valid amount');

    setSaving(true);
    try {
      const payload = { ...form, amount: Number(form.amount) };
      if (editing) await updateExpense(editing._id, payload);
      else await createExpense(payload);
      setModalOpen(false);
      await Promise.all([loadExpenses(), loadSummary()]);
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not save the expense');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (e) => {
    if (!window.confirm(`Remove "${e.title}" (${money(e.amount)})?`)) return;
    try {
      await deleteExpense(e._id);
      await Promise.all([loadExpenses(), loadSummary()]);
    } catch (err) {
      window.alert(err?.response?.data?.message || 'Could not remove the expense');
    }
  };

  const dayChange = useMemo(() => {
    const today = Number(summary.today) || 0;
    const yest = Number(summary.yesterday) || 0;
    if (!yest) return null;
    return Math.round(((today - yest) / yest) * 1000) / 10;
  }, [summary]);

  const field = 'w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400/60';
  const label = 'block text-[11px] font-black uppercase tracking-wide text-gray-500 mb-1.5';

  const cards = [
    { label: 'Today', value: summary.today, icon: CalendarDays, tone: 'text-gray-900' },
    { label: 'Yesterday', value: summary.yesterday, icon: CalendarDays, tone: 'text-gray-900' },
    { label: 'This Week', value: summary.week, icon: Receipt, tone: 'text-gray-900' },
    { label: 'This Month', value: summary.month, icon: TrendingDown, tone: 'text-amber-600' },
    { label: 'This Year', value: summary.year, icon: Wallet, tone: 'text-rose-600' }
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-black text-gray-900 tracking-tight">Miscellaneous Expenses</h2>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-1">
              Day-to-day running costs — tea, cleaning, repairs, transport. Kept separate from service revenue.
            </p>
          </div>
          <button onClick={openAdd}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all shrink-0">
            <Plus className="w-4 h-4" /> Add Expense
          </button>
        </div>
      </div>

      {/* Period totals */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="bg-white border border-gray-200/90 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wide text-gray-400">{c.label}</span>
              <c.icon className="w-4 h-4 text-gray-300" />
            </div>
            <p className={`text-xl font-black mt-1.5 ${c.tone}`}>{money(c.value)}</p>
            {c.label === 'Today' && dayChange !== null && (
              <p className={`text-[11px] font-bold mt-0.5 ${dayChange > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {dayChange > 0 ? '+' : ''}{dayChange}% vs yesterday
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Month-wise chart */}
      <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-sm">
        <h3 className="text-sm font-black text-gray-900">Month-wise Spend</h3>
        <p className="text-xs text-gray-500 font-medium mb-4">Last 12 months</p>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `₹${v >= 1000 ? `${Math.round(v / 1000)}k` : v}`} />
              <Tooltip formatter={(v) => [money(v), 'Spent']} cursor={{ fill: '#fef3c7' }} />
              <Bar dataKey="total" fill="#e07b2a" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {EXPENSE_RANGES.map((r) => (
            <button key={r.id} onClick={() => setRange(r.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                range === r.id ? 'bg-amber-500 text-white shadow-sm' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}>
              {r.label}
            </button>
          ))}
        </div>

        {range === 'custom' && (
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className={label}>From</label>
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
                className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold" />
            </div>
            <div>
              <label className={label}>To</label>
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
                className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold" />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, vendor, note, bill ref..."
              className={`${field} pl-9`} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="rounded-xl bg-gray-50 px-3 py-2.5">
            <p className="text-[10px] font-black uppercase tracking-wide text-gray-400">Entries</p>
            <p className="text-lg font-black text-gray-900">{expenses.length}</p>
          </div>
          <div className="rounded-xl bg-amber-50 px-3 py-2.5">
            <p className="text-[10px] font-black uppercase tracking-wide text-amber-700">Total in Filter</p>
            <p className="text-lg font-black text-amber-700">{money(rangeTotal)}</p>
          </div>
        </div>
      </div>

      {/* Ledger */}
      {loading ? (
        <p className="text-center text-xs font-bold text-gray-400 py-10">Loading expenses...</p>
      ) : expenses.length === 0 ? (
        <div className="bg-white border border-gray-200/90 rounded-2xl py-16 text-center">
          <Wallet className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-black text-gray-900">No expenses in this period</p>
          <p className="text-xs text-gray-500 font-medium mt-1">Add your first entry, or widen the date range.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200/90 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {['Date', 'Expense', 'Mode', 'Amount', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wide text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {expenses.map((e) => (
                  <tr key={e._id} className="hover:bg-amber-50/40 transition-colors">
                    <td className="px-4 py-3 text-xs font-semibold text-gray-600 whitespace-nowrap">{formatExpenseDate(e.spentOn)}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-black text-gray-900">{e.title}</span>
                      {(e.vendor || e.notes) && (
                        <span className="block text-[10px] font-semibold text-gray-400 truncate max-w-[220px]">
                          {[e.vendor, e.notes].filter(Boolean).join(' · ')}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-gray-600">{e.paymentMode}</td>
                    <td className="px-4 py-3 text-sm font-black text-rose-600 whitespace-nowrap">{money(e.amount)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => openEdit(e)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600" title="Edit">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(e)} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500" title="Remove">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / edit */}
      {modalOpen && (
        <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-gray-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl my-6">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-amber-500" />
                <h3 className="text-lg font-black text-gray-900">{editing ? 'Edit Expense' : 'Add Expense'}</h3>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-2 rounded-lg hover:bg-gray-100" aria-label="Close">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {error && (
                <div className="px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700">{error}</div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className={label}>What was it for? *</label>
                  <input className={field} value={form.title} autoFocus
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. Tea & snacks for staff" />
                </div>
                <div>
                  <label className={label}>Amount (₹) *</label>
                  <input type="number" min="0" step="0.01" className={field} value={form.amount}
                    onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} placeholder="0.00" />
                </div>
                <div>
                  <label className={label}>Date Spent</label>
                  <input type="date" className={field} value={form.spentOn}
                    onChange={(e) => setForm((f) => ({ ...f, spentOn: e.target.value }))} />
                </div>
                <div>
                  <label className={label}>Payment Mode</label>
                  <select className={field} value={form.paymentMode}
                    onChange={(e) => setForm((f) => ({ ...f, paymentMode: e.target.value }))}>
                    {['Cash', 'UPI', 'Card', 'Net Banking', 'Credit'].map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className={label}>Vendor / Shop</label>
                  <input className={field} value={form.vendor}
                    onChange={(e) => setForm((f) => ({ ...f, vendor: e.target.value }))} placeholder="Optional" />
                </div>
                <div className="sm:col-span-2">
                  <label className={label}>Notes</label>
                  <input className={field} value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Optional" />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-gray-300 text-sm font-bold text-gray-700 hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold flex items-center gap-2 disabled:opacity-60">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editing ? 'Save Changes' : 'Add Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
