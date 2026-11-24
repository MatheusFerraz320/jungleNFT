import { z } from 'zod';
import { OrderSchema } from './order';
import { NftSummarySchema } from './nft';

export const EventMetaSchema = z.object({
  eventId: z.string().min(1),
  resourceType: z.enum(['nft', 'order', 'scene']),
  resourceId: z.string().min(1),
  version: z.number().int().min(1),
  sessionId: z.string().nullable(),
  occurredAt: z.iso.datetime(),
});

export const RealtimeReadyEventSchema = z.object({
  type: z.literal('scene.ready'),
  meta: EventMetaSchema.extend({ resourceType: z.literal('scene') }),
  payload: z.object({
    scenario: z.string().min(1),
    serverVersion: z.number().int().min(1),
  }),
});

export const NftUpdatedEventSchema = z.object({
  type: z.literal('nft.updated'),
  meta: EventMetaSchema.extend({ resourceType: z.literal('nft') }),
  payload: z.object({
    nft: NftSummarySchema,
  }),
});

export const OrderUpdatedEventSchema = z.object({
  type: z.literal('order.updated'),
  meta: EventMetaSchema.extend({ resourceType: z.literal('order') }),
  payload: z.object({
    orderId: z.string().min(1),
    order: OrderSchema,
  }),
});

export const RealtimeEventSchema = z.discriminatedUnion('type', [
  RealtimeReadyEventSchema,
  NftUpdatedEventSchema,
  OrderUpdatedEventSchema,
]);

export type EventMeta = z.infer<typeof EventMetaSchema>;
export type RealtimeReadyEvent = z.infer<typeof RealtimeReadyEventSchema>;
export type NftUpdatedEvent = z.infer<typeof NftUpdatedEventSchema>;
export type OrderUpdatedEvent = z.infer<typeof OrderUpdatedEventSchema>;
export type RealtimeEvent = z.infer<typeof RealtimeEventSchema>;
