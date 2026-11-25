import type { Network, NftCategory, NftDetail, NftRarity, NftSummary } from '@/shared/contracts';
import { NftDetailSchema, NftSummarySchema } from '@/shared/contracts';
import { networkLabels, rarityLabels } from '@/shared/lib/nft-labels';

const artworkFiles = [
  'artwork-03',
  'artwork-04',
  'artwork-05',
  'artwork-06',
  'artwork-07',
  'artwork-08',
  'artwork-09',
  'artwork-10',
  'artwork-11',
] as const;

function artwork(index: number) {
  const file = artworkFiles[index % artworkFiles.length];
  if (!file) throw new Error(`Artwork não encontrado para o índice ${index}.`);
  return `/assets/nfts/${file}.webp`;
}

interface FeaturedSeed {
  name: string;
  tokenId: string;
  artworkIndex: number;
  priceEth: string;
  originalPriceEth?: string;
  category: NftCategory;
  rarity: NftRarity;
  network: Network;
  totalEditions: number;
  availableEditions: number;
  createdAt: string;
  rating: number;
  reviewCount: number;
}

const featuredSeeds: FeaturedSeed[] = [
  {
    name: 'Emerald Ape #042',
    tokenId: '0042',
    artworkIndex: 0,
    priceEth: '1.19',
    category: 'art',
    rarity: 'rare',
    network: 'ethereum',
    totalEditions: 50,
    availableEditions: 34,
    createdAt: '2026-09-12T12:00:00.000Z',
    rating: 4.8,
    reviewCount: 19,
  },
  {
    name: 'Sage Nomad #009',
    tokenId: '0009',
    artworkIndex: 1,
    priceEth: '1.69',
    category: 'photography',
    rarity: 'uncommon',
    network: 'polygon',
    totalEditions: 10,
    availableEditions: 6,
    createdAt: '2026-09-11T12:00:00.000Z',
    rating: 4.5,
    reviewCount: 12,
  },
  {
    name: 'Neon Vessel #552',
    tokenId: '0552',
    artworkIndex: 2,
    priceEth: '1.99',
    originalPriceEth: '2.29',
    category: 'art',
    rarity: 'epic',
    network: 'solana',
    totalEditions: 100,
    availableEditions: 78,
    createdAt: '2026-09-10T12:00:00.000Z',
    rating: 4.7,
    reviewCount: 8,
  },
  {
    name: 'Cosmic Bloom #118',
    tokenId: '0118',
    artworkIndex: 3,
    priceEth: '1.29',
    category: 'art',
    rarity: 'rare',
    network: 'ethereum',
    totalEditions: 20,
    availableEditions: 12,
    createdAt: '2026-09-09T12:00:00.000Z',
    rating: 4.6,
    reviewCount: 14,
  },
  {
    name: 'Violet Nomad #314',
    tokenId: '0314',
    artworkIndex: 4,
    priceEth: '1.39',
    category: 'collectible',
    rarity: 'uncommon',
    network: 'polygon',
    totalEditions: 15,
    availableEditions: 9,
    createdAt: '2026-09-08T12:00:00.000Z',
    rating: 4.9,
    reviewCount: 21,
  },
  {
    name: 'Ivory Baron #088',
    tokenId: '0088',
    artworkIndex: 5,
    priceEth: '1.79',
    category: 'photography',
    rarity: 'epic',
    network: 'solana',
    totalEditions: 25,
    availableEditions: 3,
    createdAt: '2026-09-07T12:00:00.000Z',
    rating: 4.4,
    reviewCount: 7,
  },
  {
    name: 'Golden Beat #207',
    tokenId: '0207',
    artworkIndex: 6,
    priceEth: '0.99',
    category: 'music',
    rarity: 'legendary',
    network: 'polygon',
    totalEditions: 30,
    availableEditions: 20,
    createdAt: '2026-09-06T12:00:00.000Z',
    rating: 4.8,
    reviewCount: 11,
  },
  {
    name: 'Golden Signal #160',
    tokenId: '0160',
    artworkIndex: 7,
    priceEth: '0.39',
    category: 'music',
    rarity: 'rare',
    network: 'solana',
    totalEditions: 40,
    availableEditions: 28,
    createdAt: '2026-09-05T12:00:00.000Z',
    rating: 4.6,
    reviewCount: 9,
  },
  {
    name: 'Jade Oracle #777',
    tokenId: '0777',
    artworkIndex: 8,
    priceEth: '2.49',
    category: 'gaming',
    rarity: 'legendary',
    network: 'ethereum',
    totalEditions: 5,
    availableEditions: 2,
    createdAt: '2026-09-04T12:00:00.000Z',
    rating: 4.9,
    reviewCount: 26,
  },
];

const featuredNfts: NftSummary[] = featuredSeeds.map((seed, index) =>
  NftSummarySchema.parse({
    id: `nft-${String(index + 1).padStart(3, '0')}`,
    tokenId: seed.tokenId,
    name: seed.name,
    collectionId: 'collection-1',
    collectionName: 'Kurio Apes',
    imageUrl: artwork(seed.artworkIndex),
    priceEth: seed.priceEth,
    originalPriceEth: seed.originalPriceEth,
    availableEditions: seed.availableEditions,
    totalEditions: seed.totalEditions,
    network: seed.network,
    category: seed.category,
    rarity: seed.rarity,
    createdAt: seed.createdAt,
    version: 1,
  }),
);

const variantNames = [
  'Moss Wanderer',
  'Amber Circuit',
  'Fern Prophet',
  'Solar Drifter',
  'Obsidian Bloom',
  'Coral Cipher',
  'Tidal Monarch',
  'Copper Mirage',
  'Lunar Canopy',
  'Static Garden',
  'Velvet Vertex',
  'Crimson Echo',
  'Prism Hunter',
  'Silent Reactor',
  'Aurora Index',
];

const variantCategories: NftCategory[] = [
  'art',
  'collectible',
  'photography',
  'music',
  'gaming',
  'art-3d',
  'generative',
  'memberships',
  'utility',
];
const variantRarities: NftRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
const variantNetworks: Network[] = ['ethereum', 'polygon', 'solana'];
const variantCollections = [
  { id: 'collection-2', name: 'Neon Canopy' },
  { id: 'collection-3', name: 'Ancient Signals' },
  { id: 'collection-4', name: 'Digital Flora' },
  { id: 'collection-5', name: 'Wild Frequencies' },
];

const variantNfts: NftSummary[] = variantNames.map((name, index) => {
  const tokenNumber = 600 + index * 7;
  const collection = variantCollections[index % variantCollections.length];
  if (!collection) throw new Error('Coleção de variante não encontrada.');

  return NftSummarySchema.parse({
    id: `nft-${String(index + 10).padStart(3, '0')}`,
    tokenId: String(tokenNumber),
    name: `${name} #${tokenNumber}`,
    collectionId: collection.id,
    collectionName: collection.name,
    imageUrl: artwork(index + 2),
    priceEth: (0.25 + index * 0.15).toFixed(2),
    availableEditions: 4 + ((index * 3) % 20),
    totalEditions: 20 + (index % 5) * 10,
    network: variantNetworks[index % variantNetworks.length] ?? 'ethereum',
    category: variantCategories[index % variantCategories.length] ?? 'art',
    rarity: variantRarities[index % variantRarities.length] ?? 'common',
    createdAt: new Date(Date.UTC(2026, 9, 1 + index, 12)).toISOString(),
    version: 1,
  });
});

export const nftFixtures: NftSummary[] = [...featuredNfts, ...variantNfts];

const traitsByArtwork: string[][] = [
  ['Óculos', 'Esmeralda'],
  ['Chapéu', 'Roxo'],
  ['Blazer', 'Esmeralda'],
  ['Chapéu', 'Roxo'],
  ['Fones', 'Dourado'],
  ['Blazer', 'Esmeralda'],
  ['Fones', 'Dourado'],
  ['Fones', 'Dourado'],
  ['Chapéu', 'Jade'],
];

const creators = [
  { id: 'creator-1', name: 'Nova Sato', avatarUrl: '/assets/creators/nova-sato.svg' },
  { id: 'creator-2', name: 'Iris Vale', avatarUrl: '/assets/creators/iris-vale.svg' },
  { id: 'creator-3', name: 'Caio Mendes', avatarUrl: '/assets/creators/caio-mendes.svg' },
];

const reviewAuthors = ['Marina L.', 'Diego P.', 'Aline R.', 'Tomas K.', 'Bia N.', 'Rafa S.'];

const reviewComments = [
  'A arte é ainda mais bonita no detalhe. A entrega foi rápida e a proveniência está clara.',
  'Coleção impecável. Os metadados e a rede escolhida fazem toda a diferença.',
  'Comprei para a minha coleção pessoal e recomendo. Processo simples do início ao fim.',
  'Cores e composição excelentes. É a peça central da minha galeria digital.',
  'Já acompanhava o criador e esta edição superou as expectativas.',
  'A experiência de compra foi tranquila e o suporte respondeu rápido.',
];

function buildReviews(nft: NftSummary, count: number) {
  const numericToken = Number(nft.tokenId) || 0;

  return Array.from({ length: Math.min(count, 3) }, (_, index) => {
    const position = (numericToken + index) % reviewAuthors.length;
    const author = reviewAuthors[position] ?? 'Colecionador';
    const comment =
      reviewComments[(numericToken + index * 2) % reviewComments.length] ?? 'Ótima peça.';

    return {
      id: `${nft.id}-review-${index + 1}`,
      author,
      rating: 5 - (index % 2),
      comment,
      createdAt: new Date(Date.UTC(2026, 8, 20 - index, 12)).toISOString(),
    };
  });
}

const featuredDetails = new Map(
  featuredSeeds.map((seed, index) => [
    `nft-${String(index + 1).padStart(3, '0')}`,
    { rating: seed.rating, reviewCount: seed.reviewCount },
  ]),
);

function artworkIndexFor(imageUrl: string) {
  return artworkFiles.findIndex((file) => `/assets/nfts/${file}.webp` === imageUrl);
}

export function buildNftDetail(nft: NftSummary): NftDetail {
  const numericToken = Number(nft.tokenId) || 0;
  const mainArtworkIndex = Math.max(0, artworkIndexFor(nft.imageUrl));
  const details = featuredDetails.get(nft.id) ?? {
    rating: Number((4.3 + (numericToken % 6) * 0.1).toFixed(1)),
    reviewCount: 6 + (numericToken % 18),
  };
  const creator = creators[numericToken % creators.length];
  if (!creator) throw new Error('Criador não encontrado.');

  return NftDetailSchema.parse({
    ...nft,
    summary: `Um colecionável digital finalizado à mão da coleção Kurio Editions, verificado na ${networkLabels[nft.network]}, com arte desbloqueável e acesso para colecionadores.`,
    description: [
      `${nft.name} é uma obra digital 1/${nft.totalEditions} finalizada à mão da coleção Kurio Editions. Cada atributo fica armazenado nos metadados do token e verificado na ${networkLabels[nft.network]}. A obra explora identidade, movimento e luz em um mundo digital sem fronteiras.`,
      `A propriedade inclui a arte em alta resolução, lançamentos exclusivos para colecionadores e um registro permanente de procedência registrada na rede. ${creator.name} recebe 5% de direitos autorais nas vendas secundárias, apoiando novos trabalhos e lançamentos da comunidade.`,
    ].join('\n\n'),
    creator,
    gallery: [nft.imageUrl, nft.imageUrl, nft.imageUrl, nft.imageUrl],
    attributes: [
      ...(traitsByArtwork[mainArtworkIndex % traitsByArtwork.length] ?? []),
      rarityLabels[nft.rarity],
    ],
    rating: details.rating,
    reviewCount: details.reviewCount,
    reviews: buildReviews(nft, details.reviewCount),
  });
}
