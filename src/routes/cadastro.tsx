import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { AuthScreen } from '@/features/auth';

export const Route = createFileRoute('/cadastro')({
  validateSearch: z.object({ redirect: z.string().optional() }),
  head: () => ({ meta: [{ title: 'Criar conta — Kurio' }] }),
  component: function RegisterRoute() {
    const { redirect } = Route.useSearch();
    return <AuthScreen mode="register" redirectTo={redirect} />;
  },
});
