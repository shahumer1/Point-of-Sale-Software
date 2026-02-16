// const mongoose = require('mongoose');

// const customerSchema = mongoose.Schema({
//     name: { type: String, required: true },
//     phone: { type: String, required: true },
//     address: { type: String },
//     balance: { type: Number, default: 0 }, // Positive = Customer owes money, Negative = Advance
// }, {
//     timestamps: true,
// });

// const Customer = mongoose.model('Customer', customerSchema);

// module.exports = Customer;



const mongoose = require('mongoose');

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
    creditHistory: { type: [creditHistorySchema], default: [] } // ✅ Add default empty array
  },
  { timestamps: true }
);

module.exports = mongoose.model('Customer', customerSchema);

