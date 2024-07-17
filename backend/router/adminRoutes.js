const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController'); // Adjust the path as necessary

router.post('/register', adminController.register);
router.get('/confirm/:token', adminController.confirmEmail);
router.post('/login', adminController.login);
module.exports = router;
