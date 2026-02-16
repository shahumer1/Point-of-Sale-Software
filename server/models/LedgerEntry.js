const mongoose = require('mongoose');

const ledgerEntrySchema = mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true
    },
    amount: { type: Number, required: true },
    note: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('LedgerEntry', ledgerEntrySchema);
