const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');

// @desc    Get sales report
// @route   GET /api/reports/sales
// @access  Private/Admin
const getSalesReport = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;

    // Default to today if no dates provided
    let start = startDate ? new Date(startDate) : new Date();
    start.setHours(0, 0, 0, 0);

    let end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    // 1. Aggregation for Totals
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
                totalProfit: { $sum: "$profit" },
                totalOrders: { $sum: 1 }
            }
        }
    ]);

    // 2. Fetch detailed orders for the table
    const orders = await Order.find({
        createdAt: { $gte: start, $lte: end }
    })
        .populate('customer', 'name')
        .sort({ createdAt: -1 });

    const stats = reportStats[0] || { totalSales: 0, totalProfit: 0, totalOrders: 0 };

    res.json({
        period: { start, end },
        summary: stats,
        orders
    });
});

module.exports = { getSalesReport };
