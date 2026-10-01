const express = require('express');
const router = express.Router();
const carDetailingController = require('./carDetailing.controller');
const carDetailingMiddleware = require('./carDetailing.middleware');
const warranty = require('./carDetailing.warranty.controller');
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

// Detailing warranties. Scoped to this module -- no other service issues them.
// /mine is mounted before the parameterised routes and is the only one a plain
// customer may call; it returns strictly their own warranties.
router.get('/warranty-periods', authMiddleware, staffOnly, warranty.getWarrantyPeriods);
router.post('/warranty-periods', authMiddleware, staffOnly, warranty.createWarrantyPeriod);
router.delete('/warranty-periods/:id', authMiddleware, staffOnly, warranty.deleteWarrantyPeriod);

router.get('/warranties/mine', authMiddleware, warranty.getMyWarranties);
router.get('/warranties/vehicle/:plate', authMiddleware, staffOnly, warranty.getWarrantiesByVehicle);
router.get('/warranties', authMiddleware, staffOnly, warranty.getWarranties);
router.post('/warranties', authMiddleware, staffOnly, warranty.createWarranty);
router.patch('/warranties/:id/void', authMiddleware, staffOnly, warranty.voidWarranty);

module.exports = router;
