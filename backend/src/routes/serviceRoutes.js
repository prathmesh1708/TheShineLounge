const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/roleMiddleware');

const {
  createService,
  getHomeServices,
  getAllServices,
  getServiceBySlug,
  getServiceById,
  updateService,
  toggleServiceStatus,
  deleteService,
  reorderServices,
  addMembership,
  deleteMembership,
  addPlan,
  deletePlan
} = require('../controllers/serviceController');

// Public Routes
router.get('/home', getHomeServices);
router.get('/', getAllServices);
router.get('/:slug', getServiceBySlug);

// Admin Protected Routes
router.get('/admin/:id', authMiddleware, adminOnly, getServiceById);
router.post('/', authMiddleware, adminOnly, createService);
router.put('/:id', authMiddleware, adminOnly, updateService);
router.patch('/reorder', authMiddleware, adminOnly, reorderServices);
router.patch('/:id/status', authMiddleware, adminOnly, toggleServiceStatus);
router.delete('/:id', authMiddleware, adminOnly, deleteService);

// Sub-resource Admin Routes
router.post('/:id/memberships', authMiddleware, adminOnly, addMembership);
router.delete('/:id/memberships/:memId', authMiddleware, adminOnly, deleteMembership);
router.post('/:id/plans', authMiddleware, adminOnly, addPlan);
router.delete('/:id/plans/:planId', authMiddleware, adminOnly, deletePlan);

module.exports = router;
