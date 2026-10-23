import React, { useMemo, useState } from 'react';
import {
  IndianRupee,
  TrendingUp,
  Users,
  CalendarCheck,
  Package,
  ArrowUpRight,
  Sparkles,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertTriangle,
  CalendarDays
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { useAdmin } from '../common/context/AdminContext';
import StatsCard from '../common/components/StatsCard';
import AdminPayrollPanel from '../common/components/AdminPayrollPanel';
import {
  monthKeyOf,
  formatMonthKey,
  shiftMonthKey,
  getBookingDate,
  sumPaid,
  buildServiceRevenue,
  buildPaymentModes,
  growthPercent,
  toDateKey,
  parseDateKey,
  countDaysInclusive,
  isInDateRange,
  DATE_PRESETS,
  getPresetRange,
  getMonthRange,
  getPreviousDateRange,
  formatRangeLabel,
  buildDailyRevenueTrend,
  buildMonthlyRevenueTrendForRange,
  getDataSpan,
  formatCompactRupees,
  bookingAmount
} from '../common/utils/dashboardStats';

const PENDING_STATUSES = ['Pending', 'Confirmed', 'In Progress'];
const DAILY_TREND_MAX_DAYS = 31;
const FILTER_MODES = [
  { value: 'preset', label: 'Quick' },
  { value: 'month', label: 'Month' },
  { value: 'custom', label: 'Custom' }
];

export default function AdminDashboardPage() {
  const { stats, bookings } = useAdmin();

  const now = new Date();
  const todayKey = toDateKey(now);
  const currentMonthKey = monthKeyOf(now);

  // Date range filter. Default: This Month.
  const [filterMode, setFilterMode] = useState('preset'); // 'preset' | 'month' | 'custom'
  const [datePreset, setDatePreset] = useState('thisMonth');
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey);
  const [startDate, setStartDate] = useState(getPresetRange('thisMonth').start);
  const [endDate, setEndDate] = useState(todayKey);

  // Custom inputs may be typed in any order; normalise instead of erroring.
  const customRange = useMemo(() => {
    if (!startDate || !endDate) return { start: startDate || endDate, end: endDate || startDate };
    return startDate <= endDate ? { start: startDate, end: endDate } : { start: endDate, end: startDate };
  }, [startDate, endDate]);

  const range = useMemo(() => {
    if (filterMode === 'month') return getMonthRange(selectedMonth);
    if (filterMode === 'custom') return customRange;
    return getPresetRange(datePreset);
  }, [filterMode, datePreset, selectedMonth, customRange, todayKey]);

  const isAll = !range.start && !range.end;
  const comparePreset = filterMode === 'preset' ? datePreset : filterMode;

  const periodLabel = useMemo(() => {
    if (filterMode === 'month') return formatMonthKey(selectedMonth);
    if (filterMode === 'preset') {
      const preset = DATE_PRESETS.find((p) => p.value === datePreset);
      return preset ? preset.label : formatRangeLabel(range.start, range.end);
    }
    return formatRangeLabel(range.start, range.end);
  }, [filterMode, selectedMonth, datePreset, range]);

  // Last 12 months in the month dropdown, plus a calendar-picked older one.
  const monthOptions = useMemo(() => {
    const keys = Array.from({ length: 12 }, (_, i) => shiftMonthKey(currentMonthKey, -i));
    if (!keys.includes(selectedMonth)) keys.push(selectedMonth);
    return keys;
  }, [currentMonthKey, selectedMonth]);

  const view = useMemo(() => {
    const list = (bookings || []).filter((b) => b && !b.isDeleted);
    const inRange = (d) => isInDateRange(d, range.start, range.end);
    const rangeBookings = isAll ? list : list.filter((b) => inRange(getBookingDate(b)));

    const lifetimeRevenue = sumPaid(list);
    const periodRevenue = sumPaid(list, inRange);

    const prev = isAll ? null : getPreviousDateRange(range.start, range.end, comparePreset);
    const prevRevenue = prev ? sumPaid(list, (d) => isInDateRange(d, prev.start, prev.end)) : 0;

    // Span the charts and the average use; All Time spans the actual data.
    // All Time runs from the first sale to today, so the average counts quiet days too.
    const dataSpan = getDataSpan(list);
    const span = isAll ? { start: dataSpan ? dataSpan.start : todayKey, end: todayKey } : range;
    // Divide by days that have actually happened (a custom range may run past today).
    const avgEnd = span.end > todayKey ? todayKey : span.end;
    const dayCount = Math.max(1, countDaysInclusive(span.start, avgEnd));
    const spanDays = countDaysInclusive(span.start, span.end);

    const isSingleDay = !isAll && range.start === range.end;
    const isTodayOnly = isSingleDay && range.start === todayKey;

    // YTD for the year the range ends in, up to the range end (or today).
    const ytdEndKey = isAll ? todayKey : (range.end > todayKey ? todayKey : range.end);
    const ytdYear = parseDateKey(ytdEndKey).getFullYear();
    const ytdRevenue = sumPaid(list, (d) => isInDateRange(d, `${ytdYear}-01-01`, ytdEndKey));

    const isDailyTrend = spanDays <= DAILY_TREND_MAX_DAYS;
    const trend = isDailyTrend
      ? buildDailyRevenueTrend(list, span.start, span.end)
      : buildMonthlyRevenueTrendForRange(list, span.start, span.end);

    const recent = [...rangeBookings]
      .sort((a, b) => (getBookingDate(b)?.getTime() || 0) - (getBookingDate(a)?.getTime() || 0))
      .slice(0, 5);

    return {
      lifetimeRevenue,
      periodRevenue,
      prevRevenue,
      prevLabel: prev ? formatRangeLabel(prev.start, prev.end) : '',
      periodGrowth: prev ? growthPercent(periodRevenue, prevRevenue) : undefined,
      isSingleDay,
      isTodayOnly,
      dayCount,
      dailyAverage: Math.round(periodRevenue / dayCount),
      ytdYear,
      ytdEndKey,
      ytdRevenue,
      pending: rangeBookings.filter((b) => PENDING_STATUSES.includes(b.status)).length,
      trend,
      isDailyTrend,
      trendLabel: formatRangeLabel(span.start, span.end),
      serviceRevenue: buildServiceRevenue(rangeBookings),
      paymentModes: buildPaymentModes(rangeBookings),
      recent
    };
  }, [bookings, range, isAll, comparePreset, todayKey]);

  // Payroll is monthly: follow the month the range ends in.
  const payrollMonth = isAll ? null : monthKeyOf(parseDateKey(range.end > todayKey ? todayKey : range.end));

  const inputCls = 'bg-white text-gray-900 text-xs font-bold rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-400 min-w-0';

  return (
    <div className="space-y-6">
      {/* Welcome Hero Banner */}
      <div
        className="p-6 rounded-2xl text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        style={{ backgroundColor: '#1e4a7e' }}
      >
        <div>
          <span className="text-xs font-extrabold uppercase tracking-widest text-amber-300 flex items-center gap-1.5 mb-1">
            <Sparkles className="w-4 h-4 text-amber-400" /> Multi-Service Executive Portal
          </span>
          <h1 className="text-2xl font-black tracking-tight">Welcome back! 👋</h1>
          <p className="text-xs text-blue-100 mt-1 max-w-xl">
            Here is your live business intelligence snapshot across Car Wash, Detailing, Pet Spa, Café, and Salon services for Mumbai Main Branch.
          </p>
        </div>

        {/* Date range filter: quick presets, a calendar month, or a custom range */}
        <div className="w-full sm:w-auto flex flex-col gap-2 bg-white/10 border border-white/20 rounded-xl p-2">
          <div className="flex items-center gap-1" role="tablist" aria-label="Date filter mode">
            <CalendarDays className="w-4 h-4 text-amber-300 mx-1 flex-shrink-0" />
            {FILTER_MODES.map((m) => (
              <button
                key={m.value}
                type="button"
                role="tab"
                aria-selected={filterMode === m.value}
                onClick={() => setFilterMode(m.value)}
                className={`flex-1 sm:flex-none px-3 py-1 rounded-lg text-[11px] font-extrabold transition-colors ${
                  filterMode === m.value ? 'bg-amber-400 text-gray-900' : 'text-blue-100 hover:bg-white/10'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {filterMode === 'preset' && (
            <select
              value={datePreset}
              onChange={(e) => setDatePreset(e.target.value)}
              aria-label="Date range preset"
              className={inputCls}
            >
              {DATE_PRESETS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          )}

          {filterMode === 'month' && (
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                aria-label="Dashboard month"
                className={`${inputCls} flex-1`}
              >
                {monthOptions.map((key) => (
                  <option key={key} value={key}>
                    {formatMonthKey(key)}{key === currentMonthKey ? ' (This month)' : ''}
                  </option>
                ))}
              </select>
              <input
                type="month"
                value={selectedMonth}
                max={currentMonthKey}
                onChange={(e) => setSelectedMonth(e.target.value || currentMonthKey)}
                aria-label="Pick a month on the calendar"
                className={`${inputCls} flex-1`}
              />
            </div>
          )}

          {filterMode === 'custom' && (
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                value={startDate || ''}
                max={todayKey}
                onChange={(e) => setStartDate(e.target.value)}
                aria-label="Start date"
                className={`${inputCls} flex-1`}
              />
              <span className="text-[11px] font-bold text-blue-100">to</span>
              <input
                type="date"
                value={endDate || ''}
                max={todayKey}
                onChange={(e) => setEndDate(e.target.value)}
                aria-label="End date"
                className={`${inputCls} flex-1`}
              />
            </div>
          )}

          <p className="text-[10px] font-semibold text-blue-100 px-1">
            Showing: <span className="text-amber-300 font-extrabold">{isAll ? 'All Time' : formatRangeLabel(range.start, range.end)}</span>
            {!isAll && ` · ${view.dayCount} day${view.dayCount === 1 ? '' : 's'}`}
          </p>
        </div>
      </div>

      {/* 1. Four Revenue Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatsCard
          title="Total Lifetime Revenue"
          value={view.lifetimeRevenue}
          isCurrency={true}
          icon={IndianRupee}
          iconBg="#fff7ed"
          iconColor="#e07b2a"
          subtitle="All-time benchmark (paid sales)"
        />
        {view.isTodayOnly ? (
          <StatsCard
            title="Today's Sales"
            value={view.periodRevenue}
            isCurrency={true}
            icon={TrendingUp}
            iconBg="#eff6ff"
            iconColor="#1e4a7e"
            subtitle="Real-time today total"
          />
        ) : (
          <StatsCard
            title="Daily Average"
            value={view.dailyAverage}
            isCurrency={true}
            icon={TrendingUp}
            iconBg="#eff6ff"
            iconColor="#1e4a7e"
            subtitle={`₹${view.dailyAverage.toLocaleString('en-IN')}/day across ${view.dayCount} day${view.dayCount === 1 ? '' : 's'}`}
          />
        )}
        <StatsCard
          title={`Period Sales (${periodLabel})`}
          value={view.periodRevenue}
          isCurrency={true}
          growth={view.periodGrowth}
          icon={IndianRupee}
          iconBg="#fff7ed"
          iconColor="#e07b2a"
          subtitle={isAll ? 'Every paid sale on record' : `vs ${view.prevLabel}: ₹${view.prevRevenue.toLocaleString('en-IN')}`}
        />
        <StatsCard
          title={`Year to Date (${view.ytdYear})`}
          value={view.ytdRevenue}
          isCurrency={true}
          icon={CreditCard}
          iconBg="#eff6ff"
          iconColor="#1e4a7e"
          subtitle={formatRangeLabel(`${view.ytdYear}-01-01`, view.ytdEndKey)}
        />
      </div>

      {/* 2. Quick Operations Stat Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3.5 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase">Active Members</p>
            <p className="text-lg font-black text-gray-900">{Number(stats?.activeMembers || 0).toLocaleString('en-IN')}</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3.5 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-800">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase">Total Customers</p>
            <p className="text-lg font-black text-gray-900">{Number(stats?.totalCustomers || 0).toLocaleString('en-IN')}</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3.5 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase">Pending Bookings ({periodLabel})</p>
            <p className="text-lg font-black text-amber-600">{view.pending}</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3.5 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase">Low Stock Items</p>
            <p className="text-lg font-black text-rose-600">{stats?.lowStockItems ?? 0}</p>
          </div>
        </div>
      </div>

      {/* Staff salary & deductions across every department */}
      <AdminPayrollPanel month={payrollMonth} />

      {/* 3. Recharts Visual Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend Line Chart */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900">{view.isDailyTrend ? 'Daily' : 'Monthly'} Revenue Trend</h3>
              <p className="text-xs text-gray-400">{view.isDailyTrend ? 'Paid sales per day' : 'Paid sales per month'} across all branches</p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-100">
              {view.trendLabel}
            </span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={view.trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} interval="preserveStartEnd" minTickGap={12} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={formatCompactRupees} width={56} />
                <Tooltip
                  formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#1e4a7e"
                  strokeWidth={3}
                  dot={view.trend.length > 20 ? false : { fill: '#e07b2a', r: 4, strokeWidth: 2, stroke: '#ffffff' }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Service Revenue Distribution PieChart */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="mb-2">
            <h3 className="text-sm font-bold text-gray-900">Revenue by Department</h3>
            <p className="text-xs text-gray-400">Service share breakdown · {periodLabel}</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={view.serviceRevenue}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {view.serviceRevenue.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(val) => `₹${Number(val).toLocaleString('en-IN')}`} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Payment Modes & Transactions Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Modes Bar Chart */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 mb-1">Preferred Payment Modes</h3>
          <p className="text-xs text-gray-400 mb-4">Volume breakdown by channel · {periodLabel}</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={view.paymentModes}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mode" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} tickFormatter={formatCompactRupees} width={52} />
                <Tooltip formatter={(v) => `₹${Number(v).toLocaleString('en-IN')}`} />
                <Bar dataKey="amount" fill="#e07b2a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Transactions Table */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Recent Service Bookings</h3>
              <p className="text-xs text-gray-400">{isAll ? 'Live transaction stream' : `Latest bookings · ${periodLabel}`}</p>
            </div>
            <a href="/admin/bookings" className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1">
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase">
                  <th className="py-2.5 px-3">Booking ID</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Service</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {view.recent.length > 0 ? (
                  view.recent.map((b, idx) => {
                    const amt = bookingAmount(b);
                    const displayService = b?.service || b?.packageName || b?.membershipName || b?.plan || 'Service Wash';
                    const displayCustomer = b?.customerName || b?.userName || 'Customer';
                    const displayId = b?.id || b?.bookingId || (b?._id ? String(b._id).slice(-6) : 'N/A');
                    const displayStatus = b?.status || 'Completed';

                    return (
                      <tr key={displayId || idx} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-gray-900">{displayId}</td>
                        <td className="py-2.5 px-3 font-semibold text-gray-700">{displayCustomer}</td>
                        <td className="py-2.5 px-3 font-medium text-gray-600">{displayService}</td>
                        <td className="py-2.5 px-3 font-bold text-gray-900">
                          ₹{isNaN(amt) ? '0' : amt.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            displayStatus === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                            displayStatus === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                            displayStatus === 'Confirmed' ? 'bg-amber-100 text-amber-700' :
                            displayStatus === 'Cancelled' ? 'bg-rose-100 text-rose-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {displayStatus}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-400 font-medium">
                      {isAll ? 'No recent bookings recorded yet.' : `No bookings recorded for ${periodLabel}.`}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
