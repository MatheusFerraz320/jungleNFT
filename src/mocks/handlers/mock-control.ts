import { http, HttpResponse } from 'msw';
import { z } from 'zod';
import { mockDomain } from '@/mocks/db/domain';
import { DomainError } from '@/mocks/db/domain-error';
import { resetMockDatabase } from '@/mocks/db/reset';
import { mockDatabase } from '@/mocks/db/store';
import { isScenarioId } from '@/mocks/scenarios';
import { RealtimeEventSchema } from '@/shared/contracts';
import { addFault } from '../lib/faults';
import { socketHub } from './socket-hub';

const resetRequestSchema = z.object({
  scenario: z.string().default('default'),
});

const faultSchema = z.object({
  method: z.string().min(1),
  path: z.string().min(1),
  status: z.number().int().min(400).max(599).default(500),
  times: z.number().int().min(1).default(1),
});

const nftPatchSchema = z.object({
  priceEth: z.string().optional(),
  availableEditions: z.number().int().min(0).optional(),
});

const invalid = (message: string) =>
  HttpResponse.json({ code: 'VALIDATION_ERROR', message }, { status: 422 });

/** Endpoints de controle do ambiente simulado (reset, cenário, falhas, eventos). */
export const mockControlHandlers = [
  http.post('*/api/mocks/reset', async ({ request }) => {
    const payload = resetRequestSchema.safeParse(await request.json());

    if (!payload.success || !isScenarioId(payload.data.scenario)) {
      return invalid('Cenário de mock inválido.');
    }

    resetMockDatabase(payload.data.scenario);

    return HttpResponse.json({ scenario: mockDatabase.scenario });
  }),

  http.post('*/api/mocks/scenario', async ({ request }) => {
    const payload = resetRequestSchema.safeParse(await request.json());
    if (!payload.success || !isScenarioId(payload.data.scenario)) {
      return invalid('Cenário de mock inválido.');
    }

    mockDatabase.setScenario(payload.data.scenario);
    return HttpResponse.json({ scenario: mockDatabase.scenario });
  }),

  http.post('*/api/mocks/faults', async ({ request }) => {
    const payload = faultSchema.safeParse(await request.json());
    if (!payload.success) return invalid('Falha simulada inválida.');

    addFault({
      method: payload.data.method,
      path: payload.data.path,
      status: payload.data.status,
      remaining: payload.data.times,
    });
    return HttpResponse.json({ registered: true }, { status: 201 });
  }),

  http.post('*/api/mocks/expire-sessions', () => {
    mockDomain.expireSessions();
    return new HttpResponse(null, { status: 204 });
  }),

  http.post('*/api/mocks/socket/disconnect', () => {
    socketHub.disconnectAll();
    return new HttpResponse(null, { status: 204 });
  }),

  http.post('*/api/mocks/socket/emit', async ({ request }) => {
    const payload = RealtimeEventSchema.safeParse(await request.json());
    if (!payload.success) return invalid('Evento de tempo real inválido.');

    socketHub.broadcast(payload.data);
    return new HttpResponse(null, { status: 204 });
  }),

  http.post('*/api/mocks/socket/stale/:nftId', ({ params }) =>
    socketHub.staleNft(String(params.nftId))
      ? new HttpResponse(null, { status: 204 })
      : HttpResponse.json({ code: 'NOT_FOUND', message: 'NFT não encontrado.' }, { status: 404 }),
  ),

  http.post('*/api/mocks/nfts/:id', async ({ request, params }) => {
    const payload = nftPatchSchema.safeParse(await request.json());
    if (!payload.success) return invalid('Alteração de NFT inválida.');

    try {
      return HttpResponse.json(mockDomain.patchNft(String(params.id), payload.data));
    } catch (error) {
      if (error instanceof DomainError) {
        return HttpResponse.json(
          { code: error.code, message: error.message },
          { status: error.status },
        );
      }
      throw error;
    }
  }),
];
