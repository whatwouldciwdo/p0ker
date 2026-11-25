import { io, Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents } from '@p0ker/shared';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: TypedSocket | null = null;

export function getSocket(): TypedSocket {
  if (!socket) {
    const wsUrl = import.meta.env.VITE_WS_URL || window.location.origin;
    socket = io(wsUrl, {
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      transports: ['polling', 'websocket'],
    });
  } else if (!socket.connected && !socket.active) {
    socket.connect();
  }
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
