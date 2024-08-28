const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');

// Create a new invoice
router.post('/', invoiceController.createInvoice);

// Get all invoices or filter by createdBy
router.get('/', invoiceController.getInvoices);

// Get a single invoice by ID
router.get('/:id', invoiceController.getInvoiceById);

// Update an invoice by ID
router.put('/:id', invoiceController.updateInvoice);

// Delete an invoice by ID
router.delete('/:id', invoiceController.deleteInvoice);

module.exports = router;
