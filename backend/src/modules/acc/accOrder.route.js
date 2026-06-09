const express = require('express');
const router = express.Router();
const AccOrderController = require('./accOrder.controller');
const { checkToken, checkRoleMDW } = require('../../middleware/auJWT.middleware');
const { orderLimiter } = require('../../middleware/rateLimit.middleware');

router.post('/', orderLimiter, checkToken, AccOrderController.createOrder);
router.get('/my-orders', checkToken, AccOrderController.getMyOrders);
router.get('/detail/:id', checkToken, AccOrderController.getOrderById);

router.get('/', checkRoleMDW, AccOrderController.getAllOrders);
router.get('/user/:user_id', checkRoleMDW, AccOrderController.getOrdersByUserId);
router.get('/acc/:acc_id', checkRoleMDW, AccOrderController.getOrdersByAccId);
router.put('/:id/status', checkRoleMDW, AccOrderController.updateStatus);
router.put('/:id/cancel', checkRoleMDW, AccOrderController.cancelOrder);
router.put('/:id/send', checkRoleMDW, AccOrderController.sendAcc);

module.exports = router;