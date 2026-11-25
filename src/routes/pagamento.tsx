import { createFileRoute } from '@tanstack/react-router';
import { requireAuth } from '@/features/auth';
import { PaymentPage } from '@/features/checkout';

export const Route = createFileRoute('/pagamento')({
  beforeLoad: ({ location }) => requireAuth(location),
  head: () => ({ meta: [{ title: 'Pagamento — Kurio' }] }),
  component: PaymentPage,
});
