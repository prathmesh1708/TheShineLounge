const Expense = require('../models/Expense');

const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

// All period boundaries are local calendar edges, not rolling windows: "today"
// means since midnight and "this month" means since the 1st, which is how
// someone reading a day's or month's spend expects it to behave.
const startOfDay = (d = new Date()) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const startOfWeek = (d = new Date()) => {
  const x = startOfDay(d);
  // Monday as the first day of the week.
  const day = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - day);
  return x;
};
const startOfMonth = (d = new Date()) => new Date(d.getFullYear(), d.getMonth(), 1);
const startOfYear = (d = new Date()) => new Date(d.getFullYear(), 0, 1);

const buildRange = (range, from, to) => {
  const now = new Date();
  switch (range) {
    case 'today':
      return { $gte: startOfDay(now) };
    case 'yesterday': {
      const start = startOfDay(now);
      start.setDate(start.getDate() - 1);
      return { $gte: start, $lt: startOfDay(now) };
    }
    case 'week':
      return { $gte: startOfWeek(now) };
    case 'month':
      return { $gte: startOfMonth(now) };
    case 'year':
      return { $gte: startOfYear(now) };
    case 'custom': {
      const q = {};
      if (from) { const f = new Date(from); if (!isNaN(f)) q.$gte = startOfDay(f); }
      if (to) { const t = new Date(to); if (!isNaN(t)) { t.setHours(23, 59, 59, 999); q.$lte = t; } }
      return Object.keys(q).length ? q : null;
    }
    default:
      return null; // all time
  }
};

// @desc    List expenses, filtered
// @route   GET /api/expenses
// @access  Private (Admin)
const getExpenses = async (req, res) => {
  try {
    const { range, from, to, category, serviceKey, search } = req.query;
    const query = { isDeleted: { $ne: true } };

    const spentOn = buildRange(range, from, to);
    if (spentOn) query.spentOn = spentOn;

    if (category && category !== 'All') query.category = category;
    if (serviceKey && serviceKey !== 'All') query.serviceKey = serviceKey;

    if (search && String(search).trim()) {
      const rx = new RegExp(escapeRegex(String(search).trim()), 'i');
      query.$or = [{ title: rx }, { category: rx }, { vendor: rx }, { notes: rx }, { paidBy: rx }, { billRef: rx }];
    }

    const expenses = await Expense.find(query).sort({ spentOn: -1, createdAt: -1 });
    const total = round2(expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0));

    res.status(200).json({ success: true, count: expenses.length, total, expenses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server error fetching expenses' });
  }
};

// @desc    Headline totals plus a month-by-month breakdown
// @route   GET /api/expenses/summary
// @access  Private (Admin)
const getExpenseSummary = async (req, res) => {
  try {
    const all = await Expense.find({ isDeleted: { $ne: true } }).select('amount spentOn category').lean();

    const now = new Date();
    const bounds = {
      today: startOfDay(now),
      week: startOfWeek(now),
      month: startOfMonth(now),
      year: startOfYear(now)
    };
    const yesterdayStart = new Date(bounds.today);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);

    const sumFrom = (from, until) => round2(all.reduce((sum, e) => {
      const t = new Date(e.spentOn).getTime();
      if (isNaN(t) || t < from.getTime()) return sum;
      if (until && t >= until.getTime()) return sum;
      return sum + (Number(e.amount) || 0);
    }, 0));

    // Twelve months back, oldest first, so a chart can plot it directly.
    const monthly = [];
    for (let i = 11; i >= 0; i--) {
      const from = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const until = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      monthly.push({
        key: `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, '0')}`,
        label: from.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
        total: sumFrom(from, until)
      });
    }

    const byCategory = {};
    all.forEach((e) => {
      const t = new Date(e.spentOn).getTime();
      if (isNaN(t) || t < bounds.month.getTime()) return;
      const key = e.category || 'General';
      byCategory[key] = round2((byCategory[key] || 0) + (Number(e.amount) || 0));
    });

    res.status(200).json({
      success: true,
      summary: {
        today: sumFrom(bounds.today),
        yesterday: sumFrom(yesterdayStart, bounds.today),
        week: sumFrom(bounds.week),
        month: sumFrom(bounds.month),
        year: sumFrom(bounds.year),
        allTime: round2(all.reduce((s, e) => s + (Number(e.amount) || 0), 0)),
        count: all.length
      },
      monthly,
      byCategoryThisMonth: Object.entries(byCategory)
        .map(([category, total]) => ({ category, total }))
        .sort((a, b) => b.total - a.total)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server error building summary' });
  }
};

// @desc    Record an expense
// @route   POST /api/expenses
// @access  Private (Admin)
const createExpense = async (req, res) => {
  try {
    const { title, amount } = req.body;

    if (!title || !String(title).trim()) {
      return res.status(400).json({ success: false, message: 'A title is required' });
    }
    const numAmount = Number(amount);
    if (!Number.isFinite(numAmount) || numAmount < 0) {
      return res.status(400).json({ success: false, message: 'Amount must be a number of zero or more' });
    }

    const spentOn = req.body.spentOn ? new Date(req.body.spentOn) : new Date();
    if (isNaN(spentOn.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid date' });
    }

    const expense = await Expense.create({
      title: String(title).trim(),
      category: String(req.body.category || 'General').trim(),
      amount: round2(numAmount),
      spentOn,
      paidBy: String(req.body.paidBy || '').trim(),
      paymentMode: String(req.body.paymentMode || 'Cash').trim(),
      serviceKey: String(req.body.serviceKey || '').trim(),
      vendor: String(req.body.vendor || '').trim(),
      billRef: String(req.body.billRef || '').trim(),
      notes: String(req.body.notes || ''),
      recordedBy: (req.user && req.user.fullName) || ''
    });

    res.status(201).json({ success: true, message: 'Expense recorded', expense });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server error recording expense' });
  }
};

// @desc    Update an expense
// @route   PUT /api/expenses/:id
// @access  Private (Admin)
const updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    if (req.body.amount !== undefined) {
      const numAmount = Number(req.body.amount);
      if (!Number.isFinite(numAmount) || numAmount < 0) {
        return res.status(400).json({ success: false, message: 'Amount must be a number of zero or more' });
      }
      expense.amount = round2(numAmount);
    }

    if (req.body.spentOn !== undefined) {
      const d = new Date(req.body.spentOn);
      if (isNaN(d.getTime())) {
        return res.status(400).json({ success: false, message: 'Invalid date' });
      }
      expense.spentOn = d;
    }

    ['title', 'category', 'paidBy', 'paymentMode', 'serviceKey', 'vendor', 'billRef', 'notes'].forEach((f) => {
      if (req.body[f] !== undefined) expense[f] = req.body[f];
    });

    await expense.save();
    res.status(200).json({ success: true, message: 'Expense updated', expense });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server error updating expense' });
  }
};

// @desc    Remove an expense
// @route   DELETE /api/expenses/:id
// @access  Private (Admin)
const deleteExpense = async (req, res) => {
  try {
    // Soft delete so a bookkeeping total can still be reconciled against what
    // was recorded at the time.
    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, isDeleted: { $ne: true } },
      { $set: { isDeleted: true } },
      { new: true }
    );

    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    res.status(200).json({ success: true, message: 'Expense removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server error deleting expense' });
  }
};

module.exports = {
  getExpenses,
  getExpenseSummary,
  createExpense,
  updateExpense,
  deleteExpense
};
