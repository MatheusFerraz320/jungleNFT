import { http } from '@/shared/api/http';
import { NftDetailSchema, type NftDetail } from '@/shared/contracts';

export async function getNft(id: string, signal?: AbortSignal): Promise<NftDetail> {
  const response = await http.get(`/nfts/${encodeURIComponent(id)}`, { signal });

  return NftDetailSchema.parse(response.data);
}
