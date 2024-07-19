const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController'); // Adjust the path as necessary

router.post('/register', adminController.register);
router.get('/confirm/:token', adminController.confirmEmail);
router.post('/login', adminController.login);
router.post('/sendotp', adminController.sendotp);
router.post('/resetpassword', adminController.resetpassword);
module.exports = router;
