const express = require('express');
const router = express.Router();
const cafeController = require('./cafe.controller');
const cafeMiddleware = require('./cafe.middleware');
const authMiddleware = require('../middleware/authMiddleware');
const { staffOnly } = require('../middleware/roleMiddleware');

// Unscoped order queue — every customer's order, name and contact details.
router.get('/', authMiddleware, staffOnly, cafeController.getBookings);
router.post('/', cafeMiddleware.validateCafeBooking, cafeController.createBooking);

// Menu and pricing are public marketing content.
router.get('/details', cafeController.getServiceDetails);

module.exports = router;
