import { eq, and } from 'drizzle-orm';
import type { Db } from '@consecom/db';
import * as s from '@consecom/db';
import { errors, CreateCheckoutSchema } from '@consecom/shared';
import { getStripe, isStripeConfigured } from '../lib/stripe.js';
import { CreditService } from './credits.js';
import { ApiKeyService } from './api-key.js';

const PLAN_TO_PRICE_ENV: Record<string, string | undefined> = {
  TESTE: process.env.STRIPE_PRICE_ID_TESTE,
  STARTER: process.env.STRIPE_PRICE_ID_STARTER,
  PRO: process.env.STRIPE_PRICE_ID_PRO,
  POWER: process.env.STRIPE_PRICE_ID_POWER,
};

/**
 * BillingService — Stripe checkout, webhook activation, plan management.
 *
 * On `checkout.session.completed`:
 *   1. Mark payment as paid
 *   2. Insert credit_ledger entry (+credits)
 *   3. Create subscription (or activate existing pending one)
 *   4. Create a default API key for the customer
 *
 * Webhook handlers verify Stripe signature and use `stripe_events` for
 * idempotency (a re-delivered event returns 200 immediately).
 */
export class BillingService {
  constructor(
    private db: Db,
    private credits: CreditService = new CreditService(db),
    private apiKeys: ApiKeyService = new ApiKeyService(db),
  ) {}

  async createCheckoutSession(input: { customerId: string; planCode: string; email: string; name: string }) {
    if (!isStripeConfigured()) {
      throw errors.internal(
        'Stripe não está configurado no servidor. Configure STRIPE_SECRET_KEY e STRIPE_WEBHOOK_SECRET.',
      );
    }
    const { planCode } = CreateCheckoutSchema.parse(input);
    const priceId = PLAN_TO_PRICE_ENV[planCode];
    if (!priceId) {
      throw errors.notFound(
        `Plano ${planCode} não tem um Stripe Price ID configurado (STRIPE_PRICE_ID_${planCode})`,
      );
    }

    const [plan] = await this.db
      .select()
      .from(s.plans)
      .where(and(eq(s.plans.code, planCode), eq(s.plans.active, true)))
      .limit(1);
    if (!plan) throw errors.notFound(`Plano ${planCode} não está ativo`);

    const stripe = getStripe();

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: input.email,
      success_url: `${process.env.PUBLIC_WEB_URL ?? 'http://localhost:3000'}/dashboard/billing?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.PUBLIC_WEB_URL ?? 'http://localhost:3000'}/dashboard/billing?cancelled=1`,
      metadata: {
        customerId: input.customerId,
        planId: plan.id,
        planCode: plan.code,
      },
    });

    // Persist a pending payment row so the webhook can resolve it.
    await this.db.insert(s.payments).values({
      customerId: input.customerId,
      gateway: 'stripe',
      gatewayPaymentId: session.id,
      gatewaySessionId: session.id,
      amountCents: plan.priceCents,
      currency: 'BRL',
      status: 'pending',
      rawPayload: { checkoutSessionId: session.id, planCode: plan.code, planId: plan.id },
    });

    return {
      checkoutUrl: session.url ?? '',
      sessionId: session.id,
    };
  }

  /**
   * Verify webhook signature and return the parsed event.
   * Stripe provides at-least-once delivery; we use the events table to dedupe.
   */
  async handleWebhook(rawBody: string, signature: string): Promise<{ received: true; handled: boolean }> {
    if (!isStripeConfigured()) {
      throw errors.internal('Stripe não está configurado');
    }
    const stripe = getStripe();
    const event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );

    // Idempotency: if we've seen this event id before, return early.
    const existing = await this.db
      .select()
      .from(s.stripeEvents)
      .where(eq(s.stripeEvents.eventId, event.id))
      .limit(1);
    if (existing.length > 0) {
      return { received: true, handled: false };
    }

    // Persist the event BEFORE handling, so a crash mid-handler is replayable.
    await this.db.insert(s.stripeEvents).values({
      eventId: event.id,
      eventType: event.type,
      payload: event as unknown as Record<string, unknown>,
    });

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as import('stripe').Stripe.Checkout.Session;
        await this.activateFromCheckout(session);
        break;
      }
      case 'checkout.session.expired':
      case 'payment_intent.payment_failed': {
        // Mark the payment as failed (best-effort).
        const obj = event.data.object as { id?: string };
        if (obj.id) {
          await this.db
            .update(s.payments)
            .set({ status: 'failed', updatedAt: new Date() })
            .where(eq(s.payments.gatewayPaymentId, obj.id));
        }
        break;
      }
      default:
        // Other events are recorded but not handled in MVP.
        break;
    }

    return { received: true, handled: true };
  }

  private async activateFromCheckout(session: import('stripe').Stripe.Checkout.Session) {
    const customerId = session.metadata?.customerId;
    const planId = session.metadata?.planId;
    const planCode = session.metadata?.planCode;
    if (!customerId || !planId || !planCode) {
      throw new Error(`checkout.session.completed missing metadata: ${session.id}`);
    }

    // Mark payment paid.
    const [payment] = await this.db
      .update(s.payments)
      .set({ status: 'paid', paidAt: new Date(), updatedAt: new Date() })
      .where(eq(s.payments.gatewayPaymentId, session.id))
      .returning();
    if (!payment) {
      // payment row not found — log and bail; reconciliation can fix later.
      console.warn('[billing] payment row not found for session', session.id);
      return;
    }

    // Load plan to know credits + duration.
    const [plan] = await this.db
      .select()
      .from(s.plans)
      .where(eq(s.plans.id, planId))
      .limit(1);
    if (!plan) throw new Error(`plan not found: ${planId}`);

    // Idempotency for the activation step: if a subscription already exists
    // for this plan + payment, skip creating another.
    const existingSub = await this.db
      .select()
      .from(s.subscriptions)
      .where(and(
        eq(s.subscriptions.customerId, customerId),
        eq(s.subscriptions.planId, plan.id),
      ))
      .limit(1);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + plan.durationDays * 86_400_000);

    if (existingSub.length > 0) {
      await this.db
        .update(s.subscriptions)
        .set({
          status: 'active',
          startedAt: now,
          expiresAt,
          cancelledAt: null,
        })
        .where(eq(s.subscriptions.id, existingSub[0]!.id));
    } else {
      await this.db.insert(s.subscriptions).values({
        customerId,
        planId: plan.id,
        status: 'active',
        startedAt: now,
        expiresAt,
      });
    }

    // Grant credits.
    await this.credits.grant(
      customerId,
      plan.credits,
      'purchase',
      'payment',
      payment.id,
      `Plano ${plan.displayName} (${planCode})`,
    );

    // Stamp payment with subscription reference.
    const [newSub] = await this.db
      .select()
      .from(s.subscriptions)
      .where(and(
        eq(s.subscriptions.customerId, customerId),
        eq(s.subscriptions.planId, plan.id),
      ))
      .limit(1);
    if (newSub) {
      await this.db
        .update(s.payments)
        .set({ subscriptionId: newSub.id })
        .where(eq(s.payments.id, payment.id));
    }

    // Mint a default API key so the customer can use the API right away.
    const existingKeys = await this.apiKeys.list(customerId);
    if (existingKeys.length === 0) {
      await this.apiKeys.create(customerId, 'default');
    }
  }
}
