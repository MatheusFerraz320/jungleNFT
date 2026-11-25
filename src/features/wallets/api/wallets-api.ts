import { z } from 'zod';
import { http } from '@/shared/api/http';
import {
  WalletSchema,
  type CreateWalletRequest,
  type UpdateWalletRequest,
  type Wallet,
} from '@/shared/contracts';

const WalletListSchema = z.object({ wallets: z.array(WalletSchema) });

export async function getWallets(signal?: AbortSignal): Promise<Wallet[]> {
  const response = await http.get('/wallets', { signal });
  return WalletListSchema.parse(response.data).wallets;
}

export async function createWallet(body: CreateWalletRequest): Promise<Wallet> {
  const response = await http.post('/wallets', body);
  return WalletSchema.parse(response.data);
}

export async function updateWallet(id: string, body: UpdateWalletRequest): Promise<Wallet> {
  const response = await http.patch(`/wallets/${encodeURIComponent(id)}`, body);
  return WalletSchema.parse(response.data);
}
