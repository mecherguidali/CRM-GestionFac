const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');


// Create a new invoice
router.post('/', invoiceController.createInvoice);

// Get all invoices with optional filtering
// http://localhost:3000/api/invoices?type=Proforma
router.get('/', invoiceController.getInvoices);

// Convert Proforma to Facture
router.post('/convert-to-facture/:id', invoiceController.convertProformaToFacture);

// Update an existing invoice
router.put('/:id', invoiceController.updateInvoice);

// Delete an invoice
router.delete('/:id', invoiceController.deleteInvoice);
// Route to update payment status
router.post('/pay/:id', invoiceController.updatePaymentStatus);

// Route to generate PDF for an invoice
router.get('/export-pdf/:id/:createdBy', invoiceController.generateInvoicePDF);

//Route to gernate pdf for invoice and send it par email
router.get('/export-pdf/send-email/:id/:createdBy', invoiceController.generateInvoicePDFandSendEmail);

module.exports = router;
