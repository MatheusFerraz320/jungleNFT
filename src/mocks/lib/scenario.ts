import { delay } from 'msw';
import { mockDatabase } from '@/mocks/db/store';
import { scenarios } from '@/mocks/scenarios/presets';

/** PRNG semeado (mulberry32): a latência variável é reproduzível entre execuções. */
let randomState = 0x9e3779b9;

export function resetScenarioRandom() {
  randomState = 0x9e3779b9;
}

function nextRandom() {
  randomState = (randomState + 0x6d2b79f5) | 0;
  let t = Math.imul(randomState ^ (randomState >>> 15), 1 | randomState);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function isOfflineScenario() {
  return mockDatabase.scenario === 'offline';
}

export async function waitForScenario() {
  const scenario = scenarios[mockDatabase.scenario];
  const latency = scenario.latencyMs + Math.floor(nextRandom() * scenario.latencyVarianceMs);

  if (latency > 0) {
    await delay(latency);
  }
}
