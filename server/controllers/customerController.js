// const asyncHandler = require('express-async-handler');
// const Customer = require('../models/Customer');
// const CustomerLedger = require('../models/CustomerLedger');

// // @desc    Get all customers
// // @route   GET /api/customers
// // @access  Private
// const getCustomers = asyncHandler(async (req, res) => {
//     const customers = await Customer.find({});
//     res.json(customers);
// });

// // @desc    Create a customer
// // @route   POST /api/customers
// // @access  Private
// const createCustomer = asyncHandler(async (req, res) => {
//     const { name, phone, address } = req.body;

//     const customerExists = await Customer.findOne({ phone });
//     if (customerExists) {
//         res.status(400);
//         throw new Error('Customer already exists with this phone number');
//     }

//     const customer = new Customer({
//         name,
//         phone,
//         address,
//     });

//     const createdCustomer = await customer.save();
//     res.status(201).json(createdCustomer);
// });

// // @desc    Get a single customer
// // @route   GET /api/customers/:id
// // @access  Private
// const getCustomerById = asyncHandler(async (req, res) => {
//     const customer = await Customer.findById(req.params.id);
//     if (customer) {
//         res.json(customer);
//     } else {
//         res.status(404);
//         throw new Error('Customer not found');
//     }
// });


// // @desc    Update customer
// // @route   PUT /api/customers/:id
// // @access  Private
// const updateCustomer = asyncHandler(async (req, res) => {
//     const { name, phone, address } = req.body;
//     const customer = await Customer.findById(req.params.id);

//     if (customer) {
//         customer.name = name;
//         customer.phone = phone;
//         customer.address = address;
//         const updatedCustomer = await customer.save();
//         res.json(updatedCustomer);
//     } else {
//         res.status(404);
//         throw new Error('Customer not found');
//     }
// });

// // @desc    Delete customer
// // @route   DELETE /api/customers/:id
// // @access  Private/Admin
// const deleteCustomer = asyncHandler(async (req, res) => {
//     const customer = await Customer.findById(req.params.id);
//     if (customer) {
//         await customer.deleteOne();
//         res.json({ message: 'Customer removed' });
//     } else {
//         res.status(404);
//         throw new Error('Customer not found');
//     }
// });

// const { createCustomerLedgerEntry } = require('../services/ledgerService');

// // @desc    Record a customer payment (reduces balance)
// // @route   POST /api/customers/:id/payments
// // @access  Private (staff/admin)
// const recordPayment = asyncHandler(async (req, res) => {
//     const customerId = req.params.id;
//     const { amount, paymentMethod = 'Cash', notes = '', idempotencyKey = null } = req.body;

//     if (!amount || Number(amount) <= 0) {
//         res.status(400);
//         throw new Error('Invalid payment amount');
//     }

//     const ledger = await createCustomerLedgerEntry({
//         customerId,
//         referenceType: 'PAYMENT',
//         referenceId: null,
//         debitAmount: 0,
//         creditAmount: Number(amount),
//         paymentMethod,
//         notes,
//         createdBy: req.user?._id || null,
//         idempotencyKey
//     });

//     res.status(201).json(ledger);
// });

// // @desc    Get customer ledger entries with pagination
// // @route   GET /api/customers/:id/ledger
// // @access  Private
// const getCustomerLedger = asyncHandler(async (req, res) => {
//     const customerId = req.params.id;
//     const page = Number(req.query.page) || 1;
//     const limit = Math.min(Number(req.query.limit) || 50, 200);

//     const query = { customer: customerId, deletedAt: null };
//     const total = await CustomerLedger.countDocuments(query);
//     const entries = await CustomerLedger.find(query).sort({ date: -1 }).skip((page - 1) * limit).limit(limit);

//     res.json({ total, page, limit, entries });
// });

// // @desc    Soft-delete a ledger entry (admin only) and create an adjustment to reconcile balance
// // @route   DELETE /api/customers/:id/ledger/:ledgerId
// // @access  Private/Admin
// const deleteCustomerLedgerEntry = asyncHandler(async (req, res) => {
//     const { id: customerId, ledgerId } = req.params;

//     let session = null;
//     let startedHere = false;
//     if (require('mongoose').transactionsSupported) {
//         session = await Customer.startSession();
//         try {
//             session.startTransaction();
//             startedHere = true;
//         } catch (err) {
//             session.endSession();
//             session = null;
//             startedHere = false;
//             console.warn('Transactions unavailable - proceeding without transaction for ledger deletion');
//         }
//     }

//     try {
//         const ledger = session ? await CustomerLedger.findOne({ _id: ledgerId, customer: customerId }).session(session) : await CustomerLedger.findOne({ _id: ledgerId, customer: customerId });
//         if (!ledger) {
//             res.status(404);
//             throw new Error('Ledger entry not found');
//         }
//         if (ledger.deletedAt) {
//             if (startedHere && session) {
//                 await session.commitTransaction();
//                 session.endSession();
//             } else if (session) {
//                 session.endSession();
//             }
//             return res.json({ message: 'Already deleted' });
//         }

//         // Mark soft-deleted
//         ledger.deletedAt = new Date();
//         ledger.deletedBy = req.user?._id || null;
//         if (session) await ledger.save({ session }); else await ledger.save();

//         // Reconcile by creating an ADJUSTMENT opposite to the effect of the deleted entry
//         const delta = Number(ledger.debitAmount || 0) - Number(ledger.creditAmount || 0);
//         let adjustment;
//         if (delta > 0) {
//             // Original increased customer's balance by delta; to reverse, create PAYMENT (credit)
//             adjustment = await createCustomerLedgerEntry({
//                 customerId,
//                 referenceType: 'ADJUSTMENT',
//                 referenceId: ledger._id,
//                 debitAmount: 0,
//                 creditAmount: delta,
//                 notes: `Reversal of ledger ${ledger._id}`,
//                 createdBy: req.user?._id || null,
//                 idempotencyKey: `REV:${ledger._id}`,
//                 session
//             });
//         } else if (delta < 0) {
//             // Original decreased customer's balance; to reverse, create a debit
//             adjustment = await createCustomerLedgerEntry({
//                 customerId,
//                 referenceType: 'ADJUSTMENT',
//                 referenceId: ledger._id,
//                 debitAmount: Math.abs(delta),
//                 creditAmount: 0,
//                 notes: `Reversal of ledger ${ledger._id}`,
//                 createdBy: req.user?._id || null,
//                 idempotencyKey: `REV:${ledger._id}`,
//                 session
//             });
//         }

//         if (startedHere && session) {
//             await session.commitTransaction();
//             session.endSession();
//         } else if (session) {
//             session.endSession();
//         }

//         res.json({ message: 'Ledger soft-deleted', adjustment });
//     } catch (err) {
//         if (startedHere && session) {
//             await session.abortTransaction();
//             session.endSession();
//         } else if (session) {
//             session.endSession();
//         }
//         throw err;
//     }
// });


// module.exports = {
//     getCustomers,
//     createCustomer,
//     getCustomerById,
//     updateCustomer,
//     deleteCustomer,
//     recordPayment,
//     getCustomerLedger,
//     deleteCustomerLedgerEntry
// };






const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Customer = require('../models/Customer');
const CustomerLedger = require('../models/CustomerLedger');
const { createCustomerLedgerEntry } = require('../services/ledgerService');

/**
 * @desc    Get all customers
 * @route   GET /api/customers
 * @access  Private
 */
const getCustomers = asyncHandler(async (req, res) => {
    const customers = await Customer.find({});
    res.json(customers);
});

/**
 * @desc    Create a new customer
 * @route   POST /api/customers
 * @access  Private
 */
const createCustomer = asyncHandler(async (req, res) => {
    const { name, phone, address } = req.body;

    const customerExists = await Customer.findOne({ phone });
    if (customerExists) {
        res.status(400);
        throw new Error('Customer already exists with this phone number');
    }

    const customer = await Customer.create({ name, phone, address });
    res.status(201).json(customer);
});

/**
 * @desc    Get a single customer by ID
 * @route   GET /api/customers/:id
 * @access  Private
 */
const getCustomerById = asyncHandler(async (req, res) => {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
        res.status(404);
        throw new Error('Customer not found');
    }
    res.json(customer);
});

/**
 * @desc    Update a customer
 * @route   PUT /api/customers/:id
 * @access  Private
 */
const updateCustomer = asyncHandler(async (req, res) => {
    const { name, phone, address } = req.body;
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
        res.status(404);
        throw new Error('Customer not found');
    }

    customer.name = name;
    customer.phone = phone;
    customer.address = address;

    const updatedCustomer = await customer.save();
    res.json(updatedCustomer);
});

/**
 * @desc    Delete a customer
 * @route   DELETE /api/customers/:id
 * @access  Private/Admin
 */
const deleteCustomer = asyncHandler(async (req, res) => {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
        res.status(404);
        throw new Error('Customer not found');
    }

    await customer.deleteOne();
    res.json({ message: 'Customer removed' });
});

/**
 * @desc    Record a payment (or credit) from a customer
 * @route   POST /api/customers/:id/payments
 * @access  Private (staff/admin)
 */
const recordPayment = asyncHandler(async (req, res) => {
    const customerId = req.params.id;
    const { amount, paymentMethod = 'Cash', notes = '', idempotencyKey = null } = req.body;

    if (!amount || Number(amount) <= 0) {
        res.status(400);
        throw new Error('Invalid payment amount');
    }

    // Create ledger entry without transactions (works on standalone MongoDB)
    const ledger = await createCustomerLedgerEntry({
        customerId,
        referenceType: 'PAYMENT',
        referenceId: null,
        debitAmount: 0,
        creditAmount: Number(amount),
        paymentMethod,
        notes,
        createdBy: req.user?._id || null,
        idempotencyKey,
        session: null
    });

    res.status(201).json(ledger);
});

/**
 * @desc    Get paginated ledger entries for a customer
 * @route   GET /api/customers/:id/ledger
 * @access  Private
 */
const getCustomerLedger = asyncHandler(async (req, res) => {
    const customerId = req.params.id;
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 50, 200);

    const query = { customer: customerId, deletedAt: null };
    const total = await CustomerLedger.countDocuments(query);
    const entriesDocs = await CustomerLedger.find(query)
        .sort({ date: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

    // Convert to plain objects so we can add fields safely
    let entries = entriesDocs.map(e => e.toObject());

    // Enrich SALE entries with order items (product name & qty)
    const saleIds = entries.filter(e => e.referenceType === 'SALE' && e.referenceId).map(e => e.referenceId);
    if (saleIds.length > 0) {
        const Order = require('../models/Order');
        const orders = await Order.find({ _id: { $in: saleIds } }).select('items').populate('items.product', 'name sku');
        const orderMap = new Map();
        orders.forEach(o => orderMap.set(String(o._id), o));

        entries = entries.map(e => {
            if (e.referenceType === 'SALE' && e.referenceId) {
                const o = orderMap.get(String(e.referenceId));
                if (o) {
                    e.orderItems = o.items.map(it => ({
                        productId: it.product?._id || it.product,
                        productName: it.product?.name || it.name,
                        qty: it.qty
                    }));
                }
            }
            return e;
        });
    }

    res.json({ total, page, limit, entries });
});

/**
 * @desc    Soft-delete a ledger entry and create adjustment to reconcile balance
 * @route   DELETE /api/customers/:id/ledger/:ledgerId
 * @access  Private/Admin
 */
const deleteCustomerLedgerEntry = asyncHandler(async (req, res) => {
    const { id: customerId, ledgerId } = req.params;

    let session = null;

    // Optional transaction: only if MongoDB supports replica sets
    try {
        if (mongoose.transactionsSupported) {
            session = await Customer.startSession();
            session.startTransaction();
        }
    } catch {
        session = null; // fallback if standalone
    }

    try {
        const ledger = session
            ? await CustomerLedger.findOne({ _id: ledgerId, customer: customerId }).session(session)
            : await CustomerLedger.findOne({ _id: ledgerId, customer: customerId });

        if (!ledger) {
            res.status(404);
            throw new Error('Ledger entry not found');
        }

        if (ledger.deletedAt) {
            if (session) session.endSession();
            return res.json({ message: 'Already deleted' });
        }

        ledger.deletedAt = new Date();
        ledger.deletedBy = req.user?._id || null;
        if (session) await ledger.save({ session }); else await ledger.save();

        // Reconcile: reverse the effect
        const delta = (ledger.debitAmount || 0) - (ledger.creditAmount || 0);
        let adjustment;

        if (delta !== 0) {
            adjustment = await createCustomerLedgerEntry({
                customerId,
                referenceType: 'ADJUSTMENT',
                referenceId: ledger._id,
                debitAmount: delta < 0 ? Math.abs(delta) : 0,
                creditAmount: delta > 0 ? delta : 0,
                notes: `Reversal of ledger ${ledger._id}`,
                createdBy: req.user?._id || null,
                idempotencyKey: `REV:${ledger._id}`,
                session
            });
        }

        if (session) {
            if (mongoose.transactionsSupported) await session.commitTransaction();
            session.endSession();
        }

        res.json({ message: 'Ledger soft-deleted', adjustment });
    } catch (err) {
        if (session) {
            if (mongoose.transactionsSupported) await session.abortTransaction();
            session.endSession();
        }
        throw err;
    }
});

module.exports = {
    getCustomers,
    createCustomer,
    getCustomerById,
    updateCustomer,
    deleteCustomer,
    recordPayment,
    getCustomerLedger,
    deleteCustomerLedgerEntry
};
