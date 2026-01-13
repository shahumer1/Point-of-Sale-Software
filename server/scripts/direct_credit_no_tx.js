const mongoose = require('mongoose');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Order = require('../models/Order');
const CustomerLedger = require('../models/CustomerLedger');

(async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mern-pos';
    await mongoose.connect(uri);
    console.log('Connected to DB');

    const product = await Product.findOne({ stock: { $gt: 0 } });
    if (!product) throw new Error('No product with stock');

    const customer = await Customer.findOne({});
    if (!customer) throw new Error('No customer found');

    // decrement stock
    product.stock -= 1;
    await product.save();

    const orderData = {
      customer: customer._id,
      items: [{ product: product._id, name: product.name, qty: 1, price: product.price }],
      totalAmount: product.price,
      paidAmount: 0,
      dueAmount: product.price,
      paymentStatus: 'Unpaid',
      profit: (product.price - product.cost),
      taxAmount: 0,
      discountAmount: 0,
      paymentMethod: 'Credit',
    };

    const createdOrder = await Order.create(orderData);

    const debit = product.price;
    const ledger = await CustomerLedger.create({
      customer: customer._id,
      referenceType: 'SALE',
      referenceId: createdOrder._id,
      debitAmount: debit,
      creditAmount: 0,
      balanceAfter: Number(customer.balance || 0) + debit,
      paymentMethod: null,
      notes: `Direct no-tx sale ${createdOrder._id}`,
      createdBy: null,
      idempotencyKey: `DIRECTNTX:SALE:${createdOrder._id}`
    });

    customer.balance = Number(customer.balance || 0) + debit;
    await customer.save();

    console.log('Created order:', createdOrder._id);
    console.log('Created ledger:', ledger._id, 'debit:', ledger.debitAmount, 'balanceAfter:', ledger.balanceAfter);
    const updatedCustomer = await Customer.findById(customer._id);
    console.log('Customer balance now:', updatedCustomer.balance);

    process.exit(0);
  } catch (err) {
    console.error('Error in direct no-tx test:', err);
    process.exit(1);
  }
})();