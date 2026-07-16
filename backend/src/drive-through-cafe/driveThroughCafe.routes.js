const express = require('express');
const router = express.Router();
const driveThroughCafeController = require('./driveThroughCafe.controller');
const driveThroughCafeMiddleware = require('./driveThroughCafe.middleware');

router.get('/', driveThroughCafeController.getBookings);
router.post('/', driveThroughCafeMiddleware.validateDriveThroughCafeBooking, driveThroughCafeController.createBooking);
router.get('/details', driveThroughCafeController.getServiceDetails);

module.exports = router;
