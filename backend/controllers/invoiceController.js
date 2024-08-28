const Invoice = require('../models/appmodel/Invoice');

// Create a new invoice
exports.createInvoice = async (req, res) => {
  const { client, number, year, currency, status, date, expirationDate, note, items, subtotal, tax, taxAmount, total, createdBy } = req.body;

  try {
    const newInvoice = new Invoice({
      client,
      number,
      year,
      currency,
      status,
      date,
      expirationDate,
      note,
      items,
      subtotal,
      tax,
      taxAmount,
      total,
      createdBy,
    });

    const savedInvoice = await newInvoice.save();
    res.status(201).json(savedInvoice);
  } catch (error) {
    res.status(500).json({ message: 'Error creating invoice', error });
  }
};

// Get all invoices or filter by createdBy
exports.getInvoices = async (req, res) => {
  const { createdBy } = req.query;

  try {
    const filter = createdBy ? { createdBy } : {};
    const invoices = await Invoice.find(filter);
    res.status(200).json(invoices);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching invoices', error });
  }
};

// Get a single invoice by ID
exports.getInvoiceById = async (req, res) => {
  const { id } = req.params;

  try {
    const invoice = await Invoice.findById(id);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

    res.status(200).json(invoice);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching invoice', error });
  }
};

// Update an invoice by ID
exports.updateInvoice = async (req, res) => {
  const { id } = req.params;
  const { client, number, year, currency, status, date, expirationDate, note, items, subtotal, tax, taxAmount, total } = req.body;

  try {
    const updatedInvoice = await Invoice.findByIdAndUpdate(
      id,
      { client, number, year, currency, status, date, expirationDate, note, items, subtotal, tax, taxAmount, total },
      { new: true }
    );

    if (!updatedInvoice) return res.status(404).json({ message: 'Invoice not found' });

    res.status(200).json(updatedInvoice);
  } catch (error) {
    res.status(500).json({ message: 'Error updating invoice', error });
  }
};

// Delete an invoice by ID
exports.deleteInvoice = async (req, res) => {
  const { id } = req.params;

  try {
    const invoice = await Invoice.findByIdAndDelete(id);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

    res.status(200).json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting invoice', error });
  }
};
