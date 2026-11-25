import { queryOptions, useQuery, useQueryClient } from '@tanstack/react-query';
import { getToken } from '@/shared/api/client-identity';
import { queryKeys } from '@/shared/api/query-keys';
import type { Session, User } from '@/shared/contracts';
import { getSession } from '../api/auth-api';

/**
 * Sessão atual. Sem token não há chamada de rede (`null`); com token, a API valida a sessão e
 * respostas 401 disparam o fluxo global de expiração.
 */
export const sessionQueryOptions = queryOptions({
  queryKey: queryKeys.auth.session,
  queryFn: async ({ signal }): Promise<Session | null> => (getToken() ? getSession(signal) : null),
  staleTime: 60_000,
  retry: false,
});

export function useSession() {
  const query = useQuery(sessionQueryOptions);
  return { user: (query.data?.user ?? null) as User | null, isPending: query.isPending };
}

export function useCurrentUser() {
  return useSession().user;
}

export function useQueryClientSessionReset() {
  const queryClient = useQueryClient();
  return () => queryClient.clear();
}
