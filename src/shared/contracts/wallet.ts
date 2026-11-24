import { z } from 'zod';
import { NetworkSchema } from './common';

export const WalletAddressSchema = z
  .string()
  .regex(
    /^0x[a-fA-F0-9]{40}$/,
    'Informe um endereço EVM válido (0x + 40 caracteres hexadecimais).',
  );

export const WalletSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  label: z.string().min(1).max(40),
  address: WalletAddressSchema,
  network: NetworkSchema,
  isPrimary: z.boolean(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  version: z.number().int().min(1),
});

export const CreateWalletRequestSchema = z.object({
  label: z.string().min(1).max(40),
  address: WalletAddressSchema,
  network: NetworkSchema,
  isPrimary: z.boolean().default(false),
});

export const UpdateWalletRequestSchema = CreateWalletRequestSchema.partial();

export type Wallet = z.infer<typeof WalletSchema>;
export type CreateWalletRequest = z.infer<typeof CreateWalletRequestSchema>;
export type UpdateWalletRequest = z.infer<typeof UpdateWalletRequestSchema>;
