const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/roleMiddleware');
const {
  createStaff,
  getStaffList,
  getStaffById,
  updateStaff,
  toggleStaffStatus,
  resetStaffPassword,
  deleteStaff,
  getCustomers,
  getCustomerById,
  updateProfile
} = require('../controllers/userController');

// ─── Self-Service (any authenticated user) ───────────────────
router.put('/profile', authMiddleware, updateProfile);

// ─── Staff Management (Admin Only) ──────────────────────────
router.post('/staff', authMiddleware, adminOnly, createStaff);
router.get('/staff', authMiddleware, adminOnly, getStaffList);
router.get('/staff/:id', authMiddleware, adminOnly, getStaffById);
router.put('/staff/:id', authMiddleware, adminOnly, updateStaff);
router.patch('/staff/:id/status', authMiddleware, adminOnly, toggleStaffStatus);
router.patch('/staff/:id/reset-password', authMiddleware, adminOnly, resetStaffPassword);
router.delete('/staff/:id', authMiddleware, adminOnly, deleteStaff);

// ─── Customer Management (Admin Only) ───────────────────────
router.get('/customers', authMiddleware, adminOnly, getCustomers);
router.get('/customers/:id', authMiddleware, adminOnly, getCustomerById);

module.exports = router;
