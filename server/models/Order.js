const mongoose = require('mongoose');

const orderSchema = mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
    },
    items: [
        {
            product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
            name: { type: String, required: true },
            qty: { type: Number, required: true },
            price: { type: Number, required: true },
        }
    ],
    totalAmount: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    dueAmount: { type: Number, default: 0 },
    paymentStatus: { type: String, enum: ['Paid', 'Partial', 'Unpaid'], default: 'Paid' },
    profit: { type: Number, required: true, default: 0 },
    taxAmount: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    paymentMethod: { type: String, required: true, enum: ['Cash', 'Card', 'Online', 'Credit'] },
    isPaid: { type: Boolean, default: true },
}, {
    timestamps: true,
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
