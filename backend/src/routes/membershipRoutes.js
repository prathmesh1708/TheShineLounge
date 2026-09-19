const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { staffOnly } = require('../middleware/roleMiddleware');

const {
  getMemberships,
  createMembership,
  deleteMembership
} = require('../controllers/membershipController');

router.get('/', authMiddleware, staffOnly, getMemberships);
router.post('/', authMiddleware, staffOnly, createMembership);
router.delete('/:id', authMiddleware, staffOnly, deleteMembership);

module.exports = router;
