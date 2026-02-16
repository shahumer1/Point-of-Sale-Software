// const express = require('express');
// const router = express.Router();
// const {
//     getCustomers,
//     createCustomer,
//     updateCustomer,
//     deleteCustomer,
// } = require('../controllers/customerController');
// const { protect, admin } = require('../middleware/authMiddleware');

// router.route('/')
//     .get(protect, getCustomers)
//     .post(protect, admin, createCustomer);

// router.route('/:id')
//     .put(protect, admin, updateCustomer)
//     .delete(protect, admin, deleteCustomer);

// module.exports = router;

const express = require('express');
const router = express.Router();
const {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerLedger,
  clearCustomerPayment,
  addSaleEntry
} = require('../controllers/customerController');

router.route('/')
  .get(getCustomers)
  .post(createCustomer);

router.route('/:id')
  .put(updateCustomer)
  .delete(deleteCustomer);

router.route('/:id/ledger').get(getCustomerLedger);
router.route('/:id/clear').post(clearCustomerPayment);
router.route('/sale').post(addSaleEntry); // add sale for a customer

module.exports = router;

