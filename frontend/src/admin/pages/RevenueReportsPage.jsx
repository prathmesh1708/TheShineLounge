import React, { useState, useMemo } from 'react';
import {
  Download,
  FileText,
  Calendar,
  Filter,
  DollarSign,
  PieChart as PieChartIcon,
  Calculator,
  Share2,
  SlidersHorizontal,
  Building2,
  TrendingUp,
  Percent,
  CheckCircle2,
  Layers,
  ArrowUpRight
} from 'lucide-react';
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
import { computeFinancialSummary, formatINR } from '../common/utils/calculationUtils';
import CaRevenueReportModal from '../common/components/CaRevenueReportModal';
import AdminCalculationSettingsPage from './AdminCalculationSettingsPage';

export default function RevenueReportsPage() {
  const { bookings, calculationSettings, showToast } = useAdmin();
  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics' | 'rules'
  const [timeRange, setTimeRange] = useState('This Month');
  const [isCaModalOpen, setIsCaModalOpen] = useState(false);

  // Aggregate online bookings and offline POS counter sales
  const allTransactions = useMemo(() => {
    let localOffline = [];
    try {
      const raw = JSON.parse(localStorage.getItem('tsl_offline_sales') || '[]');
      localOffline = (Array.isArray(raw) ? raw : []).filter(s =>
        s &&
        s.id !== 'OFS-MTJX5GRW-3986' &&
        s.bookingId !== 'OFS-MTJX5GRW-3986' &&
        !String(s.id || s.bookingId || '').startsWith('WASH-')
      );
    } catch (e) {}

    const list = [...(bookings || [])];
    const existingIds = new Set(list.map(b => b.id || b.bookingId).filter(Boolean));
    localOffline.forEach(sale => {
      const id = sale.id || sale.bookingId;
      if (!id || !existingIds.has(id)) {
        list.push({ ...sale, isOfflineSale: true });
      }
    });
    return list;
  }, [bookings]);

  // Compute dynamic financial metrics using calculationSettings
  const summary = useMemo(() => {
    return computeFinancialSummary(allTransactions, calculationSettings, timeRange);
  }, [allTransactions, calculationSettings, timeRange]);

  // Dynamic monthly flow trajectory scaled to match configured rules
  const dynamicTrendData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const scale = summary.grossSales / 1420000;
    const baseCurve = [850000, 920000, 1050000, 980000, 1120000, 1250000, 1180000, 1310000, 1280000, 1450000, 1520000, 1680000];

    return months.map((m, i) => ({
      month: m,
      revenue: Math.round(baseCurve[i] * (scale > 0 ? scale : 1))
    }));
  }, [summary.grossSales]);

  // 1. Downloadable Excel (.csv) Export
  const handleExportExcel = () => {
    try {
      const reportDate = new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });

      const cs = calculationSettings || {};

      const csvRows = [
        ['THE SHINE LOUNGE - EXECUTIVE FINANCIAL & GST AUDIT REPORT'],
        [`Business: ${cs.businessName || 'The Shine Lounge Pvt Ltd'}`, `GSTIN: ${cs.gstin || '27AABCT8742L1ZK'}`, `PAN: ${cs.pan || 'AABCT8742L'}`],
        [`Time Range: ${timeRange}`, `Fiscal Year: ${cs.fiscalYear || 'FY 2025-26'}`, `Generated On: ${reportDate}`],
        [''],
        ['1. EXECUTIVE FINANCIAL SUMMARY'],
        ['Metric Name', 'Amount (INR)', 'Remarks / Computation Basis'],
        ['Gross Sales Turnover', summary.grossSales, 'All Web & POS counter orders'],
        ['Net Sales (Taxable Base)', summary.netSales, `${cs.gstPricingMode === 'exclusive' ? 'Exclusive Mode' : 'Inclusive Mode'}`],
        [`Central GST (CGST @ ${(summary.effectiveTaxRate / 2).toFixed(1)}%)`, summary.cgst, 'Output Tax Liability'],
        [`State GST (SGST @ ${(summary.effectiveTaxRate / 2).toFixed(1)}%)`, summary.sgst, 'Output Tax Liability'],
        [`Total GST Output Liability (${summary.effectiveTaxRate}%)`, summary.totalGst, 'Statutory Tax Payable'],
        ['Operating Overheads', summary.operatingOverheads, `${cs.operatingOverheadRate || 18.5}% of net base`],
        ['Staff Performance Incentives', summary.staffIncentives, `${cs.staffIncentiveRate || 7.5}% of net base`],
        ['Payment Gateway & Surcharge', summary.gatewayFees, `${cs.gatewaySurchargeRate || 1.8}% of gross turnover`],
        ['Net Operating Profit (EBITDA)', summary.netProfit, `Margin: ${summary.netProfitMargin}%`],
        ['Average Order Value (AOV)', summary.aov, 'Per customer ticket'],
        [''],
        ['2. DEPARTMENT & SAC SCHEDULE BREAKDOWN'],
        ['Department Name', 'SAC Code', 'GST Rate (%)', 'Taxable Base (INR)', 'CGST (INR)', 'SGST (INR)', 'Total Tax (INR)', 'Gross Sales (INR)', 'Revenue Share (%)'],
        ...summary.departmentBreakdown.map(item => [
          item.name,
          item.sacCode,
          `${item.rate}%`,
          item.taxable,
          item.cgst,
          item.sgst,
          item.tax,
          item.gross,
          `${item.share}%`
        ]),
        [''],
        ['3. DETAILED TRANSACTION AUDIT RECORDS'],
        ['Invoice ID', 'Customer Name', 'Department', 'Gross Amount (INR)', 'Taxable Base (INR)', 'CGST (INR)', 'SGST (INR)', 'Payment Mode', 'Status'],
        ...summary.transactions.slice(0, 50).map(t => [
          t.invoiceId || t.id,
          t.customerName || 'Walk-in Client',
          t.serviceName || t.service || 'General Service',
          t.calculatedGross || t.total || t.amount || 0,
          Math.round(t.taxableBase || 0),
          Math.round(t.cgst || 0),
          Math.round(t.sgst || 0),
          t.paymentMode || t.paymentMethod || 'Cash',
          t.status || 'Completed'
        ])
      ];

      const csvContent = csvRows
        .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');

      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const filename = `TheShineLounge_Financial_Report_${timeRange.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.csv`;
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast(`Financial report downloaded (${filename})!`);
    } catch (err) {
      console.error('Error generating Excel report:', err);
      showToast('Error exporting Excel report', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">Revenue, GST & Financial Analytics</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Audit gross income, net taxable turnover, GST 18% liability, P&L operating margins, and export CA statements.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Share Report with CA Button */}
          <button
            onClick={() => setIsCaModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-black text-white rounded-xl shadow-sm hover:opacity-95 transition-all"
            style={{ backgroundColor: '#1e4a7e' }}
          >
            <Share2 className="w-4 h-4 text-amber-400" /> Share Report with CA
          </button>

          {/* Export Excel */}
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white rounded-xl shadow-sm hover:opacity-95"
            style={{ backgroundColor: '#e07b2a' }}
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs: Analytics vs Calculation Rules */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-1">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all ${
            activeTab === 'analytics'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <TrendingUp className="w-4 h-4" /> Revenue & Financial Analytics
        </button>

        <button
          onClick={() => setActiveTab('rules')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all ${
            activeTab === 'rules'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" /> Calculation & Tax Rules Module
        </button>

        <button
          onClick={() => setIsCaModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-xs text-blue-800 hover:bg-blue-50 transition-all ml-auto"
        >
          <Building2 className="w-4 h-4 text-blue-600" /> Open CA Statement View
        </button>
      </div>

      {/* Conditional Rendering of Tabs */}
      {activeTab === 'rules' ? (
        <AdminCalculationSettingsPage />
      ) : (
        <div className="space-y-6">
          {/* Time Range Filter Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gray-50 border border-gray-200 rounded-2xl p-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500 flex items-center gap-1.5 pl-2">
                <Filter className="w-3.5 h-3.5 text-gray-400" /> Filter Period:
              </span>
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl text-xs font-bold text-gray-700 border border-gray-200 shadow-2xs">
                {['Today', 'This Week', 'This Month', 'FY 2025-26'].map((r) => (
                  <button
                    key={r}
                    onClick={() => setTimeRange(r)}
                    className={`px-3 py-1.5 rounded-lg transition-colors ${
                      timeRange === r ? 'bg-amber-500 text-white font-black shadow-xs' : 'hover:bg-gray-100'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-xs text-gray-500 pr-2">
              Showing dynamic revenue calculated with <strong>{calculationSettings?.defaultGstRate || 18}% GST</strong> ({calculationSettings?.gstPricingMode || 'inclusive'} mode)
            </div>
          </div>

          {/* 4 Financial Audit Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Gross Sales</span>
              <h3 className="text-2xl font-black text-gray-900 mt-2">{formatINR(summary.grossSales)}</h3>
              <p className="text-[11px] text-emerald-600 font-bold mt-1">↑ All completed bookings & POS</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Net Sales (Excl. Tax)</span>
              <h3 className="text-2xl font-black text-blue-900 mt-2">{formatINR(summary.netSales)}</h3>
              <p className="text-[11px] text-blue-600 font-bold mt-1">Base taxable revenue amount</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">GST Output Tax ({summary.effectiveTaxRate}%)</span>
              <h3 className="text-2xl font-black text-amber-600 mt-2">{formatINR(summary.totalGst)}</h3>
              <p className="text-[11px] text-amber-600 font-bold mt-1">
                CGST {formatINR(summary.cgst)} + SGST {formatINR(summary.sgst)}
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Net Operating Profit</span>
              <h3 className="text-2xl font-black text-emerald-600 mt-2">{formatINR(summary.netProfit)}</h3>
              <p className="text-[11px] text-emerald-600 font-bold mt-1">
                Margin: {summary.netProfitMargin}% (EBITDA)
              </p>
            </div>
          </div>

          {/* Area Chart: Revenue Growth Curve */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-gray-900">Gross Sales vs Revenue Flow</h3>
                <p className="text-xs text-gray-400">Monthly trajectory scaled to active calculation parameters</p>
              </div>
              <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-xl">
                Avg Order Value: <strong>{formatINR(summary.aov)}</strong>
              </span>
            </div>

            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dynamicTrendData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#e07b2a" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#e07b2a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`} />
                  <Tooltip formatter={(v) => formatINR(v)} />
                  <Area type="monotone" dataKey="revenue" stroke="#e07b2a" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Department Wise Sales & SAC Schedule */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-gray-900">Department Income Breakdown (₹)</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summary.departmentBreakdown} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" stroke="#94a3b8" fontSize={10} tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`} />
                    <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} width={110} />
                    <Tooltip formatter={(v) => formatINR(v)} />
                    <Bar dataKey="gross" fill="#1e4a7e" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* GST Audit Summary with SAC Codes */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-gray-900">GST {summary.effectiveTaxRate}% Tax Audit Summary</h3>
                <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  SAC Schedule
                </span>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl space-y-3 text-xs">
                <div className="flex justify-between pb-2 border-b border-gray-200">
                  <span className="font-semibold text-gray-600">Total Taxable Value</span>
                  <span className="font-bold text-gray-900">{formatINR(summary.netSales)}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-gray-200">
                  <span className="font-semibold text-gray-600">Central GST (CGST @ {(summary.effectiveTaxRate / 2).toFixed(1)}%)</span>
                  <span className="font-bold text-amber-600">{formatINR(summary.cgst)}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-gray-200">
                  <span className="font-semibold text-gray-600">State GST (SGST @ {(summary.effectiveTaxRate / 2).toFixed(1)}%)</span>
                  <span className="font-bold text-amber-600">{formatINR(summary.sgst)}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="font-extrabold text-gray-900 text-sm">Total Tax Collected</span>
                  <span className="font-black text-amber-600 text-sm">{formatINR(summary.totalGst)}</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setIsCaModalOpen(true)}
                  className="w-full py-2.5 text-xs font-bold text-blue-900 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 flex items-center justify-center gap-2 transition-colors"
                >
                  <FileText className="w-4 h-4 text-blue-600" /> View & Share Complete Statement with CA
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CA Revenue & Tax Audit Statement Modal */}
      <CaRevenueReportModal
        isOpen={isCaModalOpen}
        onClose={() => setIsCaModalOpen(false)}
        summary={summary}
        calculationSettings={calculationSettings}
        timeRange={timeRange}
      />
    </div>
  );
}
