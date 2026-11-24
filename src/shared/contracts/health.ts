import { z } from 'zod';

export const HealthResponseSchema = z.object({
  status: z.literal('ok'),
  timestamp: z.iso.datetime(),
  scenario: z.string().min(1),
  mocks: z.literal(true),
});

export type HealthResponse = z.infer<typeof HealthResponseSchema>;
