/**
 * Migration: backfill ledgers from historical Orders
 * Usage: node migrations/20260111_backfill_ledgers.js
 * Ensure DB is backed up before running. This script is idempotent via idempotency keys.
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Order = require('../models/Order');
const Customer = require('../models/Customer');
const { createCustomerLedgerEntry } = require('../services/ledgerService');

dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to DB');

    // 1) Create SALE ledger entries for orders where dueAmount > 0
    const orders = await Order.find({}).sort({ createdAt: 1 });
    console.log(`Found ${orders.length} orders`);

    for (const order of orders) {
        const due = Number(order.dueAmount || (order.totalAmount - (order.paidAmount || order.totalAmount)));
        if (due > 0 && order.customer) {
            try {
                await createCustomerLedgerEntry({
                    customerId: order.customer,
                    referenceType: 'SALE',
                    referenceId: order._id,
                    debitAmount: due,
                    creditAmount: 0,
                    notes: `Migration: record credit from historical order ${order._id}`,
                    idempotencyKey: `MIGRATE:SALE:${order._id}`
                });
                console.log(`Created SALE ledger for order ${order._id}`);
            } catch (err) {
                console.error(`Skipping order ${order._id}:`, err.message);
            }
        }
    }

    // 2) Reconcile each customer's balance if ledger-sum != current balance
    const customers = await Customer.find({});
    for (const c of customers) {
        // compute ledger-derived balance
        const agg = await mongoose.model('CustomerLedger').aggregate([
            { $match: { customer: c._id, deletedAt: null } },
            { $group: { _id: null, debit: { $sum: '$debitAmount' }, credit: { $sum: '$creditAmount' } } }
        ]);
        const debit = agg[0]?.debit || 0;
        const credit = agg[0]?.credit || 0;
        const ledgerBalance = debit - credit;
        const currentBalance = Number(c.balance || 0);
        if (ledgerBalance !== currentBalance) {
            const diff = currentBalance - ledgerBalance;
            try {
                if (diff > 0) {
                    // customer currently has bigger balance than ledger suggests -> create ADJUSTMENT debit
                    await createCustomerLedgerEntry({
                        customerId: c._id,
                        referenceType: 'ADJUSTMENT',
                        debitAmount: diff,
                        creditAmount: 0,
                        notes: `Migration: reconcile to existing balance (diff ${diff})`,
                        idempotencyKey: `MIGRATE:RECONCILE:${c._id}`
                    });
                } else if (diff < 0) {
                    await createCustomerLedgerEntry({
                        customerId: c._id,
                        referenceType: 'ADJUSTMENT',
                        debitAmount: 0,
                        creditAmount: Math.abs(diff),
                        notes: `Migration: reconcile to existing balance (diff ${diff})`,
                        idempotencyKey: `MIGRATE:RECONCILE:${c._id}`
                    });
                }
                console.log(`Reconciled customer ${c._id}, diff ${diff}`);
            } catch (err) {
                console.error(`Failed to reconcile ${c._id}:`, err.message);
            }
        }
    }

    console.log('Migration complete');
    mongoose.disconnect();
}

run().catch(err => {
    console.error(err);
    mongoose.disconnect();
    process.exit(1);
});