const express = require('express');
const router = express.Router();
const adminController = require('./admin.controller');
const adminMiddleware = require('./admin.middleware');

router.use(adminMiddleware.isAdmin);

router.get('/dashboard', adminController.getDashboardStats);
router.post('/maintenance', adminController.manageSystemData);

module.exports = router;
