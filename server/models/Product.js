const mongoose = require('mongoose');

const productSchema = mongoose.Schema({
    name: { type: String, required: true },
    sku: { type: String, unique: true },
    category: { type: String, required: true },
    price: { type: Number, required: true, default: 0 },
    cost: { type: Number, required: true, default: 0 },
    stock: { type: Number, required: true, default: 0 },
    status: { type: String, enum: ['active', 'out-of-stock'], default: 'active' },
}, {
    timestamps: true,
});

productSchema.pre('save', function (next) {
    if (this.stock <= 0) {
        this.status = 'out-of-stock';
    } else {
        this.status = 'active';
    }
    next();
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
