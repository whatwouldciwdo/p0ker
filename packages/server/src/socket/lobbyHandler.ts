import { Server, Socket } from 'socket.io';
import { TableManager } from '../engine/TableManager';

export function registerLobbyHandlers(io: Server, socket: Socket): void {
  // ── lobby:list ───────────────────────────────────────────────────────────────
  // Client requests the current list of open tables.
  socket.on('lobby:list', () => {
    try {
      const tableManager = TableManager.getInstance();
      const tables = tableManager.listTables();
      socket.emit('lobby:tables', tables);
    } catch (err) {
      console.error('lobby:list error', err);
      socket.emit('error', 'Failed to fetch lobby list.');
    }
  });
}

/**
 * Broadcast an updated lobby table list to all connected clients.
 * Call this whenever a table is created, modified, or removed.
 */
export function broadcastLobbyUpdate(io: Server): void {
  try {
    const tableManager = TableManager.getInstance();
    const tables = tableManager.listTables();
    io.emit('lobby:tables', tables);
  } catch (err) {
    console.error('broadcastLobbyUpdate error', err);
  }
}
