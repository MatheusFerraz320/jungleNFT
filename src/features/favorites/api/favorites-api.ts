import { http } from '@/shared/api/http';
import { FavoritesResponseSchema, type FavoritesResponse } from '@/shared/contracts';

export async function getFavorites(signal?: AbortSignal): Promise<FavoritesResponse> {
  const response = await http.get('/favorites', { signal });
  return FavoritesResponseSchema.parse(response.data);
}

export async function setFavorite(nftId: string, favorite: boolean): Promise<FavoritesResponse> {
  const url = `/favorites/${encodeURIComponent(nftId)}`;
  const response = favorite ? await http.put(url) : await http.delete(url);
  return FavoritesResponseSchema.parse(response.data);
}
