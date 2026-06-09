const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const cookieParser = require('cookie-parser');

const paymentRoutes = require('./modules/payment/payment.route.js');
const authroute = require('./modules/auth/auth.route.js');
const gamesRoute = require('./modules/game/game.route.js');
const topup_wallet_logsRoute = require("./modules/walletLog/walletLog.route.js");
const toup_packageRoute = require("./modules/package/package.route.js");
const orderRoute = require("./modules/order/order.route.js");
const webhook = require('./routes/webhooks.route.js');
const userRoute = require("./modules/user/user.route.js")
const accRoute = require("./modules/acc/acc.route.js")
const accOrdersRoute = require('./modules/acc/accOrder.route.js')
const app = express();

app.set('trust proxy', 'loopback, linklocal, uniquelocal');

const getAllowedOrigins = () => {
  const originsEnv = process.env.CORS_ORIGINS;
  if (originsEnv) {
    return originsEnv.split(',').map(o => o.trim());
  }

  return [
    "http://localhost:3000",
    "https://pompomnapgame.com",
    "https://www.pompomnapgame.com",
    "http://pompomnapgame.com",
    "http://www.pompomnapgame.com"
  ];
};

const corsOptions = {
  origin: getAllowedOrigins(),
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true
};

app.use(cors(corsOptions));

app.options('*', cors(corsOptions));

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.use(cookieParser());

app.use(express.json());

const securityBlocker = require('./middleware/securityBlocker.middleware');
app.use(securityBlocker);

const { generalLimiter } = require('./middleware/rateLimit.middleware');
app.use('/api', (req, res, next) => {
  if (req.method === 'OPTIONS') return next();
  generalLimiter(req, res, next);
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/order', orderRoute);
app.use('/api/toup-wallet-log', topup_wallet_logsRoute);
app.use('/api/games', gamesRoute);
app.use('/api/payment', paymentRoutes);
app.use('/api/statistics', require('./modules/statistics/statistics.route.js'));

app.use('/api/users', authroute);
app.use('/api/users', userRoute);

app.use('/api/user', userRoute);
app.use('/api/user', authroute);

app.use('/api/webhook', webhook);
app.use('/api/toup-package', toup_packageRoute);
app.use('/api/acc', accRoute);
app.use('/api/accOrder', accOrdersRoute);
app.use('/api/callback', require('./modules/callback/callback.route.js'));
app.use('/api/nguona', require('./modules/nguona/nguona.route.js'));

const errorMiddleware = require('./middleware/error.middleware');
app.use(errorMiddleware);

module.exports = app;