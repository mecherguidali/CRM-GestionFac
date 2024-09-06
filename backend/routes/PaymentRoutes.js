const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// Route to create a payment
router.post('/:invoiceId', paymentController.createPayment);

// Route to get all payments for a specific invoice
router.get('/:invoiceId', paymentController.getPaymentsForInvoice);

module.exports = router;
