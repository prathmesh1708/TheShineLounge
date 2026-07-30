const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { checkIn, checkOut, getStaffAttendance } = require('../controllers/attendanceController');

router.post('/check-in', authMiddleware, checkIn);
router.post('/check-out', authMiddleware, checkOut);
router.get('/staff/:id', authMiddleware, getStaffAttendance);

module.exports = router;
