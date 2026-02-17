const express = require('express');
const router = express.Router();
const {
    getExpenses,
    getExpenseSummary,
    createExpense,
    deleteExpense,
} = require('../controllers/expenseController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getExpenses)
    .post(protect, admin, createExpense);

router.route('/summary/category').get(protect, admin, getExpenseSummary);

router.route('/:id').delete(protect, admin, deleteExpense);

module.exports = router;
