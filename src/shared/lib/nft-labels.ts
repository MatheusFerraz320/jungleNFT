import type { Network, NftCategory, NftRarity } from '@/shared/contracts';

export const categoryLabels: Record<NftCategory, string> = {
  art: 'Arte digital',
  photography: 'Fotografia',
  music: 'Música',
  'art-3d': 'Arte 3D',
  collectible: 'Colecionáveis',
  generative: 'Generativa',
  gaming: 'Jogos',
  memberships: 'Assinaturas',
  utility: 'Utilidade',
};

export const rarityLabels: Record<NftRarity, string> = {
  common: 'Comum',
  uncommon: 'Incomum',
  rare: 'Raro',
  epic: 'Épico',
  legendary: 'Lendário',
};

export const networkLabels: Record<Network, string> = {
  ethereum: 'Ethereum',
  polygon: 'Polygon',
  solana: 'Solana',
};

export const rarityBadgeLabel: Partial<Record<NftRarity, string>> = {
  rare: 'RARO',
  epic: 'ÉPICO',
  legendary: 'LENDÁRIO',
};
