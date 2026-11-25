import { http, HttpResponse } from 'msw';
import { mockDatabase } from '@/mocks/db/store';
import { HealthResponseSchema } from '@/shared/contracts';
import { isOfflineScenario, waitForScenario } from '../lib/scenario';

export const healthHandler = http.get('*/api/health', async () => {
  if (isOfflineScenario()) return HttpResponse.error();
  await waitForScenario();

  return HttpResponse.json(
    HealthResponseSchema.parse({
      status: 'ok',
      timestamp: new Date().toISOString(),
      scenario: mockDatabase.scenario,
      mocks: true,
    }),
  );
});
