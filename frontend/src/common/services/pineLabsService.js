import apiClient from '../utils/apiClient';

// Paying on the counter's Pine Labs card machine.
//
// The browser never talks to Pine Labs: their cloud whitelists our server's IP
// and the security token must not leave it. All this does is ask our backend
// to push the amount onto the terminal, then ask repeatedly what the customer
// did with it.

const CONFIG_TTL_MS = 60 * 1000;
let configCache = { at: 0, promise: null };

// Whether to show the Pine Labs button at all. Cached briefly: every POS
// screen asks on mount and the answer only changes on a server restart.
export const getPineLabsConfig = ({ force = false } = {}) => {
  if (!force && configCache.promise && Date.now() - configCache.at < CONFIG_TTL_MS) return configCache.promise;
  const promise = apiClient
    .get('/payments/pinelabs/status')
    .then((res) => res.data)
    .catch(() => ({ enabled: false, dryRun: false, departments: [] }));
  configCache = { at: Date.now(), promise };
  return promise;
};

const message = (err, fallback) => err?.response?.data?.message || err?.message || fallback;

// Pushes the amount onto the department's machine. Resolves with the pending
// payment; the caller then polls it.
export const initiatePineLabsPayment = async ({ amount, source, departmentKey, customerName, phone, vehicleNo, staffName }) => {
  try {
    const res = await apiClient.post('/payments/pinelabs/initiate', {
      amount, source, departmentKey, customerName, phone, vehicleNo, staffName
    });
    return res.data.payment;
  } catch (err) {
    throw new Error(message(err, 'Could not reach the Pine Labs terminal.'));
  }
};

export const getPineLabsPayment = async (txnRef) => {
  const res = await apiClient.get(`/payments/pinelabs/${encodeURIComponent(txnRef)}`);
  return res.data.payment;
};

export const cancelPineLabsPayment = async (txnRef) => {
  try {
    const res = await apiClient.post(`/payments/pinelabs/${encodeURIComponent(txnRef)}/cancel`);
    return res.data.payment;
  } catch (err) {
    throw new Error(message(err, 'Could not cancel the payment on the terminal.'));
  }
};

// Polls until the terminal settles. A poll that fails to reach OUR server is
// not an answer about the card, so it is retried rather than treated as a
// decline — only the backend may decide a payment failed.
export const pollPineLabsPayment = (txnRef, { intervalMs = 3000, timeoutMs = 150000, onTick, signal } = {}) =>
  new Promise((resolve, reject) => {
    const startedAt = Date.now();
    let stopped = false;

    const stop = () => { stopped = true; };
    signal?.addEventListener('abort', stop, { once: true });

    const tick = async () => {
      if (stopped) return;
      try {
        const payment = await getPineLabsPayment(txnRef);
        if (stopped) return;
        onTick?.(payment);
        if (payment.status !== 'pending') return resolve(payment);
      } catch {
        // Network blip: fall through and try again on the next tick.
      }
      if (Date.now() - startedAt > timeoutMs) {
        return reject(new Error('The terminal did not report a result in time. Check the machine before retrying.'));
      }
      setTimeout(tick, intervalMs);
    };

    setTimeout(tick, intervalMs);
  });

// The line printed on the receipt for an approved card payment.
export const cardSummary = (payment) => {
  if (!payment) return '';
  const bits = [payment.cardType, payment.cardLast4 ? `••••${payment.cardLast4}` : '', payment.approvalCode ? `Auth ${payment.approvalCode}` : ''];
  return bits.filter(Boolean).join(' · ');
};
