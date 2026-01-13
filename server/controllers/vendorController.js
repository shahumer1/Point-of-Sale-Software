const asyncHandler = require('express-async-handler');
const Vendor = require('../models/Vendor');
const VendorLedger = require('../models/VendorLedger');
const { createVendorLedgerEntry } = require('../services/ledgerService');

// @desc    Get all vendors
// @route   GET /api/vendors
// @access  Private
const getVendors = asyncHandler(async (req, res) => {
    const vendors = await Vendor.find({});
    res.json(vendors);
});

// @desc    Create a vendor
// @route   POST /api/vendors
// @access  Private/Admin
const createVendor = asyncHandler(async (req, res) => {
    const { name, phone, address } = req.body;
    const vendor = new Vendor({ name, phone, address });
    const createdVendor = await vendor.save();
    res.status(201).json(createdVendor);
});

// @desc    Record vendor payment or purchase (handles credit purchases)
// @route   POST /api/vendors/:id/ledger
// @access  Private
const recordVendorLedger = asyncHandler(async (req, res) => {
    const vendorId = req.params.id;
    const { referenceType, products = [], totalCost = 0, paidAmount = 0, paymentMode = 'Cash', notes = '', idempotencyKey = null } = req.body;

    if (!['PURCHASE', 'PAYMENT', 'ADJUSTMENT'].includes(referenceType)) {
        res.status(400);
        throw new Error('Invalid reference type');
    }

    const ledger = await createVendorLedgerEntry({
        vendorId,
        referenceType,
        products,
        totalCost,
        paidAmount,
        paymentMode,
        notes,
        createdBy: req.user?._id || null,
        idempotencyKey
    });

    res.status(201).json(ledger);
});

// @desc    Get vendor ledger
// @route   GET /api/vendors/:id/ledger
// @access  Private
const getVendorLedger = asyncHandler(async (req, res) => {
    const vendorId = req.params.id;
    const page = Number(req.query.page) || 1;
    const limit = Math.min(Number(req.query.limit) || 50, 200);

    const query = { vendor: vendorId, deletedAt: null };
    const total = await VendorLedger.countDocuments(query);
    const entries = await VendorLedger.find(query).sort({ date: -1 }).skip((page - 1) * limit).limit(limit);

    res.json({ total, page, limit, entries });
});

// @desc    Soft-delete a vendor ledger entry (admin only) and reconcile via ADJUSTMENT
// @route   DELETE /api/vendors/:id/ledger/:ledgerId
// @access  Private/Admin
const deleteVendorLedgerEntry = asyncHandler(async (req, res) => {
    const { id: vendorId, ledgerId } = req.params;

    let session = null;
    let startedHere = false;
    if (require('mongoose').transactionsSupported) {
        session = await Vendor.startSession();
        try {
            session.startTransaction();
            startedHere = true;
        } catch (err) {
            session.endSession();
            session = null;
            startedHere = false;
            console.warn('Transactions unavailable - proceeding without transaction for vendor ledger deletion');
        }
    }

    try {
        const ledger = session ? await VendorLedger.findOne({ _id: ledgerId, vendor: vendorId }).session(session) : await VendorLedger.findOne({ _id: ledgerId, vendor: vendorId });
        if (!ledger) {
            res.status(404);
            throw new Error('Ledger entry not found');
        }
        if (ledger.deletedAt) {
            if (startedHere && session) {
                await session.commitTransaction();
                session.endSession();
            } else if (session) {
                session.endSession();
            }
            return res.json({ message: 'Already deleted' });
        }

        ledger.deletedAt = new Date();
        ledger.deletedBy = req.user?._id || null;
        if (session) await ledger.save({ session }); else await ledger.save();

        // delta effect on vendor balance is dueAmount
        const delta = Number(ledger.dueAmount || 0);
        let adjustment;
        if (delta > 0) {
            // To reverse, create PAYMENT (company pays vendor)
            adjustment = await createVendorLedgerEntry({
                vendorId,
                referenceType: 'ADJUSTMENT',
                referenceId: ledger._id,
                products: [],
                totalCost: 0,
                paidAmount: delta,
                paymentMode: 'Other',
                notes: `Reversal of ledger ${ledger._id}`,
                createdBy: req.user?._id || null,
                idempotencyKey: `REV:${ledger._id}`,
                session
            });
        }

        if (startedHere && session) {
            await session.commitTransaction();
            session.endSession();
        } else if (session) {
            session.endSession();
        }

        res.json({ message: 'Ledger soft-deleted', adjustment });
    } catch (err) {
        if (startedHere && session) {
            await session.abortTransaction();
            session.endSession();
        } else if (session) {
            session.endSession();
        }
        throw err;
    }
});

module.exports = { getVendors, createVendor, recordVendorLedger, getVendorLedger, deleteVendorLedgerEntry };