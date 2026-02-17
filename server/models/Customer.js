const mongoose = require('mongoose'); // <--- ye missing tha

const creditHistorySchema = mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    amount: { type: Number, required: true },
    note: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const customerSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String },
    address: { type: String },
    balance: { type: Number, default: 0 },
    creditHistory: { type: [creditHistorySchema], default: [] }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Customer', customerSchema);
