import React, { useState } from 'react';
import { Download, FileText, Calendar, Filter, DollarSign, PieChart as PieChartIcon } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar
} from 'recharts';
import { useAdmin } from '../common/context/AdminContext';

export default function RevenueReportsPage() {
  const { revenueTrendData, serviceRevenueData, showToast } = useAdmin();
  const [timeRange, setTimeRange] = useState('This Month');

  const handleExportPDF = () => {
    showToast('GST & Financial Revenue Report exported to PDF!');
  };

  const handleExportExcel = () => {
    showToast('Detailed Sales Breakdown exported to Excel (.xlsx)!');
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">Revenue, GST & Financial Analytics</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Audit gross income, net revenue, GST 18% liability, and department profitability reports.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Time Range Filter */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs font-bold text-gray-700">
            {['Today', 'This Week', 'This Month', 'FY 2025-26'].map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  timeRange === r ? 'bg-white shadow-xs text-amber-600 font-extrabold' : 'hover:bg-gray-200/60'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200"
          >
            <FileText className="w-4 h-4 text-rose-500" /> Export PDF
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white rounded-xl shadow-sm hover:opacity-95"
            style={{ backgroundColor: '#e07b2a' }}
          >
            <Download className="w-4 h-4" /> Export Excel
          </button>
        </div>
      </div>

      {/* 4 Financial Audit Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Gross Sales</span>
          <h3 className="text-2xl font-black text-gray-900 mt-2">₹14,20,000</h3>
          <p className="text-[11px] text-emerald-600 font-bold mt-1">↑ +12.4% vs last month</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Net Sales (Excl. Tax)</span>
          <h3 className="text-2xl font-black text-blue-900 mt-2">₹12,03,389</h3>
          <p className="text-[11px] text-gray-400 font-medium mt-1">Base revenue amount</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">GST Output Tax (18%)</span>
          <h3 className="text-2xl font-black text-amber-600 mt-2">₹2,16,610</h3>
          <p className="text-[11px] text-amber-600 font-bold mt-1">CGST 9% + SGST 9%</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Avg Order Value (AOV)</span>
          <h3 className="text-2xl font-black text-gray-900 mt-2">₹1,840</h3>
          <p className="text-[11px] text-emerald-600 font-bold mt-1">↑ +4.2% per ticket</p>
        </div>
      </div>

      {/* Area Chart: Revenue Growth Curve */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div>
          <h3 className="text-base font-bold text-gray-900">Gross Sales vs Net Revenue Flow</h3>
          <p className="text-xs text-gray-400">Monthly financial trajectory with GST breakdown</p>
        </div>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueTrendData}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#e07b2a" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#e07b2a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `₹${v / 100000}L`} />
              <Tooltip formatter={(v) => `₹${Number(v).toLocaleString('en-IN')}`} />
              <Area type="monotone" dataKey="revenue" stroke="#e07b2a" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Department Wise Sales Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-gray-900">Department Income Breakdown (₹)</h3>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={serviceRevenueData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" stroke="#94a3b8" fontSize={10} tickFormatter={(v) => `₹${v / 100000}L`} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} width={110} />
                <Tooltip formatter={(v) => `₹${Number(v).toLocaleString('en-IN')}`} />
                <Bar dataKey="value" fill="#1e4a7e" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GST Audit Summary */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-gray-900">GST 18% Tax Audit Summary</h3>
          <div className="p-4 bg-gray-50 rounded-xl space-y-3 text-xs">
            <div className="flex justify-between pb-2 border-b border-gray-200">
              <span className="font-semibold text-gray-600">Total Taxable Value</span>
              <span className="font-bold text-gray-900">₹12,03,389.83</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-gray-200">
              <span className="font-semibold text-gray-600">Central GST (CGST @ 9%)</span>
              <span className="font-bold text-amber-600">₹1,08,305.08</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-gray-200">
              <span className="font-semibold text-gray-600">State GST (SGST @ 9%)</span>
              <span className="font-bold text-amber-600">₹1,08,305.08</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="font-extrabold text-gray-900 text-sm">Total Tax Collected</span>
              <span className="font-black text-amber-600 text-sm">₹2,16,610.16</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
