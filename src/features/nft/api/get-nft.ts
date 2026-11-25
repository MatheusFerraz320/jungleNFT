import { http } from '@/shared/api/http';
import { NftDetailSchema, type NftDetail } from '@/shared/contracts';

export async function getNft(id: string): Promise<NftDetail> {
  const response = await http.get(`/nfts/${encodeURIComponent(id)}`);

  return NftDetailSchema.parse(response.data);
}
