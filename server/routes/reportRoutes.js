const express = require('express');
const router = express.Router();
const { getSalesReport, getCustomerOutstanding, getVendorPayables, getCreditVsCashSales, getAgingReport } = require('../controllers/reportController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/sales', protect, admin, getSalesReport);
router.get('/customers/outstanding', protect, admin, getCustomerOutstanding);
router.get('/vendors/payables', protect, admin, getVendorPayables);
router.get('/sales/type', protect, admin, getCreditVsCashSales);
router.get('/aging', protect, admin, getAgingReport);

module.exports = router;
