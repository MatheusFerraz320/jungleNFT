import { queryOptions, useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/query-keys';
import { getOrder } from '../api/orders-api';

const POLL_MS = 1_000;

/**
 * Estado do pedido. Enquanto `pending`, consulta periodicamente (recuperação após refresh ou
 * reconexão); `confirmed` e `rejected` são terminais e encerram o polling.
 */
export function orderQueryOptions(id: string) {
  return queryOptions({
    queryKey: queryKeys.order(id),
    queryFn: ({ signal }) => getOrder(id, signal),
    refetchInterval: (query) => (query.state.data?.status === 'pending' ? POLL_MS : false),
    refetchOnReconnect: 'always',
  });
}

export function useOrder(id: string) {
  return useQuery(orderQueryOptions(id));
}
