import {
  NftCategorySchema,
  NftListResponseSchema,
  NftRaritySchema,
  type NftFacets,
  type NftListQuery,
  type NftListResponse,
  type NftSummary,
} from '@/shared/contracts';
import { parseEth } from '@/shared/lib/decimal';

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function buildFacets(nfts: NftSummary[]): NftFacets {
  const categories = Object.fromEntries(NftCategorySchema.options.map((value) => [value, 0]));
  const rarities = Object.fromEntries(NftRaritySchema.options.map((value) => [value, 0]));
  const networks: Record<string, number> = {};

  for (const nft of nfts) {
    categories[nft.category] = (categories[nft.category] ?? 0) + 1;
    rarities[nft.rarity] = (rarities[nft.rarity] ?? 0) + 1;
    networks[nft.network] = (networks[nft.network] ?? 0) + 1;
  }

  return { categories, rarities, networks };
}

function matchesQuery(nft: NftSummary, query: NftListQuery) {
  if (query.excludeId && nft.id === query.excludeId) return false;
  if (query.collectionId && nft.collectionId !== query.collectionId) return false;

  if (query.q) {
    const term = normalize(query.q);
    const haystack = normalize(`${nft.name} ${nft.collectionName}`);
    if (!haystack.includes(term)) return false;
  }

  if (query.categories?.length && !query.categories.includes(nft.category)) return false;
  if (query.rarities?.length && !query.rarities.includes(nft.rarity)) return false;
  if (query.network && nft.network !== query.network) return false;
  if (query.availableOnly && nft.availableEditions === 0) return false;

  const price = parseEth(nft.priceEth);
  if (query.minPriceEth && price.lessThan(parseEth(query.minPriceEth))) return false;
  if (query.maxPriceEth && price.greaterThan(parseEth(query.maxPriceEth))) return false;

  return true;
}

function compareNfts(a: NftSummary, b: NftSummary, sort: NftListQuery['sort']) {
  switch (sort) {
    case 'price-asc':
      return parseEth(a.priceEth).comparedTo(parseEth(b.priceEth));
    case 'price-desc':
      return parseEth(b.priceEth).comparedTo(parseEth(a.priceEth));
    case 'newest':
      return b.createdAt.localeCompare(a.createdAt);
    case 'name-asc':
      return a.name.localeCompare(b.name, 'pt-BR');
    default:
      return 0;
  }
}

export function queryNfts(nfts: NftSummary[], query: NftListQuery): NftListResponse {
  const filtered = nfts.filter((nft) => matchesQuery(nft, query));
  const sorted = [...filtered].sort((a, b) => compareNfts(a, b, query.sort));

  const total = sorted.length;
  const totalPages = Math.ceil(total / query.pageSize);
  const page = totalPages === 0 ? 1 : Math.min(query.page, totalPages);
  const start = (page - 1) * query.pageSize;

  return NftListResponseSchema.parse({
    items: sorted.slice(start, start + query.pageSize),
    pagination: {
      page,
      pageSize: query.pageSize,
      total,
      totalPages,
    },
    facets: buildFacets(nfts),
  });
}
