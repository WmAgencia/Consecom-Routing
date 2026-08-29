import type { FastifyInstance } from 'fastify';
import { sql, eq, and, desc, gte, lte, count } from 'drizzle-orm';
import * as s from '@consecom/db';
import { requireAdmin } from './auth.js';

/**
 * Master Panel API — admin-only routes. All require a valid admin cookie.
 */
export async function registerAdminApi(app: FastifyInstance) {
  const db = app.db;

  // Dashboard aggregates
  app.get('/v1/admin/dashboard', async (req) => {
    await requireAdmin(req);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [revenueToday] = await db
      .select({ total: sql<number>`COALESCE(SUM(${s.payments.amountCents}), 0)::int` })
      .from(s.payments)
      .where(and(eq(s.payments.status, 'paid'), gte(s.payments.paidAt, todayStart)));

    const [customersActive] = await db
      .select({ total: count() })
      .from(s.customers)
      .where(eq(s.customers.status, 'active'));

    const [requestsToday] = await db
      .select({ total: count() })
      .from(s.usageEvents)
      .where(gte(s.usageEvents.createdAt, todayStart));

    const [costToday] = await db
      .select({ total: sql<number>`COALESCE(SUM(${s.usageEvents.costCents}), 0)::int` })
      .from(s.usageEvents)
      .where(and(gte(s.usageEvents.createdAt, todayStart), eq(s.usageEvents.status, 'success')));

    const [errorsToday] = await db
      .select({ total: count() })
      .from(s.usageEvents)
      .where(and(gte(s.usageEvents.createdAt, todayStart), eq(s.usageEvents.status, 'error')));

    const margin = (revenueToday?.total ?? 0) - (costToday?.total ?? 0);

    // Top models by token volume (last 7d)
    const topModels = await db
      .select({
        modelId: s.usageEvents.modelId,
        total: sql<number>`SUM(${s.usageEvents.totalTokens})::int`,
      })
      .from(s.usageEvents)
      .where(gte(s.usageEvents.createdAt, new Date(Date.now() - 7 * 86_400_000)))
      .groupBy(s.usageEvents.modelId)
      .orderBy(desc(sql`SUM(${s.usageEvents.totalTokens})`))
      .limit(5);

    const modelMap = new Map(
      (await db.select().from(s.models)).map((m) => [m.id, m]),
    );

    return {
      revenueCents: revenueToday?.total ?? 0,
      customersActive: customersActive?.total ?? 0,
      requestsToday: requestsToday?.total ?? 0,
      costCents: costToday?.total ?? 0,
      marginCents: margin,
      errorsToday: errorsToday?.total ?? 0,
      topModels: topModels.map((t) => ({
        model: modelMap.get(t.modelId)?.code ?? t.modelId,
        totalTokens: t.total,
      })),
    };
  });

  // List customers
  app.get('/v1/admin/customers', async (req) => {
    await requireAdmin(req);
    const rows = await db
      .select({
        id: s.users.id,
        email: s.users.email,
        name: s.users.name,
        status: s.users.status,
        createdAt: s.users.createdAt,
        customerStatus: s.customers.status,
      })
      .from(s.users)
      .innerJoin(s.customers, eq(s.customers.id, s.users.id))
      .where(eq(s.users.role, 'customer'))
      .orderBy(desc(s.users.createdAt))
      .limit(200);

    // Enrich with plan + balance summary
    const enriched = await Promise.all(
      rows.map(async (r) => {
        const [sub] = await db
          .select({ plan: s.plans, sub: s.subscriptions })
          .from(s.subscriptions)
          .innerJoin(s.plans, eq(s.plans.id, s.subscriptions.planId))
          .where(eq(s.subscriptions.customerId, r.id))
          .orderBy(desc(s.subscriptions.startedAt))
          .limit(1);
        const [bal] = await db
          .select()
          .from(s.creditBalances)
          .where(eq(s.creditBalances.customerId, r.id))
          .limit(1);
        return {
          ...r,
          planCode: sub?.plan.code ?? null,
          subscriptionStatus: sub?.sub.status ?? null,
          expiresAt: sub?.sub.expiresAt ?? null,
          creditsAvailable: bal?.creditsAvailable ?? 0,
          creditsUsed: bal?.creditsUsed ?? 0,
        };
      }),
    );
    return { data: enriched };
  });

  // Single customer detail
  app.get<{ Params: { id: string } }>('/v1/admin/customers/:id', async (req) => {
    await requireAdmin(req);
    const id = req.params.id;
    const [row] = await db
      .select()
      .from(s.users)
      .where(eq(s.users.id, id))
      .limit(1);
    if (!row) throw new Error('not found');

    const [customer] = await db
      .select()
      .from(s.customers)
      .where(eq(s.customers.id, id))
      .limit(1);
    const [balance] = await db
      .select()
      .from(s.creditBalances)
      .where(eq(s.creditBalances.customerId, id))
      .limit(1);
    const keys = await db
      .select()
      .from(s.apiKeys)
      .where(eq(s.apiKeys.customerId, id))
      .orderBy(desc(s.apiKeys.createdAt));
    const recentUsage = await db
      .select()
      .from(s.usageEvents)
      .where(eq(s.usageEvents.customerId, id))
      .orderBy(desc(s.usageEvents.createdAt))
      .limit(50);

    // Active subscription + plan (most recent, regardless of status)
    const subRows = await db
      .select({ subscription: s.subscriptions, plan: s.plans })
      .from(s.subscriptions)
      .innerJoin(s.plans, eq(s.plans.id, s.subscriptions.planId))
      .where(eq(s.subscriptions.customerId, id))
      .orderBy(desc(s.subscriptions.startedAt))
      .limit(1);
    const activeSub = subRows[0] ?? null;

    return {
      user: row,
      customer,
      balance,
      subscription: activeSub?.subscription ?? null,
      plan: activeSub?.plan ?? null,
      apiKeys: keys.map((k) => ({
        id: k.id,
        name: k.name,
        keyPrefix: k.keyPrefix,
        status: k.status,
        createdAt: k.createdAt,
        requestCount: k.requestCount,
      })),
      recentUsage: recentUsage.map((u) => ({
        requestId: u.requestId,
        modelId: u.modelId,
        inputTokens: u.inputTokens,
        outputTokens: u.outputTokens,
        creditsConsumed: u.creditsConsumed,
        costCents: u.costCents,
        latencyMs: u.latencyMs,
        status: u.status,
        createdAt: u.createdAt,
      })),
    };
  });

  // Toggle customer status (suspend / unsuspend)
  app.post<{ Params: { id: string } }>('/v1/admin/customers/:id/toggle', async (req) => {
    const admin = await requireAdmin(req);
    const id = req.params.id;
    const body = (req.body ?? {}) as { status?: 'active' | 'suspended' };
    if (!body.status || (body.status !== 'active' && body.status !== 'suspended')) {
      throw new Error('invalid status');
    }
    await db
      .update(s.users)
      .set({ status: body.status })
      .where(eq(s.users.id, id));
    await db
      .update(s.customers)
      .set({ status: body.status })
      .where(eq(s.customers.id, id));
    await db.insert(s.auditLogs).values({
      adminUserId: admin.sub,
      action: body.status === 'suspended' ? 'customer_suspend' : 'customer_unsuspend',
      targetType: 'customer',
      targetId: id,
      metadata: { adminEmail: admin.email },
    });
    return { ok: true };
  });

  // ---------------------------------------------------------------------------
  // Master Panel — manual controls (independent of Stripe)
  // ---------------------------------------------------------------------------

  // Activate / renew a plan for any customer (no Stripe required).
  app.post<{ Params: { id: string } }>(
    '/v1/admin/customers/:id/activate-plan',
    async (req) => {
      const admin = await requireAdmin(req);
      const id = req.params.id;
      const body = (req.body ?? {}) as { planCode?: string };
      if (!body.planCode) throw new Error('planCode is required');

      const { BillingService } = await import('../../services/billing.js');
      const billing = new BillingService(db);
      const result = await billing.activatePlan(id, body.planCode, { gateway: 'manual' });

      await db.insert(s.auditLogs).values({
        adminUserId: admin.sub,
        action: 'plan_manual_activate',
        targetType: 'customer',
        targetId: id,
        metadata: {
          adminEmail: admin.email,
          planCode: body.planCode,
          paymentId: result.payment.id,
          subscriptionId: result.subscription.id,
          apiKeyId: result.apiKey?.id,
        },
      });

      return {
        ok: true,
        subscription: result.subscription,
        payment: result.payment,
        apiKey: result.apiKey,
      };
    },
  );

  // Create an API key for any customer (admin-minted).
  app.post<{ Params: { id: string } }>(
    '/v1/admin/customers/:id/api-keys',
    async (req) => {
      const admin = await requireAdmin(req);
      const id = req.params.id;
      const body = (req.body ?? {}) as { name?: string; expiresInDays?: number };
      if (!body.name || !body.name.trim()) throw new Error('name is required');

      const { ApiKeyService } = await import('../../services/api-key.js');
      const apiKeyService = new ApiKeyService(db);
      const created = await apiKeyService.create(
        id,
        body.name.trim(),
        body.expiresInDays,
      );

      await db.insert(s.auditLogs).values({
        adminUserId: admin.sub,
        action: 'api_key_create_manual',
        targetType: 'customer',
        targetId: id,
        metadata: {
          adminEmail: admin.email,
          apiKeyId: created.id,
          keyPrefix: created.keyPrefix,
          name: body.name,
        },
      });

      return created; // contains the full key, shown once
    },
  );

  // Revoke any API key by id (admin override).
  app.post<{ Params: { id: string } }>(
    '/v1/admin/api-keys/:id/revoke',
    async (req) => {
      const admin = await requireAdmin(req);
      const keyId = req.params.id;

      // Look up the key to discover its owner.
      const [key] = await db
        .select()
        .from(s.apiKeys)
        .where(eq(s.apiKeys.id, keyId))
        .limit(1);
      if (!key) throw new Error('api key not found');

      const { ApiKeyService } = await import('../../services/api-key.js');
      const apiKeyService = new ApiKeyService(db);
      await apiKeyService.revoke(key.customerId, keyId);

      await db.insert(s.auditLogs).values({
        adminUserId: admin.sub,
        action: 'api_key_revoke_manual',
        targetType: 'api_key',
        targetId: keyId,
        metadata: {
          adminEmail: admin.email,
          customerId: key.customerId,
          keyPrefix: key.keyPrefix,
        },
      });

      return { ok: true };
    },
  );

  // Adjust credits
  app.post<{ Params: { id: string } }>('/v1/admin/customers/:id/credits', async (req) => {
    const admin = await requireAdmin(req);
    const id = req.params.id;
    const body = (req.body ?? {}) as { delta?: number; description?: string };
    if (typeof body.delta !== 'number' || body.delta === 0) {
      throw new Error('delta must be non-zero number');
    }
    const { CreditService } = await import('../../services/credits.js');
    const cs = new CreditService(db);
    await cs.grant(
      id,
      Math.abs(body.delta),
      'admin_adjustment',
      'admin',
      admin.sub,
      `${body.description ?? 'admin adjustment'} (delta=${body.delta})`,
    );
    await db.insert(s.auditLogs).values({
      adminUserId: admin.sub,
      action: 'credits_adjust',
      targetType: 'credit_balance',
      targetId: id,
      metadata: { adminEmail: admin.email, delta: body.delta, description: body.description },
    });
    return { ok: true };
  });

  // Plans CRUD
  app.get('/v1/admin/plans', async (req) => {
    await requireAdmin(req);
    const rows = await db.select().from(s.plans).orderBy(s.plans.priceCents);
    return { data: rows };
  });
  app.post<{ Params: { id: string } }>('/v1/admin/plans/:id', async (req) => {
    const admin = await requireAdmin(req);
    const id = req.params.id;
    const patch = (req.body ?? {}) as Partial<{
      priceCents: number;
      credits: number;
      rateLimitPerMin: number;
      active: boolean;
      modelsAllowed: string[];
    }>;
    await db.update(s.plans).set(patch).where(eq(s.plans.id, id));
    await db.insert(s.auditLogs).values({
      adminUserId: admin.sub,
      action: 'plan_update',
      targetType: 'plan',
      targetId: id,
      metadata: { adminEmail: admin.email, patch },
    });
    return { ok: true };
  });

  // Models list + toggle
  app.get('/v1/admin/models', async (req) => {
    await requireAdmin(req);
    const rows = await db.select().from(s.models).orderBy(s.models.code);
    const providers = await db.select().from(s.providers);
    const pmap = new Map(providers.map((p) => [p.id, p]));
    return {
      data: rows.map((m) => ({
        ...m,
        providerCode: pmap.get(m.providerId)?.code ?? 'unknown',
      })),
    };
  });
  app.post<{ Params: { id: string } }>('/v1/admin/models/:id/toggle', async (req) => {
    const admin = await requireAdmin(req);
    const id = req.params.id;
    const [m] = await db.select().from(s.models).where(eq(s.models.id, id)).limit(1);
    if (!m) throw new Error('model not found');
    const newStatus = m.status === 'active' ? 'disabled' : 'active';
    await db.update(s.models).set({ status: newStatus }).where(eq(s.models.id, id));
    await db.insert(s.auditLogs).values({
      adminUserId: admin.sub,
      action: newStatus === 'active' ? 'model_enable' : 'model_disable',
      targetType: 'model',
      targetId: id,
      metadata: { adminEmail: admin.email, code: m.code },
    });
    return { ok: true, status: newStatus };
  });

  // Providers
  app.get('/v1/admin/providers', async (req) => {
    await requireAdmin(req);
    const rows = await db.select().from(s.providers);
    return { data: rows };
  });

  // Cost margin aggregation
  app.get('/v1/admin/costs', async (req) => {
    await requireAdmin(req);
    const since = new Date(Date.now() - 30 * 86_400_000);
    const rows = await db
      .select({
        customerId: s.usageEvents.customerId,
        revenueCents: sql<number>`0::int`,
        costCents: sql<number>`SUM(${s.usageEvents.costCents})::int`,
        totalTokens: sql<number>`SUM(${s.usageEvents.totalTokens})::int`,
      })
      .from(s.usageEvents)
      .where(gte(s.usageEvents.createdAt, since))
      .groupBy(s.usageEvents.customerId);

    // Enrich with revenue from payments.
    const userMap = new Map(
      (await db.select({ id: s.users.id, email: s.users.email, name: s.users.name }).from(s.users))
        .map((u) => [u.id, u]),
    );
    const paymentSums = await db
      .select({
        customerId: s.payments.customerId,
        revenue: sql<number>`SUM(${s.payments.amountCents})::int`,
      })
      .from(s.payments)
      .where(and(eq(s.payments.status, 'paid'), gte(s.payments.paidAt, since)))
      .groupBy(s.payments.customerId);
    const revenueMap = new Map(paymentSums.map((p) => [p.customerId, p.revenue]));

    return {
      data: rows.map((r) => ({
        customerId: r.customerId,
        user: userMap.get(r.customerId),
        revenueCents: revenueMap.get(r.customerId) ?? 0,
        costCents: r.costCents,
        marginCents: (revenueMap.get(r.customerId) ?? 0) - r.costCents,
        totalTokens: r.totalTokens,
      })),
    };
  });

  // Audit logs (read-only)
  app.get('/v1/admin/audit-logs', async (req) => {
    await requireAdmin(req);
    const rows = await db
      .select()
      .from(s.auditLogs)
      .orderBy(desc(s.auditLogs.createdAt))
      .limit(200);
    return { data: rows };
  });
}