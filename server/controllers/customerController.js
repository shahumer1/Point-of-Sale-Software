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

// GET Customer Ledger
const getCustomerLedger = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) {
    res.status(404);
    throw new Error('Customer not found');
  }
  const ledger = await LedgerEntry.find({ customer: req.params.id }).sort({ createdAt: -1 });
  res.json({ customer, ledger });
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
    note: `Payment cleared via ${paymentMethod}`
  });

  res.json({ message: 'Payment cleared', entry });
});

// POST Sale Entry (example)
const addSaleEntry = asyncHandler(async (req, res) => {
  const { customerId, amount, note } = req.body;
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
    note: note || 'Sale'
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
