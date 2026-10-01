const Staff = require('../models/Staff');
const SalaryStatement = require('../models/SalaryStatement');
const SalaryDeduction = require('../models/SalaryDeduction');
const SalaryRevision = require('../models/SalaryRevision');
const payroll = require('../services/payroll');

const RECENT_MONTHS = 6;

const rupees = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN')}`;

const monthLabel = (month) => {
  const [y, m] = month.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('en-IN', { month: 'long', year: 'numeric', timeZone: 'UTC' });
};

// Admin screens address staff by Mongo _id, staffId or email
const findStaff = async (idParam) => {
  const conditions = [{ staffId: idParam }, { email: String(idParam || '').toLowerCase().trim() }];
  if (/^[0-9a-fA-F]{24}$/.test(String(idParam))) conditions.unshift({ _id: idParam });
  return Staff.findOne({ $or: conditions, isDeleted: { $ne: true } });
};

const monthFromQuery = (req) => req.query.month || req.body?.month || payroll.currentPayMonth();

const sendError = (res, error, fallback) => {
  const status = error instanceof payroll.PayrollError ? error.status : 500;
  res.status(status).json({ success: false, message: error.message || fallback });
};

const notifyStaff = async (staff, { title, message, priority = 'high' }) => {
  try {
    const Notification = require('../models/Notification');
    await Notification.create({
      title,
      message,
      recipientType: 'staff',
      targetUserId: staff._id,
      serviceKey: staff.serviceKey || 'car-wash',
      category: 'service_update',
      priority,
      actionUrl: '/staff/profile'
    });
  } catch (err) {
    console.warn('Failed to insert salary notification:', err);
  }
};

// Statement, deductions and recent months for one staff member
const buildSalaryDetail = async (staff, month, { includeAdminHistory }) => {
  const [statement, deductions, recentStatements] = await Promise.all([
    payroll.getStatementView(staff, month),
    SalaryDeduction.find({ staff: staff._id, payMonth: month }).sort({ createdAt: -1 }).lean(),
    SalaryStatement.find({ staff: staff._id }).sort({ payMonth: -1 }).limit(RECENT_MONTHS).lean()
  ]);

  const detail = {
    month,
    currentMonth: payroll.currentPayMonth(),
    monthlySalary: staff.monthlySalary || 0,
    statement,
    deductions,
    recentStatements
  };

  if (includeAdminHistory) {
    detail.revisions = await SalaryRevision.find({ staff: staff._id }).sort({ createdAt: -1 }).limit(20).lean();
    detail.categories = SalaryDeduction.CATEGORIES;
    detail.paymentModes = payroll.PAYMENT_MODES;
  }
  return detail;
};

// @desc    Salary summary for every staff member of a service for one month
// @route   GET /api/salary/overview?serviceKey=car-wash&month=2026-09
// @access  Admin
const getSalaryOverview = async (req, res) => {
  try {
    const month = monthFromQuery(req);
    payroll.assertPayMonth(month);

    const query = { isDeleted: { $ne: true } };
    if (req.query.serviceKey && req.query.serviceKey !== 'all') query.serviceKey = req.query.serviceKey;
    const staffList = await Staff.find(query)
      .select('fullName staffId staffRole serviceKey department photo profileImage monthlySalary isActive')
      .sort({ fullName: 1 });

    const rows = await Promise.all(
      staffList.map(async (staff) => {
        const statement = await payroll.getStatementView(staff, month);
        return {
          staffId: staff._id,
          staffCode: staff.staffId,
          fullName: staff.fullName,
          staffRole: staff.staffRole,
          serviceKey: staff.serviceKey,
          photo: staff.photo || staff.profileImage || '',
          isActive: staff.isActive,
          baseSalary: statement.baseSalary,
          totalDeductions: statement.totalDeductions,
          netPayable: statement.netPayable,
          status: statement.status,
          paidAt: statement.paidAt || null
        };
      })
    );

    const totals = rows.reduce(
      (acc, r) => ({
        baseSalary: acc.baseSalary + r.baseSalary,
        totalDeductions: acc.totalDeductions + r.totalDeductions,
        netPayable: acc.netPayable + r.netPayable,
        paidCount: acc.paidCount + (r.status === 'paid' ? 1 : 0)
      }),
      { baseSalary: 0, totalDeductions: 0, netPayable: 0, paidCount: 0 }
    );

    res.status(200).json({ success: true, month, currentMonth: payroll.currentPayMonth(), totals, rows });
  } catch (error) {
    sendError(res, error, 'Server error fetching salary overview');
  }
};

// @desc    One staff member's salary for a month, with deductions and history
// @route   GET /api/salary/staff/:id?month=2026-09
// @access  Admin
const getStaffSalary = async (req, res) => {
  try {
    const month = monthFromQuery(req);
    payroll.assertPayMonth(month);
    const staff = await findStaff(req.params.id);
    if (!staff) return res.status(404).json({ success: false, message: 'Staff member not found' });

    const detail = await buildSalaryDetail(staff, month, { includeAdminHistory: true });
    res.status(200).json({
      success: true,
      staff: { _id: staff._id, staffId: staff.staffId, fullName: staff.fullName, staffRole: staff.staffRole, serviceKey: staff.serviceKey },
      ...detail
    });
  } catch (error) {
    sendError(res, error, 'Server error fetching staff salary');
  }
};

// @desc    Deduct salary with a reason
// @route   POST /api/salary/staff/:id/deductions
// @access  Admin
const addStaffDeduction = async (req, res) => {
  try {
    const staff = await findStaff(req.params.id);
    if (!staff) return res.status(404).json({ success: false, message: 'Staff member not found' });

    const { month = payroll.currentPayMonth(), amount, category, reason } = req.body;
    const { deduction, statement } = await payroll.addDeduction({ staff, month, amount, category, reason, actor: req.user });

    await notifyStaff(staff, {
      title: `💸 Salary Deduction: ${rupees(deduction.amount)}`,
      message: `${rupees(deduction.amount)} deducted from your ${monthLabel(month)} salary (${deduction.category}): ${deduction.reason}. Remaining: ${rupees(statement.netPayable)}.`
    });

    res.status(201).json({
      success: true,
      message: `${rupees(deduction.amount)} deducted from ${staff.fullName}'s ${monthLabel(month)} salary.`,
      deduction,
      statement
    });
  } catch (error) {
    sendError(res, error, 'Server error adding deduction');
  }
};

// @desc    Reverse a deduction (it stays on record, marked reversed)
// @route   POST /api/salary/deductions/:deductionId/reverse
// @access  Admin
const reverseStaffDeduction = async (req, res) => {
  try {
    const { deduction, statement } = await payroll.reverseDeduction({
      deductionId: req.params.deductionId,
      reason: req.body.reason,
      actor: req.user
    });

    const staff = await Staff.findById(deduction.staff).select('serviceKey fullName');
    if (staff) {
      await notifyStaff(staff, {
        title: `↩️ Deduction Reversed: ${rupees(deduction.amount)}`,
        message: `The ${rupees(deduction.amount)} ${deduction.category} deduction on your ${monthLabel(deduction.payMonth)} salary was reversed: ${deduction.reversalReason}. Remaining: ${rupees(statement.netPayable)}.`,
        priority: 'normal'
      });
    }

    res.status(200).json({ success: true, message: 'Deduction reversed.', deduction, statement });
  } catch (error) {
    sendError(res, error, 'Server error reversing deduction');
  }
};

// @desc    Change a staff member's monthly salary
// @route   PUT /api/salary/staff/:id/base
// @access  Admin
const changeStaffBaseSalary = async (req, res) => {
  try {
    const staff = await findStaff(req.params.id);
    if (!staff) return res.status(404).json({ success: false, message: 'Staff member not found' });

    const { monthlySalary, effectiveFrom, reason } = req.body;
    const result = await payroll.changeBaseSalary({
      staff,
      newSalary: monthlySalary,
      effectiveFrom: effectiveFrom || undefined,
      reason,
      actor: req.user
    });

    res.status(200).json({
      success: true,
      message: result.revision
        ? `Monthly salary for ${staff.fullName} updated to ${rupees(result.staff.monthlySalary)}.`
        : 'Monthly salary is unchanged.',
      monthlySalary: result.staff.monthlySalary,
      revision: result.revision
    });
  } catch (error) {
    sendError(res, error, 'Server error updating salary');
  }
};

// @desc    Mark a month as paid, which locks it
// @route   PATCH /api/salary/staff/:id/statements/:month/pay
// @access  Admin
const markStaffSalaryPaid = async (req, res) => {
  try {
    const staff = await findStaff(req.params.id);
    if (!staff) return res.status(404).json({ success: false, message: 'Staff member not found' });

    const statement = await payroll.markPaid({
      staff,
      month: req.params.month,
      paymentMode: req.body.paymentMode,
      note: req.body.note,
      actor: req.user
    });

    await notifyStaff(staff, {
      title: `✅ ${monthLabel(statement.payMonth)} Salary Paid`,
      message: `${rupees(statement.netPayable)} paid via ${statement.paymentMode}${statement.totalDeductions ? ` (after ${rupees(statement.totalDeductions)} in deductions)` : ''}.`
    });

    res.status(200).json({ success: true, message: `${monthLabel(statement.payMonth)} salary marked paid for ${staff.fullName}.`, statement });
  } catch (error) {
    sendError(res, error, 'Server error marking salary paid');
  }
};

// @desc    Logged-in staff member's own salary
// @route   GET /api/salary/me?month=2026-09
// @access  Staff
const getMySalary = async (req, res) => {
  try {
    const month = monthFromQuery(req);
    payroll.assertPayMonth(month);
    const staff = await Staff.findById(req.user._id);
    if (!staff) return res.status(404).json({ success: false, message: 'Staff profile not found' });

    const detail = await buildSalaryDetail(staff, month, { includeAdminHistory: false });
    res.status(200).json({ success: true, ...detail });
  } catch (error) {
    sendError(res, error, 'Server error fetching your salary');
  }
};

module.exports = {
  getSalaryOverview,
  getStaffSalary,
  addStaffDeduction,
  reverseStaffDeduction,
  changeStaffBaseSalary,
  markStaffSalaryPaid,
  getMySalary
};
