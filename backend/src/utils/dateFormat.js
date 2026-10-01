// A sale carries two dates: `saleDate` ("2026-08-20") drives date inputs and
// range filters, while `date` ("August 20, 2026") is the string the admin table
// prints verbatim. Updates used to assign `booking.date = saleDate`, so every
// edit -- even one that only touched the customer name -- rewrote the display
// field into ISO and the table started showing "2026-08-20". Route display
// writes through toDisplayDate so the two fields stay in their own formats.
const DISPLAY_RE = /^[A-Z][a-z]+ \d{1,2}, \d{4}$/;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// A bare YYYY-MM-DD parses as UTC midnight, which renders as the previous day
// anywhere west of Greenwich. Anchoring at local noon keeps the calendar day.
const toDisplayDate = (value) => {
  if (!value) return '';

  const str = String(value).trim();
  if (DISPLAY_RE.test(str)) return str;

  const parsed = new Date(ISO_DATE_RE.test(str) ? `${str}T12:00:00` : str);
  if (isNaN(parsed.getTime())) return str;

  return parsed.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

// The inverse, for the other direction of the same confusion: mirrors that fall
// back to `booking.date` would otherwise store "August 20, 2026" in `saleDate`,
// where a date input and every range filter expect YYYY-MM-DD.
const toIsoDate = (value) => {
  if (!value) return '';

  const str = String(value).trim();
  if (ISO_DATE_RE.test(str)) return str;

  const parsed = new Date(str);
  if (isNaN(parsed.getTime())) return '';

  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${parsed.getFullYear()}-${month}-${day}`;
};

module.exports = { toDisplayDate, toIsoDate };
