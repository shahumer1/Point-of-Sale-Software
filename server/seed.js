const mongoose = require('mongoose');
const dotenv = require('dotenv');
const colors = require('colors'); // Optional but helpful for logs
const User = require('./models/User');
const Product = require('./models/Product');
const Customer = require('./models/Customer');
const Order = require('./models/Order');
const Expense = require('./models/Expense');
const connectDB = require('./config/db');

dotenv.config();

connectDB();

const importData = async () => {
    try {
        await Order.deleteMany();
        await Product.deleteMany();
        await User.deleteMany();
        await Customer.deleteMany();
        await Expense.deleteMany();

        const users = await User.create([
            {
                name: 'Admin User',
                email: 'admin@example.com',
                password: 'password123',
                role: 'admin',
            },
            {
                name: 'Staff User',
                email: 'staff@example.com',
                password: 'password123',
                role: 'staff',
            },
        ]);

        const adminUser = users[0]._id;

        const products = await Product.insertMany([
            {
                name: 'Wireless Mouse',
                sku: 'WM001',
                category: 'Electronics',
                price: 1500,
                cost: 800,
                stock: 50,
            },
            {
                name: 'Mechanical Keyboard',
                sku: 'MK002',
                category: 'Electronics',
                price: 4500,
                cost: 3000,
                stock: 20,
            },
            {
                name: 'USB-C Cable',
                sku: 'UC003',
                category: 'Accessories',
                price: 500,
                cost: 200,
                stock: 100,
            },
            {
                name: 'Monitor 24 inch',
                sku: 'MO004',
                category: 'Electronics',
                price: 25000,
                cost: 20000,
                stock: 10,
            },
            {
                name: 'Laptop Stand',
                sku: 'LS005',
                category: 'Accessories',
                price: 1200,
                cost: 700,
                stock: 30,
            },
        ]);

        const customers = await Customer.insertMany([
            {
                name: 'Ali Khan',
                phone: '03001234567',
                address: 'Clifton, Karachi',
                balance: 0,
            },
            {
                name: 'Ahmed Shah',
                phone: '03219876543',
                address: 'Saddar, Hyderabad',
                balance: 500,
            },
            {
                name: 'Sara Bibi',
                phone: '03335555555',
                address: 'Latifabad, Hyderabad',
                balance: 0,
            },
        ]);

        console.log('Data Imported!');
        process.exit();
    } catch (error) {
        console.error(`${error}`);
        process.exit(1);
    }
};

const destroyData = async () => {
    try {
        await Order.deleteMany();
        await Product.deleteMany();
        await User.deleteMany();
        await Customer.deleteMany();
        await Expense.deleteMany();

        console.log('Data Destroyed!');
        process.exit();
    } catch (error) {
        console.error(`${error}`);
        process.exit(1);
    }
};

if (process.argv[2] === '-d') {
    destroyData();
} else {
    importData();
}
