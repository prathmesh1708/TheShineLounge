import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Download, Loader2 } from 'lucide-react';
import ReceiptDocument, { formatReceiptDate, getReceiptValidityRange } from '../../../common/components/ReceiptDocument';
import { downloadReceiptPdf, shareOrDownloadReceiptPdf } from '../../../common/utils/receiptPdfGenerator';


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
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  useEffect(() => {
    setTargetPhone(getInitialPhone());
    setPhoneError('');
    if (sale && sale.autoOpenWhatsApp) {
      setShowWhatsAppModal(true);
    }
  }, [sale]);

  if (!isOpen || !sale) return null;

  const isMembership = sale.saleType === 'membership' || !!sale.membershipName;
  const planName = sale.packageName || sale.membershipName || (isMembership ? 'Monthly Membership' : 'Car Wash Service');
  const price = Number(sale.price || sale.total || sale.amount || 0);
  const receiptNo = sale.id || sale.bookingId || sale.receiptNo || 'OFS-2026-001';
  const issuedDate = formatReceiptDate(sale.date || sale.createdAt);
  const validityRange = getReceiptValidityRange(sale, issuedDate);

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
    const docTitle = isMembership ? 'MEMBERSHIP RECEIPT' : 'SERVICE RECEIPT';
    const customer = sale.customerName || 'Valued Customer';
    const plate = sale.vehicleNo ? sale.vehicleNo : 'Registered Vehicle';
    const model = sale.vehicleModel || sale.vehicleType || 'Car';
    const payMode = sale.paymentMode || 'Cash';
    const amountStr = `₹${price.toLocaleString('en-IN')}`;
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://app.theshinelounge.in';
    const receiptUrl = `${origin}/receipt/${encodeURIComponent(receiptNo)}`;

    return `✨ *THE SHINE LOUNGE - ${docTitle}* ✨\n━━━━━━━━━━━━━━━━━━━━\n📄 *Receipt No:* #${receiptNo}\n📅 *Issued Date:* ${issuedDate}\n👤 *Member / Customer:* ${customer}\n🚗 *Vehicle:* ${plate} (${model})\n📦 *Plan / Service:* ${planName}\n💳 *Payment Mode:* ${payMode}\n💰 *Total Paid:* ${amountStr}\n⏳ *Validity:* ${validityRange}\n━━━━━━━━━━━━━━━━━━━━\n📥 *Official Digital PDF Receipt:* \n${receiptUrl}\n\n📍 *The Shine Lounge - Premium Car Care*\n📞 *Helpline:* +91 98200 99999\n🌐 *Website:* https://theshinelounge.com\n\n🙏 _Thank you for choosing The Shine Lounge! Show this digital receipt or vehicle plate at our bay._`;
  };

  const handleDownloadPdfOnly = async () => {
    if (!receiptRef.current) return;
    try {
      setIsGeneratingPdf(true);
      const filename = `Receipt-${receiptNo}.pdf`;
      await downloadReceiptPdf(receiptRef.current, filename);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Could not generate PDF directly. Opening print dialog...');
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleSendWhatsApp = async (phoneToSend) => {
    const rawNumber = phoneToSend !== undefined ? phoneToSend : targetPhone;
    const sanitized = cleanPhoneForWhatsApp(rawNumber);

    if (!sanitized || sanitized.length < 10) {
      setPhoneError('Please enter a valid 10-digit mobile number');
      setShowWhatsAppModal(true);
      return;
    }

    try {
      setIsGeneratingPdf(true);
      const filename = `Receipt-${receiptNo}.pdf`;

      // 1. Download/Generate PDF for user so they have the file ready
      if (receiptRef.current) {
        await shareOrDownloadReceiptPdf(receiptRef.current, filename, `The Shine Lounge Receipt #${receiptNo}`);
      }

      // 2. Open WhatsApp Web / App with pre-filled message and direct digital receipt link
      const message = generateWhatsAppMessage();
      const whatsappUrl = `https://api.whatsapp.com/send?phone=${sanitized}&text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');

      setShowWhatsAppModal(false);
      setPhoneError('');
    } catch (error) {
      console.error('Error in WhatsApp PDF send:', error);
      // Still open WhatsApp even if PDF export failed
      const message = generateWhatsAppMessage();
      const whatsappUrl = `https://api.whatsapp.com/send?phone=${sanitized}&text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      setShowWhatsAppModal(false);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-4 bg-gray-900/75 backdrop-blur-sm overflow-y-auto">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Dialog */}
      <div
        className="relative z-10 w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col my-4 sm:my-6 max-h-[96vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Control Bar */}
        <div className="px-4 sm:px-6 py-3 border-b border-gray-100 flex items-center justify-between gap-2 bg-slate-50/90 flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs sm:text-sm font-black tracking-wide text-[#1e3e62] truncate uppercase flex items-center gap-1.5">
              <span>📄</span>
              <span>{isMembership ? 'Membership Receipt' : 'Service Receipt'}</span>
            </span>
            <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-[#1e3e62]">
              #{receiptNo}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* "Send via WhatsApp" Button - strictly matching user design image 2 */}
            <button
              onClick={() => setShowWhatsAppModal(true)}
              disabled={isGeneratingPdf}
              className="px-4 sm:px-5 py-2 rounded-full text-xs font-bold text-white shadow-sm hover:shadow-md transition-all flex items-center gap-2 bg-[#1ea952] hover:bg-[#16a34a] active:scale-95 disabled:opacity-60"
              title="Send Receipt via WhatsApp with PDF"
            >
              {isGeneratingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.301-.15-1.781-.879-2.056-.979-.275-.1-.475-.15-.675.15-.2.301-.775.979-.95 1.179-.175.2-.351.225-.651.075-.3-.15-1.268-.467-2.417-1.492-.894-.798-1.497-1.784-1.673-2.084-.175-.301-.019-.464.131-.613.136-.135.301-.351.451-.526.15-.175.2-.301.3-.501.1-.2.05-.376-.025-.526-.075-.15-.676-1.63-.926-2.233-.243-.587-.49-.508-.675-.518-.175-.009-.375-.01-.575-.01-.2 0-.526.075-.802.376-.275.301-1.052 1.028-1.052 2.508 0 1.48 1.078 2.909 1.228 3.109.15.2 2.122 3.24 5.141 4.544.718.31 1.278.496 1.714.635.722.23 1.378.198 1.9.12.58-.088 1.78-.727 2.03-1.43.25-.702.25-1.303.175-1.43-.075-.126-.275-.201-.575-.351zM12.04 2C6.52 2 2.035 6.485 2.035 12.005c0 1.954.564 3.784 1.542 5.337L2 22l4.82-1.53c1.49.85 3.208 1.335 5.22 1.335 5.52 0 10.005-4.485 10.005-10.005C22.045 6.485 17.56 2 12.04 2zm0 18.27c-1.72 0-3.32-.49-4.68-1.34l-.33-.2-3.13.99.99-3.05-.22-.35c-.93-1.48-1.47-3.23-1.47-5.115 0-4.56 3.71-8.27 8.27-8.27 4.56 0 8.27 3.71 8.27 8.27 0 4.56-3.71 8.27-8.27 8.27z"/>
                </svg>
              )}
              <span>Send via WhatsApp</span>
            </button>

            {/* Direct Download PDF Button */}
            <button
              onClick={handleDownloadPdfOnly}
              disabled={isGeneratingPdf}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm hover:shadow-md transition-all flex items-center gap-1.5 bg-[#e07b2a] hover:bg-[#c96a1e] active:scale-95 disabled:opacity-60"
              title="Download Official A4 PDF"
            >
              {isGeneratingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Download PDF</span>
              <span className="sm:hidden">PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Receipt Preview Canvas */}
        <div className="p-3 sm:p-6 overflow-y-auto custom-scrollbar bg-slate-200/60 flex-1">
          <div className="bg-white rounded-lg shadow-lg border border-gray-300/80 mx-auto max-w-[794px] overflow-hidden">
            <ReceiptDocument ref={receiptRef} sale={sale} />
          </div>
        </div>

        {/* Bottom Control Bar */}
        <div className="px-4 sm:px-6 py-3 border-t border-gray-100 flex items-center justify-between gap-3 bg-white flex-shrink-0">
          <div className="text-xs text-gray-500 hidden sm:flex items-center gap-2 min-w-0">
            <span className="text-gray-400">Customer:</span>
            <strong className="text-gray-800 font-bold truncate">{sale.customerName || 'Valued Customer'}</strong>
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
              disabled={isGeneratingPdf}
              className="flex-1 sm:flex-initial px-5 py-2 rounded-full text-xs font-bold text-white shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 bg-[#1ea952] hover:bg-[#16a34a] active:scale-95 disabled:opacity-60"
            >
              <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.301-.15-1.781-.879-2.056-.979-.275-.1-.475-.15-.675.15-.2.301-.775.979-.95 1.179-.175.2-.351.225-.651.075-.3-.15-1.268-.467-2.417-1.492-.894-.798-1.497-1.784-1.673-2.084-.175-.301-.019-.464.131-.613.136-.135.301-.351.451-.526.15-.175.2-.301.3-.501.1-.2.05-.376-.025-.526-.075-.15-.676-1.63-.926-2.233-.243-.587-.49-.508-.675-.518-.175-.009-.375-.01-.575-.01-.2 0-.526.075-.802.376-.275.301-1.052 1.028-1.052 2.508 0 1.48 1.078 2.909 1.228 3.109.15.2 2.122 3.24 5.141 4.544.718.31 1.278.496 1.714.635.722.23 1.378.198 1.9.12.58-.088 1.78-.727 2.03-1.43.25-.702.25-1.303.175-1.43-.075-.126-.275-.201-.575-.351zM12.04 2C6.52 2 2.035 6.485 2.035 12.005c0 1.954.564 3.784 1.542 5.337L2 22l4.82-1.53c1.49.85 3.208 1.335 5.22 1.335 5.52 0 10.005-4.485 10.005-10.005C22.045 6.485 17.56 2 12.04 2zm0 18.27c-1.72 0-3.32-.49-4.68-1.34l-.33-.2-3.13.99.99-3.05-.22-.35c-.93-1.48-1.47-3.23-1.47-5.115 0-4.56 3.71-8.27 8.27-8.27 4.56 0 8.27 3.71 8.27 8.27 0 4.56-3.71 8.27-8.27 8.27z"/>
              </svg>
              <span>Send via WhatsApp</span>
            </button>
            <button
              onClick={handleDownloadPdfOnly}
              disabled={isGeneratingPdf}
              className="flex-1 sm:flex-initial px-5 py-2 rounded-xl text-xs font-bold text-white shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-1.5 bg-[#e07b2a] hover:bg-[#c96a1e] active:scale-95 disabled:opacity-60"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>

        {/* WhatsApp Send Confirmation & Number Verification Popover Modal */}
        {showWhatsAppModal && (
          <div className="fixed inset-0 z-[100000] flex items-center justify-center p-3 bg-black/65 backdrop-blur-xs animate-in fade-in duration-150">
            <div
              className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-gray-200 overflow-hidden space-y-4 p-5"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#1ea952] text-white flex items-center justify-center shadow-xs">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.301-.15-1.781-.879-2.056-.979-.275-.1-.475-.15-.675.15-.2.301-.775.979-.95 1.179-.175.2-.351.225-.651.075-.3-.15-1.268-.467-2.417-1.492-.894-.798-1.497-1.784-1.673-2.084-.175-.301-.019-.464.131-.613.136-.135.301-.351.451-.526.15-.175.2-.301.3-.501.1-.2.05-.376-.025-.526-.075-.15-.676-1.63-.926-2.233-.243-.587-.49-.508-.675-.518-.175-.009-.375-.01-.575-.01-.2 0-.526.075-.802.376-.275.301-1.052 1.028-1.052 2.508 0 1.48 1.078 2.909 1.228 3.109.15.2 2.122 3.24 5.141 4.544.718.31 1.278.496 1.714.635.722.23 1.378.198 1.9.12.58-.088 1.78-.727 2.03-1.43.25-.702.25-1.303.175-1.43-.075-.126-.275-.201-.575-.351zM12.04 2C6.52 2 2.035 6.485 2.035 12.005c0 1.954.564 3.784 1.542 5.337L2 22l4.82-1.53c1.49.85 3.208 1.335 5.22 1.335 5.52 0 10.005-4.485 10.005-10.005C22.045 6.485 17.56 2 12.04 2zm0 18.27c-1.72 0-3.32-.49-4.68-1.34l-.33-.2-3.13.99.99-3.05-.22-.35c-.93-1.48-1.47-3.23-1.47-5.115 0-4.56 3.71-8.27 8.27-8.27 4.56 0 8.27 3.71 8.27 8.27 0 4.56-3.71 8.27-8.27 8.27z"/>
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-gray-900 leading-tight">Send via WhatsApp</h4>
                    <p className="text-[10px] text-gray-500">Official PDF & Digital Receipt</p>
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
                    <p className="text-[10px] text-gray-400 mt-1">10-digit number will automatically format with country code (+91)</p>
                  )}
                </div>

                {/* Info preview */}
                <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-2.5 space-y-1">
                  <div className="flex justify-between text-[11px] font-bold text-gray-600">
                    <span>Receipt No:</span>
                    <span className="text-gray-900 font-mono">#{receiptNo}</span>
                  </div>
                  <div className="flex justify-between text-[11px] font-bold text-gray-600">
                    <span>Vehicle:</span>
                    <span className="text-gray-900">{sale.vehicleNo || 'Registered Vehicle'}</span>
                  </div>
                  <div className="flex justify-between text-[11px] font-bold text-gray-600">
                    <span>Total Paid:</span>
                    <span className="text-emerald-700 font-black">₹{price.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowWhatsAppModal(false)}
                  disabled={isGeneratingPdf}
                  className="flex-1 py-2.5 text-xs font-bold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSendWhatsApp(targetPhone)}
                  disabled={isGeneratingPdf}
                  className="flex-1 py-2.5 text-xs font-black text-white bg-[#1ea952] hover:bg-[#16a34a] rounded-full shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-60"
                >
                  {isGeneratingPdf ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.301-.15-1.781-.879-2.056-.979-.275-.1-.475-.15-.675.15-.2.301-.775.979-.95 1.179-.175.2-.351.225-.651.075-.3-.15-1.268-.467-2.417-1.492-.894-.798-1.497-1.784-1.673-2.084-.175-.301-.019-.464.131-.613.136-.135.301-.351.451-.526.15-.175.2-.301.3-.501.1-.2.05-.376-.025-.526-.075-.15-.676-1.63-.926-2.233-.243-.587-.49-.508-.675-.518-.175-.009-.375-.01-.575-.01-.2 0-.526.075-.802.376-.275.301-1.052 1.028-1.052 2.508 0 1.48 1.078 2.909 1.228 3.109.15.2 2.122 3.24 5.141 4.544.718.31 1.278.496 1.714.635.722.23 1.378.198 1.9.12.58-.088 1.78-.727 2.03-1.43.25-.702.25-1.303.175-1.43-.075-.126-.275-.201-.575-.351zM12.04 2C6.52 2 2.035 6.485 2.035 12.005c0 1.954.564 3.784 1.542 5.337L2 22l4.82-1.53c1.49.85 3.208 1.335 5.22 1.335 5.52 0 10.005-4.485 10.005-10.005C22.045 6.485 17.56 2 12.04 2zm0 18.27c-1.72 0-3.32-.49-4.68-1.34l-.33-.2-3.13.99.99-3.05-.22-.35c-.93-1.48-1.47-3.23-1.47-5.115 0-4.56 3.71-8.27 8.27-8.27 4.56 0 8.27 3.71 8.27 8.27 0 4.56-3.71 8.27-8.27 8.27z"/>
                      </svg>
                      <span>Send & Download PDF</span>
                    </>
                  )}
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
