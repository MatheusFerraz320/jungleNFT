import { http } from '@/shared/api/http';
import { OrderSchema, type CreateOrderRequest, type Order } from '@/shared/contracts';

/** A `Idempotency-Key` garante que reenvios/timeouts recuperem o mesmo pedido. */
export async function createOrder(
  body: CreateOrderRequest,
  idempotencyKey: string,
): Promise<Order> {
  const response = await http.post('/orders', body, {
    headers: { 'Idempotency-Key': idempotencyKey },
  });
  return OrderSchema.parse(response.data);
}

export async function getOrder(id: string, signal?: AbortSignal): Promise<Order> {
  const response = await http.get(`/orders/${encodeURIComponent(id)}`, { signal });
  return OrderSchema.parse(response.data);
}
