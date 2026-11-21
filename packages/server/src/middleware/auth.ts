import { Request, Response, NextFunction } from 'express';
import { Socket } from 'socket.io';
import { parse as parseCookie } from 'cookie';
import pool from '../db/postgres';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: { id: string; username: string; chips: number };
    }
  }
}

// Extend Socket.io data
declare module 'socket.io' {
  interface SocketData {
    userId: string;
    username: string;
    tableId?: string;
  }
}

async function resolveSession(token: string) {
  const result = await pool.query(
    `SELECT u.id, u.username, u.chips
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token = $1 AND s.expires_at > NOW()`,
    [token]
  );
  return result.rows[0] ?? null;
}

export async function cookieAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token = req.cookies?.sid;
  if (!token) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const user = await resolveSession(token);
  if (!user) {
    res.status(401).json({ error: 'Session expired or invalid' });
    return;
  }

  req.user = user;
  next();
}

export async function socketAuthMiddleware(
  socket: Socket,
  next: (err?: Error) => void
): Promise<void> {
  try {
    const cookieHeader = socket.handshake.headers.cookie ?? '';
    const cookies = parseCookie(cookieHeader);
    const token = cookies['sid'];

    if (!token) {
      next(new Error('Not authenticated'));
      return;
    }

    const user = await resolveSession(token);
    if (!user) {
      next(new Error('Session expired or invalid'));
      return;
    }

    socket.data.userId = user.id;
    socket.data.username = user.username;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
}
