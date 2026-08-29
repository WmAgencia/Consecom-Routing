import type { FastifyInstance, FastifyRequest } from 'fastify';
import { desc } from 'drizzle-orm';
import { eq } from 'drizzle-orm';
import * as s from '@consecom/db';
import { tenantScoped } from '@consecom/db';
import { errors } from '@consecom/shared';

/**
 * GET /v1/usage — list usage events for the customer (dashboard).
 * Auth: session cookie.
 */
export async function registerUsageRoutes(app: FastifyInstance) {
  const db = app.db;

  async function userId(req: FastifyRequest): Promise<string> {
    const { verifyAccessToken } = await import('../../lib/auth.js');
    const token = req.cookies['__consecom_session'];
    if (!token) throw errors.unauthorized();
    const claims = await verifyAccessToken(token);
    return claims.sub;
  }

  app.get('/usage', async (req) => {
    const customerId = await userId(req);
    const scoped = tenantScoped(db, customerId);

    const limit = Math.min(Number((req.query as Record<string, unknown>).limit ?? 50), 200);
    const events = await db
      .select()
      .from(s.usageEvents)
      .where(eq(s.usageEvents.customerId, customerId))
      .orderBy(desc(s.usageEvents.createdAt))
      .limit(limit);

    const balance = await scoped.getCreditBalance();

    return {
      data: events.map((e) => ({
        id: e.id,
        requestId: e.requestId,
        modelId: e.modelId,
        inputTokens: e.inputTokens,
        outputTokens: e.outputTokens,
        totalTokens: e.totalTokens,
        creditsConsumed: e.creditsConsumed,
        costCents: e.costCents,
        latencyMs: e.latencyMs,
        status: e.status,
        errorCode: e.errorCode,
        createdAt: e.createdAt.toISOString(),
      })),
      balance: balance
        ? {
            available: balance.creditsAvailable,
            reserved: balance.creditsReserved,
            used: balance.creditsUsed,
          }
        : { available: 0, reserved: 0, used: 0 },
    };
  });
}
