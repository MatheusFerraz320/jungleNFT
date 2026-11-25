import { createFileRoute } from '@tanstack/react-router';
import { PaymentPage } from '@/features/checkout';

export const Route = createFileRoute('/pagamento')({
  head: () => ({ meta: [{ title: 'Pagamento — Kurio' }] }),
  component: PaymentPage,
});
