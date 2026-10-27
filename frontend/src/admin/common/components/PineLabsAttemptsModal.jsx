import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, CreditCard, Loader2, RefreshCw } from 'lucide-react';
import apiClient from '../../../common/utils/apiClient';

// Every card presented at a counter, including the ones that were refused.
//
// A declined card never becomes a sale, so it appears nowhere else in the
// admin: without this screen the only record of a customer's card being
// refused would be the staff member's memory. The amounts here are attempts,
// not revenue — an approved row is money taken and is also on the sale.

const STATUS_STYLE = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  failed: 'bg-red-50 text-red-700 border-red-200',
  cancelled: 'bg-gray-100 text-gray-600 border-gray-200',
  timeout: 'bg-amber-50 text-amber-700 border-amber-200',
  pending: 'bg-blue-50 text-blue-700 border-blue-200'
};

const FILTERS = [
  { key: '', label: 'All attempts' },
  { key: 'failed', label: 'Declined' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'timeout', label: 'Timed out' },
  { key: 'success', label: 'Approved' }
];

const when = (iso) => (iso ? new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '');

export default function PineLabsAttemptsModal({ isOpen, onClose }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  // Bumped to re-fetch when the filter has not changed.
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!isOpen) return undefined;
    let alive = true;
    setLoading(true);
    setError('');
    apiClient
      .get('/payments/pinelabs', { params: filter ? { status: filter } : {} })
      .then((res) => { if (alive) setRows(res.data.transactions || []); })
      .catch((err) => { if (alive) setError(err?.response?.data?.message || 'Could not load the card attempts.'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [isOpen, filter, reloadKey]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl max-h-[85vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gray-900 text-white flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-gray-900">Card Terminal Attempts</h3>
              <p className="text-[11px] text-gray-500">Every card presented on a Pine Labs machine, approved or not</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100" aria-label="Close">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-1.5 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.key || 'all'}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
                filter === f.key ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {f.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            className="ml-auto p-1.5 rounded-lg hover:bg-gray-100"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
          )}
          {!loading && error && <p className="py-12 text-center text-xs text-red-600">{error}</p>}
          {!loading && !error && rows.length === 0 && (
            <p className="py-12 text-center text-xs text-gray-400">No card attempts recorded yet.</p>
          )}
          {!loading && !error && rows.map((r) => (
            <div key={r.txnRef} className="px-5 py-3 border-b border-gray-50 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-[11px] text-gray-500">{r.txnRef}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${STATUS_STYLE[r.status] || STATUS_STYLE.pending}`}>
                    {r.status}
                  </span>
                  {r.sourceId && <span className="text-[10px] text-gray-400">billed on {r.sourceId}</span>}
                </div>
                <p className="text-xs font-bold text-gray-900 mt-0.5 truncate">
                  {r.customerName || 'Walk-in'}{r.vehicleNo ? ` · ${r.vehicleNo}` : ''}
                </p>
                <p className="text-[10px] text-gray-500 truncate">
                  {[r.department, r.terminal && `machine ••${r.terminal}`, when(r.createdAt)].filter(Boolean).join(' · ')}
                </p>
                {r.status === 'success' && (r.cardType || r.approvalCode) && (
                  <p className="text-[10px] text-gray-500 truncate">
                    {[r.cardType, r.cardLast4 && `••••${r.cardLast4}`, r.approvalCode && `Auth ${r.approvalCode}`].filter(Boolean).join(' · ')}
                  </p>
                )}
                {r.failureReason && <p className="text-[10px] text-red-600 mt-0.5">{r.failureReason}</p>}
              </div>
              <div className="text-right flex-shrink-0">
                <p className={`text-sm font-black ${r.status === 'success' ? 'text-emerald-700' : 'text-gray-400 line-through'}`}>
                  ₹{Number(r.amount || 0).toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}
