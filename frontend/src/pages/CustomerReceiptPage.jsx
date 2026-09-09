import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Download, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import ReceiptDocument from '../common/components/ReceiptDocument';
import { downloadReceiptPdf, shareOrDownloadReceiptPdf } from '../common/utils/receiptPdfGenerator';
import { apiClient } from '../common/utils/apiClient';

export default function CustomerReceiptPage() {
  const { id } = useParams();
  const receiptRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sale, setSale] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);

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

  const handleDownloadPdf = async () => {
    if (!receiptRef.current || !sale) return;
    try {
      setIsDownloading(true);
      const receiptNo = sale.id || sale.bookingId || id || 'TSL';
      await downloadReceiptPdf(receiptRef.current, `Receipt-${receiptNo}.pdf`);
    } catch (err) {
      console.error('PDF download error:', err);
      window.print();
    } finally {
      setIsDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center space-y-4 max-w-sm w-full text-center">
          <Loader2 className="w-10 h-10 text-[#1e3e62] animate-spin" />
          <h2 className="text-base font-black text-gray-900">Loading Official Receipt</h2>
          <p className="text-xs text-gray-500">Connecting to The Shine Lounge records...</p>
        </div>
      </div>
    );
  }

  if (error || !sale) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center space-y-4 max-w-md w-full text-center">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-black text-gray-900">Receipt Not Found</h2>
          <p className="text-xs text-gray-500">{error || 'The requested receipt could not be retrieved.'}</p>
          <Link
            to="/"
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#1e3e62] hover:bg-[#152e4a] transition-all flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Homepage</span>
          </Link>
        </div>
      </div>
    );
  }

  const receiptNo = sale.id || sale.bookingId || id;

  return (
    <div className="min-h-screen bg-slate-200/80 py-4 sm:py-8 px-2 sm:px-4">
      {/* Floating Action Header Bar */}
      <div className="max-w-[794px] mx-auto mb-4 sm:mb-6 bg-white/95 backdrop-blur-md rounded-2xl shadow-sm border border-gray-200/80 p-3 sm:p-4 flex items-center justify-between gap-3">
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

      {/* Official A4 Receipt Paper Document */}
      <div className="max-w-[794px] mx-auto bg-white rounded-lg shadow-xl border border-gray-300 overflow-hidden">
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
