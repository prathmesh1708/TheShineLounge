const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  createNotification,
  getAdminNotifications,
  updateNotification,
  deleteNotification,
  getUserNotifications,
  getStaffNotifications,
  markAsRead,
  markAllAsRead
} = require('../controllers/notificationController');

// User & Staff routes
router.get('/user', authMiddleware, getUserNotifications);
router.get('/staff', authMiddleware, getStaffNotifications);
router.post('/read-all', authMiddleware, markAllAsRead);
router.post('/read/:id', authMiddleware, markAsRead);

// Admin CRUD routes
router.get('/admin', authMiddleware, getAdminNotifications);
router.post('/admin', authMiddleware, createNotification);
router.put('/admin/:id', authMiddleware, updateNotification);
router.delete('/admin/:id', authMiddleware, deleteNotification);

module.exports = router;
