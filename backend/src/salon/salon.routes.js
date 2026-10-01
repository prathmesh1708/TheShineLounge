const express = require('express');
const router = express.Router();
const salonController = require('./salon.controller');
const salonMiddleware = require('./salon.middleware');
const salonProducts = require('./salon.products.controller');
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

// Salon Retail Products (counter stock) + POS bills.
// Scoped to this module on purpose: product stock, barcodes and billing are a
// salon concern, and nothing here is mounted for the other services.
router.get('/products', authMiddleware, staffOnly, salonProducts.getProducts);
router.get('/products/barcode/:code', authMiddleware, staffOnly, salonProducts.getProductByBarcode);
router.post('/products', authMiddleware, staffOnly, salonProducts.createProduct);
router.put('/products/:id', authMiddleware, staffOnly, salonProducts.updateProduct);
router.patch('/products/:id/stock', authMiddleware, staffOnly, salonProducts.adjustStock);
router.delete('/products/:id', authMiddleware, staffOnly, salonProducts.deleteProduct);

router.get('/product-options', authMiddleware, staffOnly, salonProducts.getProductOptions);
router.post('/product-options', authMiddleware, staffOnly, salonProducts.createProductOption);
router.delete('/product-options/:id', authMiddleware, staffOnly, salonProducts.deleteProductOption);

router.get('/product-sales', authMiddleware, staffOnly, salonProducts.getProductSales);
router.post('/product-sales', authMiddleware, staffOnly, salonProducts.createProductSale);
router.delete('/product-sales/:id', authMiddleware, staffOnly, salonProducts.deleteProductSale);

module.exports = router;
