import { z } from 'zod';

export const PlanCodeSchema = z.enum(['TESTE', 'STARTER', 'PRO', 'POWER']);
export type PlanCode = z.infer<typeof PlanCodeSchema>;

export const PlanSchema = z.object({
  id: z.string().uuid(),
  code: PlanCodeSchema,
  displayName: z.string(),
  priceCents: z.number().int().nonnegative(),
  durationDays: z.number().int().positive(),
  credits: z.number().int().nonnegative(),
  rateLimitPerMin: z.number().int().positive(),
  modelsAllowed: z.array(z.string()),
  active: z.boolean(),
});
export type Plan = z.infer<typeof PlanSchema>;

export const SubscriptionStatusSchema = z.enum([
  'active',
  'expired',
  'cancelled',
  'pending_payment',
]);
export type SubscriptionStatus = z.infer<typeof SubscriptionStatusSchema>;

export const SubscriptionSchema = z.object({
  id: z.string().uuid(),
  customerId: z.string().uuid(),
  planId: z.string().uuid(),
  status: SubscriptionStatusSchema,
  startedAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
});
export type Subscription = z.infer<typeof SubscriptionSchema>;

export const CreateCheckoutSchema = z.object({
  planCode: PlanCodeSchema,
});
export type CreateCheckoutInput = z.infer<typeof CreateCheckoutSchema>;
