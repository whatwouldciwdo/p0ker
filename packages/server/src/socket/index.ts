import { Server } from 'socket.io';
import { socketAuthMiddleware } from '../middleware/auth';
import { registerTableHandlers } from './tableHandler';
import { registerLobbyHandlers } from './lobbyHandler';
import { TableManager } from '../engine/TableManager';

export function registerSocketHandlers(io: Server) {
  TableManager.getInstance().setIO(io);
  io.use(socketAuthMiddleware);

  io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.data.username} (${socket.id})`);
    registerTableHandlers(io, socket);
    registerLobbyHandlers(io, socket);

    socket.on('disconnect', () => {
      console.log(`Player disconnected: ${socket.data.username}`);
    });
  });
}
