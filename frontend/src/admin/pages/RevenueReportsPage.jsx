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

  // 1. Fully Working & Downloadable Excel (.csv) Export
  const handleExportExcel = () => {
    try {
      const reportDate = new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });

      const csvRows = [
        ['THE SHINE LOUNGE - EXECUTIVE FINANCIAL & GST AUDIT REPORT'],
        [`Time Range Filter: ${timeRange}`, `Generated On: ${reportDate}`, `Location: Main Lounge (Mumbai)`],
        [''],
        ['1. FINANCIAL AUDIT SUMMARY'],
        ['Metric Name', 'Amount (INR)', 'Growth / Remarks'],
        ['Gross Sales', '1420000', '+12.4% vs last period'],
        ['Net Sales (Excl. Tax)', '1203389.83', 'Base taxable revenue'],
        ['Central GST (CGST @ 9%)', '108305.08', 'Output Tax Collection'],
        ['State GST (SGST @ 9%)', '108305.08', 'Output Tax Collection'],
        ['Total GST Output Tax (18%)', '216610.16', 'Total Liability'],
        ['Average Order Value (AOV)', '1840', '+4.2% per ticket'],
        [''],
        ['2. DEPARTMENT INCOME BREAKDOWN'],
        ['Department', 'Gross Revenue (INR)', 'Revenue Share (%)'],
        ...serviceRevenueData.map(item => [
          item.name,
          item.value,
          `${((item.value / 1420000) * 100).toFixed(1)}%`
        ]),
        [''],
        ['3. MONTHLY REVENUE FLOW TRAJECTORY'],
        ['Month', 'Revenue (INR)'],
        ...revenueTrendData.map(item => [item.month, item.revenue]),
        [''],
        ['4. DETAILED TRANSACTION AUDIT RECORDS'],
        ['Invoice ID', 'Date', 'Customer Name', 'Department', 'Taxable Base (INR)', 'CGST (9%)', 'SGST (9%)', 'Gross Amount (INR)', 'Payment Method'],
        ['INV-2026-0801', '08 Aug 2026', 'Rahul Sharma', 'Car Wash', '2118.64', '190.68', '190.68', '2500.00', 'UPI / Razorpay'],
        ['INV-2026-0802', '08 Aug 2026', 'Priya Patel', 'Car Detailing', '10169.49', '915.25', '915.25', '12000.00', 'Credit Card'],
        ['INV-2026-0803', '07 Aug 2026', 'Amit Kumar', 'Café & Dining', '635.59', '57.20', '57.20', '750.00', 'Cash'],
        ['INV-2026-0804', '07 Aug 2026', 'Neha Gupta', 'Men\'s Salon', '1525.42', '137.29', '137.29', '1800.00', 'UPI'],
        ['INV-2026-0805', '06 Aug 2026', 'Vikram Malhotra', 'Drive-Thru Cafe', '423.73', '38.14', '38.14', '500.00', 'Card'],
        ['INV-2026-0806', '06 Aug 2026', 'Karan Johar', 'Car Wash', '1016.95', '91.53', '91.53', '1200.00', 'UPI']
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

  // 2. Fully Working & Downloadable PDF Report Export
  const handleExportPDF = () => {
    try {
      const reportDate = new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });

      const printHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>The Shine Lounge - Revenue & GST Audit Report</title>
          <style>
            @media print {
              @page { size: A4; margin: 15mm; }
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; margin: 0; padding: 0; }
              .no-print { display: none !important; }
            }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; padding: 24px; max-width: 900px; margin: 0 auto; background: #fff; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #e07b2a; padding-bottom: 16px; margin-bottom: 24px; }
            .title { font-size: 24px; font-weight: 900; color: #0f172a; margin: 0; text-transform: uppercase; tracking: 0.5px; }
            .subtitle { font-size: 12px; color: #64748b; margin-top: 4px; font-weight: 600; }
            .badge { background-color: #fef3c7; color: #92400e; font-weight: 800; padding: 6px 12px; border-radius: 8px; font-size: 11px; border: 1px solid #fcd34d; }
            .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
            .kpi-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; }
            .kpi-title { font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase; }
            .kpi-value { font-size: 18px; font-weight: 900; color: #0f172a; margin-top: 4px; }
            .kpi-sub { font-size: 10px; color: #16a34a; font-weight: 700; margin-top: 2px; }
            .section-title { font-size: 14px; font-weight: 800; color: #0f172a; border-left: 4px solid #e07b2a; padding-left: 8px; margin: 24px 0 12px 0; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
            th { background: #0f172a; color: #fff; text-align: left; padding: 8px 12px; font-weight: 700; }
            td { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-weight: 600; }
            tr:nth-child(even) td { background: #f8fafc; }
            .gst-box { background: #fff7ed; border: 1px solid #ffedd5; border-radius: 12px; padding: 16px; margin-bottom: 24px; }
            .gst-row { display: flex; justify-content: space-between; font-size: 12px; padding: 6px 0; border-bottom: 1px dashed #fed7aa; }
            .gst-row.total { border-top: 2px solid #e07b2a; border-bottom: none; font-weight: 900; font-size: 14px; color: #c2410c; padding-top: 10px; margin-top: 4px; }
            .footer { margin-top: 40px; pt-16px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 10px; color: #94a3b8; }
            .download-bar { background: #0f172a; color: white; padding: 12px 20px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
            .btn { background: #e07b2a; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 700; cursor: pointer; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="download-bar no-print">
            <span><strong>PDF Executive Report Preview</strong> — Press button to print or save as PDF.</span>
            <button class="btn" onclick="window.print()">🖨️ Print / Save as PDF</button>
          </div>

          <div class="header">
            <div>
              <h1 class="title">The Shine Lounge</h1>
              <div class="subtitle">Revenue, GST 18% & Financial Analytics Audit Report</div>
            </div>
            <div>
              <span class="badge">Filter: ${timeRange}</span>
            </div>
          </div>

          <div class="kpi-grid">
            <div class="kpi-card">
              <div class="kpi-title">Gross Sales</div>
              <div class="kpi-value">₹14,20,000</div>
              <div class="kpi-sub">↑ +12.4% vs last month</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-title">Net Sales (Excl. Tax)</div>
              <div class="kpi-value" style="color:#1e3a8a;">₹12,03,389</div>
              <div class="kpi-sub" style="color:#64748b;">Base Taxable Revenue</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-title">GST Output Tax (18%)</div>
              <div class="kpi-value" style="color:#c2410c;">₹2,16,610</div>
              <div class="kpi-sub" style="color:#c2410c;">CGST 9% + SGST 9%</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-title">Avg Order Value (AOV)</div>
              <div class="kpi-value">₹1,840</div>
              <div class="kpi-sub">↑ +4.2% per ticket</div>
            </div>
          </div>

          <div class="section-title">1. GST 18% Tax Audit Summary</div>
          <div class="gst-box">
            <div class="gst-row">
              <span>Total Taxable Value (Net Revenue)</span>
              <strong>₹12,03,389.83</strong>
            </div>
            <div class="gst-row">
              <span>Central GST (CGST @ 9%)</span>
              <strong style="color:#c2410c;">₹1,08,305.08</strong>
            </div>
            <div class="gst-row">
              <span>State GST (SGST @ 9%)</span>
              <strong style="color:#c2410c;">₹1,08,305.08</strong>
            </div>
            <div class="gst-row total">
              <span>Total GST Collected Liability (18%)</span>
              <span>₹2,16,610.16</span>
            </div>
          </div>

          <div class="section-title">2. Department Income Breakdown</div>
          <table>
            <thead>
              <tr>
                <th>Department Name</th>
                <th>Gross Income (INR)</th>
                <th>Revenue Contribution (%)</th>
              </tr>
            </thead>
            <tbody>
              ${serviceRevenueData.map(item => `
                <tr>
                  <td><strong>${item.name}</strong></td>
                  <td>₹${Number(item.value).toLocaleString('en-IN')}</td>
                  <td>${((item.value / 1420000) * 100).toFixed(1)}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="section-title">3. Sample Transaction Audit Records</div>
          <table>
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Department</th>
                <th>Base (₹)</th>
                <th>GST 18% (₹)</th>
                <th>Total (₹)</th>
                <th>Payment</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>INV-2026-0801</td>
                <td>08 Aug 2026</td>
                <td>Rahul Sharma</td>
                <td>Car Wash</td>
                <td>₹2,118.64</td>
                <td>₹381.36</td>
                <td><strong>₹2,500.00</strong></td>
                <td>UPI / Razorpay</td>
              </tr>
              <tr>
                <td>INV-2026-0802</td>
                <td>08 Aug 2026</td>
                <td>Priya Patel</td>
                <td>Car Detailing</td>
                <td>₹10,169.49</td>
                <td>₹1,830.51</td>
                <td><strong>₹12,000.00</strong></td>
                <td>Credit Card</td>
              </tr>
              <tr>
                <td>INV-2026-0803</td>
                <td>07 Aug 2026</td>
                <td>Amit Kumar</td>
                <td>Café & Dining</td>
                <td>₹635.59</td>
                <td>₹114.41</td>
                <td><strong>₹750.00</strong></td>
                <td>Cash</td>
              </tr>
            </tbody>
          </table>

          <div class="footer">
            <span>Generated by Super Admin • The Shine Lounge Systems</span>
            <span>Date: ${reportDate}</span>
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 500);
            };
          </script>
        </body>
        </html>
      `;

      // 1. Trigger Print Window for PDF Download
      const printWindow = window.open('', '_blank', 'width=900,height=800');
      if (printWindow) {
        printWindow.document.write(printHtml);
        printWindow.document.close();
      }

      // 2. Also trigger direct PDF/HTML report Blob download as offline backup
      const pdfBlob = new Blob([printHtml], { type: 'text/html;charset=utf-8;' });
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      const filename = `TheShineLounge_Financial_Report_${timeRange.replace(/[^a-zA-Z0-9]/g, '_')}.html`;
      link.setAttribute('href', pdfUrl);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(pdfUrl);

      showToast('PDF report generated and print dialog opened!');
    } catch (err) {
      console.error('Error exporting PDF:', err);
      showToast('Error exporting PDF report', 'error');
    }
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
