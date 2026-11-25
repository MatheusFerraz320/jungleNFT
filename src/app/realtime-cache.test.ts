import { QueryClient, QueryObserver } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import { queryKeys } from '@/shared/api/query-keys';
import type { NftDetail, NftSummary } from '@/shared/contracts';
import { applyNftUpdate } from './realtime-cache';

vi.mock('sonner', () => ({ toast: { info: vi.fn(), success: vi.fn(), error: vi.fn() } }));

const base = {
  id: 'nft-1',
  tokenId: '0001',
  name: 'Teste #1',
  collectionId: 'c',
  collectionName: 'Coleção',
  imageUrl: '/a.webp',
  priceEth: '1.50',
  availableEditions: 5,
  totalEditions: 10,
  network: 'ethereum',
  category: 'art',
  rarity: 'rare',
  createdAt: '2026-01-01T00:00:00.000Z',
  version: 2,
} as NftSummary;

describe('applyNftUpdate', () => {
  it('refaz a busca inicial em voo para não terminar com a resposta anterior ao evento', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    let release: (value: NftDetail) => void = () => undefined;
    const queryFn = vi
      .fn<() => Promise<NftDetail>>()
      .mockImplementationOnce(() => new Promise<NftDetail>((resolve) => (release = resolve)))
      .mockResolvedValue({ ...base, priceEth: '1.75', version: 3 } as NftDetail);

    const observer = new QueryObserver(queryClient, {
      queryKey: queryKeys.nfts.detail('nft-1'),
      queryFn,
    });
    const unsubscribe = observer.subscribe(() => undefined);

    // A 1ª resposta (preço antigo) ainda está em voo quando o evento chega.
    applyNftUpdate(queryClient, { ...base, priceEth: '1.75', version: 3 });
    release({ ...base, version: 2 } as NftDetail);

    await vi.waitFor(() =>
      expect(queryClient.getQueryData<NftDetail>(queryKeys.nfts.detail('nft-1'))?.priceEth).toBe(
        '1.75',
      ),
    );
    expect(queryFn).toHaveBeenCalledTimes(2);
    unsubscribe();
  });

  it('aplica o evento direto no cache quando a versão é mais nova e ignora a antiga', () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(queryKeys.nfts.detail('nft-1'), { ...base, version: 5 });

    applyNftUpdate(queryClient, { ...base, priceEth: '9.99', version: 4 });
    expect(queryClient.getQueryData<NftDetail>(queryKeys.nfts.detail('nft-1'))?.priceEth).toBe(
      '1.50',
    );

    applyNftUpdate(queryClient, { ...base, priceEth: '2.00', version: 6 });
    expect(queryClient.getQueryData<NftDetail>(queryKeys.nfts.detail('nft-1'))?.priceEth).toBe(
      '2.00',
    );
  });
});
