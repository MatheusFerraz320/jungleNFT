import type { Query, QueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/query-keys';
import type { Session } from '@/shared/contracts';

const PRIVATE_SEGMENTS = new Set(['favorites', 'cart', 'quote', 'orders', 'profile', 'wallets']);

function isPrivateQuery(query: Query) {
  const [root, segment] = query.queryKey;
  return (
    (root === 'junglenft' && PRIVATE_SEGMENTS.has(String(segment))) || root === 'checkout-quote'
  );
}

/**
 * Troca/encerramento de sessão: grava a nova sessão (ou `null`) — o que notifica os componentes
 * montados — e descarta todo dado privado em cache. O catálogo público é preservado.
 * (`queryClient.clear()` desanexaria observers montados e deixaria a UI com dados antigos.)
 */
export function replaceSession(queryClient: QueryClient, session: Session | null) {
  queryClient.setQueryData(queryKeys.auth.session, session);
  queryClient.removeQueries({ predicate: isPrivateQuery });
}
