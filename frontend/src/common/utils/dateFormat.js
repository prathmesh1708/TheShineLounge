// A sale carries two dates: `saleDate` ("2026-08-20") feeds date inputs and
// range filters, while `date` ("August 20, 2026") is what the admin table
// prints. Updates used to write the ISO value into `date`, so an edit that only
// changed the customer name also flipped the displayed date to "2026-08-20".
// The backend no longer does that (see backend/src/utils/dateFormat.js), and
// normalizing on read keeps rows already saved that way looking right too.
//
// This is deliberately not formatReceiptDate: that one defaults an empty date
// to today, which is right on a receipt being issued now and wrong for a list
// where a missing date must stay missing rather than become today.
const DISPLAY_RE = /^[A-Z][a-z]+ \d{1,2}, \d{4}$/;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// A bare YYYY-MM-DD parses as UTC midnight, which renders as the previous day
// anywhere west of Greenwich. Anchoring at local noon keeps the calendar day.
export const parseSaleDate = (value) => {
  if (!value) return null;

  const str = String(value).trim();
  const parsed = new Date(ISO_DATE_RE.test(str) ? `${str}T12:00:00` : str);
  if (!isNaN(parsed.getTime())) return parsed;

  // Last resort for DD/MM/YYYY and DD-MM-YYYY rows.
  const parts = str.split(/[-/]/);
  if (parts.length === 3 && parts[2].length === 4) {
    const fallback = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T12:00:00`);
    if (!isNaN(fallback.getTime())) return fallback;
  }

  return null;
};

export const toDisplayDate = (value) => {
  if (!value) return '';

  const str = String(value).trim();
  if (DISPLAY_RE.test(str)) return str;

  const parsed = parseSaleDate(str);
  if (!parsed) return str;

  return parsed.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

// The inverse: recovers YYYY-MM-DD from whatever a row happens to carry, so a
// date input and the range filters get a value they can compare.
export const toIsoDate = (value) => {
  const parsed = parseSaleDate(value);
  if (!parsed) return '';

  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${parsed.getFullYear()}-${month}-${day}`;
};

// `saleDate` is the unambiguous field, so it wins; `date` is a display string
// that only round-trips reliably once parsed, and createdAt is the last resort.
export const getSaleDate = (sale) => {
  if (!sale) return null;
  return parseSaleDate(sale.saleDate) || parseSaleDate(sale.date) || parseSaleDate(sale.createdAt);
};
