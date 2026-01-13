const express = require('express');
const router = express.Router();
const { getVendors, createVendor, recordVendorLedger, getVendorLedger, deleteVendorLedgerEntry } = require('../controllers/vendorController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/').get(protect, getVendors).post(protect, admin, createVendor);
router.post('/:id/ledger', protect, recordVendorLedger);
router.get('/:id/ledger', protect, getVendorLedger);
router.delete('/:id/ledger/:ledgerId', protect, admin, deleteVendorLedgerEntry);

module.exports = router;