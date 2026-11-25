import { useSyncExternalStore } from 'react';

/**
 * Sessão local (etapa visual). Será substituída pelos contratos REST `/auth/*` (login, cadastro,
 * sessão, logout); a interface só depende de `useSession()`.
 */
export interface LocalSession {
  name: string;
  email: string;
}

const STORAGE_KEY = 'kurio.session.v1';
const listeners = new Set<() => void>();
let state: LocalSession | null = read();

function read(): LocalSession | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LocalSession) : null;
  } catch {
    return null;
  }
}

function commit(next: LocalSession | null) {
  state = next;
  try {
    if (next) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // sem persistência.
  }
  listeners.forEach((listener) => listener());
}

export function startSession(session: LocalSession) {
  commit(session);
}

export function endSession() {
  commit(null);
}

export function useSession() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => state,
    () => state,
  );
}
