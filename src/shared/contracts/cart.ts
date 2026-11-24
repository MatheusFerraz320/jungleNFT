import { z } from 'zod';
import { EthAmountSchema, QuantitySchema } from './common';
import { NftSummarySchema } from './nft';

export const CartItemSchema = z.object({
  id: z.string().min(1),
  nftId: z.string().min(1),
  nft: NftSummarySchema,
  quantity: QuantitySchema,
  unitPriceEth: EthAmountSchema,
  availableEditions: z.number().int().min(0),
  lineTotalEth: EthAmountSchema,
});

export const CartSchema = z.object({
  id: z.string().min(1),
  userId: z.string().nullable(),
  items: z.array(CartItemSchema),
  itemCount: z.number().int().min(0),
  subtotalEth: EthAmountSchema,
  updatedAt: z.iso.datetime(),
  version: z.number().int().min(1),
});

export const AddCartItemRequestSchema = z.object({
  nftId: z.string().min(1),
  quantity: QuantitySchema,
});

export const UpdateCartItemRequestSchema = z.object({
  quantity: QuantitySchema,
});

export type CartItem = z.infer<typeof CartItemSchema>;
export type Cart = z.infer<typeof CartSchema>;
export type AddCartItemRequest = z.infer<typeof AddCartItemRequestSchema>;
export type UpdateCartItemRequest = z.infer<typeof UpdateCartItemRequestSchema>;
