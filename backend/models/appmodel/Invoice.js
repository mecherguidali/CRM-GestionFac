const mongoose = require('mongoose');

// Schema for individual items in the invoice
const itemSchema = new mongoose.Schema({
  article: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  quantity: {
    type: Number,
    required: true,
    default: 1,
  },
  price: {
    type: Number,
    required: true,
  },
  total: {
    type: Number,
    required: true,
  },
});

const invoiceSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.ObjectId,
    ref: 'Client',
    required: true,
    autopopulate: true,
  },
  number: {
    type: Number,
    required: true,
  },
  year: {
    type: Number,
    required: true,
  },
  currency: {
    type: mongoose.Schema.ObjectId,
    ref: 'Currency',
    required: true,
    autopopulate: true,
  },
  status: {
    type: String,
    required: true,
    enum: ['Brouillon', 'Envoyé', 'Payé', 'Annulé'],
    default: 'Brouillon',
  },
  date: {
    type: Date,
    required: true,
  },
  expirationDate: {
    type: Date,
  },
  note: {
    type: String,
  },
  items: [itemSchema],
  subtotal: {
    type: Number,
    required: true,
  },
  tax: {
    type: mongoose.Schema.ObjectId,
    ref: 'Tax',
    required: true,
    autopopulate: true,
  },
  taxAmount: {
    type: Number,
    required: true,
  },
  total: {
    type: Number,
    required: true,
  },
  createdBy: {
    type: String,
    required: true,
  },
  created: {
    type: Date,
    default: Date.now,
  },
});



const Invoice = mongoose.model('Invoice', invoiceSchema);
module.exports = Invoice;
