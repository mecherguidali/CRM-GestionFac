const mongoose = require('mongoose');

// Define the schema for the form data
const entrepriseSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: false,
  },
  mainContact: { type: mongoose.Schema.ObjectId, ref: 'Person', autopopulate: false },
  pays: {
    type: String,
  },
  telephone: {
    type: String,
  },
  email: {
    type: String,
    required: true,
  
  },
  siteweb: {
    type: String,
  },
  createdBy: {
    type: String,
    required: true
},
created: {
    type: Date,
    default: Date.now,
  },
});

// Create and export the model
const Entreprise = mongoose.model('Entreprise', entrepriseSchema);
module.exports = Entreprise;
