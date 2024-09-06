const Payment = require('../models/appmodel/payment');
const Invoice = require('../models/appmodel/Invoice');

// Create a new payment for an invoice
exports.createPayment = async (req, res) => {
  try {
    const { amountPaid, paymentMethod, createdBy } = req.body;
    const { invoiceId } = req.params;
    // Find the related invoice
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Create a new payment record
    const payment = new Payment({
      invoice: invoiceId,
      amountPaid,
      paymentMethod,
      createdBy  // Save the string value for createdBy
    });

    // Save the payment record
    await payment.save();

    // Update the invoice's paidAmount
    invoice.paidAmount += amountPaid;
    if (invoice.paidAmount >= invoice.total) {
      invoice.paymentStatus = 'Paid';  // Mark the invoice as fully paid
    } else {
      invoice.paymentStatus = 'Partially Paid';  // Mark the invoice as partially paid
    }
    await invoice.save();

    res.status(201).json({ message: 'Payment recorded successfully', payment });
  } catch (error) {
    res.status(500).json({ message: 'Error recording payment', error });
  }
};
// Get payment history for an invoice
exports.getPaymentsForInvoice = async (req, res) => {
    try {
      const { invoiceId } = req.params;
  
      // Find all payments related to the invoice
      const payments = await Payment.find({ invoice: invoiceId });
  
      if (!payments || payments.length === 0) {
        return res.status(404).json({ message: 'No payments found for this invoice' });
      }
  
      res.status(200).json(payments);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching payment history', error });
    }
  };
