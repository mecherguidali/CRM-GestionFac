const express = require('express');
const router = express.Router();
const adminController = require('../controller/adminController'); // Adjust the path as necessary

router.post('/register', adminController.register);
router.get('/confirm/:token', adminController.confirmEmail);
router.post('/login', adminController.login);
module.exports = router;
