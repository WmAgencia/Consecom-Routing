import { z } from 'zod';

export const PaymentStatusSchema = z.enum(['pending', 'paid', 'failed', 'refunded']);
export type PaymentStatus = z.infer<typeof PaymentStatusSchema>;

export const CheckoutSessionResponseSchema = z.object({
  checkoutUrl: z.string().url(),
  sessionId: z.string(),
});
export type CheckoutSessionResponse = z.infer<typeof CheckoutSessionResponseSchema>;
