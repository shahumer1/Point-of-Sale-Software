const mongoose = require('mongoose');
const Customer = require('../models/Customer');
const CustomerLedger = require('../models/CustomerLedger');
const Vendor = require('../models/Vendor');
const VendorLedger = require('../models/VendorLedger');

async function createCustomerLedgerEntry({
    customerId,
    referenceType,
    referenceId = null,
    debitAmount = 0,
    creditAmount = 0,
    paymentMethod = null,
    notes = null,
    createdBy = null,
    idempotencyKey = null,
    session: providedSession = null
}) {
    if (!customerId) throw new Error('CustomerId is required');
    if (debitAmount < 0 || creditAmount < 0) throw new Error('Amounts must be non-negative');
    if (Number(debitAmount || 0) === 0 && Number(creditAmount || 0) === 0) throw new Error('Either debitAmount or creditAmount must be greater than zero');

    let session = providedSession;
    let startedHere = false;

    // If no session provided, attempt to create one and start a transaction only if supported.
    if (!session && mongoose.transactionsSupported) {
        session = await mongoose.startSession();
        try {
            session.startTransaction();
            startedHere = true;
        } catch (err) {
            // Unexpected: we thought transactions were supported, but starting failed.
            try { session.endSession(); } catch(e){}
            session = null;
            startedHere = false;
            console.warn('Could not start transaction despite replica set; proceeding without session for ledger entry');
        }
    } else if (!session && !mongoose.transactionsSupported) {
        // Explicitly avoid sessions when transactions are unsupported
        session = null;
    }

    try {
        // Idempotency: return early if an entry with this key exists
        if (idempotencyKey) {
            const existing = session ? await CustomerLedger.findOne({ idempotencyKey }).session(session) : await CustomerLedger.findOne({ idempotencyKey });
            if (existing) {
                if (startedHere) {
                    await session.commitTransaction();
                    session.endSession();
                }
                return existing;
            }
        }

        // Fetch customer and previous ledger to calculate balance using latest ledger entry (most authoritative)
        const customer = session ? await Customer.findById(customerId).session(session) : await Customer.findById(customerId);
        if (!customer) throw new Error('Customer not found');

        const lastLedger = session ? await CustomerLedger.findOne({ customer: customerId }).sort({ createdAt: -1 }).session(session) : await CustomerLedger.findOne({ customer: customerId }).sort({ createdAt: -1 });
        const prevBalance = lastLedger ? Number(lastLedger.balanceAfter) : Number(customer.balance || 0);

        const newBalance = Number((prevBalance + Number(debitAmount || 0) - Number(creditAmount || 0)).toFixed(2));

        const ledger = new CustomerLedger({
            customer: customerId,
            referenceType,
            referenceId,
            debitAmount: Number(debitAmount || 0),
            creditAmount: Number(creditAmount || 0),
            balanceAfter: newBalance,
            paymentMethod,
            notes,
            createdBy,
            idempotencyKey
        });

        // Save ledger with retry on duplicate key due to idempotency race
        try {
            if (session) await ledger.save({ session }); else await ledger.save();
        } catch (saveErr) {
            // If duplicate key error occurred and idempotencyKey provided, another process inserted it concurrently - fetch and return
            if (saveErr && saveErr.code === 11000 && idempotencyKey) {
                const existing = session ? await CustomerLedger.findOne({ idempotencyKey }).session(session) : await CustomerLedger.findOne({ idempotencyKey });
                if (existing) {
                    if (startedHere) {
                        await session.commitTransaction();
                        session.endSession();
                    }
                    return existing;
                }
            }
            throw saveErr;
        }

        // Persist customer balance
        customer.balance = newBalance;
        if (session) await customer.save({ session }); else await customer.save();

        if (startedHere) {
            await session.commitTransaction();
            session.endSession();
        }

        return ledger;
    } catch (err) {
        if (startedHere) {
            await session.abortTransaction();
            session.endSession();
        }
        throw err;
    }
}

async function createVendorLedgerEntry({
    vendorId,
    referenceType,
    referenceId = null,
    products = [],
    totalCost = 0,
    paidAmount = 0,
    paymentMode = null,
    notes = null,
    createdBy = null,
    idempotencyKey = null,
    session: providedSession = null
}) {
    if (totalCost < 0 || paidAmount < 0) throw new Error('Amounts must be non-negative');

    let session = providedSession;
    let startedHere = false;

    // If no session provided, attempt to create one and start a transaction only if supported.
    if (!session && mongoose.transactionsSupported) {
        session = await mongoose.startSession();
        try {
            session.startTransaction();
            startedHere = true;
        } catch (err) {
            session.endSession();
            session = null;
            startedHere = false;
            console.warn('Could not start transaction despite replica set; proceeding without transaction for vendor ledger entry');
        }
    } else if (!session && !mongoose.transactionsSupported) {
        session = null;
    }

    try {
        if (idempotencyKey) {
            const existing = session ? await VendorLedger.findOne({ idempotencyKey }).session(session) : await VendorLedger.findOne({ idempotencyKey });
            if (existing) {
                if (startedHere) {
                    await session.commitTransaction();
                    session.endSession();
                }
                return existing;
            }
        }

        const vendor = session ? await Vendor.findById(vendorId).session(session) : await Vendor.findById(vendorId);
        if (!vendor) throw new Error('Vendor not found');

        const prevBalance = Number(vendor.balance || 0);
        const dueAmount = Number(totalCost) - Number(paidAmount);
        const newBalance = prevBalance + dueAmount; // company owes vendor more on credit

        const ledger = new VendorLedger({
            vendor: vendorId,
            referenceType,
            referenceId,
            products,
            totalCost,
            paidAmount,
            dueAmount,
            paymentMode,
            balanceAfter: newBalance,
            notes,
            createdBy,
            idempotencyKey
        });

        if (session) await ledger.save({ session }); else await ledger.save();

        vendor.balance = newBalance;
        if (session) await vendor.save({ session }); else await vendor.save();

        if (startedHere) {
            await session.commitTransaction();
            session.endSession();
        }
        return ledger;
    } catch (err) {
        if (startedHere) {
            await session.abortTransaction();
            session.endSession();
        }
        throw err;
    }
}

module.exports = {
    createCustomerLedgerEntry,
    createVendorLedgerEntry
};