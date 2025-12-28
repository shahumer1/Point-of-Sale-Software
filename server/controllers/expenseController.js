const asyncHandler = require('express-async-handler');
const Expense = require('../models/Expense');

// @desc    Get all expenses
// @route   GET /api/expenses
// @access  Private/Admin
const getExpenses = asyncHandler(async (req, res) => {
    const expenses = await Expense.find({}).sort({ date: -1 });
    res.json(expenses);
});

// @desc    Create expense
// @route   POST /api/expenses
// @access  Private/Admin
const createExpense = asyncHandler(async (req, res) => {
    const { category, amount, note, date } = req.body;
    const expense = new Expense({
        category,
        amount,
        note,
        date,
    });
    const createdExpense = await expense.save();
    res.status(201).json(createdExpense);
});

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
// @access  Private/Admin
const deleteExpense = asyncHandler(async (req, res) => {
    const expense = await Expense.findById(req.params.id);
    if (expense) {
        await expense.deleteOne();
        res.json({ message: 'Expense removed' });
    } else {
        res.status(404);
        throw new Error('Expense not found');
    }
});

module.exports = {
    getExpenses,
    createExpense,
    deleteExpense,
};
