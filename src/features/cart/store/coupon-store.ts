import { useSyncExternalStore } from 'react';

/** Cupom escolhido pelo usuário (validado pela API na cotação). Vale durante a sessão da aba. */
const KEY = 'junglenft:coupon';
const listeners = new Set<() => void>();

function read() {
  try {
    return window.sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

let current = read();

export function setCoupon(code: string | null) {
  current = code;
  try {
    if (code) window.sessionStorage.setItem(KEY, code);
    else window.sessionStorage.removeItem(KEY);
  } catch {
    // sem persistência: vale só em memória.
  }
  listeners.forEach((listener) => listener());
}

export function useCoupon() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => current,
    () => null,
  );
}
