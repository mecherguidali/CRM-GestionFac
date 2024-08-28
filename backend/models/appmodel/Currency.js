const mongoose = require('mongoose');

const currencySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  code: {
    type: String,
    required: true,
    uppercase: true,
  },
  symbol: {
    type: String,
    required: true,
  },
  symbolPosition: {
    type: String,
    required: true,
    enum: ['before', 'after'], // Specifies if the symbol is placed before or after the amount
  },
  decimalSeparator: {
    type: String,
    required: true,
  },
  thousandSeparator: {
    type: String,
    required: true,
  },
  precision: {
    type: Number,
    required: true,
    default: 2, // Number of decimal places
  },
  zeroFormat: {
    type: String,
    required: true,
    enum: ['hide', 'show'], // Specifies if zero amounts should be hidden or shown
  },
  active: {
    type: Boolean,
    default: true,
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

const Currency = mongoose.model('Currency', currencySchema);
module.exports = Currency;
