import type { NftCategory, NftRarity, NftSummary } from '@/shared/contracts';
import { NftSummarySchema } from '@/shared/contracts';

const categories: NftCategory[] = ['art', 'gaming', 'music', 'collectible', 'photography'];
const rarities: NftRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
const networks = ['ethereum', 'polygon', 'base', 'arbitrum', 'optimism'] as const;
const images = [
  '/assets/nfts/artwork-03.png',
  '/assets/nfts/artwork-04.png',
  '/assets/nfts/artwork-05.png',
  '/assets/nfts/artwork-06.png',
  '/assets/nfts/artwork-07.png',
  '/assets/nfts/artwork-08.png',
  '/assets/nfts/artwork-09.png',
  '/assets/nfts/artwork-10.png',
  '/assets/nfts/artwork-11.png',
];
const collectionNames = [
  'Jungle Genesis',
  'Neon Canopy',
  'Ancient Signals',
  'Digital Flora',
  'Wild Frequencies',
];

function buildNft(index: number): NftSummary {
  const createdAt = new Date(Date.UTC(2026, 0, 1 + (index % 24))).toISOString();
  const totalEditions = 10 + (index % 5) * 5;
  const priceEth = (0.035 + (index % 9) * 0.025).toFixed(3);

  return NftSummarySchema.parse({
    id: `nft-${String(index + 1).padStart(3, '0')}`,
    tokenId: String(index + 1),
    name: `Wild Artifact #${String(index + 1).padStart(2, '0')}`,
    collectionId: `collection-${(index % collectionNames.length) + 1}`,
    collectionName: collectionNames[index % collectionNames.length],
    imageUrl: images[index % images.length],
    priceEth,
    availableEditions: index % 11 === 0 ? 0 : totalEditions - (index % 4),
    totalEditions,
    network: networks[index % networks.length],
    category: categories[index % categories.length],
    rarity: rarities[index % rarities.length],
    createdAt,
    version: 1,
  });
}

export const nftFixtures = Array.from({ length: 24 }, (_, index) => buildNft(index));
