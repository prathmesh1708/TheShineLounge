const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { adminOnly, staffOnly } = require('../middleware/roleMiddleware');

const {
  getStaffList,
  getStaffById,
  createStaff,
  updateStaff,
  deleteStaff,
  toggleStaffStatus,
  resetStaffPassword,
  updateStaffBreak,
  getStaffBreakStatus
} = require('../controllers/staffController');

router.get('/', authMiddleware, staffOnly, getStaffList);
router.get('/:id', authMiddleware, staffOnly, getStaffById);
router.post('/', authMiddleware, adminOnly, createStaff);
router.put('/:id', authMiddleware, adminOnly, updateStaff);
router.delete('/:id', authMiddleware, adminOnly, deleteStaff);
router.patch('/:id/status', authMiddleware, adminOnly, toggleStaffStatus);
router.patch('/:id/reset-password', authMiddleware, adminOnly, resetStaffPassword);
router.post('/:id/break', authMiddleware, staffOnly, updateStaffBreak);
router.get('/:id/break', authMiddleware, staffOnly, getStaffBreakStatus);

module.exports = router;


