import { describe, expect, it } from 'vitest';
import { NftListQuerySchema } from '@/shared/contracts';
import { nftFixtures } from '@/mocks/fixtures/nfts';
import { queryNfts } from './nft-queries';

function parseQuery(overrides: Record<string, unknown> = {}) {
  return NftListQuerySchema.parse(overrides);
}

describe('queryNfts', () => {
  it('filters by category and keeps facets for the whole catalog', () => {
    const response = queryNfts(
      nftFixtures,
      parseQuery({ categories: ['photography'], pageSize: 48 }),
    );

    expect(response.items.length).toBeGreaterThan(0);
    expect(response.items.every((nft) => nft.category === 'photography')).toBe(true);
    expect(response.facets.categories.photography).toBe(response.items.length);
    expect(response.facets.categories.art).toBeGreaterThan(0);
  });

  it('sorts by price ascending', () => {
    const response = queryNfts(nftFixtures, parseQuery({ sort: 'price-asc', pageSize: 48 }));
    const prices = response.items.map((nft) => Number(nft.priceEth));

    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });

  it('paginates and excludes the current NFT from related results', () => {
    const response = queryNfts(
      nftFixtures,
      parseQuery({ collectionId: 'collection-1', excludeId: 'nft-001', pageSize: 5 }),
    );

    expect(response.items).toHaveLength(5);
    expect(response.pagination.total).toBe(8);
    expect(response.items.some((nft) => nft.id === 'nft-001')).toBe(false);
  });
});
