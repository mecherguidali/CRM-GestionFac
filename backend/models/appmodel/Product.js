const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  productCategory: {
    type: mongoose.Schema.ObjectId,
    ref: 'ProductCategory',
    required: true,
    autopopulate: true,
  },
  createdBy: {
    type: String,
    required: true
},
  currency: {
    type: String,
    required: true,
    enum: ['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'INR'], // List of allowed currencies
  },
  price: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: false,
  },
  reference: {
    type: String,
    required: false,
  },
  created: {
    type: Date,
    default: Date.now,
  },
});



const Product = mongoose.model('Product', productSchema);
module.exports = Product;