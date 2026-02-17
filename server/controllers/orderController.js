const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Customer = require('../models/Customer');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private (Staff/Admin)
const addOrderItems = asyncHandler(async (req, res) => {
    const {
        items,
        paymentMethod,
        totalAmount,
        taxAmount,
        discountAmount,
        customer
    } = req.body;

    // Validate items array
    if (!items || !Array.isArray(items) || items.length === 0) {
        res.status(400);
        throw new Error('No order items');
    }

    // Validate basic fields
    if (typeof totalAmount !== 'number' || totalAmount < 0) {
        res.status(400);
        throw new Error('Invalid totalAmount');
    }
    if (typeof taxAmount !== 'number' || taxAmount < 0) {
        res.status(400);
        throw new Error('Invalid taxAmount');
    }
    if (typeof discountAmount !== 'number' || discountAmount < 0) {
        res.status(400);
        throw new Error('Invalid discountAmount');
    }

    // If a customer id is provided, validate it exists
    let customerDoc = null;
    if (customer) {
        customerDoc = await Customer.findById(customer);
        if (!customerDoc) {
            res.status(404);
            throw new Error('Customer not found');
        }
    }

    let calculatedProfit = 0;
    const orderItems = [];

    // Verify products, calculate profit, update stock
    for (const item of items) {
        if (!item.product) {
            res.status(400);
            throw new Error('Invalid product in items');
        }
        if (!item.qty || item.qty <= 0) {
            res.status(400);
            throw new Error(`Invalid quantity for ${item.name || item.product}`);
        }
        if (typeof item.price !== 'number' || item.price < 0) {
            res.status(400);
            throw new Error(`Invalid price for ${item.name || item.product}`);
        }

        const product = await Product.findById(item.product);
        if (!product) {
            res.status(404);
            throw new Error(`Product not found: ${item.product}`);
        }
        if (product.stock < item.qty) {
            res.status(400);
            throw new Error(`Insufficient stock for ${product.name}`);
        }

        // Profit calculated using item price vs stored cost (server-authoritative)
        calculatedProfit += (item.price - (product.cost || 0)) * item.qty;

        // Decrease stock
        product.stock -= item.qty;
        await product.save();

        orderItems.push({ product: product._id, name: item.name, qty: item.qty, price: item.price });
    }

    // Create Order (server computes profit)
    const order = new Order({
        customer: customer || null,
        items: orderItems,
        totalAmount,
        profit: calculatedProfit,
        taxAmount,
        discountAmount,
        paymentMethod,
        isPaid: paymentMethod !== 'Credit'
    });

    const createdOrder = await order.save();

    // If Credit payment and customer exists, update balance and credit history
    if (paymentMethod === 'Credit' && customerDoc) {
        customerDoc.balance += totalAmount;
        customerDoc.creditHistory = customerDoc.creditHistory || [];
        customerDoc.creditHistory.push({
            orderId: createdOrder._id,
            amount: totalAmount,
            note: 'Credit Sale',
            createdBy: req.user ? req.user._id : null
        });
        await customerDoc.save();
    }

    // Return populated order for frontend convenience
    const populatedOrder = await Order.findById(createdOrder._id)
        .populate('customer', 'name phone balance')
        .populate('items.product', 'name sku price');

    res.status(201).json(populatedOrder);
});

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id)
        .populate('customer', 'name phone balance')
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
        .populate('customer', 'name balance')
        .sort({ createdAt: -1 });

    res.json(orders);
});

module.exports = {
    addOrderItems,
    getOrderById,
    getOrders,
};
