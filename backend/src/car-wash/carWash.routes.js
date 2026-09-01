const express = require('express');
const router = express.Router();
const carWashController = require('./carWash.controller');
const carWashMiddleware = require('./carWash.middleware');
const authMiddleware = require('../middleware/authMiddleware');
const { staffOnly } = require('../middleware/roleMiddleware');

// The booking list is the operations queue: it returns every customer's wash,
// with their name, plate and contact details, and is not scoped to a caller.
// It was reachable with no token at all. Staff and admins only.
router.get('/', authMiddleware, staffOnly, carWashController.getBookings);
router.post('/', carWashMiddleware.validateCarWashBooking, carWashController.createBooking);

// Packages and pricing are public marketing content.
router.get('/details', carWashController.getServiceDetails);

module.exports = router;
