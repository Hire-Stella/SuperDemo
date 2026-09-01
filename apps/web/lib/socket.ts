'use client';

import { io, type Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@superdemo/contracts';
import { getAccessToken } from './api';

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: AppSocket | null = null;

/**
 * One socket per tab, shared by every component.
 *
 * Auth rides the handshake, so the server can reject before the socket joins any
 * room. On reconnect the token is re-read rather than captured once, because an
 * access token expires every 15 minutes and a stale one would reconnect-loop.
 */
export function getSocket(): AppSocket {
  if (socket) return socket;

  const url = process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:3101';

  socket = io(url, {
    transports: ['websocket', 'polling'],
    withCredentials: true,
    autoConnect: false,
    reconnection: true,
    reconnectionDelay: 500,
    reconnectionDelayMax: 5000,
    auth: (cb) => cb({ token: getAccessToken() ?? '' }),
  }) as AppSocket;

  return socket;
}

export function connectSocket(): AppSocket {
  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}
