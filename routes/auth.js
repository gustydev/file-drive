const authController = require('../controllers/authController');
const express = require('express');
const router = express.Router();
const passport = require('passport');

router.get('/signup', authController.signupGet);
router.post('/signup', authController.signupPost);

router.get('/login', authController.loginGet);
router.post('/login', authController.loginPost);

router.get('/logout', authController.logoutGet);

module.exports = router;