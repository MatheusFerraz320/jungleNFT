import { http } from 'msw';
import { mockDomain } from '@/mocks/db/domain';
import { respond } from '../lib/respond';

export const authHandlers = [
  http.post('*/api/auth/register', (info) =>
    respond(info, async ({ json }) => ({
      status: 201,
      body: await mockDomain.register(await json()),
    })),
  ),
  http.post('*/api/auth/login', (info) =>
    respond(info, async ({ json }) => ({ body: await mockDomain.login(await json()) })),
  ),
  http.get('*/api/auth/session', (info) =>
    respond(info, ({ token }) => ({ body: mockDomain.session(token) })),
  ),
  http.post('*/api/auth/logout', (info) =>
    respond(info, ({ token }) => {
      mockDomain.logout(token);
      return { status: 204 };
    }),
  ),
];
