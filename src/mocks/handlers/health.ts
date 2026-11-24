import { delay, http, HttpResponse } from 'msw';
import { scenarios } from '@/mocks/scenarios/presets';
import { mockDatabase } from '@/mocks/db/store';
import { HealthResponseSchema } from '@/shared/contracts';

export const healthHandler = http.get('*/api/health', async () => {
  if (mockDatabase.scenario === 'offline') {
    return HttpResponse.error();
  }

  const scenario = scenarios[mockDatabase.scenario];
  const latency = scenario.latencyMs + Math.floor(Math.random() * scenario.latencyVarianceMs);
  await delay(latency);

  return HttpResponse.json(
    HealthResponseSchema.parse({
      status: 'ok',
      timestamp: new Date().toISOString(),
      scenario: mockDatabase.scenario,
      mocks: true,
    }),
  );
});
