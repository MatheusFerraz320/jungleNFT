import { createFileRoute } from '@tanstack/react-router';
import { OrderConfirmationPage } from '@/features/orders';

export const Route = createFileRoute('/pedido/$orderId')({
  head: () => ({ meta: [{ title: 'Confirmação de pedido — Kurio' }] }),
  component: function OrderRoute() {
    const { orderId } = Route.useParams();
    return <OrderConfirmationPage orderId={orderId} />;
  },
});
