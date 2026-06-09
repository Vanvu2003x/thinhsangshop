const express = require('express');
const router = express.Router();
const AuthController = require('./auth.controller');
const { checkToken, checkRoleMDW } = require('../../middleware/auJWT.middleware');
const { authLimiter, otpLimiter } = require('../../middleware/rateLimit.middleware');

router.post('/register', otpLimiter, AuthController.register);
router.post('/login', authLimiter, AuthController.login);
router.post('/check-mail', otpLimiter, AuthController.checkmail);
router.post('/checkmail', otpLimiter, AuthController.checkmail);
router.post('/forgot-password', otpLimiter, AuthController.forgotPasswordSendOTP);
router.post('/reset-password', authLimiter, AuthController.resetPassword);
router.post('/logout', AuthController.logout);

router.post('/checkRole', checkToken, AuthController.getRole);

module.exports = router;