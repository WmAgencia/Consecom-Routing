import { eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import type { Db } from '@consecom/db';
import * as s from '@consecom/db';

/**
 * UsageService — records usage events and request logs.
 * One row per /v1/chat/completions call (success OR error).
 * `request_id` is the trace id that connects the log row to the ledger row.
 */
export class UsageService {
  constructor(private db: Db) {}

  async recordUsage(input: {
    customerId: string;
    apiKeyId: string;
    modelId: string;
    providerId: string;
    requestId: string;
    inputTokens: number;
    outputTokens: number;
    creditsConsumed: number;
    costCents: number;
    latencyMs: number;
    status: 'success' | 'error' | 'rate_limited';
    errorCode?: string;
  }): Promise<void> {
    // Defensive: coerce all numeric fields to safe integers. NaN/undefined
    // would otherwise raise Postgres 22P02 "invalid input syntax for type integer".
    const safeInputTokens = Number.isFinite(input.inputTokens) ? Math.max(0, Math.round(input.inputTokens)) : 0;
    const safeOutputTokens = Number.isFinite(input.outputTokens) ? Math.max(0, Math.round(input.outputTokens)) : 0;
    const safeCreditsConsumed = Number.isFinite(input.creditsConsumed) ? Math.max(0, Math.round(input.creditsConsumed)) : 0;
    const safeCostCents = Number.isFinite(input.costCents) ? Math.max(0, Math.round(input.costCents)) : 0;
    const safeLatencyMs = Number.isFinite(input.latencyMs) ? Math.max(0, Math.round(input.latencyMs)) : 0;
    await this.db.insert(s.usageEvents).values({
      id: randomUUID(),
      customerId: input.customerId,
      apiKeyId: input.apiKeyId,
      modelId: input.modelId,
      providerId: input.providerId,
      requestId: input.requestId,
      inputTokens: safeInputTokens,
      outputTokens: safeOutputTokens,
      totalTokens: safeInputTokens + safeOutputTokens,
      creditsConsumed: safeCreditsConsumed,
      costCents: safeCostCents,
      latencyMs: safeLatencyMs,
      status: input.status,
      errorCode: input.errorCode ?? null,
    });
  }

  async recordRequest(input: {
    requestId: string;
    customerId: string | null;
    apiKeyId: string | null;
    endpoint: string;
    method: string;
    statusCode: number;
    latencyMs: number;
    errorCode?: string | undefined;
    payloadMeta?: Record<string, unknown> | undefined;
    ip?: string | undefined;
    userAgent?: string | undefined;
  }): Promise<void> {
    const safeLatencyMs = Number.isFinite(input.latencyMs) ? Math.max(0, Math.round(input.latencyMs)) : 0;
    const safeStatusCode = Number.isFinite(input.statusCode) ? Math.round(input.statusCode) : 0;
    await this.db.insert(s.requestLogs).values({
      id: randomUUID(),
      requestId: input.requestId,
      customerId: input.customerId,
      apiKeyId: input.apiKeyId,
      endpoint: input.endpoint,
      method: input.method,
      statusCode: safeStatusCode,
      latencyMs: safeLatencyMs,
      errorCode: input.errorCode ?? null,
      payloadMeta: input.payloadMeta ?? null,
      ip: input.ip ?? null,
      userAgent: input.userAgent ?? null,
    });
  }
}

/** Quick read of a model's row by code, with provider code. */
export async function findModelByCode(db: Db, code: string) {
  const [m] = await db
    .select({
      id: s.models.id,
      code: s.models.code,
      displayName: s.models.displayName,
      providerId: s.models.providerId,
      providerCode: s.providers.code,
      inputPricePer1kCents: s.models.inputPricePer1kCents,
      outputPricePer1kCents: s.models.outputPricePer1kCents,
      status: s.models.status,
    })
    .from(s.models)
    .innerJoin(s.providers, eq(s.providers.id, s.models.providerId))
    .where(eq(s.models.code, code))
    .limit(1);
  return m ?? null;
}
