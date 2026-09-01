const express = require('express');
const router = express.Router();
const salonController = require('./salon.controller');
const salonMiddleware = require('./salon.middleware');
const authMiddleware = require('../middleware/authMiddleware');
const { staffOnly } = require('../middleware/roleMiddleware');

// Bookings & Details
// The list is the unscoped appointment book — every client's name, stylist and
// contact details — so it is staff/admin only.
router.get('/', authMiddleware, staffOnly, salonController.getBookings);
router.post('/', salonMiddleware.validateSalonBooking, salonController.createBooking);
router.get('/details', salonController.getServiceDetails);

// Salon Services CRUD
// The menu is public to read; editing it and its prices is staff-only. These
// writes previously accepted any anonymous request.
router.get('/services', salonController.getServicesList);
router.post('/services', authMiddleware, staffOnly, salonController.createServiceItem);
router.put('/services/:id', authMiddleware, staffOnly, salonController.updateServiceItem);
router.delete('/services/:id', authMiddleware, staffOnly, salonController.deleteServiceItem);

// Salon Time Slots CRUD
router.get('/slots', salonController.getTimeSlots);
router.post('/slots', authMiddleware, staffOnly, salonController.createTimeSlot);
router.put('/slots/:id', authMiddleware, staffOnly, salonController.updateTimeSlot);
router.delete('/slots/:id', authMiddleware, staffOnly, salonController.deleteTimeSlot);

module.exports = router;
