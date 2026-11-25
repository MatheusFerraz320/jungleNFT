import { createFileRoute } from '@tanstack/react-router';
import { CartPage } from '@/features/cart';

export const Route = createFileRoute('/carrinho')({
  head: () => ({ meta: [{ title: 'Carrinho de NFTs — Kurio' }] }),
  component: CartPage,
});
