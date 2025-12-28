const express = require('express');
const router = express.Router();
const {
    addOrderItems,
    getOrderById,
    getOrders,
} = require('../controllers/orderController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/').post(protect, addOrderItems).get(protect, admin, getOrders);
router.route('/:id').get(protect, getOrderById);

module.exports = router;
