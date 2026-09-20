const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { adminOnly, staffOnly } = require('../middleware/roleMiddleware');

const {
  getStaffList,
  createStaff,
  updateStaff,
  deleteStaff,
  toggleStaffStatus,
  resetStaffPassword
} = require('../controllers/staffController');

router.get('/', authMiddleware, staffOnly, getStaffList);
router.post('/', authMiddleware, adminOnly, createStaff);
router.put('/:id', authMiddleware, adminOnly, updateStaff);
router.delete('/:id', authMiddleware, adminOnly, deleteStaff);
router.patch('/:id/status', authMiddleware, adminOnly, toggleStaffStatus);
router.patch('/:id/reset-password', authMiddleware, adminOnly, resetStaffPassword);

module.exports = router;

