const mongoose = require('mongoose');

const ledgerEntrySchema = mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    amount: { type: Number, required: true },
    note: { type: String },
    paymentMethod: { type: String, default: 'Cash' },
    items: [
      {
        name: { type: String, required: true },
        qty: { type: Number, required: true },
        price: { type: Number, required: true }
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.models.LedgerEntry || mongoose.model('LedgerEntry', ledgerEntrySchema);
