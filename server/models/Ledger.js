const mongoose = require('mongoose');

const ledgerEntrySchema = mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    amount: { type: Number, required: true },
    note: { type: String },
    paymentMethod: { type: String, default: 'Cash' },
  },
  { timestamps: true }
);

// Prevent OverwriteModelError
module.exports = mongoose.models.LedgerEntry || mongoose.model('LedgerEntry', ledgerEntrySchema);
