import { z } from 'zod';

/** ETH amounts always travel as canonical decimal strings. Never use number. */
export const EthAmountSchema = z
  .string()
  .regex(/^(0|[1-9]\d*)(\.\d+)?$/, 'Informe um valor ETH decimal não negativo.');

export const QuantitySchema = z
  .number()
  .int()
  .positive('A quantidade deve ser um inteiro positivo.');

export const NetworkSchema = z.enum(['ethereum', 'polygon', 'solana']);

export const PaginationSchema = z.object({
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
  total: z.number().int().min(0),
  totalPages: z.number().int().min(0),
});

export const ApiFieldErrorSchema = z.object({
  field: z.string().min(1),
  message: z.string().min(1),
  code: z.string().min(1).optional(),
});

export const ApiErrorResponseSchema = z.object({
  code: z.string().min(1),
  message: z.string().min(1),
  fieldErrors: z.array(ApiFieldErrorSchema).optional(),
  requestId: z.string().min(1).optional(),
});

export type EthAmount = z.infer<typeof EthAmountSchema>;
export type Quantity = z.infer<typeof QuantitySchema>;
export type Network = z.infer<typeof NetworkSchema>;
export type Pagination = z.infer<typeof PaginationSchema>;
export type ApiFieldError = z.infer<typeof ApiFieldErrorSchema>;
export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;
