const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const Product = require('../models/Product');

// @desc    Get dashboard summary statistics
// @route   GET /api/dashboard/summary
// @access  Private/Admin
const getDashboardSummary = asyncHandler(async (req, res) => {
    // 1. Aggregation for Orders (Sales, Profit, Count)
    const orderStats = await Order.aggregate([
        {
            $group: {
                _id: null,
                totalSales: { $sum: "$totalAmount" },
                totalProfit: { $sum: "$profit" },
                totalOrders: { $sum: 1 }
            }
        }
    ]);

    // 2. Count Low Stock Products (threshold < 10)
    const lowStockCount = await Product.countDocuments({
        stock: { $lt: 10 }
    });

    // 3. Format Response
    const stats = orderStats[0] || { totalSales: 0, totalProfit: 0, totalOrders: 0 };

    res.json({
        totalSales: stats.totalSales,
        totalOrders: stats.totalOrders,
        estimatedProfit: stats.totalProfit,
        lowStockCount: lowStockCount
    });
});

module.exports = { getDashboardSummary };
