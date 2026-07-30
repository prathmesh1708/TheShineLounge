const express = require('express');
const router = express.Router();
const salonController = require('./salon.controller');
const salonMiddleware = require('./salon.middleware');

// Bookings & Details
router.get('/', salonController.getBookings);
router.post('/', salonMiddleware.validateSalonBooking, salonController.createBooking);
router.get('/details', salonController.getServiceDetails);

// Salon Services CRUD
router.get('/services', salonController.getServicesList);
router.post('/services', salonController.createServiceItem);
router.put('/services/:id', salonController.updateServiceItem);
router.delete('/services/:id', salonController.deleteServiceItem);

// Salon Time Slots CRUD
router.get('/slots', salonController.getTimeSlots);
router.post('/slots', salonController.createTimeSlot);
router.put('/slots/:id', salonController.updateTimeSlot);
router.delete('/slots/:id', salonController.deleteTimeSlot);

module.exports = router;


