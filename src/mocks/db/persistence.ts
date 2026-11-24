import { z } from 'zod';

const PREFIX = 'junglenft:mocks:';

export function persistenceKey(key: string) {
  return `${PREFIX}${key}`;
}

export function readPersistedState<T>(key: string, schema: z.ZodType<T>): T | undefined {
  if (typeof localStorage === 'undefined') return undefined;

  try {
    const raw = localStorage.getItem(persistenceKey(key));
    if (!raw) return undefined;
    return schema.parse(JSON.parse(raw));
  } catch {
    return undefined;
  }
}

export function writePersistedState<T>(key: string, schema: z.ZodType<T>, value: T) {
  if (typeof localStorage === 'undefined') return;

  try {
    const serialized = JSON.stringify(schema.parse(value));
    if (typeof serialized !== 'string') return;
    localStorage.setItem(persistenceKey(key), serialized);
  } catch {
    // Persistence is best-effort; REST remains the source of truth.
  }
}

export function clearPersistedState(key: string) {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(persistenceKey(key));
}

export function clearAllPersistedState() {
  if (typeof localStorage === 'undefined') return;

  for (const key of Object.keys(localStorage)) {
    if (key.startsWith(PREFIX)) localStorage.removeItem(key);
  }
}
