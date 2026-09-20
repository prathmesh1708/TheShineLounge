import React, { useRef } from 'react';
import {
  X,
  Printer,
  FileText,
  Share2,
  Mail,
  CheckCircle2,
  Building2,
  ShieldAlert,
  Percent,
  TrendingUp,
  CreditCard,
  Download,
  Phone
} from 'lucide-react';
import { formatINR } from '../utils/calculationUtils';

export default function CaRevenueReportModal({
  isOpen,
  onClose,
  summary,
  calculationSettings,
  timeRange
}) {
  if (!isOpen || !summary) return null;

  const cs = calculationSettings || {};
  const reportDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const cleanPhone = (cs.caPhone || '+919820123456').replace(/[^0-9]/g, '');

  // 1. WhatsApp Share Action
  const handleShareWhatsApp = () => {
    const text = `*THE SHINE LOUNGE - EXECUTIVE FINANCIAL & GST AUDIT REPORT*
Period: ${timeRange} | Fiscal Year: ${cs.fiscalYear || 'FY 2025-26'}
Generated: ${reportDate}

Dear ${cs.caName || 'Chartered Accountant'},
Please find the summary of our financial audit statement for tax filing and statutory reconciliation:

📊 *FINANCIAL SUMMARY:*
• Gross Turnover: ${formatINR(summary.grossSales)}
• Net Taxable Value: ${formatINR(summary.netSales)}
• CGST (${summary.effectiveTaxRate / 2}%): ${formatINR(summary.cgst)}
• SGST (${summary.effectiveTaxRate / 2}%): ${formatINR(summary.sgst)}
• Total Output GST Liability: ${formatINR(summary.totalGst)}
• Operating Overheads & Costs: ${formatINR(summary.totalDeductions)}
• Net Operating Profit (EBITDA): ${formatINR(summary.netProfit)} (${summary.netProfitMargin}%)

📋 *STATUTORY SAC BREAKDOWN:*
${summary.departmentBreakdown.map(d => `• ${d.name} (SAC ${d.sacCode}): ${formatINR(d.gross)} [Tax: ${formatINR(d.tax)}]`).join('\n')}

GSTIN: ${cs.gstin || '27AABCT8742L1ZK'} | PAN: ${cs.pan || 'AABCT8742L'}
Auditor: ${cs.caFirmName || 'R. Agarwal & Associates'} (Mem: ${cs.caMembershipNo || 'FCA-084291'})

Please review and confirm compliance for GSTR-3B & GSTR-1 filing.`;

    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // 2. Email Share Action
  const handleShareEmail = () => {
    const subject = `Financial & GST Audit Statement [${timeRange}] - ${cs.businessName || 'The Shine Lounge'}`;
    const body = `Dear ${cs.caName || 'Chartered Accountant'},%0D%0A%0D%0APlease find below the financial summary and GST tax audit statement for ${cs.businessName || 'The Shine Lounge'} for the period ${timeRange} (${cs.fiscalYear || 'FY 2025-26'}):%0D%0A%0D%0AGross Turnover: ${formatINR(summary.grossSales)}%0D%0ANet Taxable Base: ${formatINR(summary.netSales)}%0D%0ACentral GST (CGST): ${formatINR(summary.cgst)}%0D%0AState GST (SGST): ${formatINR(summary.sgst)}%0D%0ATotal GST Output Tax: ${formatINR(summary.totalGst)}%0D%0AOperating Deductions: ${formatINR(summary.totalDeductions)}%0D%0ANet Profit: ${formatINR(summary.netProfit)}%0D%0A%0D%0AGSTIN: ${cs.gstin || '27AABCT8742L1ZK'}%0D%0APAN: ${cs.pan || 'AABCT8742L'}%0D%0A%0D%0AKindly verify the schedule for GSTR-3B and GSTR-1 submission.%0D%0A%0D%0ARegards,%0D%0AFinance & Accounts Team%0D%0A${cs.businessName || 'The Shine Lounge'}`;
    window.location.href = `mailto:${cs.caEmail || 'tax.audit@theshinelounge.com'}?subject=${encodeURIComponent(subject)}&body=${body}`;
  };

  // 3. Print / Save as PDF
  const handlePrintPDF = () => {
    const printWindow = window.open('', '_blank', 'width=950,height=900');
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>CA Revenue & GST Audit Statement - ${cs.tradeName || 'The Shine Lounge'}</title>
        <style>
          @media print {
            @page { size: A4; margin: 12mm; }
            body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; margin: 0; padding: 0; font-size: 11px; }
            .no-print { display: none !important; }
            .page-break { page-break-before: always; }
          }
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; padding: 24px; max-width: 900px; margin: 0 auto; background: #fff; line-height: 1.4; }
          .header-box { border-bottom: 2.5px solid #1e4a7e; padding-bottom: 14px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start; }
          .logo-text { font-size: 22px; font-weight: 900; color: #1e4a7e; text-transform: uppercase; letter-spacing: 0.5px; }
          .sub-text { font-size: 11px; color: #64748b; margin-top: 3px; font-weight: 600; }
          .meta-badge { background: #f1f5f9; border: 1px solid #cbd5e1; padding: 6px 12px; border-radius: 6px; text-align: right; font-size: 11px; font-weight: 600; }
          .meta-badge strong { color: #e07b2a; }
          .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
          .kpi-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; }
          .kpi-label { font-size: 9px; text-transform: uppercase; color: #64748b; font-weight: 800; letter-spacing: 0.5px; }
          .kpi-val { font-size: 16px; font-weight: 900; color: #0f172a; margin-top: 3px; }
          .section-heading { font-size: 12px; font-weight: 900; text-transform: uppercase; color: #1e4a7e; border-left: 4px solid #e07b2a; padding-left: 8px; margin: 18px 0 10px 0; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 11px; }
          th { background: #1e4a7e; color: #fff; text-align: left; padding: 7px 10px; font-weight: 700; font-size: 10px; }
          td { padding: 6.5px 10px; border-bottom: 1px solid #e2e8f0; font-weight: 600; }
          tr:nth-child(even) td { background: #f8fafc; }
          .tax-box { background: #fefce8; border: 1px solid #fef08a; border-radius: 8px; padding: 12px; margin-bottom: 18px; }
          .tax-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 11px; }
          .tax-total { border-top: 1.5px solid #ca8a04; font-weight: 900; color: #854d0e; padding-top: 6px; margin-top: 4px; font-size: 12px; }
          .sign-box { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 35px; padding-top: 15px; border-top: 1px dashed #cbd5e1; }
          .sign-pane { border: 1px dashed #cbd5e1; border-radius: 8px; padding: 14px; min-height: 80px; position: relative; }
          .sign-title { font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; }
          .sign-footer { position: absolute; bottom: 8px; left: 14px; font-size: 10px; font-weight: 700; color: #0f172a; }
          .btn-print { background: #1e4a7e; color: #fff; padding: 8px 18px; border-radius: 6px; border: none; font-weight: 700; cursor: pointer; }
          .bar-top { background: #0f172a; color: white; padding: 10px 18px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <div class="bar-top no-print">
          <span><strong>Chartered Accountant Statement Preview</strong> — Press button to print or save as PDF.</span>
          <button class="btn-print" onclick="window.print()">🖨️ Print / Save as PDF</button>
        </div>

        <div class="header-box">
          <div>
            <div class="logo-text">${cs.businessName || 'The Shine Lounge Pvt Ltd'}</div>
            <div class="sub-text">Trade Name: ${cs.tradeName || 'The Shine Lounge'} • GSTIN: <strong>${cs.gstin || '27AABCT8742L1ZK'}</strong> • PAN: <strong>${cs.pan || 'AABCT8742L'}</strong></div>
            <div class="sub-text">${cs.registeredAddress || 'Plot 42, Senapati Bapat Marg, Lower Parel, Mumbai 400013'}</div>
          </div>
          <div class="meta-badge">
            <div>AUDIT STATEMENT: <strong>${timeRange}</strong></div>
            <div>FISCAL YEAR: <strong>${cs.fiscalYear || 'FY 2025-26'}</strong></div>
            <div>DATE: ${reportDate}</div>
          </div>
        </div>

        <div class="grid-4">
          <div class="kpi-card">
            <div class="kpi-label">Gross Sales Turnover</div>
            <div class="kpi-val" style="color:#0f172a;">${formatINR(summary.grossSales)}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Taxable Base Amount</div>
            <div class="kpi-val" style="color:#1e4a7e;">${formatINR(summary.netSales)}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Total GST Output (18%)</div>
            <div class="kpi-val" style="color:#c2410c;">${formatINR(summary.totalGst)}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Net Operating Profit</div>
            <div class="kpi-val" style="color:#16a34a;">${formatINR(summary.netProfit)}</div>
          </div>
        </div>

        <div class="section-heading">1. Statutory GST Tax Schedule (GSTR-1 & GSTR-3B Matching)</div>
        <div class="tax-box">
          <div class="tax-row">
            <span>Gross Sales (Including all online POS & counter sales)</span>
            <strong>${formatINR(summary.grossSales)}</strong>
          </div>
          <div class="tax-row">
            <span>Net Taxable Base (${cs.gstPricingMode === 'exclusive' ? 'Exclusive Mode' : 'Inclusive Mode'})</span>
            <strong>${formatINR(summary.netSales)}</strong>
          </div>
          <div class="tax-row">
            <span>Central GST (CGST @ ${(summary.effectiveTaxRate / 2).toFixed(1)}%)</span>
            <strong style="color:#c2410c;">${formatINR(summary.cgst)}</strong>
          </div>
          <div class="tax-row">
            <span>State GST (SGST @ ${(summary.effectiveTaxRate / 2).toFixed(1)}%)</span>
            <strong style="color:#c2410c;">${formatINR(summary.sgst)}</strong>
          </div>
          <div class="tax-row tax-total">
            <span>Total Output Tax Payable Liability</span>
            <span>${formatINR(summary.totalGst)}</span>
          </div>
        </div>

        <div class="section-heading">2. SAC Code Wise Service Revenue Audit Schedule</div>
        <table>
          <thead>
            <tr>
              <th>Service Department</th>
              <th>SAC Code</th>
              <th>GST Rate</th>
              <th>Taxable Value (₹)</th>
              <th>CGST (₹)</th>
              <th>SGST (₹)</th>
              <th>Total Tax (₹)</th>
              <th>Gross Sales (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${summary.departmentBreakdown.map(d => `
              <tr>
                <td><strong>${d.name}</strong></td>
                <td><code style="background:#f1f5f9;padding:2px 5px;border-radius:4px;">${d.sacCode}</code></td>
                <td>${d.rate}%</td>
                <td>${formatINR(d.taxable)}</td>
                <td>${formatINR(d.cgst)}</td>
                <td>${formatINR(d.sgst)}</td>
                <td><strong>${formatINR(d.tax)}</strong></td>
                <td><strong>${formatINR(d.gross)}</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="section-heading">3. P&L Operational Deductions & Net Margin Computation</div>
        <table>
          <thead>
            <tr>
              <th>Expense / Deduction Head</th>
              <th>Configured Rate (%)</th>
              <th>Basis</th>
              <th>Deducted Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Operating Overheads (Rent, Utilities, Consumables)</td>
              <td>${cs.operatingOverheadRate || 18.5}%</td>
              <td>Net Taxable Base</td>
              <td>${formatINR(summary.operatingOverheads)}</td>
            </tr>
            <tr>
              <td>Staff Performance Incentive Pool</td>
              <td>${cs.staffIncentiveRate || 7.5}%</td>
              <td>Net Taxable Base</td>
              <td>${formatINR(summary.staffIncentives)}</td>
            </tr>
            <tr>
              <td>Payment Gateway & POS Surcharge</td>
              <td>${cs.gatewaySurchargeRate || 1.8}%</td>
              <td>Gross Turnover</td>
              <td>${formatINR(summary.gatewayFees)}</td>
            </tr>
            <tr>
              <td>Equipment Depreciation & Capital Reserve</td>
              <td>${cs.depreciationReserveRate || 2.2}%</td>
              <td>Net Taxable Base</td>
              <td>${formatINR(summary.depreciationReserve)}</td>
            </tr>
            <tr style="background:#f1f5f9;font-weight:800;">
              <td>Total Allowable Operational Expenditure</td>
              <td>—</td>
              <td>Combined Deductions</td>
              <td><strong>${formatINR(summary.totalDeductions)}</strong></td>
            </tr>
            <tr style="background:#ecfdf5;font-weight:900;color:#065f46;">
              <td>Net Operating Earnings (EBITDA Margin: ${summary.netProfitMargin}%)</td>
              <td>—</td>
              <td>Net Base - Expenses</td>
              <td><strong>${formatINR(summary.netProfit)}</strong></td>
            </tr>
          </tbody>
        </table>

        <div class="section-heading">4. Statutory Declaration & Auditor Endorsement</div>
        <p style="font-size:10px;color:#475569;margin-bottom:15px;">
          I/We confirm that the turnover and GST liability figures recorded above have been reconciled with the digital transaction register and counter POS logs of <strong>${cs.businessName || 'The Shine Lounge Pvt Ltd'}</strong> for the period ${timeRange}.
        </p>

        <div class="sign-box">
          <div class="sign-pane">
            <div class="sign-title">Prepared & Certified By: Management</div>
            <div class="sign-footer">Authorized Signatory • The Shine Lounge</div>
          </div>
          <div class="sign-pane">
            <div class="sign-title">Reviewed & Verified By: Chartered Accountant</div>
            <div style="font-size:11px;font-weight:800;color:#1e4a7e;margin-top:6px;">
              ${cs.caName || 'CA Rajesh Agarwal'}
            </div>
            <div style="font-size:10px;color:#64748b;">
              ${cs.caFirmName || 'R. Agarwal & Associates, Chartered Accountants'}<br/>
              Membership: <strong>${cs.caMembershipNo || 'FCA-084291'}</strong>
            </div>
            <div class="sign-footer">CA Stamp & UDIN Signature</div>
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 600);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 w-full max-w-4xl my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 p-6 text-white flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-black tracking-wide uppercase">
                Chartered Accountant (CA) Tax & Revenue Statement
              </h2>
            </div>
            <p className="text-xs text-slate-300">
              Statutory GST 18%, SAC reconciliation, P&L deductions and executive revenue statement for CA audit.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] font-semibold text-slate-300">
              <span className="bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
                GSTIN: <strong className="text-white">{cs.gstin || '27AABCT8742L1ZK'}</strong>
              </span>
              <span className="bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
                PAN: <strong className="text-white">{cs.pan || 'AABCT8742L'}</strong>
              </span>
              <span className="bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-lg border border-amber-500/30 font-bold">
                Period: {timeRange} ({cs.fiscalYear || 'FY 2025-26'})
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 max-h-[72vh] overflow-y-auto space-y-6 text-xs text-gray-700">
          {/* CA Assigned Profile Banner */}
          <div className="bg-blue-50/80 border border-blue-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow-xs">
                CA
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">{cs.caName || 'CA Rajesh Agarwal'}</h4>
                <p className="text-xs text-blue-800 font-medium">
                  {cs.caFirmName || 'R. Agarwal & Associates, Chartered Accountants'} • Reg #{cs.caMembershipNo || 'FCA-084291'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold">
              <span className="text-gray-500 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-gray-400" /> {cs.caPhone || '+91 98201 23456'}
              </span>
              <span className="text-gray-300">•</span>
              <span className="text-gray-500 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-gray-400" /> {cs.caEmail || 'tax.audit@theshinelounge.com'}
              </span>
            </div>
          </div>

          {/* 4 Financial Audit KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Gross Turnover</span>
              <span className="text-xl font-black text-gray-900 mt-1 block">{formatINR(summary.grossSales)}</span>
              <span className="text-[10px] text-emerald-600 font-bold">All POS & Web Channels</span>
            </div>
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Taxable Base</span>
              <span className="text-xl font-black text-blue-900 mt-1 block">{formatINR(summary.netSales)}</span>
              <span className="text-[10px] text-gray-400 font-medium">Base Net Revenue</span>
            </div>
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total GST Output</span>
              <span className="text-xl font-black text-amber-600 mt-1 block">{formatINR(summary.totalGst)}</span>
              <span className="text-[10px] text-amber-600 font-bold">CGST + SGST (18%)</span>
            </div>
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Net Operating Profit</span>
              <span className="text-xl font-black text-emerald-600 mt-1 block">{formatINR(summary.netProfit)}</span>
              <span className="text-[10px] text-emerald-600 font-bold">Margin: {summary.netProfitMargin}%</span>
            </div>
          </div>

          {/* Section 1: GST Breakdown Table */}
          <div className="space-y-2">
            <h3 className="font-extrabold text-gray-900 text-xs uppercase tracking-wider border-l-3 border-amber-500 pl-2.5">
              1. Statutory GST 18% Output Liability Breakdown
            </h3>
            <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-4 space-y-2.5">
              <div className="flex justify-between py-1 border-b border-amber-200/60 font-semibold">
                <span>Net Taxable Base Turnover</span>
                <span className="font-mono font-bold text-gray-900">{formatINR(summary.netSales)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-amber-200/60 font-semibold">
                <span>Central GST (CGST @ {(summary.effectiveTaxRate / 2).toFixed(1)}%)</span>
                <span className="font-mono font-bold text-amber-700">{formatINR(summary.cgst)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-amber-200/60 font-semibold">
                <span>State GST (SGST @ {(summary.effectiveTaxRate / 2).toFixed(1)}%)</span>
                <span className="font-mono font-bold text-amber-700">{formatINR(summary.sgst)}</span>
              </div>
              <div className="flex justify-between pt-1 font-black text-amber-900 text-sm">
                <span>Total Output Tax Payable Liability</span>
                <span className="font-mono">{formatINR(summary.totalGst)}</span>
              </div>
            </div>
          </div>

          {/* Section 2: SAC Schedule */}
          <div className="space-y-2">
            <h3 className="font-extrabold text-gray-900 text-xs uppercase tracking-wider border-l-3 border-blue-600 pl-2.5">
              2. SAC Code Wise Revenue & Tax Schedule
            </h3>
            <div className="border border-gray-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 text-[10px] uppercase font-bold">
                  <tr>
                    <th className="py-2.5 px-3">Service Department</th>
                    <th className="py-2.5 px-3">SAC Code</th>
                    <th className="py-2.5 px-3">GST Rate</th>
                    <th className="py-2.5 px-3 text-right">Taxable Value</th>
                    <th className="py-2.5 px-3 text-right">CGST</th>
                    <th className="py-2.5 px-3 text-right">SGST</th>
                    <th className="py-2.5 px-3 text-right">Gross Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {summary.departmentBreakdown.map((item) => (
                    <tr key={item.key} className="hover:bg-gray-50/50">
                      <td className="py-2.5 px-3 font-bold text-gray-900">{item.name}</td>
                      <td className="py-2.5 px-3">
                        <code className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-mono text-[11px] font-bold">
                          {item.sacCode}
                        </code>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-gray-600">{item.rate}%</td>
                      <td className="py-2.5 px-3 text-right font-mono">{formatINR(item.taxable)}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-amber-700">{formatINR(item.cgst)}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-amber-700">{formatINR(item.sgst)}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-gray-900">{formatINR(item.gross)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Operational Cost Deductions & Net Margin */}
          <div className="space-y-2">
            <h3 className="font-extrabold text-gray-900 text-xs uppercase tracking-wider border-l-3 border-emerald-600 pl-2.5">
              3. Operational Cost Deductions & Net Profit (EBITDA)
            </h3>
            <div className="border border-gray-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 text-[10px] uppercase font-bold">
                  <tr>
                    <th className="py-2.5 px-3">Expense Head</th>
                    <th className="py-2.5 px-3">Configured Ratio</th>
                    <th className="py-2.5 px-3">Computation Base</th>
                    <th className="py-2.5 px-3 text-right">Deducted Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  <tr>
                    <td className="py-2 px-3 font-bold text-gray-900">Operating Overheads (Rent, Water, Power)</td>
                    <td className="py-2 px-3">{cs.operatingOverheadRate || 18.5}%</td>
                    <td className="py-2 px-3 text-gray-500">Net Taxable Base</td>
                    <td className="py-2 px-3 text-right font-mono">{formatINR(summary.operatingOverheads)}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-gray-900">Staff Performance Incentive Pool</td>
                    <td className="py-2 px-3">{cs.staffIncentiveRate || 7.5}%</td>
                    <td className="py-2 px-3 text-gray-500">Net Taxable Base</td>
                    <td className="py-2 px-3 text-right font-mono">{formatINR(summary.staffIncentives)}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-gray-900">Payment Gateway & Surcharge Fees</td>
                    <td className="py-2 px-3">{cs.gatewaySurchargeRate || 1.8}%</td>
                    <td className="py-2 px-3 text-gray-500">Gross Turnover</td>
                    <td className="py-2 px-3 text-right font-mono">{formatINR(summary.gatewayFees)}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-gray-900">Equipment Depreciation Reserve</td>
                    <td className="py-2 px-3">{cs.depreciationReserveRate || 2.2}%</td>
                    <td className="py-2 px-3 text-gray-500">Net Taxable Base</td>
                    <td className="py-2 px-3 text-right font-mono">{formatINR(summary.depreciationReserve)}</td>
                  </tr>
                  <tr className="bg-emerald-50/60 font-bold text-emerald-900">
                    <td className="py-2.5 px-3" colSpan="3">
                      Net Operating Profit (Margin: {summary.netProfitMargin}%)
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-sm font-black text-emerald-700">
                      {formatINR(summary.netProfit)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] text-gray-500 font-medium text-center sm:text-left">
            Ready to export for <strong>GSTR-3B & Balance Sheet Filing</strong>.
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Share to CA WhatsApp */}
            <button
              onClick={handleShareWhatsApp}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-extrabold text-white text-xs bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all"
            >
              <Share2 className="w-4 h-4" /> Share via WhatsApp
            </button>

            {/* Email to CA */}
            <button
              onClick={handleShareEmail}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 text-xs shadow-2xs transition-all"
            >
              <Mail className="w-4 h-4 text-blue-600" /> Email to CA
            </button>

            {/* Print / Save as PDF */}
            <button
              onClick={handlePrintPDF}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-extrabold text-white text-xs shadow-sm hover:opacity-95 transition-all"
              style={{ backgroundColor: '#e07b2a' }}
            >
              <Printer className="w-4 h-4" /> Print / Save as PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
