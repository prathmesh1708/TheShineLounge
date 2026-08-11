const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { adminOnly, staffOnly } = require('../middleware/roleMiddleware');
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
  updateCustomerMembership,
  updateCustomerUsageRules,
  addCustomerVehicle,
  updateProfile,
  submitFeedback,
  getMyFeedback,
  getAdminFeedbacks,
  replyToFeedback,
  updateFeedbackStatus,
  deleteFeedback
} = require('../controllers/userController');

// ─── Self-Service (any authenticated user / guest) ────────────
router.put('/profile', authMiddleware, updateProfile);
router.post('/feedback', submitFeedback);
router.get('/my-feedback', getMyFeedback);

// ─── Feedback & Support Management (Admin & Staff) ─────────────
router.get('/admin/feedback', authMiddleware, getAdminFeedbacks);
router.put('/admin/feedback/:id/reply', authMiddleware, replyToFeedback);
router.patch('/admin/feedback/:id/status', authMiddleware, updateFeedbackStatus);
router.delete('/admin/feedback/:id', authMiddleware, adminOnly, deleteFeedback);

// ─── Staff Management (Admin Only) ──────────────────────────
router.post('/staff', authMiddleware, adminOnly, createStaff);
router.get('/staff', authMiddleware, staffOnly, getStaffList);
router.get('/staff/:id', authMiddleware, adminOnly, getStaffById);
router.put('/staff/:id', authMiddleware, adminOnly, updateStaff);
router.patch('/staff/:id/status', authMiddleware, adminOnly, toggleStaffStatus);
router.patch('/staff/:id/reset-password', authMiddleware, adminOnly, resetStaffPassword);
router.delete('/staff/:id', authMiddleware, adminOnly, deleteStaff);

// ─── Customer Management (Admin & Staff) ───────────────────────
router.get('/customers', authMiddleware, getCustomers);
router.get('/customers/:id', authMiddleware, getCustomerById);
router.put('/customers/:id/membership', authMiddleware, adminOnly, updateCustomerMembership);
router.put('/customers/:id/usage-rules', authMiddleware, adminOnly, updateCustomerUsageRules);
router.post('/customers/:id/vehicles', authMiddleware, adminOnly, addCustomerVehicle);

module.exports = router;

