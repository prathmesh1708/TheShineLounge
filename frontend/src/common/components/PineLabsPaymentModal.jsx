import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CreditCard, CheckCircle2, XCircle, Loader2, RotateCcw, Banknote } from 'lucide-react';
import {
  initiatePineLabsPayment,
  pollPineLabsPayment,
  cancelPineLabsPayment,
  cardSummary
} from '../services/pineLabsService';

// The screen staff watch while the customer taps their card.
//
// Used by both the POS invoice and the offline sale, which is why it knows
// nothing about either: it is handed an amount, it gets it paid, and it calls
// back with the approved payment. The caller writes the sale afterwards —
// never before — so a declined card leaves no invoice behind.
//
// It must stay honest about the machine's state. "Cancelled" here means the
// bill really was pulled off the terminal; if the backend could not confirm
// that, the failure text says so rather than implying the counter is clear.

const rupees = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export default function PineLabsPaymentModal({
  isOpen,
  amount,
  source,
  departmentKey,
  customerName = '',
  phone = '',
  vehicleNo = '',
  staffName = '',
  pollTimeoutMs = 150000,
  onPaid,
  onCancel,
  onPayCash
}) {
  // 'starting' → 'waiting' → 'success' | 'failed'
  const [phase, setPhase] = useState('starting');
  const [payment, setPayment] = useState(null);
  const [error, setError] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [cancelling, setCancelling] = useState(false);

  // Guards a real-money call against a double render or a double click.
  const runIdRef = useRef(0);
  const abortRef = useRef(null);
  const paymentRef = useRef(null);

  const start = useCallback(async () => {
    const runId = runIdRef.current + 1;
    runIdRef.current = runId;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setPhase('starting');
    setError('');
    setPayment(null);
    paymentRef.current = null;
    setElapsed(0);

    let pending;
    try {
      pending = await initiatePineLabsPayment({ amount, source, departmentKey, customerName, phone, vehicleNo, staffName });
    } catch (err) {
      if (runIdRef.current !== runId) return;
      setError(err.message);
      setPhase('failed');
      return;
    }
    if (runIdRef.current !== runId) return;

    setPayment(pending);
    paymentRef.current = pending;
    setPhase('waiting');

    try {
      const settled = await pollPineLabsPayment(pending.txnRef, {
        timeoutMs: pollTimeoutMs,
        signal: controller.signal,
        onTick: (p) => { if (runIdRef.current === runId) { setPayment(p); paymentRef.current = p; } }
      });
      if (runIdRef.current !== runId) return;
      setPayment(settled);
      paymentRef.current = settled;
      if (settled.status === 'success') {
        setPhase('success');
      } else {
        setError(settled.failureReason || 'The card was declined.');
        setPhase('failed');
      }
    } catch (err) {
      if (runIdRef.current !== runId) return;
      setError(err.message);
      setPhase('failed');
    }
  }, [amount, source, departmentKey, customerName, phone, vehicleNo, staffName, pollTimeoutMs]);

  useEffect(() => {
    if (!isOpen) return undefined;
    start();
    return () => {
      runIdRef.current += 1;
      abortRef.current?.abort();
    };
  }, [isOpen, start]);

  // Staff need to see that something is still happening at the machine.
  useEffect(() => {
    if (phase !== 'waiting') return undefined;
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [phase]);

  // An approved payment is money taken: hand it straight to the caller so the
  // sale is written without staff having to press anything else.
  useEffect(() => {
    if (phase === 'success' && payment) onPaid?.(payment);
  }, [phase, payment, onPaid]);

  const abandon = async (then) => {
    const open = paymentRef.current && paymentRef.current.status === 'pending';
    runIdRef.current += 1;
    abortRef.current?.abort();
    if (open) {
      setCancelling(true);
      // Take the bill off the terminal before anything else happens, so the
      // next customer cannot pay this one's amount.
      try {
        await cancelPineLabsPayment(paymentRef.current.txnRef);
      } catch {
        // The backend has already recorded the attempt; staff are told to
        // check the machine by the text below.
      }
      setCancelling(false);
    }
    then?.();
  };

  if (!isOpen) return null;

  const waiting = phase === 'starting' || phase === 'waiting';
  const remaining = Math.max(0, Math.ceil(pollTimeoutMs / 1000) - elapsed);

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-5 py-4 bg-gradient-to-br from-gray-900 to-gray-700 text-white">
          <div className="flex items-center gap-2.5">
            <CreditCard className="w-5 h-5" />
            <div>
              <h3 className="font-extrabold text-sm">Pine Labs Terminal</h3>
              <p className="text-[11px] text-gray-300">
                {payment?.department || 'Counter'}{payment?.terminal ? ` · machine ••${payment.terminal}` : ''}
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 text-center space-y-3">
          <div className="text-3xl font-black text-gray-900">{rupees(amount)}</div>

          {waiting && (
            <>
              <Loader2 className="w-10 h-10 mx-auto text-amber-500 animate-spin" />
              <p className="text-sm font-bold text-gray-800">
                {phase === 'starting' ? 'Sending the bill to the machine…' : 'Ask the customer to tap or insert their card'}
              </p>
              <p className="text-[11px] text-gray-500">
                {phase === 'waiting' ? `Waiting ${elapsed}s · gives up in ${remaining}s` : 'Please wait'}
              </p>
              <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                Do not close this window — the sale is only saved once the machine approves.
              </p>
            </>
          )}

          {phase === 'success' && (
            <>
              <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500" />
              <p className="text-sm font-extrabold text-emerald-700">Payment approved</p>
              {cardSummary(payment) && <p className="text-[11px] text-gray-600 font-semibold">{cardSummary(payment)}</p>}
              <p className="text-[10px] text-gray-400 font-mono">{payment?.txnRef}</p>
            </>
          )}

          {phase === 'failed' && (
            <>
              <XCircle className="w-12 h-12 mx-auto text-red-500" />
              <p className="text-sm font-extrabold text-red-700">Payment not completed</p>
              <p className="text-[11px] text-gray-600 px-2">{error}</p>
              {payment?.txnRef && <p className="text-[10px] text-gray-400 font-mono">{payment.txnRef}</p>}
              <p className="text-[11px] text-gray-500">Nothing has been billed. Retry the card, or take cash instead.</p>
            </>
          )}
        </div>

        {phase !== 'success' && (
          <div className="px-5 pb-5 space-y-2">
            {phase === 'failed' && (
              <>
                <button
                  type="button"
                  onClick={start}
                  className="w-full py-2.5 rounded-xl bg-amber-500 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                >
                  <RotateCcw className="w-4 h-4" /> Try the card again
                </button>
                {onPayCash && (
                  <button
                    type="button"
                    onClick={() => onPayCash()}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                  >
                    <Banknote className="w-4 h-4" /> Switch to cash
                  </button>
                )}
              </>
            )}
            <button
              type="button"
              disabled={cancelling}
              onClick={() => abandon(onCancel)}
              className="w-full py-2.5 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold disabled:opacity-50"
            >
              {cancelling ? 'Clearing the machine…' : waiting ? 'Cancel payment' : 'Close'}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
