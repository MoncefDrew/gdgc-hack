const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.post('/signup', adminController.signup);
router.post('/login', adminController.login);
router.post('/forgot-password', adminController.forgotPassword);
router.post('/resetPassword', adminController.resetPassword);
router.get('/teams', adminController.getTeams);
router.get('/participants', adminController.getParticipants);


module.exports = router;
