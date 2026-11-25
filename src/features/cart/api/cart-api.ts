import { http } from '@/shared/api/http';
import { CartSchema, QuoteSchema, type Cart, type Network, type Quote } from '@/shared/contracts';

export async function getCart(signal?: AbortSignal): Promise<Cart> {
  const response = await http.get('/cart', { signal });
  return CartSchema.parse(response.data);
}

export async function addCartItem(nftId: string, quantity: number): Promise<Cart> {
  const response = await http.post('/cart/items', { nftId, quantity });
  return CartSchema.parse(response.data);
}

export async function updateCartItem(itemId: string, quantity: number): Promise<Cart> {
  const response = await http.patch(`/cart/items/${encodeURIComponent(itemId)}`, { quantity });
  return CartSchema.parse(response.data);
}

export async function removeCartItem(itemId: string): Promise<Cart> {
  const response = await http.delete(`/cart/items/${encodeURIComponent(itemId)}`);
  return CartSchema.parse(response.data);
}

export interface QuoteInput {
  cartId: string;
  network: Network;
  couponCode?: string;
}

/** A cotação da API é a referência para finalizar o pedido (cupom, taxa, disponibilidade). */
export async function createQuote(input: QuoteInput, signal?: AbortSignal): Promise<Quote> {
  const response = await http.post('/quotes', input, { signal });
  return QuoteSchema.parse(response.data);
}
