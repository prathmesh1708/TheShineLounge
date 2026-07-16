const express = require('express');
const router = express.Router();
const carDetailingController = require('./carDetailing.controller');
const carDetailingMiddleware = require('./carDetailing.middleware');

router.get('/', carDetailingController.getBookings);
router.post('/', carDetailingMiddleware.validateCarDetailingBooking, carDetailingController.createBooking);
router.get('/details', carDetailingController.getServiceDetails);

module.exports = router;
