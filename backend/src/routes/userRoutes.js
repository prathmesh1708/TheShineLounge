const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const optionalAuth = require('../middleware/optionalAuth');
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
  getMyVehicles,
  addMyVehicle,
  deleteMyVehicle,
  getMyMembership,
  submitFeedback,
  getMyFeedback,
  getAdminFeedbacks,
  replyToFeedback,
  updateFeedbackStatus,
  deleteFeedback
} = require('../controllers/userController');

// ─── Self-Service (the authenticated caller's own record only) ─
// Each of these resolves its target from req.user._id. There is no id or email
// parameter to swap, so one customer cannot address another's garage,
// membership or support history.
router.put('/profile', authMiddleware, updateProfile);

router.get('/vehicles', authMiddleware, getMyVehicles);
router.post('/vehicles', authMiddleware, addMyVehicle);
router.delete('/vehicles/:vehicleId', authMiddleware, deleteMyVehicle);

router.get('/membership', authMiddleware, getMyMembership);

// Feedback stays open to guests (the contact form on the marketing pages), but
// a signed-in submission is attributed to the account so it can be found again
// without trusting a client-supplied email.
router.post('/feedback', optionalAuth, submitFeedback);
router.get('/my-feedback', authMiddleware, getMyFeedback);

// ─── Feedback & Support Management (Admin & Staff) ─────────────
// `staffOnly` (which also admits admins) is what keeps these off a customer
// token — authMiddleware alone let any signed-in customer read every ticket.
router.get('/admin/feedback', authMiddleware, staffOnly, getAdminFeedbacks);
router.put('/admin/feedback/:id/reply', authMiddleware, staffOnly, replyToFeedback);
router.patch('/admin/feedback/:id/status', authMiddleware, staffOnly, updateFeedbackStatus);
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
// These return the whole CRM, so they are gated on the staff role rather than
// on merely holding a valid token — a customer's own token used to be enough
// to page through every other customer's contact details and membership.
router.get('/customers', authMiddleware, staffOnly, getCustomers);
router.get('/customers/:id', authMiddleware, staffOnly, getCustomerById);
router.put('/customers/:id/membership', authMiddleware, adminOnly, updateCustomerMembership);
router.put('/customers/:id/usage-rules', authMiddleware, adminOnly, updateCustomerUsageRules);
router.post('/customers/:id/vehicles', authMiddleware, adminOnly, addCustomerVehicle);

module.exports = router;

