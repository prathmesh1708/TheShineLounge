import apiClient from '../../common/utils/apiClient';

const unwrap = (res, key) => (res && res.data && res.data[key]) || null;

export const EXPENSE_RANGES = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
  { id: 'year', label: 'This Year' },
  { id: 'all', label: 'All Time' },
  { id: 'custom', label: 'Custom' }
];

export const EXPENSE_CATEGORIES = [
  'Tea & Refreshments',
  'Cleaning Supplies',
  'Repairs & Maintenance',
  'Utilities',
  'Transport & Fuel',
  'Stationery',
  'Staff Welfare',
  'Marketing',
  'Rent',
  'General'
];

export const getExpenses = async (params = {}) => {
  const res = await apiClient.get('/expenses', { params });
  return {
    expenses: (res && res.data && res.data.expenses) || [],
    total: (res && res.data && res.data.total) || 0
  };
};

export const getExpenseSummary = async () => {
  const res = await apiClient.get('/expenses/summary');
  return {
    summary: (res && res.data && res.data.summary) || {},
    monthly: (res && res.data && res.data.monthly) || [],
    byCategoryThisMonth: (res && res.data && res.data.byCategoryThisMonth) || []
  };
};

export const createExpense = async (payload) => {
  const res = await apiClient.post('/expenses', payload);
  return unwrap(res, 'expense');
};

export const updateExpense = async (id, payload) => {
  const res = await apiClient.put(`/expenses/${id}`, payload);
  return unwrap(res, 'expense');
};

export const deleteExpense = async (id) => {
  const res = await apiClient.delete(`/expenses/${id}`);
  return res && res.data;
};

export const formatExpenseDate = (value) => {
  const d = value ? new Date(value) : null;
  if (!d || isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const toDateInput = (value) => {
  const d = value ? new Date(value) : new Date();
  if (isNaN(d.getTime())) return '';
  // Local parts, not toISOString, which would shift the date backwards for
  // anyone east of UTC and file an expense under the wrong day.
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export default {
  EXPENSE_RANGES,
  EXPENSE_CATEGORIES,
  getExpenses,
  getExpenseSummary,
  createExpense,
  updateExpense,
  deleteExpense,
  formatExpenseDate,
  toDateInput
};
