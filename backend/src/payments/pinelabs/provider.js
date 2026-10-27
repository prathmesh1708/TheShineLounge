const env = require('../../common/config/env');

// Thin client for the Pine Labs "Plutus Smart — Cloud Based Integration" API.
//
// Everything that talks to Pine Labs lives here, so the service above can be
// tested with this file stubbed and so PINELABS_DRY_RUN has exactly one place
// to short-circuit. The browser never calls Pine Labs directly: their cloud
// whitelists our server IP and the security token must not leave it.
//
// Three calls make up the whole flow:
//   UploadBilledTransaction  — push the amount onto a terminal by its IMEI
//   GetCloudBasedTxnStatus   — poll that push until the card is approved
//   CancelTransaction        — pull the bill back off the terminal
//
// NOTE: the exact path prefix and the response codes below come from the
// integration document Pine Labs issues per merchant. Confirm them against
// your own document during UAT; PINELABS_RESPONSE codes are kept in one place
// here so a difference is a one-line change.

class PineLabsError extends Error {
  constructor(message, { code, raw } = {}) {
    super(message);
    this.name = 'PineLabsError';
    this.code = code;
    this.raw = raw;
  }
}

// Pine Labs' own codes. 0 is the only success; 1001-style codes mean the
// customer is still at the machine and we should keep polling.
const APPROVED = 0;
const PENDING_CODES = new Set([1001, 1002]);
const PENDING_MESSAGE = /in\s*progress|pending|not\s*(yet\s*)?(complete|received|found)|waiting/i;

// The terse replies ("INVALID IMEI") say nothing about what to do next.
const FRIENDLY = [
  [/imei/i, 'Pine Labs does not recognise this terminal — check the IMEI in PINELABS_TERMINALS and that Pine Labs enabled cloud integration on that machine'],
  [/security\s*token|unauthori[sz]ed|invalid\s*merchant|client/i, 'Pine Labs rejected our credentials — check PINELABS_MERCHANT_ID / STORE_ID / CLIENT_ID / SECURITY_TOKEN, and that UAT credentials are not being used against production'],
  [/ip|whitelist/i, "Pine Labs refused this server's IP — ask them to whitelist the backend's outbound IP"],
  [/duplicate|already/i, 'Pine Labs already has a bill with this reference on the terminal — clear it on the machine before retrying'],
  [/busy|another\s*transaction/i, 'The terminal is busy with another transaction — finish or cancel it on the machine first']
];
const explain = (raw) => {
  const hit = FRIENDLY.find(([re]) => re.test(raw));
  return hit ? `${hit[1]} (Pine Labs: "${String(raw).slice(0, 80)}")` : `Pine Labs: ${String(raw).slice(0, 200)}`;
};

const isDryRun = () => env.PINELABS_DRY_RUN;

const isConfigured = () => isDryRun() || Boolean(
  env.PINELABS_BASE_URL &&
  env.PINELABS_MERCHANT_ID &&
  env.PINELABS_STORE_ID &&
  env.PINELABS_CLIENT_ID &&
  env.PINELABS_SECURITY_TOKEN
);

// Never let the token reach a log line or an error message shown to staff.
const redact = (text) => {
  let out = String(text || '');
  for (const secret of [env.PINELABS_SECURITY_TOKEN, env.PINELABS_CLIENT_ID]) {
    if (secret) out = out.split(secret).join('***');
  }
  return out;
};

// Pine Labs bills in paise, as a string.
const toPaise = (rupees) => String(Math.round(Number(rupees || 0) * 100));

const credentials = () => ({
  MerchantID: env.PINELABS_MERCHANT_ID,
  SecurityToken: env.PINELABS_SECURITY_TOKEN,
  ClientID: env.PINELABS_CLIENT_ID,
  StoreID: env.PINELABS_STORE_ID
});

const post = async (endpoint, body) => {
  if (!isConfigured()) {
    throw new PineLabsError('Pine Labs is not configured on this server — add the credentials to backend/.env');
  }
  const url = `${env.PINELABS_BASE_URL}/${endpoint}`;
  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...credentials(), ...body }),
      // The customer is standing at the counter: fail fast rather than hang.
      signal: AbortSignal.timeout(20000)
    });
  } catch (err) {
    throw new PineLabsError(`Could not reach Pine Labs: ${redact(err.message)}`);
  }

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new PineLabsError(`Pine Labs returned an unreadable reply (HTTP ${res.status}): ${redact(text).slice(0, 200)}`);
  }
  if (!res.ok) {
    throw new PineLabsError(`Pine Labs HTTP ${res.status}: ${redact(data.ResponseMessage || text).slice(0, 200)}`, { raw: data });
  }
  return data;
};

// Status replies carry the card details as a flat [{Tag, Value}] list whose
// tag spellings differ between terminal firmware versions, so match loosely.
const pickTag = (list, pattern) => {
  const hit = (Array.isArray(list) ? list : []).find((t) => pattern.test(String(t?.Tag || '')));
  return hit ? String(hit.Value ?? '').trim() : '';
};

const parseCardDetails = (data) => {
  const tags = data?.TransactionData || data?.transactionData || [];
  const cardNumber = pickTag(tags, /card\s*(number|no)/i);
  return {
    cardType: pickTag(tags, /card\s*type|payment\s*mode/i),
    // Pine Labs masks the PAN itself; keep only the last four either way.
    cardLast4: (cardNumber.replace(/\D/g, '').slice(-4) || ''),
    approvalCode: pickTag(tags, /approval|auth\s*code/i),
    rrn: pickTag(tags, /retrieval|rrn/i),
    acquirerName: pickTag(tags, /acquirer|bank/i)
  };
};

// ── Dry run ────────────────────────────────────────────────────────────────
// Fakes the terminal so the POS screens are usable before credentials exist.
// An amount ending in .99 is declined; everything else approves after ~6s.
const dryRunStore = new Map();

const dryRunUpload = ({ txnRef, amount }) => {
  const id = `DRY${Date.now()}`;
  dryRunStore.set(id, {
    approveAt: Date.now() + 6000,
    declined: Math.round(Number(amount) * 100) % 100 === 99,
    txnRef
  });
  return { plutusTxnRefId: id, raw: { ResponseCode: APPROVED, ResponseMessage: 'DRY RUN', PlutusTransactionReferenceID: id } };
};

const dryRunStatus = (plutusTxnRefId) => {
  const row = dryRunStore.get(String(plutusTxnRefId));
  if (!row) return { status: 'failed', failureReason: 'Unknown dry-run transaction', raw: null };
  if (Date.now() < row.approveAt) return { status: 'pending', raw: { ResponseMessage: 'DRY RUN: waiting for card' } };
  dryRunStore.delete(String(plutusTxnRefId));
  if (row.declined) {
    return { status: 'failed', failureReason: 'DRY RUN: card declined (amount ended in .99)', raw: { ResponseCode: 4, ResponseMessage: 'DECLINED' } };
  }
  return {
    status: 'success',
    card: { cardType: 'VISA CREDIT', cardLast4: '4242', approvalCode: '123456', rrn: '987654321012', acquirerName: 'DRY RUN BANK' },
    raw: { ResponseCode: APPROVED, ResponseMessage: 'DRY RUN: APPROVED' }
  };
};

// ── API ────────────────────────────────────────────────────────────────────

// Pushes the amount onto the terminal. Returns Pine Labs' reference for it.
const uploadBilledTransaction = async ({ txnRef, amount, terminalImei, staffName }) => {
  if (isDryRun()) return dryRunUpload({ txnRef, amount });

  const data = await post('UploadBilledTransaction', {
    // 0 = let the customer choose card / wallet / UPI on the machine.
    AllowedPaymentMode: 0,
    Amount: toPaise(amount),
    AutoCancelDurationInMinutes: env.PINELABS_AUTO_CANCEL_MIN,
    BillingRefNo: txnRef,
    TransactionNumber: txnRef,
    ImeiNumber: String(terminalImei),
    UserID: String(staffName || 'POS').slice(0, 20)
  });

  if (Number(data.ResponseCode) !== APPROVED) {
    throw new PineLabsError(explain(data.ResponseMessage || `code ${data.ResponseCode}`), {
      code: data.ResponseCode,
      raw: data
    });
  }
  const plutusTxnRefId = String(data.PlutusTransactionReferenceID || '');
  if (!plutusTxnRefId) {
    throw new PineLabsError('Pine Labs accepted the bill but returned no transaction reference', { raw: data });
  }
  return { plutusTxnRefId, raw: data };
};

// Asks what happened to a pushed bill. Never throws on a decline: a declined
// card is an answer, not an error, and has to be recorded as one.
const getTransactionStatus = async ({ plutusTxnRefId, terminalImei }) => {
  if (isDryRun()) return dryRunStatus(plutusTxnRefId);

  let data;
  try {
    data = await post('GetCloudBasedTxnStatus', {
      PlutusTransactionReferenceID: plutusTxnRefId,
      ImeiNumber: String(terminalImei)
    });
  } catch (err) {
    // A blip talking to Pine Labs must not be read as "the customer did not
    // pay" — stay pending and let the poll loop ask again.
    return { status: 'pending', transient: err.message, raw: null };
  }

  const code = Number(data.ResponseCode);
  const message = String(data.ResponseMessage || '');

  if (code === APPROVED) {
    return { status: 'success', card: parseCardDetails(data), raw: data };
  }
  if (PENDING_CODES.has(code) || PENDING_MESSAGE.test(message)) {
    return { status: 'pending', raw: data };
  }
  return { status: 'failed', failureReason: message || `Pine Labs response code ${code}`, raw: data };
};

// Pulls the bill back off the terminal when staff abandon the payment.
const cancelTransaction = async ({ plutusTxnRefId, terminalImei }) => {
  if (isDryRun()) {
    dryRunStore.delete(String(plutusTxnRefId));
    return { raw: { ResponseMessage: 'DRY RUN: cancelled' } };
  }
  const data = await post('CancelTransaction', {
    PlutusTransactionReferenceID: plutusTxnRefId,
    ImeiNumber: String(terminalImei)
  });
  return { raw: data };
};

module.exports = {
  PineLabsError,
  isConfigured,
  isDryRun,
  uploadBilledTransaction,
  getTransactionStatus,
  cancelTransaction,
  // exported for tests
  parseCardDetails,
  toPaise
};
