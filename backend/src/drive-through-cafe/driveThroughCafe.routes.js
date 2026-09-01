const express = require('express');
const router = express.Router();
const driveThroughCafeController = require('./driveThroughCafe.controller');
const driveThroughCafeMiddleware = require('./driveThroughCafe.middleware');
const authMiddleware = require('../middleware/authMiddleware');
const { staffOnly } = require('../middleware/roleMiddleware');

// Unscoped bay queue — every customer's order and registration plate.
router.get('/', authMiddleware, staffOnly, driveThroughCafeController.getBookings);
router.post('/', driveThroughCafeMiddleware.validateDriveThroughCafeBooking, driveThroughCafeController.createBooking);

// Menu and pricing are public marketing content.
router.get('/details', driveThroughCafeController.getServiceDetails);

module.exports = router;
