const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const app = require('../../index');
const User = require('../../models/User');
const Customer = require('../../models/Customer');
const Product = require('../../models/Product');
const CustomerLedger = require('../../models/CustomerLedger');
const jwt = require('jsonwebtoken');

let token;
let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  const uri = mongod.getUri();
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

  const user = await User.create({ name: 'Test Admin', email: 'admin2@test.local', password: 'password', role: 'admin' });
  token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'testsecret');
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

afterEach(async () => {
  await Customer.deleteMany({});
  await Product.deleteMany({});
  await CustomerLedger.deleteMany({});
});

test('Credit sale creates sale ledger and updates customer balance', async () => {
  const customer = await Customer.create({ name: 'Cust Order', phone: '789', address: 'Z', balance: 0 });
  const product = await Product.create({ name: 'Widget', price: 500, cost: 300, stock: 10, category: 'General' });

  const orderItems = [{ product: product._id, name: product.name, qty: 1, price: 500 }];

  const res = await request(app)
    .post('/api/orders')
    .set('Authorization', `Bearer ${token}`)
    .send({ orderItems, paymentMethod: 'Credit', totalAmount: 500, taxAmount: 0, discountAmount: 0, customerId: customer._id, paidAmount: 0 });

  expect(res.status).toBe(201);

  const ledger = await CustomerLedger.findOne({ customer: customer._id, referenceType: 'SALE' });
  expect(ledger).toBeTruthy();
  expect(ledger.debitAmount).toBe(500);

  const updated = await Customer.findById(customer._id);
  expect(updated.balance).toBe(500);
});