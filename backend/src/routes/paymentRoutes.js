const express = require('express');
const router = express.Router();
const { deposit, withdraw, transfer, getTransactions, getBalance } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/deposit', deposit);
router.post('/withdraw', withdraw);
router.post('/transfer', transfer);
router.get('/transactions', getTransactions);
router.get('/balance', getBalance);

module.exports = router;