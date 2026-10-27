const PineLabsTransaction = require('../../models/PineLabsTransaction');
const { nextSequentialId } = require('../../utils/sequentialId');
const env = require('../../common/config/env');
const provider = require('./provider');

// The Pine Labs payment lifecycle, independent of what is being sold.
//
// Both the staff POS invoice and the admin offline sale pay the same way, so
// neither owns this: they each ask for a payment, wait for it, and only write
// their own record once it is approved. An attempt that is never approved
// still exists here, which is the whole point — a declined card leaves a row
// behind even though it leaves no invoice.

const DEPARTMENT_LABELS = {
  'car-wash': 'Car Wash',
  'car-detailing': 'Car Detailing',
  'salon': 'Salon',
  'cafe': 'Cafe',
  'drive-through-cafe': 'Drive Through Cafe',
  'dog-wash': 'Dog Wash'
};

class PaymentError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = 'PaymentError';
    this.status = status;
  }
}

// PINELABS_TERMINALS is a JSON map of department key -> terminal IMEI. It is
// parsed on every call rather than at boot so a corrected .env takes effect on
// a restart of the process only, and a malformed one names itself clearly.
const terminalMap = () => {
  if (!env.PINELABS_TERMINALS) return {};
  try {
    const parsed = JSON.parse(env.PINELABS_TERMINALS);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    throw new PaymentError('PINELABS_TERMINALS in backend/.env is not valid JSON — expected {"car-wash":"<imei>", ...}', 500);
  }
};

// Each counter has its own machine, so the department decides where the bill
// appears. Getting this wrong bills the right amount on the wrong counter's
// terminal, so an unmapped department is refused rather than guessed at.
const resolveTerminal = (departmentKey) => {
  const key = String(departmentKey || '').trim();
  const imei = String(terminalMap()[key] || '').trim() || String(env.PINELABS_DEFAULT_IMEI || '').trim();
  if (!imei) {
    const label = DEPARTMENT_LABELS[key] || key || 'this department';
    throw new PaymentError(`No Pine Labs terminal is set up for ${label} — add its IMEI to PINELABS_TERMINALS in backend/.env.`);
  }
  return imei;
};

// What the POS needs to know before it offers the Pine Labs button at all.
const status = () => {
  let terminals = {};
  try {
    terminals = terminalMap();
  } catch {
    terminals = {};
  }
  const departments = Object.keys(DEPARTMENT_LABELS).filter(
    (k) => String(terminals[k] || '').trim() || String(env.PINELABS_DEFAULT_IMEI || '').trim()
  );
  return {
    enabled: provider.isConfigured() && departments.length > 0,
    dryRun: provider.isDryRun(),
    pollTimeoutMs: env.PINELABS_POLL_TIMEOUT_MS,
    departments
  };
};

const publicView = (txn) => ({
  txnRef: txn.txnRef,
  status: txn.status,
  amount: txn.amount,
  department: txn.department,
  departmentKey: txn.departmentKey,
  // The last four of the IMEI is enough for staff to tell the machines apart
  // without printing a device identifier onto a customer-facing screen.
  terminal: String(txn.terminalImei || '').slice(-4),
  cardType: txn.cardType,
  cardLast4: txn.cardLast4,
  approvalCode: txn.approvalCode,
  rrn: txn.rrn,
  acquirerName: txn.acquirerName,
  failureReason: txn.failureReason,
  sourceId: txn.sourceId,
  completedAt: txn.completedAt,
  createdAt: txn.createdAt
});

// Pushes an amount onto the department's terminal and records the attempt.
const initiate = async ({ amount, source, departmentKey, staffId, staffName, customerName, phone, vehicleNo }) => {
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) {
    throw new PaymentError('A payment amount is required.');
  }
  if (!['invoice', 'offline-sale'].includes(source)) {
    throw new PaymentError('Unknown payment source.');
  }
  if (!provider.isConfigured()) {
    throw new PaymentError('Pine Labs is not set up on this server yet — bill in cash, or ask the admin to add the credentials.', 503);
  }

  const terminalImei = resolveTerminal(departmentKey);
  const year = new Date().getFullYear();

  // The row is written BEFORE the terminal is touched. If the push itself
  // fails, or the server dies mid-call, there is still a record of an amount
  // that may be sitting on a machine somewhere.
  let txn = null;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const txnRef = await nextSequentialId(PineLabsTransaction, { field: 'txnRef', prefix: `PL-${year}-`, pad: 5 });
    try {
      txn = await PineLabsTransaction.create({
        txnRef,
        amount: value,
        source,
        departmentKey: String(departmentKey || ''),
        department: DEPARTMENT_LABELS[departmentKey] || '',
        terminalImei,
        staffId: String(staffId || ''),
        staffName: String(staffName || ''),
        customerName: String(customerName || ''),
        phone: String(phone || ''),
        vehicleNo: String(vehicleNo || '').toUpperCase().trim(),
        status: 'pending'
      });
      break;
    } catch (err) {
      if (err && err.code === 11000) continue;
      throw err;
    }
  }
  if (!txn) throw new PaymentError('Could not allocate a payment reference, please retry.', 409);

  try {
    const { plutusTxnRefId, raw } = await provider.uploadBilledTransaction({
      txnRef: txn.txnRef,
      amount: value,
      terminalImei,
      staffName
    });
    txn.plutusTxnRefId = plutusTxnRefId;
    txn.rawResponse = raw;
    await txn.save();
  } catch (err) {
    txn.status = 'failed';
    txn.failureReason = err.message;
    txn.rawResponse = err.raw || null;
    txn.completedAt = new Date();
    await txn.save();
    throw new PaymentError(err.message, 502);
  }

  return publicView(txn);
};

const terminal = (s) => s !== 'pending';

// Polled by the POS while the customer is at the machine. Pine Labs is only
// asked while we still believe the payment is open, so a finished attempt is
// answered from our own row and can be re-read as often as the UI likes.
const checkStatus = async (txnRef) => {
  const txn = await PineLabsTransaction.findOne({ txnRef: String(txnRef || '') });
  if (!txn) throw new PaymentError('Payment not found.', 404);
  if (terminal(txn.status)) return publicView(txn);

  // Give up rather than leave staff watching a spinner forever. Pine Labs
  // auto-cancels the bill on its side after PINELABS_AUTO_CANCEL_MIN, so the
  // terminal does not keep a stale amount on screen either.
  const age = Date.now() - new Date(txn.createdAt).getTime();
  if (age > env.PINELABS_POLL_TIMEOUT_MS) {
    txn.status = 'timeout';
    txn.failureReason = 'The card was not completed in time on the terminal.';
    txn.completedAt = new Date();
    await txn.save();
    return publicView(txn);
  }

  const result = await provider.getTransactionStatus({
    plutusTxnRefId: txn.plutusTxnRefId,
    terminalImei: txn.terminalImei
  });

  if (result.status === 'pending') return publicView(txn);

  if (result.status === 'success') {
    const card = result.card || {};
    txn.status = 'success';
    txn.cardType = card.cardType || '';
    txn.cardLast4 = card.cardLast4 || '';
    txn.approvalCode = card.approvalCode || '';
    txn.rrn = card.rrn || '';
    txn.acquirerName = card.acquirerName || '';
  } else {
    txn.status = 'failed';
    txn.failureReason = result.failureReason || 'The card was declined.';
  }
  txn.rawResponse = result.raw || txn.rawResponse;
  txn.completedAt = new Date();
  await txn.save();
  return publicView(txn);
};

// Staff abandoning the payment: take the bill off the terminal so the next
// customer does not pay the previous customer's amount.
const cancel = async (txnRef) => {
  const txn = await PineLabsTransaction.findOne({ txnRef: String(txnRef || '') });
  if (!txn) throw new PaymentError('Payment not found.', 404);
  if (terminal(txn.status)) return publicView(txn);

  let note = '';
  if (txn.plutusTxnRefId) {
    try {
      await provider.cancelTransaction({ plutusTxnRefId: txn.plutusTxnRefId, terminalImei: txn.terminalImei });
    } catch (err) {
      // The bill may still be live on the machine; say so instead of
      // pretending it was withdrawn cleanly.
      note = ` (Pine Labs did not confirm the cancel: ${err.message} — clear it on the terminal)`;
    }
  }
  txn.status = 'cancelled';
  txn.failureReason = `Cancelled at the counter${note}`;
  txn.completedAt = new Date();
  await txn.save();
  return publicView(txn);
};

// An approved payment can only be spent once, and only on the amount it was
// actually approved for. Both checks matter: without the first, one approved
// card could be quoted on several invoices; without the second, staff could
// charge ₹100 on the machine and bill ₹10,000.
const assertSpendable = (txn, { amount, source, sourceId }) => {
  if (!txn) throw new PaymentError('That Pine Labs payment reference does not exist.');
  if (txn.status !== 'success') {
    throw new PaymentError(`That Pine Labs payment was not approved (${txn.status}) — it cannot be billed.`);
  }
  if (txn.source !== source) {
    throw new PaymentError('That Pine Labs payment belongs to a different kind of sale.');
  }
  if (txn.sourceId && (!sourceId || txn.sourceId !== String(sourceId))) {
    throw new PaymentError(`That Pine Labs payment is already billed on ${txn.sourceId}.`);
  }
  // Rounding differences of a rupee are a real risk with GST splits; anything
  // larger means the screen and the terminal disagree about the price.
  if (Math.abs(Number(txn.amount) - Number(amount)) > 1) {
    throw new PaymentError(`The card was charged ₹${txn.amount} but this bill is ₹${amount}.`);
  }
  return txn;
};

// Checked BEFORE the sale is written, so a bad reference is refused while
// nothing has been created yet — no orphan invoice, no burnt invoice number.
const verifyForSale = async ({ txnRef, amount, source }) => {
  const txn = await PineLabsTransaction.findOne({ txnRef: String(txnRef || '') });
  return assertSpendable(txn, { amount, source });
};

// Called once the sale exists, to point the payment at it.
const consumeForSale = async ({ txnRef, amount, source, sourceId }) => {
  const txn = await PineLabsTransaction.findOne({ txnRef: String(txnRef || '') });
  assertSpendable(txn, { amount, source, sourceId });
  txn.sourceId = String(sourceId);
  await txn.save();
  return txn;
};

// Attempts that never became a sale: the view an admin needs to see what the
// terminal refused today.
const list = async ({ status: statusFilter, departmentKey, page = 1, limit = 50 } = {}) => {
  const query = {};
  if (statusFilter) query.status = String(statusFilter);
  if (departmentKey) query.departmentKey = String(departmentKey);
  const lim = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
  const skip = (Math.max(1, parseInt(page, 10) || 1) - 1) * lim;
  const [rows, total] = await Promise.all([
    PineLabsTransaction.find(query).sort({ createdAt: -1 }).skip(skip).limit(lim).lean(),
    PineLabsTransaction.countDocuments(query)
  ]);
  return { total, transactions: rows.map(publicView) };
};

module.exports = {
  PaymentError,
  DEPARTMENT_LABELS,
  status,
  initiate,
  checkStatus,
  cancel,
  verifyForSale,
  consumeForSale,
  list,
  resolveTerminal
};
