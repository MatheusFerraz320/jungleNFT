import { createFileRoute } from '@tanstack/react-router';
import { requireAuth } from '@/features/auth';
import { WalletsPage } from '@/features/wallets';

export const Route = createFileRoute('/carteiras')({
  beforeLoad: ({ location }) => requireAuth(location),
  head: () => ({ meta: [{ title: 'Carteiras — Kurio' }] }),
  component: WalletsPage,
});
