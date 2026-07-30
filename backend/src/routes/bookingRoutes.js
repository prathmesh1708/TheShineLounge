const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  createBooking,
  getBookings,
  updateBooking,
  deleteBooking
} = require('../controllers/bookingController');

// Create booking (Public)
router.post('/', createBooking);

// Get bookings (Private - Admin & Staff)
router.get('/', authMiddleware, getBookings);

// Update booking (Private - Admin & Staff)
router.put('/:id', authMiddleware, updateBooking);

// Delete booking (Private - Admin only)
router.delete('/:id', authMiddleware, deleteBooking);

module.exports = router;
