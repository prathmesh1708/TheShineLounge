import React, { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { Download, ArrowLeft, Loader2, AlertCircle, Printer, FileCheck } from 'lucide-react';
import ReceiptDocument from '../common/components/ReceiptDocument';
import { downloadReceiptPdf, getReceiptPdfBlob } from '../common/utils/receiptPdfGenerator';
import { apiClient } from '../common/utils/apiClient';

export default function CustomerReceiptPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const receiptRef = useRef(null);
  const hasAutoDownloaded = useRef(false);

  const autoDownload = searchParams.get('download') === 'pdf' || searchParams.get('download') === 'true' || searchParams.get('download') === '1';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sale, setSale] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState('');
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [autoDownloadedNotice, setAutoDownloadedNotice] = useState(false);

  // Enforce pure light theme while on CustomerReceiptPage to guarantee crisp white paper and prevent dark-mode inheritance
  useEffect(() => {
    const prevTheme = document.documentElement.getAttribute('data-theme');
    const prevBg = document.body.style.backgroundColor;
    const prevColor = document.body.style.color;

    document.documentElement.setAttribute('data-theme', 'light');
    document.documentElement.style.colorScheme = 'light';
    document.body.setAttribute('data-theme', 'light');
    document.body.style.backgroundColor = '#f1f5f9';
    document.body.style.color = '#0f172a';

    return () => {
      if (prevTheme) {
        document.documentElement.setAttribute('data-theme', prevTheme);
        document.body.setAttribute('data-theme', prevTheme);
      } else {
        document.documentElement.removeAttribute('data-theme');
        document.body.removeAttribute('data-theme');
      }
      document.documentElement.style.colorScheme = '';
      document.body.style.backgroundColor = prevBg;
      document.body.style.color = prevColor;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadReceipt() {
      if (!id) {
        setError('No receipt identifier provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');

        // 1. Try to fetch from backend API
        try {
          const res = await apiClient.get(`/bookings/receipt/${encodeURIComponent(id)}`);
          if (res && res.data && (res.data.data || res.data.success)) {
            const data = res.data.data || res.data;
            if (isMounted) {
              setSale(data);
              setLoading(false);
              return;
            }
          }
        } catch (apiErr) {
          console.warn('Could not fetch receipt from API, checking local storage:', apiErr);
        }

        // 2. Fallback to localStorage offline sales
        const localSalesRaw = localStorage.getItem('tsl_offline_sales') || localStorage.getItem('offline_sales');
        if (localSalesRaw) {
          try {
            const parsed = JSON.parse(localSalesRaw);
            if (Array.isArray(parsed)) {
              const matched = parsed.find(
                s => String(s.id).toLowerCase() === String(id).toLowerCase() ||
                     String(s.bookingId).toLowerCase() === String(id).toLowerCase() ||
                     String(s.receiptNo).toLowerCase() === String(id).toLowerCase()
              );
              if (matched && isMounted) {
                setSale(matched);
                setLoading(false);
                return;
              }
            }
          } catch (e) {
            console.error('Error parsing local sales:', e);
          }
        }

        if (isMounted) {
          setError(`Receipt #${id} could not be found or has expired.`);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error loading receipt:', err);
        if (isMounted) {
          setError('Failed to load receipt details.');
          setLoading(false);
        }
      }
    }

    loadReceipt();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const triggerDirectPdfDownload = async (currentSale) => {
    const saleData = currentSale || sale;
    if (!receiptRef.current || !saleData || hasAutoDownloaded.current) return;
    hasAutoDownloaded.current = true;
    setIsDownloading(true);

    const receiptNo = saleData.id || saleData.bookingId || id || 'TSL';
    const filename = `Invoice-${receiptNo}.pdf`;

    try {
      // 1. Generate high-definition A4 PDF blob
      const pdfBlob = await getReceiptPdfBlob(receiptRef.current, filename);
      const blobUrl = URL.createObjectURL(pdfBlob);
      setPdfBlobUrl(blobUrl);
      setIsDownloaded(true);
      setAutoDownloadedNotice(true);

      // 2. Trigger direct browser download
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        if (document.body.contains(a)) document.body.removeChild(a);
      }, 1000);
    } catch (err) {
      console.error('Direct PDF download error:', err);
      try {
        await downloadReceiptPdf(receiptRef.current, filename);
        setIsDownloaded(true);
        setAutoDownloadedNotice(true);
      } catch (e) {
        console.error('Fallback download failed:', e);
      }
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!receiptRef.current || !sale) return;
    try {
      setIsDownloading(true);
      const receiptNo = sale.id || sale.bookingId || id || 'TSL';
      await downloadReceiptPdf(receiptRef.current, `Invoice-${receiptNo}.pdf`);
      setAutoDownloadedNotice(true);
    } catch (err) {
      console.error('PDF download error:', err);
      window.print();
    } finally {
      setIsDownloading(false);
    }
  };

  // Directly trigger PDF download immediately when loaded with ?download=pdf
  useEffect(() => {
    if (!loading && sale && autoDownload && receiptRef.current && !hasAutoDownloaded.current) {
      const timer = setTimeout(() => {
        triggerDirectPdfDownload(sale);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [loading, sale, autoDownload]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center space-y-4 max-w-sm w-full text-center border border-slate-100">
          <Loader2 className="w-10 h-10 text-[#1ea952] animate-spin" />
          <h2 className="text-base font-black text-gray-900">
            Loading Official Receipt
          </h2>
          <p className="text-xs text-gray-500">Connecting to The Shine Lounge records...</p>
        </div>
      </div>
    );
  }

  if (error || !sale) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center space-y-4 max-w-md w-full text-center border border-slate-100">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-black text-gray-900">Receipt Not Found</h2>
          <p className="text-xs text-gray-500">{error || 'The requested receipt could not be retrieved.'}</p>
          <Link
            to="/"
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#1e3e62] hover:bg-[#152e4a] transition-all flex items-center gap-1.5 mt-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Homepage</span>
          </Link>
        </div>
      </div>
    );
  }

  const receiptNo = sale.id || sale.bookingId || id;

  // DIRECT RECEIPT VIEW: Directly display the authentic official tax invoice & receipt
  return (
    <div
      data-theme="light"
      className="receipt-page-container min-h-screen py-4 sm:py-8 px-2 sm:px-4"
      style={{ backgroundColor: '#f1f5f9', color: '#0f172a' }}
    >
      {/* Floating Action Header Bar */}
      <div
        data-theme="light"
        className="max-w-[794px] mx-auto mb-4 sm:mb-6 rounded-2xl shadow-sm border border-gray-200/80 p-3 sm:p-4 flex items-center justify-between gap-3"
        style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
      >
        <div className="flex items-center gap-2">
          <Link
            to="/"
            className="p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            title="Go to The Shine Lounge Home"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <span className="text-xs sm:text-sm font-black text-[#1e3e62] uppercase tracking-wide block">
              Official Digital Receipt
            </span>
            <span className="text-[11px] text-gray-500 font-mono">
              #{receiptNo}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="hidden sm:flex px-3.5 py-2.5 rounded-xl text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all items-center gap-1.5"
            title="Print this invoice"
          >
            <Printer className="w-4 h-4 text-gray-600" />
            <span>Print</span>
          </button>
          <button
            onClick={handleDownloadPdf}
            disabled={isDownloading}
            className="px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-sm hover:shadow-md transition-all flex items-center gap-2 bg-[#e07b2a] hover:bg-[#c96a1e] active:scale-95 disabled:opacity-60"
          >
            {isDownloading ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>Download Official PDF</span>
          </button>
        </div>
      </div>

      {/* Auto Download Success Notice */}
      {autoDownloadedNotice && (
        <div className="max-w-[794px] mx-auto mb-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 text-xs animate-in fade-in shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-base flex-shrink-0">
              <FileCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-emerald-950">
                Official PDF Invoice downloaded!
              </p>
              <p className="text-emerald-700 text-[11px]">
                Your tax invoice has been saved to your downloads. You can also print or download again below.
              </p>
            </div>
          </div>
          <button
            onClick={() => setAutoDownloadedNotice(false)}
            className="text-emerald-700 hover:text-emerald-950 p-1 font-bold text-sm"
          >
            ✕
          </button>
        </div>
      )}

      {/* Official A4 Receipt Paper Document */}
      <div
        data-theme="light"
        className="max-w-[794px] mx-auto rounded-lg shadow-xl border border-gray-300 overflow-hidden receipt-paper-canvas"
        style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
      >
        <ReceiptDocument ref={receiptRef} sale={sale} />
      </div>

      {/* Footer Info */}
      <div className="max-w-[794px] mx-auto text-center mt-6 text-xs text-gray-500">
        <p>The Shine Lounge • Premium Car Care & Detailing</p>
        <p className="text-[11px] text-gray-400 mt-1">This is an authentic verified digital receipt.</p>
      </div>
    </div>
  );
}
