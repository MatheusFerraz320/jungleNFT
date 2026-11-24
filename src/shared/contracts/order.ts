import { z } from 'zod';
import { EthAmountSchema, NetworkSchema, QuantitySchema } from './common';

export const OrderStatusSchema = z.enum(['pending', 'confirmed', 'rejected']);

export const OrderItemSnapshotSchema = z.object({
  nftId: z.string().min(1),
  name: z.string().min(1),
  collectionName: z.string().min(1),
  imageUrl: z.string().min(1),
  edition: z.string().min(1),
  quantity: QuantitySchema,
  unitPriceEth: EthAmountSchema,
  lineTotalEth: EthAmountSchema,
});

export const OrderTotalsSnapshotSchema = z.object({
  subtotalEth: EthAmountSchema,
  discountEth: EthAmountSchema,
  networkFeeEth: EthAmountSchema,
  totalEth: EthAmountSchema,
  couponCode: z.string().nullable(),
});

export const CollectorSnapshotSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
});

export const CreateOrderRequestSchema = z.object({
  quoteId: z.string().min(1),
  cartId: z.string().min(1),
  walletId: z.string().min(1),
  network: NetworkSchema,
  collector: CollectorSnapshotSchema,
  acceptTerms: z.literal(true),
});

export const OrderSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  status: OrderStatusSchema,
  items: z.array(OrderItemSnapshotSchema),
  totals: OrderTotalsSnapshotSchema,
  network: NetworkSchema,
  walletAddress: z.string().min(1),
  transactionHash: z.string().nullable(),
  explorerUrl: z.string().nullable(),
  failureReason: z.string().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  version: z.number().int().min(1),
});

export type OrderStatus = z.infer<typeof OrderStatusSchema>;
export type OrderItemSnapshot = z.infer<typeof OrderItemSnapshotSchema>;
export type OrderTotalsSnapshot = z.infer<typeof OrderTotalsSnapshotSchema>;
export type CreateOrderRequest = z.infer<typeof CreateOrderRequestSchema>;
export type Order = z.infer<typeof OrderSchema>;
