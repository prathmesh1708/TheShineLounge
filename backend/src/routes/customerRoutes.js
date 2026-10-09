const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { staffOnly } = require('../middleware/roleMiddleware');
const {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer
} = require('../controllers/customerController');

router.route('/')
  .get(authMiddleware, staffOnly, getAllCustomers)
  .post(createCustomer);

router.route('/:id')
  .get(authMiddleware, staffOnly, getCustomerById)
  .put(updateCustomer)
  .delete(deleteCustomer);

module.exports = router;
