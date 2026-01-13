// const asyncHandler = require('express-async-handler');
// const Order = require('../models/Order');
// const Product = require('../models/Product'); // To update stock
// const Customer = require('../models/Customer'); // To update balance

// // @desc    Create new order
// // @route   POST /api/orders
// // @access  Private (Staff/Admin)
// const addOrderItems = asyncHandler(async (req, res) => {
//     const {
//         orderItems,
//         paymentMethod,
//         totalAmount,
//         taxAmount,
//         discountAmount,
//         customerId,
//         paidAmount = null, // optional
//         idempotencyKey = null
//     } = req.body;

//     if (orderItems && orderItems.length === 0) {
//         res.status(400);
//         throw new Error('No order items');
//         return;
//     }

//     // Determine paidAmount and dueAmount
//     const paid = paidAmount === null ? Number(totalAmount) : Number(paidAmount);
//     const due = Number(totalAmount) - Number(paid);

//     // Start transaction to make stock updates, order creation, and ledger writes atomic only when supported
//     let session = null;
//     let startedHere = false;
//     if (require('mongoose').transactionsSupported) {
//         session = await Product.startSession();
//         try {
//             session.startTransaction();
//             startedHere = true;
//         } catch (err) {
//             session.endSession();
//             session = null;
//             startedHere = false;
//             console.warn('Could not start transaction despite replica set; proceeding without transaction for order creation');
//         }
//     }

//     try {
//         let calculatedProfit = 0;

//         // Verify products and calculate profit, deduct stock within session
//         for (const item of orderItems) {
//             const product = session ? await Product.findById(item.product).session(session) : await Product.findById(item.product);
//             if (!product) {
//                 res.status(404);
//                 throw new Error(`Product not found: ${item.name}`);
//             }
//             if (product.stock < item.qty) {
//                 res.status(400);
//                 throw new Error(`Insufficient stock for ${product.name}`);
//             }

//             const itemProfit = (product.price - product.cost) * item.qty;
//             calculatedProfit += itemProfit;

//             product.stock = product.stock - item.qty;
//             if (session) await product.save({ session }); else await product.save();
//         }

//         // Build order record
//         const order = new Order({
//             customer: customerId,
//             items: orderItems,
//             paymentMethod,
//             totalAmount,
//             paidAmount: paid,
//             dueAmount: due,
//             paymentStatus: due <= 0 ? 'Paid' : (paid > 0 ? 'Partial' : 'Unpaid'),
//             profit: calculatedProfit,
//             taxAmount,
//             discountAmount,
//         });

//         const createdOrder = session ? await order.save({ session }) : await order.save();

//         // Ledger handling
//         // 1) If due > 0 => record SALE ledger (customer owes)
//         if (due > 0) {
//             if (!customerId) {
//                 // Can't create credit without customer reference
//                 throw new Error('Customer required for credit sales');
//             }

//             // Use idempotency key derived from order if not provided
//             const key = idempotencyKey || `SALE:${createdOrder._id}`;
//             await require('../services/ledgerService').createCustomerLedgerEntry({
//                 customerId,
//                 referenceType: 'SALE',
//                 referenceId: createdOrder._id,
//                 debitAmount: due,
//                 creditAmount: 0,
//                 paymentMethod: paymentMethod === 'Credit' ? 'Credit' : null,
//                 notes: `Sale ${createdOrder._id} - partial paid ${paid}`,
//                 createdBy: req.user?._id || null,
//                 idempotencyKey: key,
//                 session
//             });
//         }

//         // 2) If paid > totalAmount (overpayment) => treat excess as advance -> create PAYMENT ledger
//         if (paid > Number(totalAmount) && customerId) {
//             const excess = paid - Number(totalAmount);
//             const key = idempotencyKey || `PAYMENT:${createdOrder._id}`;
//             await require('../services/ledgerService').createCustomerLedgerEntry({
//                 customerId,
//                 referenceType: 'PAYMENT',
//                 referenceId: createdOrder._id,
//                 debitAmount: 0,
//                 creditAmount: excess,
//                 paymentMethod,
//                 notes: `Overpayment for order ${createdOrder._id}`,
//                 createdBy: req.user?._id || null,
//                 idempotencyKey: key,
//                 session
//             });
//         }

//         if (startedHere && session) {
//             await session.commitTransaction();
//             session.endSession();
//         } else if (session) {
//             session.endSession();
//         }

//         res.status(201).json(createdOrder);
//     } catch (error) {
//         if (startedHere && session) {
//             await session.abortTransaction();
//             session.endSession();
//         } else if (session) {
//             session.endSession();
//         }
//         throw error;
//     }
// });

// // @desc    Get order by ID
// // @route   GET /api/orders/:id
// // @access  Private
// const getOrderById = asyncHandler(async (req, res) => {
//     const order = await Order.findById(req.params.id).populate('customer', 'name email').populate('items.product', 'name price');

//     if (order) {
//         res.json(order);
//     } else {
//         res.status(404);
//         throw new Error('Order not found');
//     }
// });

// // @desc    Get all orders
// // @route   GET /api/orders
// // @access  Private/Admin
// const getOrders = asyncHandler(async (req, res) => {
//     const orders = await Order.find({}).populate('customer', 'id name').sort({ createdAt: -1 });
//     res.json(orders);
// });

// module.exports = {
//     addOrderItems,
//     getOrderById,
//     getOrders,
// };




// orderController.js - Fixed version
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const ledgerService = require('../services/ledgerService');

// Helper function to check if transactions are supported
const isTransactionSupported = () => {
    return mongoose.transactionsSupported === true;
};

// @desc    Create new order
// @route   POST /api/orders
// @access  Private (Staff/Admin)
const addOrderItems = asyncHandler(async (req, res) => {
    const {
        orderItems,
        paymentMethod,
        totalAmount,
        taxAmount = 0,
        discountAmount = 0,
        customerId = null,
        paidAmount = null,
        idempotencyKey = null
    } = req.body;

    // ---------- VALIDATION ----------
    if (!orderItems || orderItems.length === 0) {
        res.status(400);
        throw new Error('No order items provided');
    }

    if (!totalAmount || Number(totalAmount) <= 0) {
        res.status(400);
        throw new Error('Invalid total amount');
    }

    // If payment method is credit, customer is required
    if (paymentMethod === 'Credit' && !customerId) {
        res.status(400);
        throw new Error('Customer selection is required for credit sales');
    }

    // ---------- PAYMENT CALCULATION ----------
    const paid = paidAmount === null ? Number(totalAmount) : Number(paidAmount);
    const due = Number(totalAmount) - paid;

    // ---------- TRANSACTION SETUP ----------
    let session = null;
    try {
        // Only start session if transactions are supported
        if (isTransactionSupported()) {
            session = await mongoose.startSession();
            session.startTransaction();
        }
    } catch (error) {
        console.warn('Transactions not supported, proceeding without session:', error.message);
        session = null;
    }

    try {
        let calculatedProfit = 0;

        // ---------- STOCK & PROFIT ----------
        for (const item of orderItems) {
            const qty = item.qty || item.quantity;
            if (!qty || qty <= 0) {
                throw new Error('Invalid item quantity');
            }

            const product = session
                ? await Product.findById(item.product).session(session)
                : await Product.findById(item.product);

            if (!product) {
                throw new Error(`Product not found: ${item.product}`);
            }

            if (product.stock < qty) {
                throw new Error(`Insufficient stock for ${product.name}`);
            }

            const cost = product.cost || 0;
            const profitPerItem = product.price - cost;
            calculatedProfit += profitPerItem * qty;

            product.stock -= qty;
            if (session) {
                await product.save({ session });
            } else {
                await product.save();
            }
        }

        // ---------- CREATE ORDER ----------
        const order = new Order({
            customer: customerId,
            items: orderItems,
            paymentMethod,
            totalAmount,
            paidAmount: paid,
            dueAmount: due,
            paymentStatus: due <= 0 ? 'Paid' : paid > 0 ? 'Partial' : 'Unpaid',
            profit: calculatedProfit,
            taxAmount,
            discountAmount,
        });

        const createdOrder = session ? await order.save({ session }) : await order.save();

        // ---------- LEDGER: Record full sale as a debit entry when customer present ----------
        if (customerId && Number(totalAmount) > 0) {
            const saleKey = idempotencyKey ? `${idempotencyKey}:SALE` : `SALE:${createdOrder._id}`;

            try {
                await ledgerService.createCustomerLedgerEntry({
                    customerId,
                    referenceType: 'SALE',
                    referenceId: createdOrder._id,
                    debitAmount: Number(totalAmount),
                    creditAmount: 0,
                    paymentMethod: paymentMethod === 'Credit' ? 'Credit' : null,
                    notes: `Sale ${createdOrder._id}`,
                    createdBy: req.user?._id || null,
                    idempotencyKey: saleKey,
                    session
                });
            } catch (err) {
                // ledgerService will handle idempotency and duplicate key races, rethrow unexpected errors
                if (err.code && err.code !== 11000) throw err;
                console.log('Sale ledger creation skipped due to idempotency/duplicate key');
            }
        }

        // ---------- LEDGER: Record payment (if any) as a credit entry when a customer is associated ----------
        if (customerId && Number(paid) > 0) {
            const paymentKey = idempotencyKey ? `${idempotencyKey}:PAYMENT` : `PAYMENT:${createdOrder._id}`;
            try {
                await ledgerService.createCustomerLedgerEntry({
                    customerId,
                    referenceType: 'PAYMENT',
                    referenceId: createdOrder._id,
                    debitAmount: 0,
                    creditAmount: Number(paid),
                    paymentMethod,
                    notes: paid > Number(totalAmount) ? `Overpayment for order ${createdOrder._id}` : `Payment for order ${createdOrder._id}`,
                    createdBy: req.user?._id || null,
                    idempotencyKey: paymentKey,
                    session
                });
            } catch (err) {
                if (err.code && err.code !== 11000) throw err;
                console.log('Payment ledger creation skipped due to idempotency/duplicate key');
            }
        }

        // ---------- COMMIT ----------
        if (session) {
            await session.commitTransaction();
            session.endSession();
        }

        res.status(201).json(createdOrder);

    } catch (error) {
        if (session) {
            await session.abortTransaction();
            session.endSession();
        }
        
        // Log the error for debugging
        console.error('Error creating order:', error);
        
        // Send a more helpful error message
        if (error.name === 'MongoServerError' && error.message.includes('$transaction')) {
            res.status(500);
            throw new Error('Database configuration issue. Please check if MongoDB replica set is enabled for transactions.');
        }
        
        throw error;
    }
});

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id)
        .populate('customer', 'name email')
        .populate('items.product', 'name price');

    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }

    res.json(order);
});

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
const getOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find({})
        .populate('customer', 'name')
        .sort({ createdAt: -1 });

    res.json(orders);
});

module.exports = {
    addOrderItems,
    getOrderById,
    getOrders,
};