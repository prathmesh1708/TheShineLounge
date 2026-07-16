const express = require('express');
const router = express.Router();
const carWashController = require('./carWash.controller');
const carWashMiddleware = require('./carWash.middleware');

router.get('/', carWashController.getBookings);
router.post('/', carWashMiddleware.validateCarWashBooking, carWashController.createBooking);
router.get('/details', carWashController.getServiceDetails);

module.exports = router;
