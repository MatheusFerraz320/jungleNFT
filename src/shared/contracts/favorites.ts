import { z } from 'zod';

export const FavoritesResponseSchema = z.object({
  nftIds: z.array(z.string().min(1)),
  version: z.number().int().min(0),
});

export type FavoritesResponse = z.infer<typeof FavoritesResponseSchema>;
