const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { adminOnly, staffOnly } = require('../middleware/roleMiddleware');

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
  deletePlan,
  updatePlan,
  addSection,
  deleteSection
} = require('../controllers/serviceController');

// Public Routes
router.get('/home', getHomeServices);
router.get('/', getAllServices);
router.get('/:slug', getServiceBySlug);

// Admin Protected Routes
router.get('/admin/:id', authMiddleware, staffOnly, getServiceById);
router.post('/', authMiddleware, staffOnly, createService);
router.put('/:id', authMiddleware, staffOnly, updateService);
router.patch('/reorder', authMiddleware, staffOnly, reorderServices);
router.patch('/:id/status', authMiddleware, staffOnly, toggleServiceStatus);
router.delete('/:id', authMiddleware, staffOnly, deleteService);

// Sub-resource Admin Routes
router.post('/:id/memberships', authMiddleware, staffOnly, addMembership);
router.delete('/:id/memberships/:memId', authMiddleware, staffOnly, deleteMembership);
router.post('/:id/plans', authMiddleware, staffOnly, addPlan);
router.put('/:id/plans/:planId', authMiddleware, staffOnly, updatePlan);
router.delete('/:id/plans/:planId', authMiddleware, staffOnly, deletePlan);
router.post('/:id/sections', authMiddleware, staffOnly, addSection);
router.delete('/:id/sections/:sectionId', authMiddleware, staffOnly, deleteSection);

module.exports = router;
