const express = require('express');
const router = express.Router();
const cafeController = require('./cafe.controller');
const cafeMiddleware = require('./cafe.middleware');

router.get('/', cafeController.getBookings);
router.post('/', cafeMiddleware.validateCafeBooking, cafeController.createBooking);
router.get('/details', cafeController.getServiceDetails);

module.exports = router;
