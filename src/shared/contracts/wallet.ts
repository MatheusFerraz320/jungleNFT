import { z } from 'zod';
import { NetworkSchema } from './common';

export const WalletAddressSchema = z
  .string()
  .regex(
    /^0x[a-fA-F0-9]{40}$/,
    'Informe um endereço EVM válido (0x + 40 caracteres hexadecimais).',
  );

/** Dados complementares do colecionador exibidos no formulário de carteira (Figma). */
const WalletMetaShape = {
  displayName: z.string().max(80).optional(),
  profileName: z.string().max(80).optional(),
  walletType: z.string().max(40).optional(),
  referralCode: z.string().max(40).optional(),
  email: z.email().optional(),
  ensName: z.string().max(60).optional(),
  secondaryAddress: z.string().max(80).optional(),
};

export const WalletSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  label: z.string().min(1).max(40),
  address: WalletAddressSchema,
  network: NetworkSchema,
  isPrimary: z.boolean(),
  ...WalletMetaShape,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  version: z.number().int().min(1),
});

export const CreateWalletRequestSchema = z.object({
  label: z.string().min(1).max(40),
  address: WalletAddressSchema,
  network: NetworkSchema,
  isPrimary: z.boolean().default(false),
  ...WalletMetaShape,
});

/** `isPrimary` não tem default na edição: omitir o campo preserva o valor atual. */
export const UpdateWalletRequestSchema = CreateWalletRequestSchema.partial().extend({
  isPrimary: z.boolean().optional(),
});

export type Wallet = z.infer<typeof WalletSchema>;
export type CreateWalletRequest = z.infer<typeof CreateWalletRequestSchema>;
export type UpdateWalletRequest = z.infer<typeof UpdateWalletRequestSchema>;
