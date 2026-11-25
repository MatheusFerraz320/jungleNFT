import { http } from 'msw';
import { mockDomain } from '@/mocks/db/domain';
import { param, respond } from '../lib/respond';

export const favoriteHandlers = [
  http.get('*/api/favorites', (info) =>
    respond(info, ({ token }) => ({ body: mockDomain.listFavorites(token) })),
  ),
  http.put('*/api/favorites/:nftId', (info) =>
    respond(info, ({ token, params }) => ({
      body: mockDomain.setFavorite(token, param(params.nftId), true),
    })),
  ),
  http.delete('*/api/favorites/:nftId', (info) =>
    respond(info, ({ token, params }) => ({
      body: mockDomain.setFavorite(token, param(params.nftId), false),
    })),
  ),
];
