// const mongoose = require('mongoose');

// const customerLedgerSchema = mongoose.Schema({
//     customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
//     referenceType: { type: String, enum: ['SALE', 'PAYMENT', 'ADJUSTMENT'], required: true },
//     referenceId: { type: mongoose.Schema.Types.ObjectId }, // orderId, paymentId, adjustmentId
//     date: { type: Date, default: Date.now, index: true },
//     debitAmount: { type: Number, default: 0 }, // amount customer owes (increases balance)
//     creditAmount: { type: Number, default: 0 }, // amount customer paid (decreases balance)
//     balanceAfter: { type: Number, required: true },
//     paymentMethod: { type: String, enum: ['Cash', 'Bank', 'Online', 'Cheque','Credit' 'Other'] },
//     notes: { type: String },
//     createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
//     idempotencyKey: { type: String, sparse: true },
//     deletedAt: { type: Date, default: null },
//     deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
// }, {
//     timestamps: true,
// });

// // Prevent duplicate entries when idempotencyKey is set
// customerLedgerSchema.index({ idempotencyKey: 1 }, { unique: true, sparse: true });

// const CustomerLedger = mongoose.model('CustomerLedger', customerLedgerSchema);

// module.exports = CustomerLedger;


const mongoose = require('mongoose');

const customerLedgerSchema = mongoose.Schema({
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    referenceType: { type: String, enum: ['SALE', 'PAYMENT', 'ADJUSTMENT'], required: true },
    referenceId: { type: mongoose.Schema.Types.ObjectId }, // orderId, paymentId, adjustmentId
    date: { type: Date, default: Date.now },
    debitAmount: { type: Number, default: 0 }, // increases balance
    creditAmount: { type: Number, default: 0 }, // decreases balance
    balanceAfter: { type: Number, required: true },
    paymentMethod: { type: String, enum: ['Cash', 'Bank', 'Online', 'Cheque', 'Other', 'Credit'] }, // <- added Credit
    notes: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    idempotencyKey: { type: String, sparse: true },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
    timestamps: true,
});

// only one index for idempotencyKey
customerLedgerSchema.index({ idempotencyKey: 1 }, { unique: true, sparse: true });

const CustomerLedger = mongoose.model('CustomerLedger', customerLedgerSchema);

module.exports = CustomerLedger;

