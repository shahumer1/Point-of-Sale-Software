const express = require('express');
const router = express.Router();
const {
    getCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomerById,
    recordPayment,
    getCustomerLedger,
    deleteCustomerLedgerEntry
} = require('../controllers/customerController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getCustomers)
    .post(protect, admin, createCustomer);

router.route('/:id')
    .get(protect, getCustomerById)
    .put(protect, admin, updateCustomer)
    .delete(protect, admin, deleteCustomer);

// Ledger & Payments
router.post('/:id/payments', protect, recordPayment);
router.get('/:id/ledger', protect, getCustomerLedger);
router.delete('/:id/ledger/:ledgerId', protect, admin, deleteCustomerLedgerEntry);

module.exports = router;
