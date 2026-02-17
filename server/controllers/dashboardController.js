// const asyncHandler = require('express-async-handler');
// const Order = require('../models/Order');
// const Product = require('../models/Product');

// // @desc    Get dashboard summary statistics
// // @route   GET /api/dashboard/summary
// // @access  Private/Admin
// const getDashboardSummary = asyncHandler(async (req, res) => {
//     // 1. Aggregation for Orders (Sales, Profit, Count)
//     const orderStats = await Order.aggregate([
//         {
//             $group: {
//                 _id: null,
//                 totalSales: { $sum: "$totalAmount" },
//                 totalProfit: { $sum: "$profit" },
//                 totalOrders: { $sum: 1 }
//             }
//         }
//     ]);

//     // 2. Count Low Stock Products (threshold < 10)
//     const lowStockCount = await Product.countDocuments({
//         stock: { $lt: 10 }
//     });

//     // 3. Format Response
//     const stats = orderStats[0] || { totalSales: 0, totalProfit: 0, totalOrders: 0 };

//     res.json({
//         totalSales: stats.totalSales,
//         totalOrders: stats.totalOrders,
//         estimatedProfit: stats.totalProfit,
//         lowStockCount: lowStockCount
//     });
// });

// module.exports = { getDashboardSummary };

const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Expense = require('../models/Expense');

// @desc    Get dashboard summary statistics
// @route   GET /api/dashboard/summary
// @access  Private/Admin
const getDashboardSummary = asyncHandler(async (req, res) => {
    // 1. Get order stats (Gross Profit)
    const orderStats = await Order.aggregate([
        {
            $group: {
                _id: null,
                totalSales: { $sum: "$totalAmount" },
                grossProfit: { $sum: "$profit" },
                totalOrders: { $sum: 1 }
            }
        }
    ]);

    // 2. Get total expenses for current month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const endOfMonth = new Date();
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    endOfMonth.setDate(0);
    endOfMonth.setHours(23, 59, 59, 999);

    const expenseStats = await Expense.aggregate([
        {
            $match: {
                date: { $gte: startOfMonth, $lte: endOfMonth }
            }
        },
        {
            $group: {
                _id: null,
                totalExpenses: { $sum: "$amount" }
            }
        }
    ]);

    // 3. Count Low Stock Products
    const lowStockCount = await Product.countDocuments({
        stock: { $lt: 10 }
    });

    const stats = orderStats[0] || { totalSales: 0, grossProfit: 0, totalOrders: 0 };
    const totalExpenses = expenseStats[0]?.totalExpenses || 0;

    res.json({
        totalSales: stats.totalSales,
        totalOrders: stats.totalOrders,
        grossProfit: stats.grossProfit,
        netProfit: stats.grossProfit - totalExpenses,
        totalExpenses: totalExpenses,
        lowStockCount: lowStockCount
    });
});

module.exports = { getDashboardSummary };