import { z } from 'zod';

export const PlanCodeSchema = z.enum(['TESTE', 'STARTER', 'PRO', 'POWER', 'ENTERPRISE']);
export type PlanCode = z.infer<typeof PlanCodeSchema>;

export const PlanSchema = z.object({
  id: z.string().uuid(),
  code: PlanCodeSchema,
  displayName: z.string(),
  priceCents: z.number().int().nonnegative(),
  durationHours: z.number().int().positive(),
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

/**
 * Format a duration in hours as a pt-BR label.
 *   24  → "24h"
 *   72  → "3 dias"
 *   168 → "7 dias"
 *   720 → "30 dias"
 */
export function formatPlanDuration(hours: number): string {
  if (hours < 24) return `${hours}h`;
  const d = hours / 24;
  return d === 1 ? '1 dia' : `${d} dias`;
}

/**
 * Remaining time on an active subscription, formatted as pt-BR.
 *   < 24h → "Xh Ymin"
 *   >= 24h → "Xd Yh"
 * Returns "expirado" if expiresAt is in the past.
 */
export function formatRemainingTime(expiresAt: string | Date): string {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return 'expirado';
  const totalMinutes = Math.floor(ms / 60_000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}min`;
  return `${minutes}min`;
}