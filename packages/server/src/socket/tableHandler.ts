import { Server, Socket } from 'socket.io';
import { PlayerAction } from '@p0ker/shared';
import { TableManager } from '../engine/TableManager';
import pool from '../db/postgres';

/**
 * Broadcast the sanitized game state to every socket in a table room.
 * Each player receives only the information they are allowed to see
 * (e.g. hole cards of other players are hidden).
 */
export async function broadcastToTable(
  io: Server,
  tableId: string,
): Promise<void> {
  const tableManager = TableManager.getInstance();
  const table = tableManager.getTable(tableId);
  if (!table) return;

  const room = io.sockets.adapter.rooms.get(tableId);
  if (!room) return;

  for (const socketId of room) {
    const socketObj = io.sockets.sockets.get(socketId);
    if (!socketObj) continue;
    const targetUserId = socketObj.data?.userId || socketId;
    const state = table.getStateForPlayer(targetUserId);
    socketObj.emit('game:state', state);
    socketObj.emit('table:state', state);
  }
}

export function registerTableHandlers(io: Server, socket: Socket): void {
  const { userId, username } = socket.data as {
    userId: string;
    username: string;
  };

  // ── table:join ──────────────────────────────────────────────────────────────
  socket.on(
    'table:join',
    async (arg1: any, arg2?: any) => {
      try {
        let tableId = typeof arg1 === 'object' ? arg1.tableId : arg1;
        let buyIn = typeof arg1 === 'object' ? arg1.buyIn : arg2;
        buyIn = Number(buyIn);

        const tableManager = TableManager.getInstance();
        const table = tableManager.getTable(tableId);

        if (!table) {
          socket.emit('error', 'Table not found.');
          return;
        }

        if (buyIn < table.minBuyIn) {
          socket.emit(
            'error',
            `Buy-in must be at least ${table.minBuyIn} chips.`,
          );
          return;
        }

        // Deduct chips from DB (atomic check-and-update)
        const result = await pool.query<{ chips: number }>(
          `UPDATE users
              SET chips = chips - $1
            WHERE id = $2 AND chips >= $1
            RETURNING chips`,
          [buyIn, userId],
        );

        if (result.rowCount === 0) {
          socket.emit('error', 'Insufficient chips.');
          return;
        }

        const joinResult = table.addPlayer(userId, username, buyIn);
        if (!joinResult.success) {
          // Refund chips
          await pool.query(
            `UPDATE users SET chips = chips + $1 WHERE id = $2`,
            [buyIn, userId],
          );
          socket.emit('error', joinResult.error || 'Failed to join table.');
          return;
        }

        socket.join(tableId);
        // Store the tableId so we can reference it on disconnect / leave
        socket.data.tableId = tableId;

        socket.emit('toast', `Joined table "${table.name}"`, 'success');
        await broadcastToTable(io, tableId);
      } catch (err) {
        console.error('table:join error', err);
        socket.emit('error', 'Failed to join table.');
      }
    },
  );

  // ── table:leave ─────────────────────────────────────────────────────────────
  socket.on('table:leave', async () => {
    try {
      const tableId: string | undefined = socket.data.tableId;
      if (!tableId) return;

      const tableManager = TableManager.getInstance();
      const table = tableManager.getTable(tableId);

      if (table) {
        const remainingChips = table.removePlayer(userId);

        if (remainingChips > 0) {
          await pool.query(
            `UPDATE users SET chips = chips + $1 WHERE id = $2`,
            [remainingChips, userId],
          );
        }

        socket.leave(tableId);
        socket.data.tableId = undefined;

        socket.emit('toast', 'You have left the table.', 'info');
        await broadcastToTable(io, tableId);
      }
    } catch (err) {
      console.error('table:leave error', err);
      socket.emit('error', 'Failed to leave table.');
    }
  });

  // ── table:action / game:action ─────────────────────────────────────────────
  const handlePlayerAction = async (arg1: any, arg2?: any) => {
    try {
      const action: PlayerAction = typeof arg1 === 'object' ? arg1.action : arg1;
      const amount: number | undefined = typeof arg1 === 'object' ? arg1.amount : arg2;

      const tableId: string | undefined = socket.data.tableId;
      if (!tableId) {
        socket.emit('error', 'You are not at a table.');
        return;
      }

      const tableManager = TableManager.getInstance();
      const table = tableManager.getTable(tableId);

      if (!table) {
        socket.emit('error', 'Table not found.');
        return;
      }

      table.handleAction(userId, action, amount);
      await broadcastToTable(io, tableId);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Invalid action.';
      socket.emit('error', message);
    }
  };

  socket.on('table:action', handlePlayerAction);
  socket.on('game:action', handlePlayerAction);

  // ── table:addBot ────────────────────────────────────────────────────────────
  socket.on('table:addBot', async () => {
    try {
      const tableId: string | undefined = socket.data.tableId;
      if (!tableId) return;

      const tableManager = TableManager.getInstance();
      const table = tableManager.getTable(tableId);
      if (!table) return;

      const res = table.addBot();
      if (!res.success) {
        socket.emit('error', res.error || 'Gagal menambahkan bot');
        return;
      }

      await broadcastToTable(io, tableId);
    } catch (err) {
      console.error('table:addBot error:', err);
    }
  });

  // ── table:removeBot ─────────────────────────────────────────────────────────
  socket.on('table:removeBot', async (data?: { botId?: string }) => {
    try {
      const tableId: string | undefined = socket.data.tableId;
      if (!tableId) return;

      const tableManager = TableManager.getInstance();
      const table = tableManager.getTable(tableId);
      if (!table) return;

      table.removeBot(data?.botId);
      await broadcastToTable(io, tableId);
    } catch (err) {
      console.error('table:removeBot error:', err);
    }
  });

  // ── table:chat ──────────────────────────────────────────────────────────────
  socket.on('table:chat', (message: string) => {
    const tableId: string | undefined = socket.data.tableId;
    if (!tableId) return;

    // Sanitize – strip HTML, limit length
    const safe = String(message).replace(/<[^>]*>/g, '').slice(0, 200);
    if (!safe.trim()) return;

    io.to(tableId).emit('chat:message', {
      userId,
      username,
      message: safe,
      timestamp: Date.now(),
    });
  });

  // ── disconnect ──────────────────────────────────────────────────────────────
  socket.on('disconnect', async () => {
    try {
      const tableId: string | undefined = socket.data.tableId;
      if (!tableId) return;

      const tableManager = TableManager.getInstance();
      const table = tableManager.getTable(tableId);

      if (table) {
        // Mark the player as disconnected; remaining chips are returned
        const remainingChips = table.removePlayer(userId);

        if (remainingChips > 0) {
          await pool.query(
            `UPDATE users SET chips = chips + $1 WHERE id = $2`,
            [remainingChips, userId],
          );
        }

        await broadcastToTable(io, tableId);
      }
    } catch (err) {
      console.error('disconnect cleanup error', err);
    }
  });
}
