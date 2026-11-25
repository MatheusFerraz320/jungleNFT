import { toSocketIo } from '@mswjs/socket.io-binding';
import { ws } from 'msw';
import { z } from 'zod';
import { mockDatabase } from '@/mocks/db/store';
import { RealtimeReadyEventSchema } from '@/shared/contracts';
import { socketHub } from './socket-hub';

const subscribePayloadSchema = z.object({
  sessionId: z.string().nullable().optional(),
  token: z.string().nullable().optional(),
});

function createReadyEvent(sessionId: string | null) {
  return RealtimeReadyEventSchema.parse({
    type: 'scene.ready',
    meta: {
      eventId: crypto.randomUUID(),
      resourceType: 'scene',
      resourceId: 'marketplace',
      version: 1,
      sessionId,
      occurredAt: new Date().toISOString(),
    },
    payload: {
      scenario: mockDatabase.scenario,
      serverVersion: 1,
    },
  });
}

function socketMatcher() {
  // MSW strips Socket.IO's default `/socket.io/` prefix before matching.
  return /\/$/;
}

export const socketHandler = ws
  .link(socketMatcher())
  .addEventListener('connection', (connection) => {
    const io = toSocketIo(connection);
    const id = crypto.randomUUID();

    socketHub.register({
      id,
      userId: null,
      sessionId: null,
      emit: (event, payload) => io.client.emit(event, payload),
      close: () => connection.client.close(),
    });

    // Assina a "cena" do marketplace; o token (opcional) liga a conexão ao usuário para eventos
    // privados como `order.updated`.
    io.client.on('scene:subscribe', (_event, rawPayload) => {
      const payload = subscribePayloadSchema.safeParse(rawPayload);
      const token = payload.success ? (payload.data.token ?? null) : null;

      socketHub.authenticate(id, token);
      io.client.emit('scene:ready', createReadyEvent(token));
    });

    connection.client.addEventListener('close', () => socketHub.unregister(id));
  });
