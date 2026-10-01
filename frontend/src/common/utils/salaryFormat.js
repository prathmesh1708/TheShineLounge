// Display helpers for payroll screens. All figures come from the server;
// nothing here computes a salary.

export const formatRupees = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN')}`;

// "2026-09" -> "September 2026"
export const formatPayMonth = (month) => {
  if (!month) return '';
  const [y, m] = month.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('en-IN', { month: 'long', year: 'numeric', timeZone: 'UTC' });
};

// The current pay month (as reported by the server) and the `count - 1` before it, newest first
export const recentPayMonths = (currentMonth, count = 12) => {
  if (!currentMonth) return [];
  let [y, m] = currentMonth.split('-').map(Number);
  const months = [];
  for (let i = 0; i < count; i += 1) {
    months.push(`${y}-${String(m).padStart(2, '0')}`);
    m -= 1;
    if (m === 0) {
      m = 12;
      y -= 1;
    }
  }
  return months;
};
