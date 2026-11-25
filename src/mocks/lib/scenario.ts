import { delay } from 'msw';
import { mockDatabase } from '@/mocks/db/store';
import { scenarios } from '@/mocks/scenarios/presets';

export function isOfflineScenario() {
  return mockDatabase.scenario === 'offline';
}

export async function waitForScenario() {
  const scenario = scenarios[mockDatabase.scenario];
  const latency = scenario.latencyMs + Math.floor(Math.random() * scenario.latencyVarianceMs);

  if (latency > 0) {
    await delay(latency);
  }
}
