import { queryOptions, useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/query-keys';
import { getNft } from '../api/get-nft';

export function nftDetailQueryOptions(id: string) {
  return queryOptions({
    queryKey: queryKeys.nfts.detail(id),
    queryFn: ({ signal }) => getNft(id, signal),
  });
}

export function useNftDetail(id: string) {
  return useQuery(nftDetailQueryOptions(id));
}
