const express = require('express');
const router = express.Router();
const carDetailingController = require('./carDetailing.controller');
const carDetailingMiddleware = require('./carDetailing.middleware');
const authMiddleware = require('../middleware/authMiddleware');
const { staffOnly } = require('../middleware/roleMiddleware');

// Bookings & details
// The list is the unscoped operations queue — every customer's job, plate and
// contact details — so it is staff/admin only.
router.get('/', authMiddleware, staffOnly, carDetailingController.getBookings);
router.post('/', carDetailingMiddleware.validateCarDetailingBooking, carDetailingController.createBooking);
router.get('/details', carDetailingController.getServiceDetails);

// Car Detailing Services / Treatments CRUD
// Reading the treatment menu is public; changing the catalogue and its prices
// is not — these writes had no authentication at all.
router.get('/services', carDetailingController.getServicesList);
router.post('/services', authMiddleware, staffOnly, carDetailingController.createServiceItem);
router.put('/services/:id', authMiddleware, staffOnly, carDetailingController.updateServiceItem);
router.delete('/services/:id', authMiddleware, staffOnly, carDetailingController.deleteServiceItem);

module.exports = router;
