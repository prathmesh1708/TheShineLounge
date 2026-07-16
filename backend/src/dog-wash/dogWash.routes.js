const express = require('express');
const router = express.Router();
const dogWashController = require('./dogWash.controller');
const dogWashMiddleware = require('./dogWash.middleware');

router.get('/', dogWashController.getBookings);
router.post('/', dogWashMiddleware.validateDogWashBooking, dogWashController.createBooking);
router.get('/details', dogWashController.getServiceDetails);

module.exports = router;
