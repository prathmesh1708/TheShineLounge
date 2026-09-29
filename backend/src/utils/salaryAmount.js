// Salary used to be free text ("₹35,000 / month", "45k"). These helpers turn
// that text into whole rupees and back, so the number is what gets stored and
// the text is only ever a rendering of it.

const MAX_MONTHLY_SALARY = 10000000; // ₹1 crore, a sanity ceiling

// Returns whole rupees, or null when the text holds no usable amount
const parseSalaryText = (value) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) && value >= 0 ? Math.round(value) : null;
  }
  const text = String(value || '').toLowerCase().replace(/,/g, '');
  const match = text.match(/(\d+(?:\.\d+)?)\s*(k|l|lakh|lac)?/);
  if (!match) return null;

  let amount = Number(match[1]);
  if (match[2] === 'k') amount *= 1000;
  if (match[2] && match[2] !== 'k') amount *= 100000;
  return Number.isFinite(amount) ? Math.round(amount) : null;
};

const formatSalaryText = (amount) =>
  amount > 0 ? `₹${Number(amount).toLocaleString('en-IN')} / month` : '';

const isValidRupeeAmount = (amount, { allowZero = false } = {}) =>
  Number.isInteger(amount) && amount <= MAX_MONTHLY_SALARY && (allowZero ? amount >= 0 : amount > 0);

module.exports = { parseSalaryText, formatSalaryText, isValidRupeeAmount, MAX_MONTHLY_SALARY };
