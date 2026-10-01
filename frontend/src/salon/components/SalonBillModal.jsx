import React, { useRef, useState } from 'react';
import { X, Download, Printer, Loader2, CheckCircle2 } from 'lucide-react';
import { downloadReceiptPdf, printReceiptDocument } from '../../common/utils/receiptPdfGenerator';
import SalonReceiptDocument from './SalonReceiptDocument';

export default function SalonBillModal({ open, sale, onClose }) {
  const billRef = useRef(null);
  const [busy, setBusy] = useState('');

  if (!open || !sale) return null;

  const filename = `${sale.billNo || 'Salon-Bill'}.pdf`;

  const handleDownload = async () => {
    setBusy('download');
    try {
      await downloadReceiptPdf(billRef.current, filename);
    } catch (e) {
      console.warn('Could not generate PDF:', e.message);
    } finally {
      setBusy('');
    }
  };

  const handlePrint = async () => {
    setBusy('print');
    try {
      await printReceiptDocument(billRef.current);
    } catch (e) {
      // printReceiptDocument opens a window; a blocked popup lands here.
      window.print();
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="fixed inset-0 z-[95] flex items-start justify-center overflow-y-auto bg-gray-900/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl my-6">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <h3 className="text-base font-black text-gray-900">Bill {sale.billNo}</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100" aria-label="Close">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* The printable region. Inline-ish styling and plain colours so the PDF
            renderer reproduces it faithfully. */}
        <div className="p-5">
          <SalonReceiptDocument ref={billRef} sale={sale} />
        </div>

        <div className="flex items-center gap-3 px-5 pb-5">
          <button onClick={handlePrint} disabled={Boolean(busy)}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-bold text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2 disabled:opacity-60">
            {busy === 'print' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
            Print
          </button>
          <button onClick={handleDownload} disabled={Boolean(busy)}
            className="flex-1 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60">
            {busy === 'download' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Download PDF
          </button>
        </div>
      </div>
    </div>
  );
}
