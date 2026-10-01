// Payroll rules, in one place so the admin and staff endpoints can't disagree.
//
// Money is whole rupees. A month's figures live on its SalaryStatement and are
// moved with conditional $inc updates, so a deduction can never take netPayable
// below zero and nothing can change a month once it is marked paid -- even with
// two admins acting at the same moment.

const Staff = require('../models/Staff');
const User = require('../models/User');
const SalaryStatement = require('../models/SalaryStatement');
const SalaryDeduction = require('../models/SalaryDeduction');
const SalaryRevision = require('../models/SalaryRevision');
const { formatSalaryText, isValidRupeeAmount } = require('../utils/salaryAmount');

const PAY_TIMEZONE = 'Asia/Kolkata';
const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

class PayrollError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const currentPayMonth = () =>
  new Date().toLocaleDateString('en-CA', { timeZone: PAY_TIMEZONE }).slice(0, 7);

const isValidMonth = (month) => MONTH_RE.test(String(month || ''));

// Pay months that can be viewed or acted on: any past month up to the current one
const assertPayMonth = (month) => {
  if (!isValidMonth(month)) throw new PayrollError(400, 'Month must be in YYYY-MM format.');
  if (month > currentPayMonth()) throw new PayrollError(400, 'Salary for future months cannot be changed yet.');
};

const actorName = (user) => user?.fullName || user?.name || user?.email || 'Admin';

// Base salary in force for a month, worked out from the revision history so
// that a past month still shows what the staff member earned back then
const baseSalaryForMonth = async (staff, month) => {
  const applied = await SalaryRevision.findOne({ staff: staff._id, effectiveFrom: { $lte: month } })
    .sort({ effectiveFrom: -1, createdAt: -1 });
  if (applied) return applied.newSalary;

  const later = await SalaryRevision.findOne({ staff: staff._id, effectiveFrom: { $gt: month } })
    .sort({ effectiveFrom: 1, createdAt: 1 });
  if (later) return later.previousSalary;

  return Number(staff.monthlySalary) || 0;
};

// The stored statement, or the figures it would start with if none exists yet.
// Viewing a month never writes to MongoDB.
const getStatementView = async (staff, month) => {
  const existing = await SalaryStatement.findOne({ staff: staff._id, payMonth: month }).lean();
  if (existing) return { ...existing, persisted: true };

  const base = await baseSalaryForMonth(staff, month);
  return {
    staff: staff._id,
    payMonth: month,
    baseSalary: base,
    totalDeductions: 0,
    netPayable: base,
    status: 'open',
    persisted: false
  };
};

const ensureStatement = async (staff, month) => {
  const baseSalary = await baseSalaryForMonth(staff, month);
  const upsert = () =>
    SalaryStatement.findOneAndUpdate(
      { staff: staff._id, payMonth: month },
      {
        $setOnInsert: {
          staffName: staff.fullName,
          serviceKey: staff.serviceKey || '',
          baseSalary,
          totalDeductions: 0,
          netPayable: baseSalary,
          status: 'open'
        }
      },
      { upsert: true, new: true }
    );
  try {
    return await upsert();
  } catch (err) {
    // Two requests creating the same month at once: the unique index lets one win
    if (err.code === 11000) return upsert();
    throw err;
  }
};

const addDeduction = async ({ staff, month, amount, category, reason, actor }) => {
  assertPayMonth(month);
  const rupees = Number(amount);
  if (!isValidRupeeAmount(rupees)) {
    throw new PayrollError(400, 'Deduction must be a whole rupee amount greater than 0.');
  }
  if (!SalaryDeduction.CATEGORIES.includes(category)) {
    throw new PayrollError(400, `Category must be one of: ${SalaryDeduction.CATEGORIES.join(', ')}.`);
  }
  if (!String(reason || '').trim()) {
    throw new PayrollError(400, 'Please give a reason for the deduction.');
  }

  const statement = await ensureStatement(staff, month);
  if (statement.baseSalary <= 0) {
    throw new PayrollError(409, `Set a monthly salary for ${staff.fullName} before adding deductions.`);
  }

  // Reserve the amount on the statement first; the filter enforces both rules
  const reserved = await SalaryStatement.findOneAndUpdate(
    { _id: statement._id, status: 'open', netPayable: { $gte: rupees } },
    { $inc: { totalDeductions: rupees, netPayable: -rupees } },
    { new: true }
  );
  if (!reserved) {
    const latest = await SalaryStatement.findById(statement._id);
    if (latest.status === 'paid') {
      throw new PayrollError(409, `${month} is already marked paid and is locked.`);
    }
    throw new PayrollError(409, `Deduction exceeds the remaining salary of ₹${latest.netPayable.toLocaleString('en-IN')} for ${month}.`);
  }

  try {
    const deduction = await SalaryDeduction.create({
      staff: staff._id,
      statement: reserved._id,
      payMonth: month,
      staffName: staff.fullName,
      serviceKey: staff.serviceKey || '',
      amount: rupees,
      category,
      reason: String(reason).trim(),
      createdBy: actor?._id || null,
      createdByName: actorName(actor)
    });
    return { deduction, statement: reserved };
  } catch (err) {
    await SalaryStatement.updateOne({ _id: reserved._id }, { $inc: { totalDeductions: -rupees, netPayable: rupees } });
    throw err;
  }
};

const reverseDeduction = async ({ deductionId, reason, actor }) => {
  if (!String(reason || '').trim()) {
    throw new PayrollError(400, 'Please give a reason for reversing the deduction.');
  }
  const deduction = await SalaryDeduction.findById(deductionId);
  if (!deduction) throw new PayrollError(404, 'Deduction not found.');
  if (deduction.status !== 'active') throw new PayrollError(409, 'This deduction has already been reversed.');

  const statement = await SalaryStatement.findById(deduction.statement);
  if (!statement || statement.status === 'paid') {
    throw new PayrollError(409, `${deduction.payMonth} is already marked paid and is locked.`);
  }

  const claimed = await SalaryDeduction.findOneAndUpdate(
    { _id: deduction._id, status: 'active' },
    {
      status: 'reversed',
      reversedBy: actor?._id || null,
      reversedByName: actorName(actor),
      reversedAt: new Date(),
      reversalReason: String(reason).trim()
    },
    { new: true }
  );
  if (!claimed) throw new PayrollError(409, 'This deduction has already been reversed.');

  const restored = await SalaryStatement.findOneAndUpdate(
    { _id: statement._id, status: 'open' },
    { $inc: { totalDeductions: -claimed.amount, netPayable: claimed.amount } },
    { new: true }
  );
  if (!restored) {
    // The month was paid between the check and the update: undo the claim
    await SalaryDeduction.updateOne(
      { _id: claimed._id },
      { status: 'active', reversedBy: null, reversedByName: '', reversedAt: null, reversalReason: '' }
    );
    throw new PayrollError(409, `${deduction.payMonth} is already marked paid and is locked.`);
  }
  return { deduction: claimed, statement: restored };
};

const PAYMENT_MODES = ['Bank Transfer', 'UPI', 'Cash', 'Cheque'];

const markPaid = async ({ staff, month, paymentMode, note, actor }) => {
  assertPayMonth(month);
  if (!PAYMENT_MODES.includes(paymentMode)) {
    throw new PayrollError(400, `Payment mode must be one of: ${PAYMENT_MODES.join(', ')}.`);
  }
  const statement = await ensureStatement(staff, month);
  if (statement.baseSalary <= 0) {
    throw new PayrollError(409, `Set a monthly salary for ${staff.fullName} before marking it paid.`);
  }
  const paid = await SalaryStatement.findOneAndUpdate(
    { _id: statement._id, status: 'open' },
    {
      status: 'paid',
      paidAt: new Date(),
      paidBy: actor?._id || null,
      paidByName: actorName(actor),
      paymentMode,
      paymentNote: String(note || '').trim()
    },
    { new: true }
  );
  if (!paid) throw new PayrollError(409, `${month} is already marked paid.`);
  return paid;
};

const changeBaseSalary = async ({ staff, newSalary, effectiveFrom = currentPayMonth(), reason = '', actor }) => {
  assertPayMonth(effectiveFrom);
  const amount = Number(newSalary);
  if (!isValidRupeeAmount(amount, { allowZero: true })) {
    throw new PayrollError(400, 'Monthly salary must be a whole rupee amount.');
  }
  const previous = Number(staff.monthlySalary) || 0;
  if (amount === previous) return { staff, revision: null };

  // Open months from effectiveFrom onwards take the new base; paid months stay as paid
  const affected = { staff: staff._id, status: 'open', payMonth: { $gte: effectiveFrom } };
  const blocking = await SalaryStatement.findOne({ ...affected, totalDeductions: { $gt: amount } });
  if (blocking) {
    throw new PayrollError(
      409,
      `${blocking.payMonth} already has ₹${blocking.totalDeductions.toLocaleString('en-IN')} in deductions, more than the new salary.`
    );
  }

  // Re-base the affected statements first, so a failure here leaves the staff
  // record untouched. Each update is conditional on the deductions it read, and
  // re-reads if a deduction landed in between.
  const openStatements = await SalaryStatement.find(affected).select('_id');
  for (const { _id } of openStatements) {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const current = await SalaryStatement.findById(_id);
      if (!current || current.status !== 'open') break;
      if (current.totalDeductions > amount) {
        throw new PayrollError(409, `${current.payMonth} already has ₹${current.totalDeductions.toLocaleString('en-IN')} in deductions, more than the new salary.`);
      }
      const result = await SalaryStatement.updateOne(
        { _id, status: 'open', totalDeductions: current.totalDeductions },
        { baseSalary: amount, netPayable: amount - current.totalDeductions }
      );
      if (result.modifiedCount === 1 || result.matchedCount === 1) break;
    }
  }

  const updatedStaff = await Staff.findByIdAndUpdate(
    staff._id,
    { monthlySalary: amount, salary: formatSalaryText(amount) },
    { new: true }
  );
  await User.updateOne({ _id: staff._id }, { salary: formatSalaryText(amount) }).catch(() => {});

  const revision = await SalaryRevision.create({
    staff: staff._id,
    staffName: staff.fullName,
    previousSalary: previous,
    newSalary: amount,
    effectiveFrom,
    reason: String(reason).trim(),
    changedBy: actor?._id || null,
    changedByName: actorName(actor)
  });

  return { staff: updatedStaff, revision };
};

module.exports = {
  PayrollError,
  PAYMENT_MODES,
  currentPayMonth,
  isValidMonth,
  assertPayMonth,
  getStatementView,
  addDeduction,
  reverseDeduction,
  markPaid,
  changeBaseSalary
};
