const express = require('express');
const router = express.Router();
const salonController = require('./salon.controller');
const salonMiddleware = require('./salon.middleware');

router.get('/', salonController.getBookings);
router.post('/', salonMiddleware.validateSalonBooking, salonController.createBooking);
router.get('/details', salonController.getServiceDetails);

module.exports = router;
