import React from 'react';
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
  AlertTriangle
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

export default function AdminDashboardPage() {
  const {
    stats,
    revenueTrendData,
    serviceRevenueData,
    paymentModeData,
    bookings,
    notifications
  } = useAdmin();

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
          <h1 className="text-2xl font-black tracking-tight">Welcome back, Amitabh! 👋</h1>
          <p className="text-xs text-blue-100 mt-1 max-w-xl">
            Here is your live business intelligence snapshot across Car Wash, Detailing, Pet Spa, Café, and Salon services for Mumbai Main Branch.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-blue-900/50 p-2.5 rounded-xl border border-blue-700/50 backdrop-blur-xs">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-blue-200 block">Today's Total Target</span>
            <span className="text-base font-extrabold text-amber-400">₹2,00,000</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center font-bold text-white shadow-xs">
            92%
          </div>
        </div>
      </div>

      {/* 1. Four Revenue Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatsCard
          title="Total Lifetime Revenue"
          value={stats.totalRevenue}
          isCurrency={true}
          growth={stats.revenueGrowth}
          icon={IndianRupee}
          iconBg="#fff7ed"
          iconColor="#e07b2a"
          subtitle="Overall gross earnings"
        />
        <StatsCard
          title="Today's Sales"
          value={stats.todaySales}
          isCurrency={true}
          growth={stats.todayGrowth}
          icon={TrendingUp}
          iconBg="#eff6ff"
          iconColor="#1e4a7e"
          subtitle="Real-time today total"
        />
        <StatsCard
          title="Monthly Sales (July)"
          value={stats.monthlySales}
          isCurrency={true}
          growth={stats.monthlyGrowth}
          icon={IndianRupee}
          iconBg="#fff7ed"
          iconColor="#e07b2a"
          subtitle="Current month revenue"
        />
        <StatsCard
          title="Annual Run-Rate"
          value={stats.annualSales}
          isCurrency={true}
          growth={stats.annualGrowth}
          icon={CreditCard}
          iconBg="#eff6ff"
          iconColor="#1e4a7e"
          subtitle="Projected FY2026 sales"
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
            <p className="text-lg font-black text-gray-900">{stats.activeMembers.toLocaleString('en-IN')}</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3.5 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-800">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase">Total Customers</p>
            <p className="text-lg font-black text-gray-900">{stats.totalCustomers.toLocaleString('en-IN')}</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3.5 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase">Pending Bookings</p>
            <p className="text-lg font-black text-amber-600">{stats.pendingBookings}</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3.5 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase">Low Stock Items</p>
            <p className="text-lg font-black text-rose-600">{stats.lowStockItems}</p>
          </div>
        </div>
      </div>

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
              FY 2025-26
            </span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v / 100000}L`} />
                <Tooltip
                  formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                />
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
            <p className="text-xs text-gray-400">Service share breakdown</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={serviceRevenueData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {serviceRevenueData.map((entry, index) => (
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
          <p className="text-xs text-gray-400 mb-4">Volume breakdown by channel</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paymentModeData}>
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
              <p className="text-xs text-gray-400">Live transaction stream</p>
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
                {bookings.slice(0, 5).map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-gray-900">{b.id}</td>
                    <td className="py-2.5 px-3 font-semibold text-gray-700">{b.customerName}</td>
                    <td className="py-2.5 px-3 font-medium text-gray-600">{b.service}</td>
                    <td className="py-2.5 px-3 font-bold text-gray-900">₹{b.total.toFixed(0)}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        b.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                        b.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                        b.status === 'Confirmed' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
