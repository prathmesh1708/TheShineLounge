const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { staffOnly, adminOnly } = require('../middleware/roleMiddleware');

const {
  getOfflineSales,
  createOfflineSale,
  updateOfflineSale,
  deleteOfflineSale
} = require('../controllers/offlineSaleController');

router.get('/', authMiddleware, staffOnly, getOfflineSales);
router.post('/', authMiddleware, staffOnly, createOfflineSale);
router.put('/:id', authMiddleware, staffOnly, updateOfflineSale);
router.delete('/:id', authMiddleware, adminOnly, deleteOfflineSale);

module.exports = router;
