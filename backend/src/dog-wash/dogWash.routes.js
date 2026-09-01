const express = require('express');
const router = express.Router();
const dogWashController = require('./dogWash.controller');
const dogWashMiddleware = require('./dogWash.middleware');
const authMiddleware = require('../middleware/authMiddleware');
const { staffOnly } = require('../middleware/roleMiddleware');

// Unscoped grooming queue — every customer's booking and contact details.
router.get('/', authMiddleware, staffOnly, dogWashController.getBookings);
router.post('/', dogWashMiddleware.validateDogWashBooking, dogWashController.createBooking);

// Packages and pricing are public marketing content.
router.get('/details', dogWashController.getServiceDetails);

module.exports = router;
