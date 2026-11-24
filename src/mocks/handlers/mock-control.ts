import { http, HttpResponse } from 'msw';
import { z } from 'zod';
import { resetMockDatabase } from '@/mocks/db/reset';
import { mockDatabase } from '@/mocks/db/store';
import { isScenarioId } from '@/mocks/scenarios';

const resetRequestSchema = z.object({
  scenario: z.string().default('default'),
});

export const mockControlHandlers = [
  http.post('*/api/mocks/reset', async ({ request }) => {
    const payload = resetRequestSchema.safeParse(await request.json());

    if (!payload.success || !isScenarioId(payload.data.scenario)) {
      return HttpResponse.json(
        { code: 'VALIDATION_ERROR', message: 'Cenário de mock inválido.' },
        { status: 422 },
      );
    }

    resetMockDatabase(payload.data.scenario);

    return HttpResponse.json({ scenario: mockDatabase.scenario });
  }),
];
