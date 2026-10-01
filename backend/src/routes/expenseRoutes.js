const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/roleMiddleware');
const expenseController = require('../controllers/expenseController');

// Miscellaneous running costs. Admin only — this is the books, not an
// operational screen, and the totals it exposes are whole-business figures.
router.get('/summary', authMiddleware, adminOnly, expenseController.getExpenseSummary);
router.get('/', authMiddleware, adminOnly, expenseController.getExpenses);
router.post('/', authMiddleware, adminOnly, expenseController.createExpense);
router.put('/:id', authMiddleware, adminOnly, expenseController.updateExpense);
router.delete('/:id', authMiddleware, adminOnly, expenseController.deleteExpense);

module.exports = router;
