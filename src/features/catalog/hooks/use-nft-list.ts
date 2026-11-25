import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/query-keys';
import type { NftListQuery } from '@/shared/contracts';
import { getNfts } from '../api/get-nfts';

export function nftListQueryOptions(query: Partial<NftListQuery>) {
  return queryOptions({
    queryKey: queryKeys.nfts.list(JSON.stringify(query)),
    queryFn: ({ signal }) => getNfts(query, signal),
    placeholderData: keepPreviousData,
  });
}

export function useNftList(query: Partial<NftListQuery>) {
  return useQuery(nftListQueryOptions(query));
}
