import type { Socket } from 'socket.io-client';
import { resolveSocketUrl } from '@/shared/config/env';

/**
 * Engine.IO captures the global WebSocket constructor when its module loads.
 * Import it dynamically, after MSW has installed its WebSocket interceptor.
 */
export async function createAppSocket(): Promise<Socket> {
  const { io } = await import('socket.io-client');

  return io(resolveSocketUrl(), {
    autoConnect: false,
    transports: ['websocket'],
    path: '/socket.io',
    reconnection: true,
    reconnectionDelay: 500,
    reconnectionDelayMax: 3_000,
    timeout: 5_000,
  });
}
