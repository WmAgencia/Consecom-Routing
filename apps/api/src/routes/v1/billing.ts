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

  app.get('/v1/billing/plans', async () => {
    const rows = await db
      .select()
      .from(s.plans)
      .where(eq(s.plans.active, true));
    return { data: rows };
  });

  app.post('/v1/billing/checkout', async (req) => {
    const customerId = await userId(req);
    const [user] = await db
      .select()
      .from(s.users)
      .where(eq(s.users.id, customerId))
      .limit(1);
    if (!user) throw errors.unauthorized();
    const body = (req.body ?? {}) as { planCode?: string };
    if (!body.planCode) throw errors.validation('planCode is required');
    return billing.createCheckoutSession({
      customerId,
      planCode: body.planCode,
      email: user.email,
      name: user.name,
    });
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
