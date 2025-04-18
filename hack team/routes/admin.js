const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.post('/signup', adminController.signup);
router.post('/login', adminController.login);
router.post('/forgot-password', adminController.forgotPassword);
router.post('/resetPassword', adminController.resetPassword);
router.post('/check-in',adminController.checkIn);
router.get('/check-in',adminController.getAllCheckIns);
router.post('/send-acceptance-email', adminController.sendAcceptanceEmail);


module.exports = router;
