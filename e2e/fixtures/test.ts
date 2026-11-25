import { test as base, expect, type Page } from '@playwright/test';

export const PASSWORD = 'Senha@123';
export const ANA = { email: 'ana@jungle.test', password: PASSWORD, name: 'Ana Souza' };
export const BRUNO = { email: 'bruno@jungle.test', password: PASSWORD, name: 'Bruno Lima' };

type Json = Record<string, unknown>;

/** Controles do ambiente simulado (MSW), sempre pela rede, como a aplicação os enxerga. */
export function mocks(page: Page) {
  const post = (path: string, body?: Json) =>
    page.evaluate(
      async ([target, payload]) => {
        const response = await fetch(`/api/mocks${target as string}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload ? JSON.stringify(payload) : undefined,
        });
        return response.status;
      },
      [path, body] as const,
    );

  return {
    reset: (scenario = 'default') => post('/reset', { scenario }),
    scenario: (scenario: string) => post('/scenario', { scenario }),
    fault: (method: string, path: string, status = 500, times = 1) =>
      post('/faults', { method, path, status, times }),
    expireSessions: () => post('/expire-sessions'),
    patchNft: (id: string, patch: { priceEth?: string; availableEditions?: number }) =>
      post(`/nfts/${id}`, patch),
    disconnectSocket: () => post('/socket/disconnect'),
    emit: (event: Json) => post('/socket/emit', event),
    staleNft: (id: string) => post(`/socket/stale/${id}`),
  };
}

export type Mocks = ReturnType<typeof mocks>;

/** Login direto pela API (rápido); o fluxo pela interface é coberto em auth.spec.ts. */
async function loginViaApi(page: Page, credentials: { email: string; password: string }) {
  await page.evaluate(async (body) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = (await response.json()) as { token: string };
    localStorage.setItem('junglenft:token', data.token);
  }, credentials);
}

interface Fixtures {
  /** Aplicação aberta na Início, com o estado dos mocks restaurado (cenário `default`). */
  app: Page;
  mock: Mocks;
  loginAs: (user: { email: string; password: string }) => Promise<void>;
  mobile: boolean;
}

export const test = base.extend<Fixtures>({
  // Cada teste roda em um contexto novo; o init script limpa o armazenamento apenas na primeira
  // carga da aba (reloads preservam sessão, carrinho e mocks).
  page: async ({ page }, use) => {
    await page.addInitScript(() => {
      if (!sessionStorage.getItem('e2e:initialized')) {
        localStorage.clear();
        sessionStorage.clear();
        sessionStorage.setItem('e2e:initialized', '1');
      }
    });
    await use(page);
  },

  app: async ({ page }, use) => {
    await page.goto('/');
    await expect(page.getByTestId('socket-status')).toContainText('conectado');
    await use(page);
  },

  mock: async ({ page }, use) => use(mocks(page)),

  loginAs: async ({ page }, use) =>
    use(async (user) => {
      await loginViaApi(page, user);
      await page.reload();
      await expect(page.getByTestId('socket-status')).toContainText('conectado');
    }),

  mobile: async ({ page }, use) => use((page.viewportSize()?.width ?? 1440) < 640),
});

export { expect };
export type { Page };
