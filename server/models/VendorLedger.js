const mongoose = require('mongoose');

const vendorLedgerSchema = mongoose.Schema({
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    referenceType: { type: String, enum: ['PURCHASE', 'PAYMENT', 'ADJUSTMENT'], required: true },
    referenceId: { type: mongoose.Schema.Types.ObjectId }, // purchaseId, paymentId, adjustmentId
    products: [
        {
            product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
            name: { type: String },
            qty: { type: Number },
            unitCost: { type: Number }
        }
    ],
    totalCost: { type: Number, default: 0 },
    paidAmount: { type: Number, default: 0 },
    dueAmount: { type: Number, default: 0 },
    paymentMode: { type: String, enum: ['Cash', 'Credit', 'Cheque', 'Bank', 'Other'] },
    balanceAfter: { type: Number, required: true },
    date: { type: Date, default: Date.now, index: true },
    notes: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    idempotencyKey: { type: String, sparse: true },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
    timestamps: true,
});

vendorLedgerSchema.index({ idempotencyKey: 1 }, { unique: true, sparse: true });

const VendorLedger = mongoose.model('VendorLedger', vendorLedgerSchema);

module.exports = VendorLedger;