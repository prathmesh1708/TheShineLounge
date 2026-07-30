const express = require('express');
const router = express.Router();
const { registerCustomer, login, getMe, logout } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// Public routes
router.post('/register', registerCustomer);
router.post('/login', login);

// Protected routes
router.get('/me', authMiddleware, getMe);
router.post('/logout', authMiddleware, logout);

module.exports = router;
