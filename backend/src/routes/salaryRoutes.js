const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/roleMiddleware');
const {
  getSalaryOverview,
  getStaffSalary,
  addStaffDeduction,
  reverseStaffDeduction,
  changeStaffBaseSalary,
  markStaffSalaryPaid,
  getMySalary
} = require('../controllers/salaryController');

// A staff account only ever sees its own salary, resolved from the token
const staffAccountOnly = (req, res, next) => {
  if (String(req.user?.role || '').toLowerCase() === 'staff') return next();
  return res.status(403).json({ success: false, message: 'Only staff accounts have a personal salary view.' });
};

router.get('/me', authMiddleware, staffAccountOnly, getMySalary);

router.get('/overview', authMiddleware, adminOnly, getSalaryOverview);
router.get('/staff/:id', authMiddleware, adminOnly, getStaffSalary);
router.post('/staff/:id/deductions', authMiddleware, adminOnly, addStaffDeduction);
router.put('/staff/:id/base', authMiddleware, adminOnly, changeStaffBaseSalary);
router.patch('/staff/:id/statements/:month/pay', authMiddleware, adminOnly, markStaffSalaryPaid);
router.post('/deductions/:deductionId/reverse', authMiddleware, adminOnly, reverseStaffDeduction);

module.exports = router;
