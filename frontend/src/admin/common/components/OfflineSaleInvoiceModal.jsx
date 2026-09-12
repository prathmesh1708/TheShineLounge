import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Download, Loader2, Copy, Check, Image as ImageIcon } from 'lucide-react';
import ReceiptDocument, { formatReceiptDate, getReceiptValidityRange } from '../../../common/components/ReceiptDocument';
import { downloadReceiptPdf, getReceiptPdfBlob, copyReceiptImageToClipboard } from '../../../common/utils/receiptPdfGenerator';
import { apiClient } from '../../../common/utils/apiClient';


export default function OfflineSaleInvoiceModal({ isOpen, onClose, sale }) {
  const receiptRef = useRef(null);
  const isProcessingRef = useRef(false);

  // Extract and format clean customer phone number
  const getInitialPhone = () => {
    if (!sale) return '';
    return String(sale.phone || sale.mobile || sale.customerPhone || '').trim();
  };

  const getDefaultMessage = () => {
    if (!sale) return '';
    const isLocal = typeof window !== 'undefined' && (
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.startsWith('192.168.')
    );
    const org = isLocal ? 'https://app.theshinelounge.in' : (window.location.origin || 'https://app.theshinelounge.in');
    const rNo = sale.id || sale.bookingId || sale.receiptNo || 'OFS-2026-001';
    const cName = sale.customerName || sale.customer || 'Valued Customer';
    const pUrl = `${org}/receipt/${encodeURIComponent(rNo)}?download=pdf`;
    return `Hello ${cName} ,\n\nThank you for choosing The Shine Lounge!\nPlease find your official tax invoice & receipt ${pUrl} attached.\n\n📍 The Shine Lounge`;
  };

  const [targetPhone, setTargetPhone] = useState(getInitialPhone);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isCopyingImage, setIsCopyingImage] = useState(false);
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [statusNotice, setStatusNotice] = useState(null);
  const [editableMessageText, setEditableMessageText] = useState(getDefaultMessage);

  useEffect(() => {
    setTargetPhone(getInitialPhone());
    setPhoneError('');
    setStatusNotice(null);
    setEditableMessageText(getDefaultMessage());
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

  const customerName = sale.customerName || sale.customer || 'Valued Customer';
  const isLocalhost = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.startsWith('192.168.')
  );
  const origin = isLocalhost ? 'https://app.theshinelounge.in' : (window.location.origin || 'https://app.theshinelounge.in');
  const pdfUrl = `${origin}/receipt/${encodeURIComponent(receiptNo)}?download=pdf`;

  // Requested WhatsApp message format
  const messageText = `Hello ${customerName} ,\n\nThank you for choosing The Shine Lounge!\nPlease find your official tax invoice & receipt ${pdfUrl} attached.\n\n📍 The Shine Lounge`;

  const cleanPhoneForWhatsApp = (raw) => {
    if (!raw) return '';
    let digits = String(raw).replace(/\D/g, '');
    if (digits.length === 10) {
      return `91${digits}`;
    }
    if (digits.length === 11 && digits.startsWith('0')) {
      return `91${digits.slice(1)}`;
    }
    if (digits.length === 12 && digits.startsWith('91')) {
      return digits;
    }
    return digits;
  };

  const handleCopyReceiptImage = async () => {
    if (!receiptRef.current || isCopyingImage) return;
    try {
      setIsCopyingImage(true);
      const success = await copyReceiptImageToClipboard(receiptRef.current);
      if (success) {
        setCopiedSuccess(true);
        setStatusNotice({
          type: 'success',
          message: '📋 Receipt image copied to clipboard! In WhatsApp, press Cmd+V (or Ctrl+V) to paste the image.'
        });
        setTimeout(() => setCopiedSuccess(false), 5000);
      } else {
        setStatusNotice({
          type: 'info',
          message: 'Direct clipboard copy not supported on this browser. You can download the PDF or use native share.'
        });
      }
    } catch (err) {
      console.error('Failed to copy image:', err);
    } finally {
      setIsCopyingImage(false);
    }
  };

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

  const handleSendWhatsApp = async (phoneToSend) => {
    const rawNumber = phoneToSend !== undefined ? phoneToSend : targetPhone;
    const sanitized = cleanPhoneForWhatsApp(rawNumber);

    if (!sanitized || sanitized.length < 10) {
      setPhoneError('Please enter a valid 10-digit mobile number');
      setShowWhatsAppModal(true);
      return;
    }

    if (isProcessingRef.current || isGeneratingPdf) return;
    if (!receiptRef.current) {
      alert('Receipt document is still preparing. Please try again in a moment.');
      return;
    }

    isProcessingRef.current = true;
    setIsGeneratingPdf(true);
    setPhoneError('');

    const textToSend = (editableMessageText && editableMessageText.trim()) ? editableMessageText : messageText;
    const filename = `Invoice-${receiptNo}.pdf`;
    // Direct WhatsApp URL formatted with client's phone number and the edited message text
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${sanitized}&text=${encodeURIComponent(textToSend)}`;

    // 1. POPUP-SAFE REDIRECTION:
    // Open a new tab immediately in the user gesture loop
    let waWindow = null;
    try {
      // 2. Automatically copy receipt image to clipboard for instant Cmd+V paste in WhatsApp
      try {
        await copyReceiptImageToClipboard(receiptRef.current);
        setCopiedSuccess(true);
      } catch (clipErr) {
        console.warn('Auto copy image to clipboard failed:', clipErr);
      }

      // 3. Generate PDF Blob from the exact same ReceiptDocument
      const pdfBlob = await getReceiptPdfBlob(receiptRef.current, filename);
      const pdfFile = new File([pdfBlob], filename, {
        type: 'application/pdf',
        lastModified: Date.now()
      });

      // 4. Proactively save PDF to backend in background so direct streaming endpoint is immediately available
      try {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) {
            const base64data = reader.result.split(',')[1];
            apiClient.post(`/bookings/receipt/${encodeURIComponent(receiptNo)}/pdf`, {
              pdfBase64: base64data,
              saleData: sale
            }).catch(() => {});
          }
        };
        reader.readAsDataURL(pdfBlob);
      } catch (_) {}

      // 5. Native Document Sharing (macOS Safari/Chrome, iOS, Android, Windows):
      // Uses navigator.share with both files: [pdfFile] and text: textToSend.
      if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        try {
          if (waWindow && !waWindow.closed) {
            waWindow.close();
          }
          await navigator.share({
            files: [pdfFile],
            title: `Tax Invoice ${receiptNo}`,
            text: textToSend
          });
          setShowWhatsAppModal(false);
          setStatusNotice({ type: 'success', message: 'Invoice PDF document shared successfully!' });
          setTimeout(() => setStatusNotice(null), 3500);
          return;
        } catch (err) {
          if (err.name === 'AbortError') {
            setShowWhatsAppModal(false);
            setStatusNotice({ type: 'info', message: 'Sharing cancelled.' });
            setTimeout(() => setStatusNotice(null), 2500);
            return;
          }
          console.warn('Native file share failed or cancelled, falling back to direct WhatsApp Web flow:', err);
        }
      }

      // 6. Desktop (Mac/PC Chrome):
      // Generates and downloads Invoice-${receiptNo}.pdf locally to the admin's machine
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        if (document.body.contains(a)) document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 1500);

      // Open WhatsApp Web with the client's number and pre-filled message
      if (waWindow) {
        waWindow.location.href = whatsappUrl;
      } else {
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      }

      setShowWhatsAppModal(false);
      setStatusNotice({
        type: 'success',
        message: '📋 PDF downloaded & Receipt image copied! In WhatsApp, press Cmd+V (or Ctrl+V) to paste the image.'
      });
      setTimeout(() => setStatusNotice(null), 6000);
    } catch (error) {
      console.error('Error in WhatsApp PDF send:', error);
      if (waWindow) {
        waWindow.location.href = whatsappUrl;
      } else {
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      }
      setShowWhatsAppModal(false);
    } finally {
      setIsGeneratingPdf(false);
      isProcessingRef.current = false;
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
            {/* "Copy Image" Button */}
            <button
              onClick={handleCopyReceiptImage}
              disabled={isCopyingImage || isGeneratingPdf}
              className={`px-3 sm:px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed ${
                copiedSuccess
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
              }`}
              title="Copy receipt image to clipboard for instant WhatsApp Cmd+V paste"
            >
              {isCopyingImage ? (
                <Loader2 className="w-4 h-4 animate-spin text-indigo-700" />
              ) : copiedSuccess ? (
                <Check className="w-4 h-4 text-white" />
              ) : (
                <ImageIcon className="w-4 h-4 text-indigo-600" />
              )}
              <span className="hidden sm:inline">{copiedSuccess ? 'Image Copied!' : 'Copy Image'}</span>
              <span className="sm:hidden">{copiedSuccess ? 'Copied' : 'Image'}</span>
            </button>

            {/* "Send via WhatsApp" Button */}
            <button
              onClick={() => setShowWhatsAppModal(true)}
              disabled={isGeneratingPdf}
              className="px-3.5 sm:px-4 py-2 rounded-full text-xs font-bold text-white shadow-sm hover:shadow-md transition-all flex items-center gap-1.5 bg-[#1ea952] hover:bg-[#16a34a] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
              title="Send Receipt via WhatsApp with PDF and Image"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Preparing...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.301-.15-1.781-.879-2.056-.979-.275-.1-.475-.15-.675.15-.2.301-.775.979-.95 1.179-.175.2-.351.225-.651.075-.3-.15-1.268-.467-2.417-1.492-.894-.798-1.497-1.784-1.673-2.084-.175-.301-.019-.464.131-.613.136-.135.301-.351.451-.526.15-.175.2-.301.3-.501.1-.2.05-.376-.025-.526-.075-.15-.676-1.63-.926-2.233-.243-.587-.49-.508-.675-.518-.175-.009-.375-.01-.575-.01-.2 0-.526.075-.802.376-.275.301-1.052 1.028-1.052 2.508 0 1.48 1.078 2.909 1.228 3.109.15.2 2.122 3.24 5.141 4.544.718.31 1.278.496 1.714.635.722.23 1.378.198 1.9.12.58-.088 1.78-.727 2.03-1.43.25-.702.25-1.303.175-1.43-.075-.126-.275-.201-.575-.351zM12.04 2C6.52 2 2.035 6.485 2.035 12.005c0 1.954.564 3.784 1.542 5.337L2 22l4.82-1.53c1.49.85 3.208 1.335 5.22 1.335 5.52 0 10.005-4.485 10.005-10.005C22.045 6.485 17.56 2 12.04 2zm0 18.27c-1.72 0-3.32-.49-4.68-1.34l-.33-.2-3.13.99.99-3.05-.22-.35c-.93-1.48-1.47-3.23-1.47-5.115 0-4.56 3.71-8.27 8.27-8.27 4.56 0 8.27 3.71 8.27 8.27 0 4.56-3.71 8.27-8.27 8.27z"/>
                  </svg>
                  <span className="hidden sm:inline">Send via WhatsApp</span>
                  <span className="sm:hidden">WhatsApp</span>
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

        {/* Status Notice banner (e.g. Cancelled or Success) */}
        {statusNotice && (
          <div className={`mx-3 sm:mx-6 mt-3 p-3 rounded-xl flex items-center justify-between text-xs animate-in fade-in shadow-xs ${
            statusNotice.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
              : 'bg-slate-100 text-slate-800 border border-slate-300'
          }`}>
            <div className="flex items-center gap-2 font-medium">
              <span>{statusNotice.message}</span>
            </div>
            <button onClick={() => setStatusNotice(null)} className="text-gray-400 hover:text-gray-700 p-1">
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
        <div className="px-4 sm:px-6 py-3 border-t border-gray-100 flex items-center justify-between gap-3 bg-white flex-shrink-0 flex-wrap">
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

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
            {/* Copy Receipt Image Button */}
            <button
              onClick={handleCopyReceiptImage}
              disabled={isCopyingImage || isGeneratingPdf}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed ${
                copiedSuccess
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
              }`}
              title="Copy receipt image to clipboard for instant WhatsApp Cmd+V paste"
            >
              {isCopyingImage ? (
                <Loader2 className="w-4 h-4 animate-spin text-indigo-700" />
              ) : copiedSuccess ? (
                <Check className="w-4 h-4 text-white" />
              ) : (
                <ImageIcon className="w-4 h-4 text-indigo-600" />
              )}
              <span>{copiedSuccess ? 'Image Copied!' : 'Copy Image (Cmd+V)'}</span>
            </button>

            {/* Send via WhatsApp Button */}
            <button
              onClick={() => setShowWhatsAppModal(true)}
              disabled={isGeneratingPdf}
              className="px-5 py-2 rounded-full text-xs font-bold text-white shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 bg-[#1ea952] hover:bg-[#16a34a] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Preparing...</span>
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

            {/* Download PDF Button */}
            <button
              onClick={handleDownloadPdfOnly}
              disabled={isGeneratingPdf}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-1.5 bg-[#e07b2a] hover:bg-[#c96a1e] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
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
              className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-gray-200 overflow-hidden space-y-4 p-5 max-h-[90vh] overflow-y-auto custom-scrollbar"
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
                    <p className="text-[10px] text-gray-500">Receipt Image & PDF</p>
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
                {/* Instant Paste Instructions Callout */}
                <div className="bg-indigo-50 border border-indigo-200/80 rounded-xl p-2.5 text-[11px] text-indigo-950 flex items-start gap-2">
                  <span className="text-base leading-none">💡</span>
                  <div>
                    <strong className="block font-bold text-indigo-900 mb-0.5">Instant Image Sharing (No API Needed):</strong>
                    <span>Clicking Send will automatically copy the full visual receipt image to your clipboard and open WhatsApp. Simply press <kbd className="px-1.5 py-0.5 bg-white border border-indigo-200 rounded font-mono font-bold text-[10px] text-indigo-900 shadow-2xs">Cmd+V</kbd> or <kbd className="px-1.5 py-0.5 bg-white border border-indigo-200 rounded font-mono font-bold text-[10px] text-indigo-900 shadow-2xs">Ctrl+V</kbd> in WhatsApp to paste and send the actual receipt image directly!</span>
                  </div>
                </div>

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
                    <span>Vehicle:</span>
                    <span className="text-gray-900">{sale.vehicleNo || 'Registered Vehicle'}</span>
                  </div>
                  <div className="flex justify-between text-[11px] font-bold text-gray-600">
                    <span>Total Paid:</span>
                    <span className="text-emerald-700 font-black">₹{price.toLocaleString('en-IN')}</span>
                  </div>

                  {/* Editable WhatsApp Message */}
                  <div className="pt-2 border-t border-emerald-200/60">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[10px] font-bold text-emerald-900 uppercase tracking-wide flex items-center gap-1">
                        <span>WhatsApp Message</span>
                        <span className="text-[9px] text-emerald-600 font-normal lowercase">(editable)</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setEditableMessageText(getDefaultMessage())}
                        className="text-[10px] text-emerald-700 hover:text-emerald-950 font-bold hover:underline transition-colors"
                        title="Reset to default message template"
                      >
                        Reset Template
                      </button>
                    </div>
                    <div className="relative">
                      <textarea
                        rows={4}
                        value={editableMessageText}
                        onChange={(e) => setEditableMessageText(e.target.value)}
                        placeholder="Type your WhatsApp message..."
                        className="w-full p-2.5 bg-white border border-emerald-300 rounded-xl text-[11px] text-gray-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none font-sans leading-relaxed shadow-2xs resize-y"
                      />
                    </div>
                  </div>

                  <div className="pt-1 flex items-center gap-1.5 text-[10px] text-emerald-800 font-medium">
                    <span>📄</span>
                    <span>Downloads PDF (<strong className="font-mono">Invoice-{receiptNo}.pdf</strong>) & copies receipt image to clipboard.</span>
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
                      <span>Preparing...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.301-.15-1.781-.879-2.056-.979-.275-.1-.475-.15-.675.15-.2.301-.775.979-.95 1.179-.175.2-.351.225-.651.075-.3-.15-1.268-.467-2.417-1.492-.894-.798-1.497-1.784-1.673-2.084-.175-.301-.019-.464.131-.613.136-.135.301-.351.451-.526.15-.175.2-.301.3-.501.1-.2.05-.376-.025-.526-.075-.15-.676-1.63-.926-2.233-.243-.587-.49-.508-.675-.518-.175-.009-.375-.01-.575-.01-.2 0-.526.075-.802.376-.275.301-1.052 1.028-1.052 2.508 0 1.48 1.078 2.909 1.228 3.109.15.2 2.122 3.24 5.141 4.544.718.31 1.278.496 1.714.635.722.23 1.378.198 1.9.12.58-.088 1.78-.727 2.03-1.43.25-.702.25-1.303.175-1.43-.075-.126-.275-.201-.575-.351zM12.04 2C6.52 2 2.035 6.485 2.035 12.005c0 1.954.564 3.784 1.542 5.337L2 22l4.82-1.53c1.49.85 3.208 1.335 5.22 1.335 5.52 0 10.005-4.485 10.005-10.005C22.045 6.485 17.56 2 12.04 2zm0 18.27c-1.72 0-3.32-.49-4.68-1.34l-.33-.2-3.13.99.99-3.05-.22-.35c-.93-1.48-1.47-3.23-1.47-5.115 0-4.56 3.71-8.27 8.27-8.27 4.56 0 8.27 3.71 8.27 8.27 0 4.56-3.71 8.27-8.27 8.27z"/>
                      </svg>
                      <span>Send via WhatsApp</span>
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

