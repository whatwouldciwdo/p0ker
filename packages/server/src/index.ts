import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import authRoutes from './api/auth.routes';
import lobbyRoutes from './api/lobby.routes';
import { registerSocketHandlers } from './socket/index';

const app = express();
const httpServer = createServer(app);

const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow all origins (reflection) with credentials support for localhost & cloudflared
    callback(null, origin || true);
  },
  credentials: true,
});

app.use(corsMiddleware);

const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      callback(null, origin || true);
    },
    credentials: true,
  },
});

app.use(express.json());
app.use(cookieParser(process.env.COOKIE_SECRET || 'p0ker_dev_secret_key_123'));

app.use('/api/auth', authRoutes);
app.use('/api/lobby', lobbyRoutes);

registerSocketHandlers(io);

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`[Server] Texas Hold'em Poker server running on port ${PORT}`);
});
