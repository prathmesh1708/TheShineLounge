import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Download, Loader2, Printer } from 'lucide-react';
import ReceiptDocument, { formatReceiptDate, getReceiptValidityRange } from '../../../common/components/ReceiptDocument';
import { downloadReceiptPdf, printReceiptDocument } from '../../../common/utils/receiptPdfGenerator';
import {
  getInvoiceWhatsAppConfig, sendReceiptOnWhatsApp, renderReceiptTemplate, saleTemplateValues, whatsappNumber
} from '../../../common/services/whatsappInvoiceService';


export default function OfflineSaleInvoiceModal({ isOpen, onClose, sale }) {
  const receiptRef = useRef(null);
  const isProcessingRef = useRef(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = async () => {
    if (!receiptRef.current || isPrinting) return;
    try {
      setIsPrinting(true);
      await printReceiptDocument(receiptRef.current);
    } catch (err) {
      console.error('Print error:', err);
      window.print();
    } finally {
      setIsPrinting(false);
    }
  };

  // Extract and format clean customer phone number
  const getInitialPhone = () => {
    if (!sale) return '';
    return String(sale.phone || sale.mobile || sale.customerPhone || '').trim();
  };


  const [targetPhone, setTargetPhone] = useState(getInitialPhone);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [statusNotice, setStatusNotice] = useState(null);
  // Business WhatsApp API (admin → WhatsApp Hub). null while loading. The
  // receipt PDF is only ever sent from the business number — never by opening
  // WhatsApp Web / wa.me in the browser.
  const [waApi, setWaApi] = useState(null);
  const [directError, setDirectError] = useState('');
  const autoSendRef = useRef(null);
  const autoHandledRef = useRef(null);

  useEffect(() => {
    let alive = true;
    if (isOpen) getInvoiceWhatsAppConfig().then((cfg) => { if (alive) setWaApi(cfg || { enabled: false }); });
    return () => { alive = false; };
  }, [isOpen]);

  useEffect(() => {
    setTargetPhone(getInitialPhone());
    setPhoneError('');
    setStatusNotice(null);
    setDirectError('');
    setShowWhatsAppModal(false);
  }, [sale]);

  // The row's "WhatsApp" button opens this modal with autoOpenWhatsApp: send
  // right away once the receipt has painted (it is what becomes the PDF).
  useEffect(() => {
    if (!isOpen || !sale || !sale.autoOpenWhatsApp || waApi === null) return undefined;
    if (autoHandledRef.current === sale) return undefined;
    const t = setTimeout(() => {
      if (autoHandledRef.current === sale) return;
      autoHandledRef.current = sale;
      if (autoSendRef.current) autoSendRef.current();
    }, 500);
    return () => clearTimeout(t);
  }, [isOpen, sale, waApi]);

  if (!isOpen || !sale) return null;

  const isMembership = sale.saleType === 'membership' || !!sale.membershipName;
  const planName = sale.packageName || sale.membershipName || (isMembership ? 'Monthly Membership' : 'Car Wash Service');
  const price = Number(sale.price || sale.total || sale.amount || 0);
  const receiptNo = sale.seqId || sale.id || sale.bookingId || sale.receiptNo || 'OFS-TSH-01';
  const issuedDate = formatReceiptDate(sale.date || sale.createdAt);
  const validityRange = getReceiptValidityRange(sale, issuedDate);

  const handleDownloadPdfOnly = async () => {
    if (!receiptRef.current || isGeneratingPdf) return;
    try {
      setIsGeneratingPdf(true);
      const filename = `Invoice-${receiptNo}.pdf`;
      await downloadReceiptPdf(receiptRef.current, filename);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Could not generate PDF directly. Opening print dialog...');
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };


  const apiOn = Boolean(waApi && waApi.enabled);

  // Direct send: PDF uploaded and delivered as a WhatsApp document by the API.
  const sendDirect = async (number, template = waApi && waApi.template) => {
    if (isProcessingRef.current) return;
    if (!receiptRef.current) {
      setDirectError('Receipt document is still preparing. Please try again in a moment.');
      setShowWhatsAppModal(true);
      return;
    }
    isProcessingRef.current = true;
    setIsGeneratingPdf(true);
    setDirectError('');
    setStatusNotice({ type: 'info', message: 'Sending the receipt PDF on WhatsApp…' });
    try {
      const res = await sendReceiptOnWhatsApp({
        kind: 'sale',
        receiptNo,
        lookupIds: [sale.bookingId, sale.id, sale._id].filter(Boolean),
        phone: number,
        receiptElement: receiptRef.current,
        template
      });
      setShowWhatsAppModal(false);
      setStatusNotice({
        type: 'success',
        message: res.dryRun ? `Test mode — the receipt PDF would be sent to ${res.phone}.` : `✅ Receipt PDF sent on WhatsApp to ${res.phone}.`
      });
    } catch (err) {
      setStatusNotice(null);
      setDirectError(err.message || 'WhatsApp send failed');
      setShowWhatsAppModal(true);
    } finally {
      setIsGeneratingPdf(false);
      isProcessingRef.current = false;
    }
  };

  // One click: with a valid number on file, send at once through the API;
  // otherwise open the popup to ask for the number. If the API is not ready
  // the popup says why — there is no browser fallback.
  const handleWhatsAppClick = async () => {
    setPhoneError('');
    setDirectError('');
    // Re-check a disabled config so a newly activated API works without a reload.
    const cfg = apiOn ? waApi : await getInvoiceWhatsAppConfig({ force: true });
    setWaApi(cfg || { enabled: false });
    if (!cfg || !cfg.enabled) {
      setDirectError((cfg && cfg.reason) || 'WhatsApp API is not available');
      setShowWhatsAppModal(true);
      return;
    }
    const number = whatsappNumber(targetPhone);
    if (number) {
      sendDirect(number, cfg.template);
      return;
    }
    setPhoneError("Enter the customer's WhatsApp number to send the PDF");
    setShowWhatsAppModal(true);
  };
  autoSendRef.current = handleWhatsAppClick;


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
            {/* Print Invoice Button */}
            <button
              onClick={handlePrint}
              disabled={isGeneratingPdf}
              className="px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border shadow-xs active:scale-95 disabled:opacity-60 bg-white text-[#1e3e62] border-slate-300 hover:bg-slate-50"
              title="Print official tax invoice"
            >
              <Printer className="w-4 h-4 text-[#1e3e62]" />
              <span>Print</span>
            </button>

            {/* "Send via WhatsApp" Button */}
            <button
              onClick={handleWhatsAppClick}
              disabled={isGeneratingPdf}
              className="px-4 sm:px-5 py-2 rounded-full text-xs font-bold text-white shadow-sm hover:shadow-md transition-all flex items-center gap-2 bg-[#1ea952] hover:bg-[#16a34a] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
              title="Send the receipt PDF on WhatsApp"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.301-.15-1.781-.879-2.056-.979-.275-.1-.475-.15-.675.15-.2.301-.775.979-.95 1.179-.175.2-.351.225-.651.075-.3-.15-1.268-.467-2.417-1.492-.894-.798-1.497-1.784-1.673-2.084-.175-.301-.019-.464.131-.613.136-.135.301-.351.451-.526.15-.175.2-.301.3-.501.1-.2.05-.376-.025-.526-.075-.15-.676-1.63-.926-2.233-.243-.587-.49-.508-.675-.518-.175-.009-.375-.01-.575-.01-.2 0-.526.075-.802.376-.275.301-1.052 1.028-1.052 2.508 0 1.48 1.078 2.909 1.228 3.109.15.2 2.122 3.24 5.141 4.544.718.31 1.278.496 1.714.635.722.23 1.378.198 1.9.12.58-.088 1.78-.727 2.03-1.43.25-.702.25-1.303.175-1.43-.075-.126-.275-.201-.575-.351zM12.04 2C6.52 2 2.035 6.485 2.035 12.005c0 1.954.564 3.784 1.542 5.337L2 22l4.82-1.53c1.49.85 3.208 1.335 5.22 1.335 5.52 0 10.005-4.485 10.005-10.005C22.045 6.485 17.56 2 12.04 2zm0 18.27c-1.72 0-3.32-.49-4.68-1.34l-.33-.2-3.13.99.99-3.05-.22-.35c-.93-1.48-1.47-3.23-1.47-5.115 0-4.56 3.71-8.27 8.27-8.27 4.56 0 8.27 3.71 8.27 8.27 0 4.56-3.71 8.27-8.27 8.27z"/>
                  </svg>
                  <span>Send WhatsApp</span>
                </>
              )}
            </button>

            {/* Direct Download PDF Button */}
            <button
              onClick={handleDownloadPdfOnly}
              disabled={isGeneratingPdf}
              className="px-3 sm:px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm hover:shadow-md transition-all flex items-center gap-1.5 bg-[#e07b2a] hover:bg-[#c96a1e] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
              title="Download Official A4 PDF"
            >
              {isGeneratingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Notice banner (e.g. Cancelled or Success) */}
        {statusNotice && (
          <div className={`mx-3 sm:mx-6 mt-3 p-3 rounded-xl flex items-center justify-between text-xs animate-in fade-in shadow-xs ${
            statusNotice.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
              : statusNotice.type === 'error'
              ? 'bg-rose-50 text-rose-900 border border-rose-300'
              : 'bg-slate-100 text-slate-800 border border-slate-300'
          }`}>
            <span className="font-semibold leading-relaxed">{statusNotice.message}</span>
            <button onClick={() => setStatusNotice(null)} className="text-gray-400 hover:text-gray-700 p-1 ml-2">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Scrollable Receipt Preview Canvas */}
        <div className="p-3 sm:p-6 overflow-y-auto custom-scrollbar bg-slate-200/60 flex-1">
          <div
            data-theme="light"
            className="rounded-lg shadow-lg border border-gray-300/80 mx-auto max-w-[794px] overflow-hidden receipt-paper-canvas"
            style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
          >
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

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap sm:flex-nowrap">
            {/* Print Invoice Button */}
            <button
              onClick={handlePrint}
              disabled={isGeneratingPdf}
              className="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border shadow-xs active:scale-95 disabled:opacity-60 bg-slate-50 text-[#1e3e62] border-slate-300 hover:bg-slate-100"
              title="Print official tax invoice"
            >
              <Printer className="w-4 h-4 text-[#1e3e62]" />
              <span>Print</span>
            </button>

            {/* Send via WhatsApp */}
            <button
              onClick={handleWhatsAppClick}
              disabled={isGeneratingPdf}
              className="flex-1 sm:flex-initial px-5 py-2 rounded-full text-xs font-bold text-white shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 bg-[#1ea952] hover:bg-[#16a34a] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.301-.15-1.781-.879-2.056-.979-.275-.1-.475-.15-.675.15-.2.301-.775.979-.95 1.179-.175.2-.351.225-.651.075-.3-.15-1.268-.467-2.417-1.492-.894-.798-1.497-1.784-1.673-2.084-.175-.301-.019-.464.131-.613.136-.135.301-.351.451-.526.15-.175.2-.301.3-.501.1-.2.05-.376-.025-.526-.075-.15-.676-1.63-.926-2.233-.243-.587-.49-.508-.675-.518-.175-.009-.375-.01-.575-.01-.2 0-.526.075-.802.376-.275.301-1.052 1.028-1.052 2.508 0 1.48 1.078 2.909 1.228 3.109.15.2 2.122 3.24 5.141 4.544.718.31 1.278.496 1.714.635.722.23 1.378.198 1.9.12.58-.088 1.78-.727 2.03-1.43.25-.702.25-1.303.175-1.43-.075-.126-.275-.201-.575-.351zM12.04 2C6.52 2 2.035 6.485 2.035 12.005c0 1.954.564 3.784 1.542 5.337L2 22l4.82-1.53c1.49.85 3.208 1.335 5.22 1.335 5.52 0 10.005-4.485 10.005-10.005C22.045 6.485 17.56 2 12.04 2zm0 18.27c-1.72 0-3.32-.49-4.68-1.34l-.33-.2-3.13.99.99-3.05-.22-.35c-.93-1.48-1.47-3.23-1.47-5.115 0-4.56 3.71-8.27 8.27-8.27 4.56 0 8.27 3.71 8.27 8.27 0 4.56-3.71 8.27-8.27 8.27z"/>
                  </svg>
                  <span>Send via WhatsApp</span>
                </>
              )}
            </button>

            {/* Download PDF */}
            <button
              onClick={handleDownloadPdfOnly}
              disabled={isGeneratingPdf}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-1.5 bg-[#e07b2a] hover:bg-[#c96a1e] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
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
              className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 overflow-hidden space-y-4 p-5"
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
                    <p className="text-[10px] text-gray-500">PDF sent directly from The Shine Lounge number</p>
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
                {directError && (
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 space-y-1">
                    <p className="text-[11px] font-bold text-rose-700">Could not send: {directError}</p>
                    {waApi && !waApi.enabled && (
                      <p className="text-[10.5px] leading-relaxed text-rose-800">Direct sending starts once the WhatsApp API is active (Admin → WhatsApp Hub).</p>
                    )}
                  </div>
                )}

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

                {/* Info preview & WhatsApp Message Preview */}
                <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-2.5 space-y-2">
                  <div className="flex justify-between text-[11px] font-bold text-gray-600">
                    <span>Receipt No:</span>
                    <span className="text-gray-900 font-mono">#{receiptNo}</span>
                  </div>
                  <div className="flex justify-between text-[11px] font-bold text-gray-600">
                    <span>{Array.isArray(sale.vehicles) && sale.vehicles.length > 1 ? 'Vehicles:' : 'Vehicle:'}</span>
                    <span className="text-gray-900 text-right">
                      {Array.isArray(sale.vehicles) && sale.vehicles.length > 0
                        ? sale.vehicles.map(v => v.plateNumber).filter(Boolean).join(', ')
                        : (sale.vehicleNo || 'Registered Vehicle')}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] font-bold text-gray-600">
                    <span>Total Paid:</span>
                    <span className="text-emerald-700 font-black">₹{price.toLocaleString('en-IN')}</span>
                  </div>

                  {apiOn && (
                    <div className="pt-2 border-t border-emerald-200/60">
                      <p className="text-[10px] font-bold text-emerald-900 uppercase tracking-wide mb-1.5">
                        Message (approved template{waApi.template && waApi.template.headerType === 'document' ? ' + receipt PDF' : ''})
                      </p>
                      <div className="w-full p-2.5 bg-white border border-emerald-200 rounded-xl text-[11px] text-gray-800 whitespace-pre-wrap leading-relaxed">
                        {renderReceiptTemplate(waApi.template, saleTemplateValues(sale, receiptNo))}
                      </div>
                    </div>
                  )}

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
                  onClick={() => {
                    const number = whatsappNumber(targetPhone);
                    if (!number) {
                      setPhoneError('Please enter a valid 10-digit mobile number');
                      return;
                    }
                    sendDirect(number);
                  }}
                  disabled={isGeneratingPdf || !apiOn}
                  className="flex-1 py-2.5 text-xs font-black text-white bg-[#1ea952] hover:bg-[#16a34a] rounded-full shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-60"
                >
                  {isGeneratingPdf ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.301-.15-1.781-.879-2.056-.979-.275-.1-.475-.15-.675.15-.2.301-.775.979-.95 1.179-.175.2-.351.225-.651.075-.3-.15-1.268-.467-2.417-1.492-.894-.798-1.497-1.784-1.673-2.084-.175-.301-.019-.464.131-.613.136-.135.301-.351.451-.526.15-.175.2-.301.3-.501.1-.2.05-.376-.025-.526-.075-.15-.676-1.63-.926-2.233-.243-.587-.49-.508-.675-.518-.175-.009-.375-.01-.575-.01-.2 0-.526.075-.802.376-.275.301-1.052 1.028-1.052 2.508 0 1.48 1.078 2.909 1.228 3.109.15.2 2.122 3.24 5.141 4.544.718.31 1.278.496 1.714.635.722.23 1.378.198 1.9.12.58-.088 1.78-.727 2.03-1.43.25-.702.25-1.303.175-1.43-.075-.126-.275-.201-.575-.351zM12.04 2C6.52 2 2.035 6.485 2.035 12.005c0 1.954.564 3.784 1.542 5.337L2 22l4.82-1.53c1.49.85 3.208 1.335 5.22 1.335 5.52 0 10.005-4.485 10.005-10.005C22.045 6.485 17.56 2 12.04 2zm0 18.27c-1.72 0-3.32-.49-4.68-1.34l-.33-.2-3.13.99.99-3.05-.22-.35c-.93-1.48-1.47-3.23-1.47-5.115 0-4.56 3.71-8.27 8.27-8.27 4.56 0 8.27 3.71 8.27 8.27 0 4.56-3.71 8.27-8.27 8.27z"/>
                      </svg>
                      <span>Send PDF on WhatsApp</span>
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

