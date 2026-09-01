import type { FastifyInstance, FastifyRequest } from 'fastify';
import { eq } from 'drizzle-orm';
import * as s from '@consecom/db';
import { errors } from '@consecom/shared';
import { BillingService } from '../../services/billing.js';

export async function registerBillingRoutes(app: FastifyInstance) {
  const db = app.db;
  const billing = new BillingService(db);

  async function userId(req: FastifyRequest): Promise<string> {
    const { verifyAccessToken } = await import('../../lib/auth.js');
    const token = req.cookies['__consecom_session'];
    if (!token) throw errors.unauthorized();
    const claims = await verifyAccessToken(token);
    return claims.sub;
  }

  app.get('/v1/billing/plan', async (req) => {
    const customerId = await userId(req);
    const [sub] = await db
      .select({ subscription: s.subscriptions, plan: s.plans })
      .from(s.subscriptions)
      .innerJoin(s.plans, eq(s.subscriptions.planId, s.plans.id))
      .where(eq(s.subscriptions.customerId, customerId))
      .orderBy(s.subscriptions.startedAt)
      .limit(1);
    return sub ?? null;
  });

  /**
   * Lightweight endpoint used by the marketing site to gate community access.
   * Returns `{ active: boolean }` — true iff the caller has a subscription
   * whose `status === 'active'` and `expiresAt > now`.
   */
  app.get('/v1/billing/active', async (req) => {
    const customerId = await userId(req);
    const [sub] = await db
      .select({ status: s.subscriptions.status, expiresAt: s.subscriptions.expiresAt })
      .from(s.subscriptions)
      .where(eq(s.subscriptions.customerId, customerId))
      .orderBy(s.subscriptions.startedAt)
      .limit(1);
    if (!sub) return { active: false };
    const isActive =
      sub.status === 'active' && new Date(sub.expiresAt).getTime() > Date.now();
    return { active: isActive };
  });

  app.get('/v1/billing/plans', async () => {
    const rows = await db
      .select()
      .from(s.plans)
      .where(eq(s.plans.active, true));
    return { data: rows };
  });

  app.post('/v1/billing/checkout', async () => {
    // Stripe checkout is temporarily disabled while the business model moves
    // to time-based plans with unlimited usage. Stripe's standard checkout
    // doesn't fit this shape; activation now happens via the Master Panel.
    throw errors.internal(
      'Checkout Stripe temporariamente desativado. Planos agora são por tempo com uso ilimitado — solicite a ativação via Master Panel.',
    );
  });
}

/**
 * Webhook route — mounted at /v1/webhooks/stripe (no auth, signed).
 * Receives the raw body, which is required for Stripe signature verification.
 */
export async function registerStripeWebhook(app: FastifyInstance) {
  const db = app.db;
  const billing = new BillingService(db);

  app.post('/v1/webhooks/stripe', {
    config: {
      // Stripe needs the raw body to verify the signature.
      rawBody: true,
    },
  }, async (req, reply) => {
    const signature = req.headers['stripe-signature'];
    if (!signature || typeof signature !== 'string') {
      return reply.status(400).send({ error: 'missing signature' });
    }
    const raw = (req as unknown as { rawBody?: Buffer }).rawBody;
    if (!raw) {
      return reply.status(400).send({ error: 'missing body' });
    }
    try {
      const result = await billing.handleWebhook(raw.toString('utf8'), signature);
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'webhook failed';
      req.log.error({ err }, 'stripe webhook failed');
      return reply.status(400).send({ error: msg });
    }
  });
}
