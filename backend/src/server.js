require("dotenv").config();
const app = require('./app');
const http = require("http");
const { Server } = require("socket.io");
const { initSocket } = require("./sockets/websocket");

const PORT = process.env.PORT || 5000;
const SOCKET_PORT = process.env.SOCKET_PORT || 5001;

const server = http.createServer(app);

const socketServer = http.createServer();

const getAllowedOrigins = () => {
  const originsEnv = process.env.SOCKET_ORIGINS;
  if (originsEnv) {
    const origins = originsEnv.split(',').map(o => o.trim()).filter(Boolean);
    return origins;
  }
  if (process.env.NODE_ENV === 'production') {
    if (process.env.FRONTEND_URL) {
      return [process.env.FRONTEND_URL];
    }
    console.warn("⚠️ Production mode nhưng không có SOCKET_ORIGINS hoặc FRONTEND_URL!");
  }
  return true;
};

const allowedOrigins = getAllowedOrigins();

const io = new Server(socketServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: false
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

initSocket(io);

server.listen(PORT, () => {
  console.log(`🚀 API Server running on port ${PORT}`);
});

socketServer.listen(SOCKET_PORT, () => {
  console.log(`🔌 Socket.IO Server running on port ${SOCKET_PORT}`);
});

const { initCronJobs } = require('./services/cron.service');
initCronJobs();