const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const Customer = require('../models/Customer');
const Vendor = require('../models/Vendor');
const CustomerLedger = require('../models/CustomerLedger');
const VendorLedger = require('../models/VendorLedger');

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

// @desc    Customer outstanding balances
// @route   GET /api/reports/customers/outstanding
// @access  Private/Admin
const getCustomerOutstanding = asyncHandler(async (req, res) => {
    // Return customers with balance > 0 sorted desc
    const customers = await Customer.find({}).select('name phone balance').sort({ balance: -1 });
    res.json(customers);
});

// @desc    Vendor payable balances
// @route   GET /api/reports/vendors/payables
// @access  Private/Admin
const getVendorPayables = asyncHandler(async (req, res) => {
    const vendors = await Vendor.find({}).select('name phone balance').sort({ balance: -1 });
    res.json(vendors);
});

// @desc    Credit sales vs cash sales
// @route   GET /api/reports/sales/type
// @access  Private/Admin
const getCreditVsCashSales = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    let start = startDate ? new Date(startDate) : new Date();
    start.setHours(0, 0, 0, 0);
    let end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    const results = await Order.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: "$paymentMethod", total: { $sum: "$totalAmount" }, count: { $sum: 1 } } }
    ]);

    res.json(results);
});

// @desc    Aging report (30/60/90 days)
// @route   GET /api/reports/aging
// @access  Private/Admin
const getAgingReport = asyncHandler(async (req, res) => {
    const now = new Date();
    const days30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const days60 = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const days90 = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    // For each customer, get sum of unpaid SALE ledger entries by age
    const sales = await CustomerLedger.aggregate([
        { $match: { referenceType: 'SALE', deletedAt: null } },
        { $project: { customer: 1, debitAmount: 1, creditAmount: 1, date: 1 } }
    ]);

    // Simpler approach: compute outstanding per customer and categorize by latest sale date
    const customers = await Customer.find({ balance: { $ne: 0 } }).select('name phone balance');

    // Basic bucketing
    const buckets = {
        '0-30': [],
        '31-60': [],
        '61-90': [],
        '90+': []
    };

    for (const c of customers) {
        // Find oldest unpaid sale date approximating via ledgers
        const latestSale = await CustomerLedger.findOne({ customer: c._id, referenceType: 'SALE', deletedAt: null }).sort({ date: 1 });
        const d = latestSale ? latestSale.date : null;
        if (!d) {
            buckets['0-30'].push(c);
            continue;
        }
        if (d >= days30) buckets['0-30'].push(c);
        else if (d >= days60) buckets['31-60'].push(c);
        else if (d >= days90) buckets['61-90'].push(c);
        else buckets['90+'].push(c);
    }

    res.json({ buckets });
});

module.exports = { getSalesReport, getCustomerOutstanding, getVendorPayables, getCreditVsCashSales, getAgingReport };
