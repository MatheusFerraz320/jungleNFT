import { z } from 'zod';
import { EthAmountSchema, NetworkSchema } from './common';

export const NftCategorySchema = z.enum(['art', 'gaming', 'music', 'collectible', 'photography']);
export const NftRaritySchema = z.enum(['common', 'uncommon', 'rare', 'epic', 'legendary']);
export const NftSortSchema = z.enum(['relevance', 'price-asc', 'price-desc', 'newest', 'name-asc']);

export const NftSummarySchema = z.object({
  id: z.string().min(1),
  tokenId: z.string().min(1),
  name: z.string().min(1),
  collectionId: z.string().min(1),
  collectionName: z.string().min(1),
  imageUrl: z.string().min(1),
  priceEth: EthAmountSchema,
  availableEditions: z.number().int().min(0),
  totalEditions: z.number().int().min(1),
  network: NetworkSchema,
  category: NftCategorySchema,
  rarity: NftRaritySchema,
  createdAt: z.iso.datetime(),
  version: z.number().int().min(1),
});

export const NftDetailSchema = NftSummarySchema.extend({
  description: z.string().min(1),
  creator: z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    avatarUrl: z.string().min(1),
  }),
  gallery: z.array(z.string().min(1)).min(1),
});

export const NftListQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  categories: z.array(NftCategorySchema).optional(),
  rarities: z.array(NftRaritySchema).optional(),
  minPriceEth: EthAmountSchema.optional(),
  maxPriceEth: EthAmountSchema.optional(),
  network: NetworkSchema.optional(),
  availableOnly: z.boolean().optional(),
  sort: NftSortSchema.default('relevance'),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(48).default(12),
});

export const NftListResponseSchema = z.object({
  items: z.array(NftSummarySchema),
  pagination: z.object({
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1),
    total: z.number().int().min(0),
    totalPages: z.number().int().min(0),
  }),
});

export type NftCategory = z.infer<typeof NftCategorySchema>;
export type NftRarity = z.infer<typeof NftRaritySchema>;
export type NftSort = z.infer<typeof NftSortSchema>;
export type NftSummary = z.infer<typeof NftSummarySchema>;
export type NftDetail = z.infer<typeof NftDetailSchema>;
export type NftListQuery = z.infer<typeof NftListQuerySchema>;
export type NftListResponse = z.infer<typeof NftListResponseSchema>;
