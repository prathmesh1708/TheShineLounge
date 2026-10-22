// Phone numbers arrive typed every way imaginable ("98765 43210", "+91-98765-43210",
// "098765 43210", "919876543210"). WhatsApp wants digits with the country code
// and no "+", so that is the one form every lookup and send goes through.
// Bare 10-digit numbers are Indian mobiles — the same rule the invoice share uses.

const DEFAULT_COUNTRY_CODE = '91';

const normalizePhone = (raw) => {
  let digits = String(raw || '').replace(/\D/g, '');
  if (!digits) return '';
  digits = digits.replace(/^00/, '');

  if (digits.length === 10) {
    // Indian mobiles start 6-9; anything else is a landline or junk.
    return /^[6-9]/.test(digits) ? `${DEFAULT_COUNTRY_CODE}${digits}` : '';
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return normalizePhone(digits.slice(1));
  }
  if (digits.length === 12 && digits.startsWith(DEFAULT_COUNTRY_CODE)) {
    return /^[6-9]/.test(digits.slice(2)) ? digits : '';
  }
  // Other countries: E.164 allows 8-15 digits including the country code.
  if (digits.length >= 11 && digits.length <= 15 && !digits.startsWith('0')) {
    return digits;
  }
  return '';
};

const formatPhone = (normalized) => {
  const d = String(normalized || '');
  if (d.length === 12 && d.startsWith(DEFAULT_COUNTRY_CODE)) {
    return `+91 ${d.slice(2, 7)} ${d.slice(7)}`;
  }
  return d ? `+${d}` : '';
};

module.exports = { normalizePhone, formatPhone };
