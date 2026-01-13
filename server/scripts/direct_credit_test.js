const mongoose = require('mongoose');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Order = require('../models/Order');
const { createCustomerLedgerEntry } = require('../services/ledgerService');

(async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mern-pos';
    await mongoose.connect(uri);
    console.log('Connected to DB');

    const product = await Product.findOne({ stock: { $gt: 0 } });
    if (!product) throw new Error('No product with stock');

    const customer = await Customer.findOne({});
    if (!customer) throw new Error('No customer found');

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      // decrement stock
      product.stock -= 1;
      await product.save({ session });

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

      const order = await Order.create([orderData], { session });
      const createdOrder = order[0];

      const ledger = await createCustomerLedgerEntry({
        customerId: customer._id,
        referenceType: 'SALE',
        referenceId: createdOrder._id,
        debitAmount: product.price,
        creditAmount: 0,
        paymentMethod: 'Credit',
        notes: `Direct test sale ${createdOrder._id}`,
        createdBy: null,
        idempotencyKey: `DIRECTTEST:SALE:${createdOrder._id}`,
        session
      });

      await session.commitTransaction();
      session.endSession();

      const updatedCustomer = await Customer.findById(customer._id);
      console.log('Order created:', createdOrder._id);
      console.log('Ledger entry:', ledger._id, ledger.referenceType, ledger.debitAmount, ledger.balanceAfter);
      console.log('Customer balance after:', updatedCustomer.balance);

      process.exit(0);
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  } catch (err) {
    console.error('Error in direct test:', err);
    process.exit(1);
  }
})();