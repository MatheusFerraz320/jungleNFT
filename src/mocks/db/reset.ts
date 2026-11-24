import { clearAllPersistedState } from './persistence';
import { mockDatabase } from './store';

export function resetMockDatabase(scenario = 'default') {
  clearAllPersistedState();
  mockDatabase.setScenario(scenario);
  mockDatabase.reset();
}
