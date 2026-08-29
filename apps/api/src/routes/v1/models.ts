import type { FastifyInstance } from 'fastify';
import { eq, and } from 'drizzle-orm';
import * as s from '@consecom/db';
import { SubscriptionService } from '../../services/subscription.js';

/**
 * GET /v1/models — list models the customer can use on their current plan.
 * Public: requires Bearer token.
 */
export async function registerModelsRoutes(app: FastifyInstance) {
  const db = app.db;
  const subscriptionService = new SubscriptionService(db);

  app.get('/models', async (req) => {
    // Reuse the auth pattern from chat.ts but lighter — we only need the customer id.
    const { ApiKeyService, extractBearer } = await import('../../services/api-key.js');
    const apiKeyService = new ApiKeyService(db);

    const presented = extractBearer(req.headers.authorization);
    if (!presented) {
      throw (await import('@consecom/shared')).errors.unauthorized();
    }
    const keyRow = await apiKeyService.findByPrefix(presented);
    if (!keyRow) throw (await import('@consecom/shared')).errors.unauthorized();
    const ok = await apiKeyService.verify(presented, keyRow.keyHash);
    if (!ok) throw (await import('@consecom/shared')).errors.unauthorized();

    const { plan } = await subscriptionService.getActive(keyRow.customerId);

    const allModels = await db
      .select()
      .from(s.models)
      .where(eq(s.models.status, 'active'));
    const providerMap = new Map(
      (await db.select().from(s.providers)).map((p) => [p.id, p]),
    );

    return {
      object: 'list',
      data: allModels.map((m) => ({
        id: m.code,
        object: 'model',
        created: Math.floor(m.createdAt.getTime() / 1000),
        owned_by: providerMap.get(m.providerId)?.code ?? 'unknown',
        display_name: m.displayName,
        available: plan.modelsAllowed.includes(m.code),
        capabilities: m.capabilities ?? {},
      })),
    };
  });
}

// silence unused import warning for `and`
void and;
