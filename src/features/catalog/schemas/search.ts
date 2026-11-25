import { z } from 'zod';
import {
  EthAmountSchema,
  NetworkSchema,
  NftCategorySchema,
  NftRaritySchema,
  NftSortSchema,
} from '@/shared/contracts';

export const catalogSearchSchema = z.object({
  q: z.string().trim().max(120).optional().catch(undefined),
  categories: z.array(NftCategorySchema).optional().catch(undefined),
  rarities: z.array(NftRaritySchema).optional().catch(undefined),
  minPriceEth: EthAmountSchema.optional().catch(undefined),
  maxPriceEth: EthAmountSchema.optional().catch(undefined),
  network: NetworkSchema.optional().catch(undefined),
  availableOnly: z.boolean().optional().catch(undefined),
  filters: z.boolean().optional().catch(undefined),
  sort: NftSortSchema.optional().catch(undefined),
  page: z.coerce.number().int().min(1).optional().catch(undefined),
  tab: z.enum(['all', 'new', 'trending']).optional().catch(undefined),
});

export type CatalogSearch = z.infer<typeof catalogSearchSchema>;
export type CatalogTab = NonNullable<CatalogSearch['tab']>;
