const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { staffOnly } = require('../middleware/roleMiddleware');

const {
  getMemberships,
  createMembership,
  updateMembership,
  deleteMembership
} = require('../controllers/membershipController');

router.get('/', authMiddleware, staffOnly, getMemberships);
router.post('/', authMiddleware, staffOnly, createMembership);
router.put('/:id', authMiddleware, staffOnly, updateMembership);
router.delete('/:id', authMiddleware, staffOnly, deleteMembership);

module.exports = router;
