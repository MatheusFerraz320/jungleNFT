import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { resetMockDatabase } from '@/mocks/db/reset';
import { FIXTURE_PASSWORD } from '@/mocks/db/domain';
import { server } from '@/mocks/server';

const BASE = 'http://localhost/api';

async function call(
  path: string,
  init: RequestInit & { token?: string; guest?: string; key?: string } = {},
) {
  const { token, guest, key, ...rest } = init;
  const headers = new Headers(rest.headers);
  if (rest.body) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (guest) headers.set('X-Guest-Id', guest);
  if (key) headers.set('Idempotency-Key', key);
  const response = await fetch(`${BASE}${path}`, { ...rest, headers });
  const text = await response.text();
  return {
    status: response.status, // eslint-disable-next-line @typescript-eslint/no-explicit-any -- corpo JSON arbitrário nos asserts
    body: text ? (JSON.parse(text) as Record<string, any>) : null,
  };
}

const post = (path: string, body: unknown, init: Parameters<typeof call>[1] = {}) =>
  call(path, { method: 'POST', body: JSON.stringify(body), ...init });

async function loginAna() {
  const { body } = await post('/auth/login', {
    email: 'ana@jungle.test',
    password: FIXTURE_PASSWORD,
  });
  return body?.token as string;
}

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
beforeEach(() => resetMockDatabase('default'));

describe('REST simulado (MSW)', () => {
  it('exige autenticação nos recursos privados', async () => {
    expect((await call('/favorites')).status).toBe(401);
    expect((await call('/profile', { token: 'invalido' })).body?.code).toBe('SESSION_EXPIRED');
  });

  it('faz login, consulta a sessão e encerra', async () => {
    const token = await loginAna();
    expect((await call('/auth/session', { token })).body?.user.email).toBe('ana@jungle.test');
    expect((await post('/auth/logout', {}, { token })).status).toBe(204);
    expect((await call('/auth/session', { token })).status).toBe(401);
  });

  it('devolve erro de validação com campos no envelope padrão', async () => {
    const { status, body } = await post('/auth/register', { name: 'A', email: 'x', password: '1' });
    expect(status).toBe(422);
    expect(body?.fieldErrors.length).toBeGreaterThan(0);
  });

  it('cria pedido de forma idempotente e simula o timeout com recuperação', async () => {
    await post('/mocks/scenario', { scenario: 'order-timeout' });
    const token = await loginAna();
    await post('/cart/items', { nftId: 'nft-001', quantity: 1 }, { token });
    const cart = (await call('/cart', { token })).body as { id: string };
    const quote = (await post('/quotes', { cartId: cart.id, network: 'ethereum' }, { token }))
      .body as { quoteId: string };
    const order = {
      quoteId: quote.quoteId,
      cartId: cart.id,
      walletId: 'wallet-ana-primary',
      network: 'ethereum',
      collector: { name: 'Ana', email: 'ana@jungle.test' },
      acceptTerms: true,
    };

    const lost = await post('/orders', order, { token, key: 'abc' });
    expect(lost.status).toBe(504);

    const retry = await post('/orders', order, { token, key: 'abc' });
    expect(retry.status).toBe(200);
    expect((await call('/orders', { token })).body?.orders).toHaveLength(1);

    const conflict = await post('/orders', { ...order, network: 'polygon' }, { token, key: 'abc' });
    expect(conflict.status).toBe(409);
    expect(conflict.body?.code).toBe('IDEMPOTENCY_CONFLICT');
  });

  it('injeta falhas determinísticas e depois volta ao normal', async () => {
    const token = await loginAna();
    await post('/mocks/faults', { method: 'PUT', path: '/favorites', status: 500, times: 1 });

    expect((await call('/favorites/nft-001', { method: 'PUT', token })).status).toBe(500);
    expect((await call('/favorites/nft-001', { method: 'PUT', token })).status).toBe(200);
  });

  it('expira todas as sessões sob demanda', async () => {
    const token = await loginAna();
    await post('/mocks/expire-sessions', {});
    expect((await call('/favorites', { token })).body?.code).toBe('SESSION_EXPIRED');
  });
});
