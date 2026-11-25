import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { AuthScreen } from '@/features/auth';

export const Route = createFileRoute('/login')({
  validateSearch: z.object({ redirect: z.string().optional() }),
  head: () => ({ meta: [{ title: 'Entrar — Kurio' }] }),
  component: function LoginRoute() {
    const { redirect } = Route.useSearch();
    return <AuthScreen mode="login" redirectTo={redirect} />;
  },
});
