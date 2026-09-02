import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Printer, Download, CheckCircle2 } from 'lucide-react';
import tslLogo from '../../../assets/images/tsl_logo.png';

export default function OfflineSaleInvoiceModal({ isOpen, onClose, sale }) {
  const receiptRef = useRef(null);

  if (!isOpen || !sale) return null;

  const isMembership = sale.saleType === 'membership' || !!sale.membershipName;
  const planName = sale.packageName || sale.membershipName || (isMembership ? 'Monthly Membership' : 'Car Wash Service');
  const price = Number(sale.price || sale.total || sale.amount || 0);

  // Issued date formatting
  const issuedDate = sale.date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  // Validity range computation
  let validityRange = '';
  if (sale.membershipExpiry) {
    validityRange = `${issuedDate} - ${sale.membershipExpiry}`;
  } else if (sale.membershipValidity) {
    validityRange = `${sale.membershipValidity} from ${issuedDate}`;
  } else if (isMembership) {
    const d = new Date();
    const startStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    d.setDate(d.getDate() + 30);
    const endStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    validityRange = `${startStr} - ${endStr}`;
  } else {
    validityRange = issuedDate;
  }

  const handlePrint = () => {
    const printContent = document.getElementById('printable-tsl-receipt');
    if (!printContent) return;

    const win = window.open('', '_blank', 'width=850,height=1000');
    if (!win) {
      window.print();
      return;
    }

    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Receipt - ${sale.customerName || 'Customer'} - ${sale.id || 'TSL'}</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
          <style>
            @page {
              size: A4;
              margin: 0;
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              margin: 0;
              padding: 0;
              background-color: #ffffff;
              color: #0f172a;
            }
            .page-container {
              width: 100%;
              max-width: 800px;
              margin: 0 auto;
              background: #ffffff;
            }
            .header-strip {
              display: flex;
              width: 100%;
              height: 18px;
            }
            .header-strip-blue {
              flex: 0 0 72%;
              background-color: #1e4a7e;
            }
            .header-strip-orange {
              flex: 0 0 28%;
              background-color: #e07b2a;
            }
            .receipt-body {
              padding: 40px 48px;
            }
            .top-header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 44px;
            }
            .brand-col {
              display: flex;
              flex-direction: column;
              align-items: flex-start;
            }
            .brand-logo {
              width: 72px;
              height: 72px;
              object-fit: contain;
            }
            .brand-name {
              font-weight: 900;
              font-size: 13px;
              letter-spacing: 1px;
              color: #0f172a;
              text-transform: uppercase;
              margin-top: 10px;
            }
            .doc-info-col {
              text-align: right;
            }
            .doc-title {
              font-size: 24px;
              font-weight: 900;
              color: #0f172a;
              letter-spacing: -0.5px;
              text-transform: uppercase;
              margin: 0 0 8px 0;
            }
            .doc-meta {
              font-size: 12px;
              color: #64748b;
              margin: 2px 0;
              font-weight: 500;
            }
            .section-title {
              font-size: 11px;
              font-weight: 900;
              color: #1e4a7e;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin: 0 0 16px 0;
            }
            .details-table {
              width: 100%;
              margin-bottom: 36px;
              border-collapse: collapse;
            }
            .details-table td {
              padding: 6px 0;
              vertical-align: top;
              font-size: 13px;
            }
            .details-label {
              width: 38%;
              color: #64748b;
              font-size: 11px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .details-value {
              width: 62%;
              color: #0f172a;
              font-weight: 800;
              font-size: 13px;
            }
            .summary-card {
              background-color: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 14px;
              padding: 22px 24px;
              margin-bottom: 14px;
            }
            .summary-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: 13px;
              color: #334155;
              font-weight: 600;
              margin-bottom: 12px;
            }
            .summary-divider {
              height: 1px;
              background-color: #e2e8f0;
              margin: 14px 0;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .total-label {
              font-size: 13px;
              font-weight: 900;
              color: #0f172a;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .total-amount {
              font-size: 20px;
              font-weight: 900;
              color: #e07b2a;
            }
            .price-notes {
              font-size: 11px;
              color: #64748b;
              line-height: 1.6;
              margin: 0 0 36px 0;
            }
            .confirmed-banner {
              background-color: #1e4a7e;
              color: #ffffff;
              border-radius: 10px;
              padding: 14px 20px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 48px;
            }
            .banner-left {
              font-size: 12px;
              font-weight: 900;
              letter-spacing: 0.8px;
              text-transform: uppercase;
            }
            .banner-right {
              font-size: 11px;
              color: #e2e8f0;
              font-weight: 600;
            }
            .footer-row {
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              padding-top: 16px;
            }
            .footer-brand {
              font-size: 11px;
              font-weight: 900;
              color: #0f172a;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .footer-sub {
              font-size: 10px;
              color: #64748b;
              margin-top: 2px;
            }
            .footer-copy {
              font-size: 11px;
              color: #94a3b8;
              font-weight: 500;
            }
          </style>
        </head>
        <body>
          <div class="page-container">
            ${printContent.innerHTML}
          </div>
          <script>
            window.onload = function() {
              window.focus();
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    win.document.close();
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-4 bg-gray-900/70 backdrop-blur-md overflow-y-auto">
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Dialog */}
      <div
        className="relative z-10 w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col my-4 sm:my-8 max-h-[95vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Control Bar */}
        <div className="px-3.5 sm:px-6 py-2.5 sm:py-3.5 border-b border-gray-100 flex items-center justify-between gap-2 bg-gray-50/80">
          <div className="flex items-center gap-1.5 text-gray-800 min-w-0">
            <span className="text-xs sm:text-sm font-black tracking-wide flex items-center gap-1.5 text-[#1e4a7e] truncate">
              📄 {isMembership ? 'Membership Receipt' : 'Tax Invoice'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={handlePrint}
              className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold text-white shadow-sm hover:shadow-md transition-all flex items-center gap-1.5"
              style={{ backgroundColor: '#e07b2a' }}
              title="Download as PDF or Print"
            >
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Download PDF / Print</span>
              <span className="sm:hidden">Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Receipt Body */}
        <div className="p-2 sm:p-6 overflow-y-auto custom-scrollbar bg-slate-100/50">
          {/* Paper Sheet Preview Container */}
          <div
            id="printable-tsl-receipt"
            ref={receiptRef}
            className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden mx-auto max-w-[700px] text-gray-900"
          >
            {/* Split Top Header Banner (72% Navy, 28% Orange) */}
            <div className="header-strip flex w-full h-[18px]">
              <div className="header-strip-blue flex-[0_0_72%] bg-[#1e4a7e]" />
              <div className="header-strip-orange flex-[0_0_28%] bg-[#e07b2a]" />
            </div>

            {/* Inner Receipt Padding */}
            <div className="receipt-body p-6 sm:p-10 space-y-7">
              {/* Header: Logo & Receipt Title */}
              <div className="top-header flex justify-between items-start gap-4">
                <div className="brand-col flex flex-col items-start">
                  <img
                    src={tslLogo}
                    alt="The Shine Lounge"
                    className="brand-logo w-16 h-16 sm:w-20 sm:h-20 object-contain"
                  />
                  <span className="brand-name font-black text-xs sm:text-sm tracking-wider text-gray-900 uppercase mt-2 block">
                    THE SHINE LOUNGE
                  </span>
                </div>

                <div className="doc-info-col text-right space-y-1">
                  <h1 className="doc-title text-xl sm:text-2xl font-black text-gray-900 uppercase tracking-tight m-0">
                    {isMembership ? 'MEMBERSHIP RECEIPT' : 'SERVICE RECEIPT'}
                  </h1>
                  <p className="doc-meta text-xs text-gray-500 font-medium m-0">
                    Issued: {issuedDate}
                  </p>
                  <p className="doc-meta text-xs text-gray-500 font-medium m-0">
                    Plan: {planName}
                  </p>
                  <p className="doc-meta text-[11px] text-gray-400 font-mono m-0">
                    Receipt No: {sale.id || 'OFS-2026-001'}
                  </p>
                </div>
              </div>

              {/* Member Details */}
              <div>
                <h2 className="section-title text-xs font-black text-[#1e4a7e] uppercase tracking-wider mb-3">
                  {isMembership ? 'MEMBER DETAILS' : 'CUSTOMER & VEHICLE DETAILS'}
                </h2>
                <table className="details-table w-full text-xs sm:text-sm">
                  <tbody>
                    <tr>
                      <td className="details-label py-1.5 w-[38%] text-gray-500 text-[11px] font-bold uppercase tracking-wide">
                        {isMembership ? 'MEMBER NAME' : 'CUSTOMER NAME'}
                      </td>
                      <td className="details-value py-1.5 w-[62%] text-gray-900 font-extrabold">
                        {sale.customerName || 'Valued Customer'}
                      </td>
                    </tr>
                    <tr>
                      <td className="details-label py-1.5 text-gray-500 text-[11px] font-bold uppercase tracking-wide">
                        CONTACT NUMBER
                      </td>
                      <td className="details-value py-1.5 text-gray-900 font-extrabold">
                        {sale.phone || '—'}
                      </td>
                    </tr>
                    {sale.customerEmail && (
                      <tr>
                        <td className="details-label py-1.5 text-gray-500 text-[11px] font-bold uppercase tracking-wide">
                          EMAIL ADDRESS
                        </td>
                        <td className="details-value py-1.5 text-gray-900 font-semibold">
                          {sale.customerEmail}
                        </td>
                      </tr>
                    )}
                    <tr>
                      <td className="details-label py-1.5 text-gray-500 text-[11px] font-bold uppercase tracking-wide">
                        {isMembership ? 'MEMBERSHIP VALIDITY' : 'SERVICE DATE'}
                      </td>
                      <td className="details-value py-1.5 text-gray-900 font-extrabold">
                        {validityRange}
                      </td>
                    </tr>
                    {sale.vehicleNo && (
                      <tr>
                        <td className="details-label py-1.5 text-gray-500 text-[11px] font-bold uppercase tracking-wide">
                          VEHICLE NUMBER
                        </td>
                        <td className="details-value py-1.5 text-gray-900 font-extrabold font-mono tracking-wider">
                          {sale.vehicleNo}
                        </td>
                      </tr>
                    )}
                    {sale.vehicleModel && (
                      <tr>
                        <td className="details-label py-1.5 text-gray-500 text-[11px] font-bold uppercase tracking-wide">
                          VEHICLE MODEL
                        </td>
                        <td className="details-value py-1.5 text-gray-900 font-semibold">
                          {sale.vehicleModel}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Payment Summary */}
              <div>
                <h2 className="section-title text-xs font-black text-[#1e4a7e] uppercase tracking-wider mb-3">
                  PAYMENT SUMMARY
                </h2>
                <div className="summary-card bg-[#f8fafc] border border-slate-200/80 rounded-xl p-5 space-y-3">
                  <div className="summary-row flex justify-between items-center text-xs sm:text-sm font-semibold text-gray-800">
                    <span>{planName}</span>
                    <span>Rs. {price.toLocaleString('en-IN')}</span>
                  </div>

                  <div className="summary-divider border-t border-slate-200/70 my-2" />

                  <div className="total-row flex justify-between items-center pt-1">
                    <span className="total-label text-xs sm:text-sm font-black text-gray-900 uppercase tracking-wide">
                      TOTAL PAID
                    </span>
                    <span className="total-amount text-lg sm:text-xl font-black text-[#e07b2a]">
                      Rs. {price.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <div className="price-notes text-[11px] text-gray-500 space-y-0.5 mt-3">
                  <p>Regular price: Rs. {price.toLocaleString('en-IN')} before applicable taxes.</p>
                  <p>Amount received via {sale.paymentMode || 'Cash'}: Rs. {price.toLocaleString('en-IN')}.</p>
                </div>
              </div>

              {/* Confirmation Banner */}
              <div className="confirmed-banner bg-[#1e4a7e] text-white rounded-xl px-5 py-3.5 flex items-center justify-between shadow-xs">
                <span className="banner-left font-black text-xs tracking-wider uppercase">
                  {isMembership ? 'MEMBERSHIP CONFIRMED' : 'PAYMENT CONFIRMED'}
                </span>
                <span className="banner-right text-xs font-semibold text-blue-100">
                  {isMembership ? `Valid ${validityRange}` : `Completed on ${issuedDate}`}
                </span>
              </div>

              {/* Footer */}
              <div className="footer-row flex justify-between items-end pt-2 border-t border-gray-100">
                <div>
                  <p className="footer-brand font-black text-xs text-gray-900 uppercase tracking-wider">
                    THE SHINE LOUNGE
                  </p>
                  <p className="footer-sub text-[11px] text-gray-500 mt-0.5">
                    Thank you for choosing The Shine Lounge.
                  </p>
                </div>
                <div>
                  <p className="footer-copy text-[11px] text-gray-400 font-medium">
                    Customer Copy
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
