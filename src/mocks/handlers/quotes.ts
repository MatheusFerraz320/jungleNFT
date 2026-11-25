import { http } from 'msw';
import { mockDomain } from '@/mocks/db/domain';
import { param, respond } from '../lib/respond';

export const quoteHandlers = [
  http.post('*/api/quotes', (info) =>
    respond(info, async ({ token, guestId, json }) => ({
      status: 201,
      body: mockDomain.createQuote(token, guestId, await json()),
    })),
  ),
  http.get('*/api/quotes/:id', (info) =>
    respond(info, ({ token, guestId, params }) => ({
      body: mockDomain.getQuote(token, guestId, param(params.id)),
    })),
  ),
];
