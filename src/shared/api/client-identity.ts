/** Identidade do cliente enviada à API: token de sessão e identificador de visitante. */
const TOKEN_KEY = 'junglenft:token';
const GUEST_KEY = 'junglenft:guest';

function read(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // armazenamento indisponível: a sessão vale apenas para esta aba.
  }
}

let memoryToken: string | null = null;
const tokenListeners = new Set<() => void>();

/** Permite que a camada de tempo real recrie a conexão quando a sessão muda. */
export function subscribeToken(listener: () => void) {
  tokenListeners.add(listener);
  return () => tokenListeners.delete(listener);
}

export function getToken() {
  return memoryToken ?? read(TOKEN_KEY);
}

export function setToken(token: string | null) {
  memoryToken = token;
  write(TOKEN_KEY, token);
  tokenListeners.forEach((listener) => listener());
}

export function getGuestId() {
  let id = read(GUEST_KEY);
  if (!id) {
    id = `g-${crypto.randomUUID()}`;
    write(GUEST_KEY, id);
  }
  return id;
}
