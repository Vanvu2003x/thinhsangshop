const express = require('express');
const router = express.Router();
const CallbackController = require('./callback.controller');
const { callbackLimiter } = require('../../middleware/rateLimit.middleware');

router.post('/morishop', callbackLimiter, CallbackController.morishopCallback);
router.get('/napgame247', callbackLimiter, CallbackController.napgameCallback);
router.post('/napgame247', callbackLimiter, CallbackController.napgameCallback);

module.exports = router;