import { createFileRoute } from '@tanstack/react-router';
import { requireAuth } from '@/features/auth';
import { ProfilePage } from '@/features/profile';

export const Route = createFileRoute('/perfil')({
  beforeLoad: ({ location }) => requireAuth(location),
  head: () => ({ meta: [{ title: 'Perfil do colecionador — Kurio' }] }),
  component: ProfilePage,
});
