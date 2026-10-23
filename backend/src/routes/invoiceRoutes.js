const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { staffOnly } = require('../middleware/roleMiddleware');
const { createInvoice, getInvoices, setInvoiceWarranty } = require('../controllers/invoiceController');

router.get('/', authMiddleware, staffOnly, getInvoices);
router.post('/', authMiddleware, staffOnly, createInvoice);
router.patch('/:invoiceNo/warranty', authMiddleware, staffOnly, setInvoiceWarranty);

module.exports = router;
