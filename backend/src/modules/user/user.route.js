const express = require('express');
const router = express.Router();
const UserController = require('./user.controller');
const { checkToken, checkRoleMDW } = require('../../middleware/auJWT.middleware');

router.get('/', checkToken, UserController.getInfo);

router.get('/all', checkRoleMDW, UserController.getAllUser);
router.put('/update-role/:id', checkRoleMDW, UserController.updateUserRole);
router.put('/:id/role', checkRoleMDW, UserController.updateUserRole);
router.get('/get-user', checkRoleMDW, UserController.getUser);
router.post('/update-balance', checkRoleMDW, UserController.updateBalance);
router.get('/search', checkRoleMDW, UserController.searchUser);
router.patch('/:id/toggle-lock', checkRoleMDW, UserController.toggleUserLock);

const AuthController = require('../auth/auth.controller');
router.post('/balance/send-otp', checkRoleMDW, AuthController.sendAdminOTP);
router.post('/balance/verify-otp', checkRoleMDW, AuthController.verifyAdminOTP);
router.put('/balance', checkRoleMDW, UserController.updateBalance);

router.post('/role/send-otp', checkRoleMDW, AuthController.sendRoleOTP);
router.post('/role/verify-otp', checkRoleMDW, AuthController.verifyRoleOTP);

router.put('/:id/level', checkRoleMDW, UserController.updateUserLevel);
router.put('/:id', checkRoleMDW, UserController.updateUser);

module.exports = router;