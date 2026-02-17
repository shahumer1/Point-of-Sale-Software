const asyncHandler = require('express-async-handler');
const Expense = require('../models/Expense');

// @desc    Get all expenses
// @route   GET /api/expenses
// @access  Private/Admin
const getExpenses = asyncHandler(async (req, res) => {
    const expenses = await Expense.find({}).sort({ date: -1 });
    res.json(expenses);
});

// @desc    Get expense summary by category
// @route   GET /api/expenses/summary/category
// @access  Private/Admin
const getExpenseSummary = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;

    // Default to current month if no dates provided
    let start = startDate ? new Date(startDate) : new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);

    let end = endDate ? new Date(endDate) : new Date();
    end.setMonth(end.getMonth() + 1);
    end.setDate(0);
    end.setHours(23, 59, 59, 999);

    const summary = await Expense.aggregate([
        {
            $match: {
                date: { $gte: start, $lte: end }
            }
        },
        {
            $group: {
                _id: "$category",
                totalAmount: { $sum: "$amount" },
                count: { $sum: 1 },
                avgAmount: { $avg: "$amount" }
            }
        },
        {
            $sort: { totalAmount: -1 }
        }
    ]);

    // Get total expenses
    const totalExpense = summary.reduce((sum, item) => sum + item.totalAmount, 0);

    res.json({
        period: { start, end },
        summary: summary,
        totalExpenses: totalExpense
    });
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
    getExpenseSummary,
    createExpense,
    deleteExpense,
};
