const mongoose = require('mongoose');

const personSchema = new mongoose.Schema({
    prenom: {
        type: String,
        required: true
    },
    nom: {
        type: String,
        required: true
    },
    createdby: {
        type: String,
        required: true
    },
    entreprise: String,
    pays: String,
    telephone: String,
    email: String
});

const Person = mongoose.model('Person', personSchema);

module.exports = Person;
