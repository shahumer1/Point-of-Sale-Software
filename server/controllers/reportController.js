const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const Expense = require('../models/Expense');

// @desc    Get sales report with Gross & Net Profit
// @route   GET /api/reports/sales
// @access  Private/Admin
const getSalesReport = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;

    // Default to today if no dates provided
    let start = startDate ? new Date(startDate) : new Date();
    start.setHours(0, 0, 0, 0);

    let end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    // 1. Aggregation for Order Stats (Gross Profit)
    const reportStats = await Order.aggregate([
        {
            $match: {
                createdAt: { $gte: start, $lte: end }
            }
        },
        {
            $group: {
                _id: null,
                totalSales: { $sum: "$totalAmount" },
                grossProfit: { $sum: "$profit" },
                totalOrders: { $sum: 1 }
            }
        }
    ]);

    // 2. Get expenses for the period with breakdown by category
    const expenseStats = await Expense.aggregate([
        {
            $match: {
                date: { $gte: start, $lte: end }
            }
        },
        {
            $group: {
                _id: "$category",
                amount: { $sum: "$amount" },
                count: { $sum: 1 }
            }
        },
        {
            $sort: { amount: -1 }
        }
    ]);

    // 3. Get total expenses
    const totalExpenseStats = await Expense.aggregate([
        {
            $match: {
                date: { $gte: start, $lte: end }
            }
        },
        {
            $group: {
                _id: null,
                totalExpenses: { $sum: "$amount" }
            }
        }
    ]);

    // 4. Fetch detailed orders for the table
    const orders = await Order.find({
        createdAt: { $gte: start, $lte: end }
    })
        .populate('customer', 'name')
        .sort({ createdAt: -1 });

    const stats = reportStats[0] || { totalSales: 0, grossProfit: 0, totalOrders: 0 };
    const totalExpenses = totalExpenseStats[0]?.totalExpenses || 0;

    res.json({
        period: { start, end },
        summary: {
            totalSales: stats.totalSales,
            grossProfit: stats.grossProfit,
            totalExpenses: totalExpenses,
            netProfit: stats.grossProfit - totalExpenses,
            totalOrders: stats.totalOrders
        },
        expenseBreakdown: expenseStats,
        orders
    });
});

module.exports = { getSalesReport };
