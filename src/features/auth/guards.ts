import { redirect } from '@tanstack/react-router';
import { queryClient } from '@/app/query-client';
import { getToken } from '@/shared/api/client-identity';
import { sessionQueryOptions } from './hooks/use-session';

/** Rotas privadas: sem sessão, redireciona ao login preservando o destino para retomada. */
export async function requireAuth(location: { href: string }) {
  if (!getToken()) {
    throw redirect({ to: '/login', search: { redirect: location.href } });
  }

  try {
    const session = await queryClient.ensureQueryData(sessionQueryOptions);
    if (!session) throw new Error('no-session');
  } catch {
    throw redirect({ to: '/login', search: { redirect: location.href } });
  }
}
