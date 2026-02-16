const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const Ledger = require('../models/Ledger');
const Customer = require('../models/Customer');

router.post('/:id/ledger', asyncHandler(async (req, res) => {
  const { amount, note, paymentMethod } = req.body;
  const customer = await Customer.findById(req.params.id);
  if (!customer) {
    res.status(404);
    throw new Error('Customer not found');
  }

  const ledgerEntry = await Ledger.create({
    customer: customer._id,
    amount,
    note,
    paymentMethod
  });

  customer.balance += amount;
  await customer.save();

  res.status(201).json(ledgerEntry);
}));

router.get('/:id/ledger', asyncHandler(async (req, res) => {
  const ledger = await Ledger.find({ customer: req.params.id }).sort({ createdAt: -1 });
  res.json({ ledger });
}));

module.exports = router;
