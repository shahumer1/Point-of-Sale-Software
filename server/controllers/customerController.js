// const express = require('express');
// const router = express.Router();
// const {
//     getCustomers,
//     createCustomer,
//     updateCustomer,
//     deleteCustomer,
//     addTransaction,
//     getLedger,
// } = require('../controllers/customerController');

// // Customer CRUD
// router.route('/').get(getCustomers).post(createCustomer);
// router.route('/:id').put(updateCustomer).delete(deleteCustomer);

// // Ledger
// router.route('/:id/transactions').post(addTransaction);
// router.route('/:id/ledger').get(getLedger);

// module.exports = router;



const asyncHandler = require('express-async-handler');
const Customer = require('../models/Customer');
const LedgerEntry = require('../models/LedgerEntry');
const Order = require('../models/Order');

// GET all customers
const getCustomers = asyncHandler(async (req, res) => {
  const customers = await Customer.find({});
  res.json(customers);
});

// POST new customer
const createCustomer = asyncHandler(async (req, res) => {
  const { name, phone, address } = req.body;
  const exists = await Customer.findOne({ phone });
  if (exists) {
    res.status(400);
    throw new Error('Customer already exists');
  }
  const customer = await Customer.create({ name, phone, address, balance: 0 });
  res.status(201).json(customer);
});

// PUT update customer
const updateCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) {
    res.status(404);
    throw new Error('Customer not found');
  }
  const { name, phone, address } = req.body;
  customer.name = name;
  customer.phone = phone;
  customer.address = address;
  await customer.save();
  res.json(customer);
});

// DELETE customer
const deleteCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) {
    res.status(404);
    throw new Error('Customer not found');
  }
  await customer.deleteOne();
  res.json({ message: 'Customer removed' });
});

// GET Customer Ledger (includes orders as readable ledger entries)
// Supports optional ?paymentMethod=Cash|Card|Online|Credit
const getCustomerLedger = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) {
    res.status(404);
    throw new Error('Customer not found');
  }

  const filterPM = req.query.paymentMethod; // optional
  const allowedPM = ['Cash', 'Card', 'Online', 'Credit'];
  const wantFilter = filterPM && allowedPM.includes(filterPM);

  // 1) Fetch order-based ledger entries (purchase orders for this customer)
  const orderQuery = { customer: req.params.id };
  if (wantFilter) orderQuery.paymentMethod = filterPM;

  const orders = await Order.find(orderQuery)
    .sort({ createdAt: -1 })
    .populate('items.product', 'name sku');

  const orderEntries = orders.map((order) => ({
    _id: order._id,
    date: order.createdAt,
    createdAt: order.createdAt,
    description: `Sale - ${order.items.map(i => `${i.name} x ${i.qty} @ Rs ${i.price * i.qty}`).join(', ')}`,
    amount: order.totalAmount,
    paymentMethod: order.paymentMethod,
    items: order.items.map(i => ({ name: i.name, qty: i.qty, price: i.price })),
    type: 'order'
  }));

  // 2) Fetch generic ledger entries (payments / manual entries)
  const ledgerQuery = { customer: req.params.id };
  if (wantFilter) ledgerQuery.paymentMethod = filterPM;

  const ledgerEntries = await LedgerEntry.find(ledgerQuery).sort({ createdAt: -1 });
  const manualEntries = ledgerEntries.map((e) => ({
    _id: e._id,
    date: e.createdAt,
    createdAt: e.createdAt,
    description: e.note || 'Ledger entry',
    amount: e.amount,
    paymentMethod: e.paymentMethod || (e.note && (/via (Cash|Card|Online|Credit)/i.exec(e.note) || [])[1]) || null,
    items: e.items || [],
    type: 'manual'
  }));

  // 3) Merge and sort by date desc
  const merged = [...orderEntries, ...manualEntries].sort((a, b) => b.date - a.date);

  res.json({ customer, ledger: merged });
});

// POST Clear Payment
const clearCustomerPayment = asyncHandler(async (req, res) => {
  const { amount, paymentMethod } = req.body;
  const customer = await Customer.findById(req.params.id);
  if (!customer) {
    res.status(404);
    throw new Error('Customer not found');
  }

  customer.balance -= amount; // reduce balance
  await customer.save();

  const entry = await LedgerEntry.create({
    customer: req.params.id,
    amount: -amount,
    note: `Payment cleared via ${paymentMethod}`,
    paymentMethod
  });

  res.json({ message: 'Payment cleared', entry });
});

// POST Sale Entry (example)
const addSaleEntry = asyncHandler(async (req, res) => {
  const { customerId, amount, note, paymentMethod } = req.body;
  const customer = await Customer.findById(customerId);
  if (!customer) {
    res.status(404);
    throw new Error('Customer not found');
  }

  customer.balance += amount; // increase balance
  await customer.save();

  const entry = await LedgerEntry.create({
    customer: customerId,
    amount: amount,
    note: note || 'Sale',
    paymentMethod: paymentMethod || null
  });

  res.json({ message: 'Sale recorded', entry });
});

module.exports = {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerLedger,
  clearCustomerPayment,
  addSaleEntry
};
