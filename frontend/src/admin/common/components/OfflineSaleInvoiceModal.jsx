
import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Printer, Download, CheckCircle2, Phone } from 'lucide-react';
import tslLogo from '../../../assets/images/tsl_logo.png';

export default function OfflineSaleInvoiceModal({ isOpen, onClose, sale }) {
  const receiptRef = useRef(null);

  // Extract and format clean customer phone number
  const getInitialPhone = () => {
    if (!sale) return '';
    return String(sale.phone || sale.mobile || sale.customerPhone || '').trim();
  };

  const [targetPhone, setTargetPhone] = useState(getInitialPhone);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  useEffect(() => {
    setTargetPhone(getInitialPhone());
    setPhoneError('');
  }, [sale]);

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

  const cleanPhoneForWhatsApp = (raw) => {
    if (!raw) return '';
    let digits = String(raw).replace(/\D/g, '');
    if (digits.length === 10) {
      return `91${digits}`;
    }
    if (digits.length === 11 && digits.startsWith('0')) {
      return `91${digits.slice(1)}`;
    }
    return digits;
  };

  const generateWhatsAppMessage = () => {
    const isPass = isMembership;
    const docTitle = isPass ? 'MEMBERSHIP RECEIPT' : 'TAX INVOICE';
    const invId = sale.id || sale.bookingId || 'TSL-INV';
    const customer = sale.customerName || 'Valued Customer';
    const plate = sale.vehicleNo || 'Registered Vehicle';
    const model = sale.vehicleModel || sale.vehicleType || 'Car';
    const service = planName;
    const payMode = sale.paymentMode || 'Cash';
    const amountStr = price > 0 ? `₹${price.toLocaleString('en-IN')}` : 'Complimentary / Membership Redeemed';
    const date = issuedDate;
    const validity = validityRange;

    return `✨ *THE SHINE LOUNGE - ${docTitle}* ✨\n━━━━━━━━━━━━━━━━━━━━\n📄 *Invoice / Ref:* #${invId}\n📅 *Date:* ${date}\n👤 *Customer Name:* ${customer}\n🚗 *Vehicle:* ${plate} (${model})\n📦 *Package / Plan:* ${service}\n💳 *Payment Mode:* ${payMode}\n💰 *Total Amount:* ${amountStr}\n⏳ *Validity / Period:* ${validity}\n━━━━━━━━━━━━━━━━━━━━\n📍 *Location:* Plot 42, Senapati Bapat Marg, Lower Parel, Mumbai 400013\n📞 *Lounge Helpline:* +91 98200 99999\n🌐 *Website:* https://theshinelounge.com\n\n🙏 _Thank you for choosing The Shine Lounge! Show this digital receipt or vehicle plate at our bay._`;
  };

  const handleSendWhatsApp = (phoneToSend) => {
    const rawNumber = phoneToSend !== undefined ? phoneToSend : targetPhone;
    const sanitized = cleanPhoneForWhatsApp(rawNumber);

    if (!sanitized || sanitized.length < 10) {
      setPhoneError('Please enter a valid 10-digit mobile number');
      setShowWhatsAppModal(true);
      return;
    }

    const message = generateWhatsAppMessage();
    const url = `https://api.whatsapp.com/send?phone=${sanitized}&text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    setShowWhatsAppModal(false);
    setPhoneError('');
  };

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
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {/* WhatsApp Direct Send Button */}
            <button
              onClick={() => setShowWhatsAppModal(true)}
              className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold text-white shadow-sm hover:shadow-md transition-all flex items-center gap-1.5 bg-[#25D366] hover:bg-[#20ba59] active:scale-95"
              title="Send Invoice to Customer via WhatsApp"
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.301-.15-1.781-.879-2.056-.979-.275-.1-.475-.15-.675.15-.2.301-.775.979-.95 1.179-.175.2-.351.225-.651.075-.3-.15-1.268-.467-2.417-1.492-.894-.798-1.497-1.784-1.673-2.084-.175-.301-.019-.464.131-.613.136-.135.301-.351.451-.526.15-.175.2-.301.3-.501.1-.2.05-.376-.025-.526-.075-.15-.676-1.63-.926-2.233-.243-.587-.49-.508-.675-.518-.175-.009-.375-.01-.575-.01-.2 0-.526.075-.802.376-.275.301-1.052 1.028-1.052 2.508 0 1.48 1.078 2.909 1.228 3.109.15.2 2.122 3.24 5.141 4.544.718.31 1.278.496 1.714.635.722.23 1.378.198 1.9.12.58-.088 1.78-.727 2.03-1.43.25-.702.25-1.303.175-1.43-.075-.126-.275-.201-.575-.351zM12.04 2C6.52 2 2.035 6.485 2.035 12.005c0 1.954.564 3.784 1.542 5.337L2 22l4.82-1.53c1.49.85 3.208 1.335 5.22 1.335 5.52 0 10.005-4.485 10.005-10.005C22.045 6.485 17.56 2 12.04 2zm0 18.27c-1.72 0-3.32-.49-4.68-1.34l-.33-.2-3.13.99.99-3.05-.22-.35c-.93-1.48-1.47-3.23-1.47-5.115 0-4.56 3.71-8.27 8.27-8.27 4.56 0 8.27 3.71 8.27 8.27 0 4.56-3.71 8.27-8.27 8.27z"/>
              </svg>
              <span className="hidden sm:inline">Send on WhatsApp</span>
              <span className="sm:hidden">WhatsApp</span>
            </button>

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

        {/* Bottom Control Bar */}
        <div className="px-4 sm:px-6 py-3 border-t border-gray-100 flex items-center justify-between gap-3 bg-white flex-shrink-0">
          <div className="text-xs text-gray-500 hidden sm:flex items-center gap-1.5 min-w-0">
            <span className="text-gray-400">Recipient:</span>
            <strong className="text-gray-800 truncate">{sale.customerName || 'Valued Customer'}</strong>
            {sale.phone && (
              <>
                <span className="text-gray-300">•</span>
                <span className="text-gray-600 font-semibold">{sale.phone}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => setShowWhatsAppModal(true)}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-1.5 bg-[#25D366] hover:bg-[#20ba59] active:scale-95"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.301-.15-1.781-.879-2.056-.979-.275-.1-.475-.15-.675.15-.2.301-.775.979-.95 1.179-.175.2-.351.225-.651.075-.3-.15-1.268-.467-2.417-1.492-.894-.798-1.497-1.784-1.673-2.084-.175-.301-.019-.464.131-.613.136-.135.301-.351.451-.526.15-.175.2-.301.3-.501.1-.2.05-.376-.025-.526-.075-.15-.676-1.63-.926-2.233-.243-.587-.49-.508-.675-.518-.175-.009-.375-.01-.575-.01-.2 0-.526.075-.802.376-.275.301-1.052 1.028-1.052 2.508 0 1.48 1.078 2.909 1.228 3.109.15.2 2.122 3.24 5.141 4.544.718.31 1.278.496 1.714.635.722.23 1.378.198 1.9.12.58-.088 1.78-.727 2.03-1.43.25-.702.25-1.303.175-1.43-.075-.126-.275-.201-.575-.351zM12.04 2C6.52 2 2.035 6.485 2.035 12.005c0 1.954.564 3.784 1.542 5.337L2 22l4.82-1.53c1.49.85 3.208 1.335 5.22 1.335 5.52 0 10.005-4.485 10.005-10.005C22.045 6.485 17.56 2 12.04 2zm0 18.27c-1.72 0-3.32-.49-4.68-1.34l-.33-.2-3.13.99.99-3.05-.22-.35c-.93-1.48-1.47-3.23-1.47-5.115 0-4.56 3.71-8.27 8.27-8.27 4.56 0 8.27 3.71 8.27 8.27 0 4.56-3.71 8.27-8.27 8.27z"/>
              </svg>
              <span>Send via WhatsApp</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-1.5"
              style={{ backgroundColor: '#e07b2a' }}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>

        {/* WhatsApp Send Confirmation & Number Verification Popover Modal */}
        {showWhatsAppModal && (
          <div className="fixed inset-0 z-[100000] flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div
              className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-gray-200 overflow-hidden space-y-4 p-5"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#25D366] text-white flex items-center justify-center shadow-xs">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.301-.15-1.781-.879-2.056-.979-.275-.1-.475-.15-.675.15-.2.301-.775.979-.95 1.179-.175.2-.351.225-.651.075-.3-.15-1.268-.467-2.417-1.492-.894-.798-1.497-1.784-1.673-2.084-.175-.301-.019-.464.131-.613.136-.135.301-.351.451-.526.15-.175.2-.301.3-.501.1-.2.05-.376-.025-.526-.075-.15-.676-1.63-.926-2.233-.243-.587-.49-.508-.675-.518-.175-.009-.375-.01-.575-.01-.2 0-.526.075-.802.376-.275.301-1.052 1.028-1.052 2.508 0 1.48 1.078 2.909 1.228 3.109.15.2 2.122 3.24 5.141 4.544.718.31 1.278.496 1.714.635.722.23 1.378.198 1.9.12.58-.088 1.78-.727 2.03-1.43.25-.702.25-1.303.175-1.43-.075-.126-.275-.201-.575-.351zM12.04 2C6.52 2 2.035 6.485 2.035 12.005c0 1.954.564 3.784 1.542 5.337L2 22l4.82-1.53c1.49.85 3.208 1.335 5.22 1.335 5.52 0 10.005-4.485 10.005-10.005C22.045 6.485 17.56 2 12.04 2zm0 18.27c-1.72 0-3.32-.49-4.68-1.34l-.33-.2-3.13.99.99-3.05-.22-.35c-.93-1.48-1.47-3.23-1.47-5.115 0-4.56 3.71-8.27 8.27-8.27 4.56 0 8.27 3.71 8.27 8.27 0 4.56-3.71 8.27-8.27 8.27z"/>
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-gray-900 leading-tight">Send via WhatsApp</h4>
                    <p className="text-[10px] text-gray-500">Official digital invoice</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowWhatsAppModal(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    disabled
                    value={sale.customerName || 'Valued Customer'}
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1">
                    WhatsApp Mobile Number
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. 9820012345 or +91 98200 12345"
                      value={targetPhone}
                      onChange={(e) => {
                        setTargetPhone(e.target.value);
                        setPhoneError('');
                      }}
                      className="w-full p-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  {phoneError ? (
                    <p className="text-[10px] text-rose-600 font-bold mt-1">{phoneError}</p>
                  ) : (
                    <p className="text-[10px] text-gray-400 mt-1">10-digit mobile number will automatically format with +91</p>
                  )}
                </div>

                {/* Message preview snippet */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-2.5 space-y-1">
                  <div className="flex justify-between text-[10px] font-bold text-gray-500">
                    <span>Invoice Ref:</span>
                    <span className="text-gray-900">#{sale.id || sale.bookingId}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-gray-500">
                    <span>Vehicle:</span>
                    <span className="text-gray-900">{sale.vehicleNo} ({sale.vehicleModel || 'Car'})</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-gray-500">
                    <span>Amount:</span>
                    <span className="text-emerald-700 font-black">₹{price.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowWhatsAppModal(false)}
                  className="flex-1 py-2 text-xs font-bold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSendWhatsApp(targetPhone)}
                  className="flex-1 py-2 text-xs font-black text-white bg-[#25D366] hover:bg-[#20ba59] rounded-xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.301-.15-1.781-.879-2.056-.979-.275-.1-.475-.15-.675.15-.2.301-.775.979-.95 1.179-.175.2-.351.225-.651.075-.3-.15-1.268-.467-2.417-1.492-.894-.798-1.497-1.784-1.673-2.084-.175-.301-.019-.464.131-.613.136-.135.301-.351.451-.526.15-.175.2-.301.3-.501.1-.2.05-.376-.025-.526-.075-.15-.676-1.63-.926-2.233-.243-.587-.49-.508-.675-.518-.175-.009-.375-.01-.575-.01-.2 0-.526.075-.802.376-.275.301-1.052 1.028-1.052 2.508 0 1.48 1.078 2.909 1.228 3.109.15.2 2.122 3.24 5.141 4.544.718.31 1.278.496 1.714.635.722.23 1.378.198 1.9.12.58-.088 1.78-.727 2.03-1.43.25-.702.25-1.303.175-1.43-.075-.126-.275-.201-.575-.351zM12.04 2C6.52 2 2.035 6.485 2.035 12.005c0 1.954.564 3.784 1.542 5.337L2 22l4.82-1.53c1.49.85 3.208 1.335 5.22 1.335 5.52 0 10.005-4.485 10.005-10.005C22.045 6.485 17.56 2 12.04 2zm0 18.27c-1.72 0-3.32-.49-4.68-1.34l-.33-.2-3.13.99.99-3.05-.22-.35c-.93-1.48-1.47-3.23-1.47-5.115 0-4.56 3.71-8.27 8.27-8.27 4.56 0 8.27 3.71 8.27 8.27 0 4.56-3.71 8.27-8.27 8.27z"/>
                  </svg>
                  <span>Open WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
