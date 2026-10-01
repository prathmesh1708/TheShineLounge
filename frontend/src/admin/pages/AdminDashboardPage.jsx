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
  Legend,
  ReferenceLine
} from 'recharts';
import { useAdmin } from '../common/context/AdminContext';
import StatsCard from '../common/components/StatsCard';
import AdminPayrollPanel from '../common/components/AdminPayrollPanel';
import {
  MONTH_NAMES,
  getBookingDate,
  monthKeyOf,
  parseMonthKey,
  formatMonthKey,
  shiftMonthKey,
  isInMonth,
  sumPaid,
  buildRevenueTrend,
  buildServiceRevenue,
  buildPaymentModes,
  growthPercent
} from '../common/utils/dashboardStats';

const ALL_TIME = 'all';
const PENDING_STATUSES = ['Pending', 'Confirmed', 'In Progress'];

export default function AdminDashboardPage() {
  const {
    stats,
    revenueTrendData,
    serviceRevenueData,
    paymentModeData,
    bookings,
    notifications
  } = useAdmin();

  // Month the dashboard is showing ('YYYY-MM'), or ALL_TIME. Defaults to now.
  const currentKey = monthKeyOf(new Date());
  const [selectedMonth, setSelectedMonth] = useState(currentKey);
  const isAll = selectedMonth === ALL_TIME;
  const focusKey = isAll ? currentKey : selectedMonth;
  const isCurrentMonth = focusKey === currentKey;
  const { year: focusYear, month: focusMonthIdx } = parseMonthKey(focusKey);
  const focusLabel = formatMonthKey(focusKey);
  const periodLabel = isAll ? 'All time' : focusLabel;

  // Last 12 months in the dropdown; a month picked on the calendar further
  // back is added so the dropdown still shows what is selected.
  const monthOptions = useMemo(() => {
    const keys = Array.from({ length: 12 }, (_, i) => shiftMonthKey(currentKey, -i));
    if (!isAll && !keys.includes(selectedMonth)) keys.push(selectedMonth);
    return keys;
  }, [currentKey, selectedMonth, isAll]);

  const view = useMemo(() => {
    const list = bookings || [];
    const inFocus = (d) => isInMonth(d, focusKey);
    const monthBookings = isAll ? list : list.filter((b) => !b?.isDeleted && inFocus(getBookingDate(b)));

    const monthRevenue = sumPaid(list, inFocus);
    const prevKey = shiftMonthKey(focusKey, -1);
    const prevRevenue = sumPaid(list, (d) => isInMonth(d, prevKey));
    const daysInMonth = new Date(focusYear, focusMonthIdx + 1, 0).getDate();
    const ytdRevenue = sumPaid(list, (d) => d && d.getFullYear() === focusYear && d.getMonth() <= focusMonthIdx);

    const recent = isAll
      ? list.slice(0, 5)
      : [...monthBookings]
          .sort((a, b) => (getBookingDate(b)?.getTime() || 0) - (getBookingDate(a)?.getTime() || 0))
          .slice(0, 5);

    return {
      monthRevenue,
      prevRevenue,
      prevLabel: formatMonthKey(prevKey, 'short'),
      monthGrowth: growthPercent(monthRevenue, prevRevenue),
      dailyAverage: Math.round(monthRevenue / daysInMonth),
      ytdRevenue,
      pending: isAll
        ? stats?.pendingBookings ?? 0
        : monthBookings.filter((b) => PENDING_STATUSES.includes(b.status)).length,
      trend: isAll ? revenueTrendData : buildRevenueTrend(list, focusYear),
      serviceRevenue: isAll ? serviceRevenueData : buildServiceRevenue(monthBookings),
      paymentModes: isAll ? paymentModeData : buildPaymentModes(monthBookings),
      recent
    };
  }, [bookings, isAll, focusKey, focusYear, focusMonthIdx, stats, revenueTrendData, serviceRevenueData, paymentModeData]);

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

        {/* Month filter: quick dropdown + calendar for any month */}
        <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-xl p-1.5">
          <CalendarDays className="w-4 h-4 text-amber-300 ml-1 flex-shrink-0" />
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            aria-label="Dashboard month"
            className="bg-white text-gray-900 text-xs font-bold rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            {monthOptions.map((key) => (
              <option key={key} value={key}>
                {formatMonthKey(key)}{key === currentKey ? ' (This month)' : ''}
              </option>
            ))}
            <option value={ALL_TIME}>All time</option>
          </select>
          <input
            type="month"
            value={isAll ? '' : selectedMonth}
            max={currentKey}
            onChange={(e) => setSelectedMonth(e.target.value || currentKey)}
            aria-label="Pick a month on the calendar"
            className="bg-white text-gray-900 text-xs font-bold rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
      </div>

      {/* 1. Four Revenue Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatsCard
          title="Total Lifetime Revenue"
          value={stats?.totalRevenue ?? 0}
          isCurrency={true}
          growth={stats?.revenueGrowth}
          icon={IndianRupee}
          iconBg="#fff7ed"
          iconColor="#e07b2a"
          subtitle="Overall gross earnings"
        />
        {isCurrentMonth ? (
          <StatsCard
            title="Today's Sales"
            value={stats?.todaySales ?? 0}
            isCurrency={true}
            growth={stats?.todayGrowth}
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
            subtitle={`Average per day in ${focusLabel}`}
          />
        )}
        <StatsCard
          title={`Monthly Sales (${focusLabel})`}
          value={view.monthRevenue}
          isCurrency={true}
          growth={view.monthGrowth}
          icon={IndianRupee}
          iconBg="#fff7ed"
          iconColor="#e07b2a"
          subtitle={`${view.prevLabel}: ₹${view.prevRevenue.toLocaleString('en-IN')}`}
        />
        <StatsCard
          title={`Year to Date (${focusYear})`}
          value={view.ytdRevenue}
          isCurrency={true}
          icon={CreditCard}
          iconBg="#eff6ff"
          iconColor="#1e4a7e"
          subtitle={`Jan – ${MONTH_NAMES[focusMonthIdx]} ${focusYear} sales`}
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
            <p className="text-[11px] font-bold text-gray-400 uppercase">Pending Bookings{isAll ? '' : ` (${MONTH_NAMES[focusMonthIdx]})`}</p>
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
      <AdminPayrollPanel month={isAll ? null : focusKey} />

      {/* 3. Recharts Visual Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend Line Chart */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Monthly Revenue Growth Trend</h3>
              <p className="text-xs text-gray-400">12-Month income curve across all branches</p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-100">
              Jan – Dec {focusYear}
            </span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={view.trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v / 100000}L`} />
                <Tooltip
                  formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                />
                {!isAll && (
                  <ReferenceLine x={MONTH_NAMES[focusMonthIdx]} stroke="#e07b2a" strokeDasharray="4 4" />
                )}
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#1e4a7e"
                  strokeWidth={3}
                  dot={{ fill: '#e07b2a', r: 5, strokeWidth: 2, stroke: '#ffffff' }}
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
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} tickFormatter={(v) => `₹${v / 100000}L`} />
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
              <p className="text-xs text-gray-400">{isAll ? 'Live transaction stream' : `Latest bookings in ${focusLabel}`}</p>
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
                    const amt = Number(b?.total ?? b?.price ?? b?.amount ?? 0);
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
                            displayStatus === 'Confirmed' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
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
                      {isAll ? 'No recent bookings recorded yet.' : `No bookings recorded in ${focusLabel}.`}
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
