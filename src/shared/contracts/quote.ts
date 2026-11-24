import { z } from 'zod';
import { EthAmountSchema, NetworkSchema, QuantitySchema } from './common';

export const QuoteRequestSchema = z.object({
  cartId: z.string().min(1),
  couponCode: z.string().trim().max(40).optional(),
  network: NetworkSchema,
});

export const QuoteItemSchema = z.object({
  nftId: z.string().min(1),
  quantity: QuantitySchema,
  unitPriceEth: EthAmountSchema,
  lineTotalEth: EthAmountSchema,
});

export const QuoteStatusSchema = z.enum(['valid', 'price_changed', 'edition_sold_out', 'expired']);

export const QuoteSchema = z.object({
  quoteId: z.string().min(1),
  cartId: z.string().min(1),
  cartVersion: z.number().int().min(1),
  items: z.array(QuoteItemSchema),
  subtotalEth: EthAmountSchema,
  discountEth: EthAmountSchema,
  networkFeeEth: EthAmountSchema,
  totalEth: EthAmountSchema,
  couponCode: z.string().nullable(),
  network: NetworkSchema,
  status: QuoteStatusSchema,
  expiresAt: z.iso.datetime(),
  version: z.number().int().min(1),
});

export type QuoteRequest = z.infer<typeof QuoteRequestSchema>;
export type QuoteItem = z.infer<typeof QuoteItemSchema>;
export type QuoteStatus = z.infer<typeof QuoteStatusSchema>;
export type Quote = z.infer<typeof QuoteSchema>;
