import { http } from 'msw';
import { mockDomain } from '@/mocks/db/domain';
import { param, respond } from '../lib/respond';

export const accountHandlers = [
  http.get('*/api/profile', (info) =>
    respond(info, ({ token }) => ({ body: mockDomain.profile(token) })),
  ),
  http.patch('*/api/profile', (info) =>
    respond(info, async ({ token, json }) => ({
      body: mockDomain.updateProfile(token, await json()),
    })),
  ),
  http.post('*/api/profile/password', (info) =>
    respond(info, async ({ token, json }) => {
      await mockDomain.changePassword(token, await json());
      return { status: 204 };
    }),
  ),
  http.get('*/api/wallets', (info) =>
    respond(info, ({ token }) => ({ body: mockDomain.listWallets(token) })),
  ),
  http.post('*/api/wallets', (info) =>
    respond(info, async ({ token, json }) => ({
      status: 201,
      body: mockDomain.createWallet(token, await json()),
    })),
  ),
  http.patch('*/api/wallets/:id', (info) =>
    respond(info, async ({ token, params, json }) => ({
      body: mockDomain.updateWallet(token, param(params.id), await json()),
    })),
  ),
];
