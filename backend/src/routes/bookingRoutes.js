const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/roleMiddleware');
const {
  createBooking,
  getBookings,
  getMyBookings,
  updateBooking,
  deleteBooking,
  getPublicReceipt,
  saveReceiptPdf,
  streamReceiptPdf
} = require('../controllers/bookingController');

// Create booking (Public — walk-ins and guests book without an account)
router.post('/', createBooking);

// Public digital receipt endpoint
router.get('/receipt/:id', getPublicReceipt);
router.get('/receipt/:id/pdf', streamReceiptPdf);
router.post('/receipt/:id/pdf', saveReceiptPdf);


// Customer self-service. Declared before '/:id'-shaped routes so 'my-bookings'
// is never read as a booking id.
router.get('/my-bookings', authMiddleware, getMyBookings);

// Get bookings (Private — customers are scoped to their own by the controller)
router.get('/', authMiddleware, getBookings);

// Update booking (Private — staff/admin drive the workflow; a customer may
// only cancel their own, enforced in the controller)
router.put('/:id', authMiddleware, updateBooking);

// Delete booking (Private - Admin only)
router.delete('/:id', authMiddleware, adminOnly, deleteBooking);

module.exports = router;
