const express = require('express');
const router = express.Router();
const {
    getCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
} = require('../controllers/customerController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getCustomers)
    .post(protect, admin, createCustomer);

router.route('/:id')
    .put(protect, admin, updateCustomer)
    .delete(protect, admin, deleteCustomer);

module.exports = router;
