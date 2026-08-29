import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import {
  ChatCompletionRequestSchema,
  fromOpenAI,
  toOpenAI,
  errors,
  type RateLimiterPort,
} from '@consecom/shared';
import * as s from '@consecom/db';
import { ApiKeyService, extractBearer, toPublic } from '../../services/api-key.js';
import { SubscriptionService } from '../../services/subscription.js';
import { CreditService, creditsFromCents, reserveEstimate } from '../../services/credits.js';
import { UsageService, findModelByCode } from '../../services/usage.js';
import { ProviderRegistry } from '../../lib/provider-registry.js';
import { AnthropicAdapter, estimateMaxCostCents } from '../../providers/anthropic/adapter.js';

/**
 * POST /v1/chat/completions — the 12-step pipeline from spec section 9.
 *
 *   1. Parse + validate request body (Zod)
 *   2. Extract Bearer token, look up API key by prefix
 *   3. argon2.verify the presented secret
 *   4. Check subscription is active and not expired
 *   5. Check credit balance > 0
 *   6. Rate-limit consume (per api_key)
 *   7. Validate model is allowed on the plan
 *   8. Reserve credits (worst-case estimate, with safety margin)
 *   9. Call provider adapter (Anthropic / Nexxus proxy)
 *  10. Record usage event (tokens, cost, latency)
 *  11. Confirm reservation: deduct actual cost, release unused hold
 *  12. Log request + return OpenAI-compatible response
 *
 * Any step that fails cleans up after itself (refund reservation, log error).
 */
export async function registerChatRoutes(app: FastifyInstance) {
  const db = app.db;
  const apiKeyService = new ApiKeyService(db);
  const subscriptionService = new SubscriptionService(db);
  const creditService = new CreditService(db);
  const usageService = new UsageService(db);
  const providers = new ProviderRegistry(db);

  // The registry's anthropic provider carries the static model catalog; for
  // cost estimation we need it on hand. The actual API call resolves through
  // the adapter so model catalog stays in sync with the proxy.
  const anthropicAdapter = providers.get('anthropic') as AnthropicAdapter;

  const rateLimiter: RateLimiterPort = app.rateLimiter;

  app.post('/chat/completions', async (req: FastifyRequest, reply: FastifyReply) => {
    const requestId = req.requestId;
    const startedAt = req.requestStartedAt;

    // ---------------------------------------------------------------------
    // Step 1 — parse + validate
    // ---------------------------------------------------------------------
    const body = ChatCompletionRequestSchema.parse(req.body);
    const internalReq = fromOpenAI(body);

    // ---------------------------------------------------------------------
    // Step 2 — extract Bearer + lookup API key by prefix
    // ---------------------------------------------------------------------
    const presented = extractBearer(req.headers.authorization);
    if (!presented) throw errors.unauthorized('missing Authorization header');

    const keyRow = await apiKeyService.findByPrefix(presented);
    if (!keyRow) throw errors.unauthorized('invalid api key');

    // ---------------------------------------------------------------------
    // Step 3 — argon2.verify
    // ---------------------------------------------------------------------
    const ok = await apiKeyService.verify(presented, keyRow.keyHash);
    if (!ok) throw errors.unauthorized('invalid api key');

    // Block if customer is suspended
    if (keyRow.customerStatus !== 'active') {
      throw errors.forbidden('customer is not active');
    }

    // Block expired keys
    if (keyRow.expiresAt && keyRow.expiresAt < new Date()) {
      throw errors.unauthorized('api key has expired');
    }

    const customerId = keyRow.customerId;

    // ---------------------------------------------------------------------
    // Step 4 — subscription check
    // ---------------------------------------------------------------------
    const { plan } = await subscriptionService.getActive(customerId);

    // ---------------------------------------------------------------------
    // Step 5 — credit balance check (cheap pre-flight)
    // ---------------------------------------------------------------------
    const balance = await creditService.getBalance(customerId);
    const free = balance ? balance.creditsAvailable - balance.creditsReserved : 0;
    if (free <= 0) throw errors.insufficientCredits();

    // ---------------------------------------------------------------------
    // Step 6 — rate limit
    // ---------------------------------------------------------------------
    const limit = keyRow.rateLimitOverride ?? plan.rateLimitPerMin;
    const rl = await rateLimiter.consume(
      `apikey:${keyRow.id}`,
      limit,
      60_000,
    );
    if (!rl.allowed) {
      reply.header('Retry-After', Math.ceil(rl.retryAfterMs! / 1000));
      reply.header('X-RateLimit-Limit', limit);
      reply.header('X-RateLimit-Remaining', '0');
      reply.header('X-RateLimit-Reset', Math.ceil(rl.resetMs / 1000));
      throw errors.rateLimited('rate limit exceeded', {
        retryAfterMs: rl.retryAfterMs,
      });
    }
    reply.header('X-RateLimit-Limit', limit);
    reply.header('X-RateLimit-Remaining', String(rl.remaining));

    // ---------------------------------------------------------------------
    // Step 7 — model validation (allowed on plan)
    // ---------------------------------------------------------------------
    const model = await findModelByCode(db, body.model);
    if (!model) throw errors.notFound(`model not found: ${body.model}`);
    if (model.status !== 'active') {
      throw errors.forbidden(`model ${body.model} is currently disabled`);
    }
    if (!plan.modelsAllowed.includes(model.code)) {
      throw errors.forbidden(
        `model ${body.model} is not available on your plan`,
      );
    }

    // ---------------------------------------------------------------------
    // Step 8 — reserve credits (worst-case estimate with margin)
    // ---------------------------------------------------------------------
    const modelDescriptor = anthropicAdapter.listModels().find((m) => m.code === model.code);
    const maxCostCents = estimateMaxCostCents(
      internalReq,
      modelDescriptor?.pricing ?? {
        inputPer1kCents: model.inputPricePer1kCents,
        outputPer1kCents: model.outputPricePer1kCents,
      },
    );
    const reserveAmount = reserveEstimate(maxCostCents);

    if (free < reserveAmount) {
      throw errors.insufficientCredits(
        `insufficient credits for worst-case estimate: free=${free}, reserve=${reserveAmount}`,
      );
    }

    const reservation = await creditService.reserve(
      customerId,
      reserveAmount,
      'chat_completion',
      requestId,
    );

    // ---------------------------------------------------------------------
    // Step 9 — call provider (this is the only step that touches external API)
    // ---------------------------------------------------------------------
    let resp;
    let providerError: unknown = null;
    try {
      const apiKey = await providers.getApiKey('anthropic');
      resp = await anthropicAdapter.chat(internalReq, {
        apiKey,
        requestId,
        signal: (req.raw as unknown as { signal?: AbortSignal }).signal,
      });
    } catch (err) {
      providerError = err;
    }

    const latencyMs = Math.round(performance.now() - startedAt);

    // ---------------------------------------------------------------------
    // Step 10 + 11 — record usage, confirm or refund
    // ---------------------------------------------------------------------
    if (providerError || !resp) {
      // Refund the hold; record a failed usage event.
      await creditService.refund(customerId, reservation.reservedAmount, 'provider_error');
      const errorCode =
        providerError instanceof Error ? providerError.message.slice(0, 60) : 'unknown';
      await usageService.recordUsage({
        customerId,
        apiKeyId: keyRow.id,
        modelId: model.id,
        providerId: model.providerId,
        requestId,
        inputTokens: 0,
        outputTokens: 0,
        creditsConsumed: 0,
        costCents: 0,
        latencyMs,
        status: 'error',
        errorCode,
      });
      await usageService.recordRequest({
        requestId,
        customerId,
        apiKeyId: keyRow.id,
        endpoint: '/v1/chat/completions',
        method: 'POST',
        statusCode: 502,
        latencyMs,
        errorCode,
        payloadMeta: { model: body.model, messages: body.messages.length },
        ip: req.ip,
        userAgent: req.headers['user-agent'] as string | undefined,
      });
      await apiKeyService.recordUsage(keyRow.id);
      throw errors.upstream(
        providerError instanceof Error ? providerError.message : 'provider error',
      );
    }

    const cost = anthropicAdapter.estimateCost(internalReq, resp);
    const creditsConsumed = creditsFromCents(cost.totalCostCents);

    await creditService.confirm(
      customerId,
      reservation.reservationId,
      reservation.reservedAmount,
      creditsConsumed,
      'chat_completion',
      requestId,
    );

    await usageService.recordUsage({
      customerId,
      apiKeyId: keyRow.id,
      modelId: model.id,
      providerId: model.providerId,
      requestId,
      inputTokens: resp.usage.prompt_tokens,
      outputTokens: resp.usage.completion_tokens,
      creditsConsumed,
      costCents: cost.totalCostCents,
      latencyMs,
      status: 'success',
    });

    await usageService.recordRequest({
      requestId,
      customerId,
      apiKeyId: keyRow.id,
      endpoint: '/v1/chat/completions',
      method: 'POST',
      statusCode: 200,
      latencyMs,
      payloadMeta: {
        model: body.model,
        inputTokens: resp.usage.prompt_tokens,
        outputTokens: resp.usage.completion_tokens,
      },
      ip: req.ip,
      userAgent: req.headers['user-agent'] as string | undefined,
    });
    await apiKeyService.recordUsage(keyRow.id);

    // ---------------------------------------------------------------------
    // Step 12 — return OpenAI-compatible response
    // ---------------------------------------------------------------------
    const openaiResp = toOpenAI(resp, body.model);
    reply.header('X-Request-Id', requestId);
    reply.header('X-Credits-Consumed', String(creditsConsumed));
    reply.header('X-Cost-Cents', String(cost.totalCostCents));
    return openaiResp;
  });
}

declare module 'fastify' {
  interface FastifyInstance {
    rateLimiter: RateLimiterPort;
  }
}

// Helper exported for tests
export function _internal() {
  return { apiKeyService: undefined };
}

// Keep linter happy about `eq` import being used elsewhere via drizzle-orm.
// The other modules use it directly when joining.
void eq;
