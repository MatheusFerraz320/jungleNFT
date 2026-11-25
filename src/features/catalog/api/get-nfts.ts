import { http } from '@/shared/api/http';
import { NftListResponseSchema, type NftListQuery, type NftListResponse } from '@/shared/contracts';

function toParams(query: Partial<NftListQuery>) {
  const params = new URLSearchParams();

  if (query.q) params.set('q', query.q);
  for (const category of query.categories ?? []) params.append('categories', category);
  for (const rarity of query.rarities ?? []) params.append('rarities', rarity);
  if (query.minPriceEth) params.set('minPriceEth', query.minPriceEth);
  if (query.maxPriceEth) params.set('maxPriceEth', query.maxPriceEth);
  if (query.network) params.set('network', query.network);
  if (query.availableOnly !== undefined) params.set('availableOnly', String(query.availableOnly));
  if (query.collectionId) params.set('collectionId', query.collectionId);
  if (query.excludeId) params.set('excludeId', query.excludeId);
  if (query.sort) params.set('sort', query.sort);
  if (query.page !== undefined) params.set('page', String(query.page));
  if (query.pageSize !== undefined) params.set('pageSize', String(query.pageSize));

  return params;
}

export async function getNfts(query: Partial<NftListQuery> = {}): Promise<NftListResponse> {
  const response = await http.get('/nfts', { params: toParams(query) });

  return NftListResponseSchema.parse(response.data);
}
