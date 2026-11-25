/**
 * Prontidão da camada de API. Com os mocks habilitados, o Service Worker do MSW precisa estar
 * ativo antes da primeira chamada; em vez de bloquear o primeiro render (o que atrasa FCP/LCP),
 * a interface renderiza de imediato e as chamadas HTTP/Socket.IO aguardam esta promessa.
 */
let markReady: () => void = () => undefined;

export const apiReady = new Promise<void>((resolve) => {
  markReady = resolve;
});

export function markApiReady() {
  markReady();
}
