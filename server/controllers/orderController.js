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
//         customerId
//     } = req.body;

//     if (orderItems && orderItems.length === 0) {
//         res.status(400);
//         throw new Error('No order items');
//         return;
//     } else {
//         let calculatedProfit = 0;

//         // Verify products and calculate profit
//         for (const item of orderItems) {
//             const product = await Product.findById(item.product);
//             if (!product) {
//                 res.status(404);
//                 throw new Error(`Product not found: ${item.name}`);
//             }
//             if (product.stock < item.qty) {
//                 res.status(400);
//                 throw new Error(`Insufficient stock for ${product.name}`);
//             }

//             // Calculate Profit per item: (Selling Price - Cost Price) * Quantity
//             const itemProfit = (product.price - product.cost) * item.qty;
//             calculatedProfit += itemProfit;

//             // Deduct Stock
//             product.stock = product.stock - item.qty;
//             await product.save();
//         }

//         const order = new Order({
//             customer: customerId,
//             items: orderItems,
//             paymentMethod,
//             totalAmount,
//             profit: calculatedProfit,
//             taxAmount,
//             discountAmount,
//         });

//         const createdOrder = await order.save();

//         // update customer balance if credit/udhaar (Not fully implemented logic, assuming paid for now unless spec says otherwise, 
//         // prompt says "Credit / loan system (Udhaar)", so maybe paymentMethod can be "Credit")
//         if (paymentMethod === 'Credit' && customerId) {
//             const customer = await Customer.findById(customerId);
//             if (customer) {
//                 customer.balance = customer.balance + totalAmount;
//                 await customer.save();
//             }
//         }

//         res.status(201).json(createdOrder);
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



    const asyncHandler = require('express-async-handler');
    const Order = require('../models/Order');
    const Product = require('../models/Product');
    const Customer = require('../models/Customer');

    // @desc    Create new order
    // @route   POST /api/orders
    // @access  Private (Staff/Admin)
    const addOrderItems = asyncHandler(async (req, res) => {
        const {
            orderItems,
            paymentMethod,
            totalAmount,
            taxAmount,
            discountAmount,
            customerId
        } = req.body;

        if (!orderItems || orderItems.length === 0) {
            res.status(400);
            throw new Error('No order items');
        }

        let calculatedProfit = 0;

        // Verify products, calculate profit, update stock
        for (const item of orderItems) {
            const product = await Product.findById(item.product);
            if (!product) {
                res.status(404);
                throw new Error(`Product not found: ${item.name}`);
            }
            if (product.stock < item.qty) {
                res.status(400);
                throw new Error(`Insufficient stock for ${product.name}`);
            }

            calculatedProfit += (product.price - product.cost) * item.qty;

            product.stock -= item.qty;
            await product.save();
        }

        // Create Order
        const order = new Order({
            customer: customerId || null,
            items: orderItems,
            paymentMethod,
            totalAmount,
            profit: calculatedProfit,
            taxAmount,
            discountAmount,
            user: req.user._id,
            isPaid: paymentMethod !== 'Credit' // Paid for Cash/Card/Online, unpaid for Credit
        });

        const createdOrder = await order.save();

        // Credit handling
if (paymentMethod === 'Credit' && customerId) {
    const customer = await Customer.findById(customerId);
    if (customer) {
        customer.balance += totalAmount;

        // Ensure creditHistory exists
        customer.creditHistory = customer.creditHistory || [];

        customer.creditHistory.push({
            orderId: createdOrder._id,
            amount: totalAmount,
            note: 'Credit Sale',
            createdBy: req.user._id
        });

        await customer.save();
    }
}



        res.status(201).json(createdOrder);
    });

    // @desc    Get order by ID
    // @route   GET /api/orders/:id
    // @access  Private
    const getOrderById = asyncHandler(async (req, res) => {
        const order = await Order.findById(req.params.id)
            .populate('customer', 'name email balance')
            .populate('items.product', 'name price');

        if (order) {
            res.json(order);
        } else {
            res.status(404);
            throw new Error('Order not found');
        }
    });

    // @desc    Get all orders
    // @route   GET /api/orders
    // @access  Private/Admin
    const getOrders = asyncHandler(async (req, res) => {
        const orders = await Order.find({})
            .populate('customer', 'id name balance')
            .sort({ createdAt: -1 });
        res.json(orders);
    });

    module.exports = {
        addOrderItems,
        getOrderById,
        getOrders,
    };
