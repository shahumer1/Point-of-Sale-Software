const mongoose = require('mongoose');

const vendorSchema = mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String },
    address: { type: String },
    balance: { type: Number, default: 0 }, // company owes vendor
    metadata: { type: mongoose.Schema.Types.Mixed },
}, {
    timestamps: true,
});

const Vendor = mongoose.model('Vendor', vendorSchema);

module.exports = Vendor;