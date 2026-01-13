const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');

const app = require('../../index');
const User = require('../../models/User');
const Customer = require('../../models/Customer');
const CustomerLedger = require('../../models/CustomerLedger');

let mongod;
let token;

beforeAll(async () => {
  mongod = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  const uri = mongod.getUri();
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

  // create an admin user and token
  const user = await User.create({ name: 'Test Admin', email: 'admin@test.local', password: 'password', role: 'admin' });
  token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'testsecret');
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

afterEach(async () => {
  await Customer.deleteMany({});
  await CustomerLedger.deleteMany({});
});

test('Record payment creates ledger entry and updates customer balance', async () => {
  const customer = await Customer.create({ name: 'Cust A', phone: '123', address: 'X', balance: 1000 });

  const res = await request(app)
    .post(`/api/customers/${customer._id}/payments`)
    .set('Authorization', `Bearer ${token}`)
    .send({ amount: 250, paymentMethod: 'Cash' });

  expect(res.status).toBe(201);

  expect(String(res.body.customer)).toBe(String(customer._id)); // controller returns ledger object with customer id
  const ledger = await CustomerLedger.findOne({ customer: customer._id });
  expect(ledger).toBeTruthy();
  expect(ledger.creditAmount).toBe(250);

  const updated = await Customer.findById(customer._id);
  expect(updated.balance).toBe(750);
});

test('Payment idempotency: same idempotencyKey not applied twice', async () => {
  const customer = await Customer.create({ name: 'Cust B', phone: '456', address: 'Y', balance: 500 });

  const key = 'idem-123';

  const first = await request(app)
    .post(`/api/customers/${customer._id}/payments`)
    .set('Authorization', `Bearer ${token}`)
    .send({ amount: 200, paymentMethod: 'Cash', idempotencyKey: key });

  expect(first.status).toBe(201);

  // second call with same key should not double-apply
  const second = await request(app)
    .post(`/api/customers/${customer._id}/payments`)
    .set('Authorization', `Bearer ${token}`)
    .send({ amount: 200, paymentMethod: 'Cash', idempotencyKey: key });
  expect([200,201]).toContain(second.status);

  const entries = await CustomerLedger.find({ customer: customer._id, idempotencyKey: key });
  expect(entries.length).toBe(1);

  const updated = await Customer.findById(customer._id);
  expect(updated.balance).toBe(300); // 500 - 200 once
});
