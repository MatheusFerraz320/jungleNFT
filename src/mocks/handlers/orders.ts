import { http, HttpResponse } from 'msw';
import { mockDomain } from '@/mocks/db/domain';
import { param, respond } from '../lib/respond';

export const orderHandlers = [
  http.post('*/api/orders', async (info) => {
    let lost = false;
    const response = await respond(info, async ({ token, idempotencyKey, json }) => {
      const result = mockDomain.createOrder(token, idempotencyKey, await json());
      lost = Boolean(result.lostResponse);
      return { status: result.replayed ? 200 : 201, body: result.order };
    });

    // A criação ocorreu, mas a resposta é "perdida" (timeout do gateway): o cliente deve repetir
    // a chamada com a mesma Idempotency-Key e recuperar o mesmo pedido.
    if (lost) {
      return HttpResponse.json(
        { code: 'TIMEOUT', message: 'O servidor demorou para responder. Tente novamente.' },
        { status: 504 },
      );
    }
    return response;
  }),
  http.get('*/api/orders', (info) =>
    respond(info, ({ token }) => ({ body: mockDomain.listOrders(token) })),
  ),
  http.get('*/api/orders/:id', (info) =>
    respond(info, ({ token, params }) => ({ body: mockDomain.getOrder(token, param(params.id)) })),
  ),
];
