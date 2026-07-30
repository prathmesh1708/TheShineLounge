const express = require('express');
const router = express.Router();
const carDetailingController = require('./carDetailing.controller');
const carDetailingMiddleware = require('./carDetailing.middleware');

// Bookings & details
router.get('/', carDetailingController.getBookings);
router.post('/', carDetailingMiddleware.validateCarDetailingBooking, carDetailingController.createBooking);
router.get('/details', carDetailingController.getServiceDetails);

// Car Detailing Services / Treatments CRUD
router.get('/services', carDetailingController.getServicesList);
router.post('/services', carDetailingController.createServiceItem);
router.put('/services/:id', carDetailingController.updateServiceItem);
router.delete('/services/:id', carDetailingController.deleteServiceItem);

module.exports = router;

