const express = require('express');
const router = express.Router();
const GameController = require('./game.controller');
const upload = require('../../configs/upload.config');
const { checkRoleMDW, optionalAuth } = require('../../middleware/auJWT.middleware');

router.get('/', optionalAuth, GameController.getAllGames);
router.get('/by-type', GameController.getGamesByType);
router.get('/top-up', GameController.getTopUpGames);
router.get('/game/:gamecode', optionalAuth, GameController.getGameByGameCode);

router.post('/sync-nguona', checkRoleMDW, GameController.syncNguonA);
router.post('/upload', checkRoleMDW, upload.secureUpload("thumbnail"), GameController.createGame);
router.delete('/delete', checkRoleMDW, GameController.deleteGame);
router.patch('/status', checkRoleMDW, GameController.updateStatus);
router.patch('/update', checkRoleMDW, upload.secureUpload("thumbnail"), GameController.updateGame);

module.exports = router;