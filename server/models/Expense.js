const mongoose = require('mongoose');

const expenseSchema = mongoose.Schema({
    category: { type: String, required: true },
    amount: { type: Number, required: true },
    note: { type: String },
    date: { type: Date, default: Date.now },
}, {
    timestamps: true,
});

const Expense = mongoose.model('Expense', expenseSchema);

module.exports = Expense;
