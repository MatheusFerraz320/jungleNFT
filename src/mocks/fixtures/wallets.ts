import type { Wallet } from '@/shared/contracts';
import { WalletSchema } from '@/shared/contracts';

const timestamp = '2026-01-01T00:00:00.000Z';

export const walletFixtures: Wallet[] = [
  WalletSchema.parse({
    id: 'wallet-ana-primary',
    userId: 'user-ana',
    label: 'Carteira principal',
    address: '0x1111111111111111111111111111111111111111',
    network: 'ethereum',
    isPrimary: true,
    createdAt: timestamp,
    updatedAt: timestamp,
    version: 1,
  }),
  WalletSchema.parse({
    id: 'wallet-ana-secondary',
    userId: 'user-ana',
    label: 'Carteira Polygon',
    address: '0x2222222222222222222222222222222222222222',
    network: 'polygon',
    isPrimary: false,
    createdAt: timestamp,
    updatedAt: timestamp,
    version: 1,
  }),
];
