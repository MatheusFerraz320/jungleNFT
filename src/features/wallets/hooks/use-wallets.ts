import { queryOptions, useQuery } from '@tanstack/react-query';
import { useCurrentUser } from '@/features/auth';
import { queryKeys } from '@/shared/api/query-keys';
import { getWallets } from '../api/wallets-api';

export function walletsQueryOptions(userId: string) {
  return queryOptions({
    queryKey: queryKeys.wallets(userId),
    queryFn: ({ signal }) => getWallets(signal),
  });
}

export function useWallets() {
  const user = useCurrentUser();
  return useQuery({ ...walletsQueryOptions(user?.id ?? 'anonymous'), enabled: Boolean(user) });
}
