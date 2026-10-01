const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/roleMiddleware');
const {
  applyLeave,
  getMyLeaves,
  cancelLeave,
  getLeaveRequests,
  reviewLeave
} = require('../controllers/leaveController');

// Leave is applied for by the staff account itself, never on someone else's behalf
const staffAccountOnly = (req, res, next) => {
  if (String(req.user?.role || '').toLowerCase() === 'staff') return next();
  return res.status(403).json({ success: false, message: 'Only staff accounts can apply for leave.' });
};

router.get('/me', authMiddleware, staffAccountOnly, getMyLeaves);
router.post('/', authMiddleware, staffAccountOnly, applyLeave);
router.patch('/:id/cancel', authMiddleware, staffAccountOnly, cancelLeave);

router.get('/', authMiddleware, adminOnly, getLeaveRequests);
router.patch('/:id/review', authMiddleware, adminOnly, reviewLeave);

module.exports = router;
