import { toSocketIo } from '@mswjs/socket.io-binding';
import { ws } from 'msw';
import { z } from 'zod';
import { mockDatabase } from '@/mocks/db/store';
import { RealtimeReadyEventSchema } from '@/shared/contracts';

const subscribePayloadSchema = z.object({
  sessionId: z.string().nullable().optional(),
});

function createReadyEvent() {
  return RealtimeReadyEventSchema.parse({
    type: 'scene.ready',
    meta: {
      eventId: crypto.randomUUID(),
      resourceType: 'scene',
      resourceId: 'marketplace',
      version: 1,
      sessionId: null,
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

    io.client.on('scene:subscribe', (_event, rawPayload) => {
      const payload = subscribePayloadSchema.safeParse(rawPayload);
      const event = createReadyEvent();

      if (payload.success && payload.data.sessionId) {
        event.meta.sessionId = payload.data.sessionId;
      }

      io.client.emit('scene:ready', event);
    });
  });
