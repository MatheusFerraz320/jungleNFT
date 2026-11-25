import { clearFaults } from '@/mocks/lib/faults';
import { resetScenarioRandom } from '@/mocks/lib/scenario';
import { mockDomain } from './domain';
import { clearAllPersistedState } from './persistence';
import { mockDatabase } from './store';

export function resetMockDatabase(scenario = 'default') {
  clearAllPersistedState();
  clearFaults();
  resetScenarioRandom();
  mockDatabase.setScenario(scenario);
  mockDatabase.reset();
  mockDomain.reset();
}
