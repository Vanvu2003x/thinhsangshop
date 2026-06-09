const express = require('express');
const router = express.Router();
const WalletLogController = require('./walletLog.controller');
const { checkToken } = require('../../middleware/auJWT.middleware');

router.get('/getTongtien', WalletLogController.getTongtien);
router.get('/total-amount', WalletLogController.getTongTienTrongKhoang);
router.get('/', WalletLogController.getWalletLog);
router.get('/pending', WalletLogController.getPendingLogs);
router.get('/logs', WalletLogController.getWalletLog);
router.get('/logs-pending', WalletLogController.getWalletLogStatusDone);
router.get('/stats', WalletLogController.getTongSoTienDaNap);
router.post('/manual-charge', WalletLogController.manualChargeBalance);
router.patch('/update', WalletLogController.manualChargeBalance);
router.post('/cancel', checkToken, WalletLogController.cancelWalletLog);
router.get('/user-logs', checkToken, WalletLogController.getLogsByUser);

module.exports = router;