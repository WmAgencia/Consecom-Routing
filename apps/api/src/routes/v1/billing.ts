import type { FastifyInstance, FastifyRequest } from 'fastify';
import { eq } from 'drizzle-orm';
import * as s from '@consecom/db';
import { errors, CreateCheckoutSchema } from '@consecom/shared';

/**
 * GET /v1/billing/plan — current plan + subscription
 * POST /v1/billing/checkout — start Stripe checkout (Phase 4 wires the real flow)
 *
 * Phase 2 ships the routes but checkout is a placeholder that returns 501.
 */
export async function registerBillingRoutes(app: FastifyInstance) {
  const db = app.db;

  async function userId(req: FastifyRequest): Promise<string> {
    const { verifyAccessToken } = await import('../../lib/auth.js');
    const token = req.cookies['__consecom_session'];
    if (!token) throw errors.unauthorized();
    const claims = await verifyAccessToken(token);
    return claims.sub;
  }

  app.get('/billing/plan', async (req) => {
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

  app.post('/billing/checkout', async (req) => {
    const _input = CreateCheckoutSchema.parse(req.body);
    // Phase 4 — real Stripe checkout session goes here.
    return {
      error: 'not_implemented',
      message: 'Stripe checkout wiring arrives in Phase 4',
    };
  });
}
