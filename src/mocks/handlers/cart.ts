import { http } from 'msw';
import { mockDomain } from '@/mocks/db/domain';
import { param, respond } from '../lib/respond';

export const cartHandlers = [
  http.get('*/api/cart', (info) =>
    respond(info, ({ token, guestId }) => ({ body: mockDomain.getCart(token, guestId) })),
  ),
  http.post('*/api/cart/items', (info) =>
    respond(info, async ({ token, guestId, json }) => ({
      status: 201,
      body: mockDomain.addCartItem(token, guestId, await json()),
    })),
  ),
  http.patch('*/api/cart/items/:itemId', (info) =>
    respond(info, async ({ token, guestId, params, json }) => ({
      body: mockDomain.updateCartItem(token, guestId, param(params.itemId), await json()),
    })),
  ),
  http.delete('*/api/cart/items/:itemId', (info) =>
    respond(info, ({ token, guestId, params }) => ({
      body: mockDomain.removeCartItem(token, guestId, param(params.itemId)),
    })),
  ),
];
