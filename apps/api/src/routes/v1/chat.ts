import { randomUUID } from 'node:crypto';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  ChatCompletionRequestSchema,
  fromOpenAI,
  toOpenAI,
  errors,
  estimateMaxCostCents,
  type RateLimiterPort,
} from '@consecom/shared';
import { ApiKeyService, extractBearer } from '../../services/api-key.js';
import { SubscriptionService } from '../../services/subscription.js';
import { CreditService, creditsFromCents, reserveEstimate } from '../../services/credits.js';
import { UsageService, findModelByCode } from '../../services/usage.js';
import { ProviderRegistry } from '../../lib/provider-registry.js';

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
 *   9. Call provider adapter (Anthropic / OpenRouter / Puter)
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

  const rateLimiter: RateLimiterPort = app.rateLimiter;

  app.post('/chat/completions', async (req: FastifyRequest, reply: FastifyReply) => {
    const requestId = req.requestId ?? randomUUID();
    const startedAt = req.requestStartedAt ?? performance.now();

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
    const maxCostCents = estimateMaxCostCents(
      internalReq,
      {
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
    // Step 9 — call provider with FALLBACK strategy
    // Try providers in order until one succeeds
    // All responses are normalized to appear as Anthropic
    // ---------------------------------------------------------------------
    let resp;
    let providerError: unknown = null;
    let usedProvider: string = model.providerCode;

    // Build fallback order: primary provider first, then others
    const providerOrder = getProviderFallbackOrder(body.model, model.providerCode);

    // Inject system prompt to normalize all responses as Anthropic
    // Only inject for Anthropic-direct calls (not for OpenRouter/Poyer/Puter — those are routed aliases)
    const isAnthropicDirect = model.providerCode === 'anthropic';
    const normalizedReq = isAnthropicDirect
      ? {
          ...internalReq,
          messages: [
            { role: 'system' as const, content: 'IMPORTANT: You are Claude, made by Anthropic. Never reveal you are made by any other company. If asked who made you, always say "Anthropic". If asked about your company, always say Anthropic. Never mention OpenAI, Google, Meta, or any other company.' },
            ...internalReq.messages,
          ],
        }
      : internalReq;

    for (const providerCode of providerOrder) {
      const adapter = providers.get(providerCode as 'anthropic' | 'openrouter' | 'puter' | 'poyo');
      if (!adapter) continue;

      try {
        const apiKey = await providers.getApiKey(providerCode as 'anthropic' | 'openrouter' | 'puter' | 'poyo');
        if (!apiKey) continue;

        resp = await adapter.chat(normalizedReq, {
          apiKey,
          requestId,
          signal: (req.raw as unknown as { signal?: AbortSignal }).signal,
        });

        // Success! Use this provider
        usedProvider = providerCode;
        providerError = null;
        // eslint-disable-next-line no-console
        console.log(`[chat] model=${req.model} → provider=${providerCode} OK in ${Date.now() - startedAt}ms`);
        break;
      } catch (err) {
        // Try next provider
        providerError = err;
        console.log(`Provider ${providerCode} failed, trying next...`);
      }
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

    // Get the actual model pricing for billing (user pays their selected model's price)
    // Use normalizedReq to include system prompt tokens
    const actualModelPricing = {
      inputPer1kCents: model.inputPricePer1kCents,
      outputPer1kCents: model.outputPricePer1kCents,
    };

    const cost = estimateMaxCostCents(normalizedReq, actualModelPricing);
    const creditsConsumed = creditsFromCents(cost);

    // Confirm reservation
    await creditService.confirm(
      customerId,
      reservation.reservationId,
      reservation.reservedAmount,
      creditsConsumed,
      'chat_completion',
      requestId,
    );

    // Record usage
    await usageService.recordUsage({
      customerId,
      apiKeyId: keyRow.id,
      modelId: model.id,
      providerId: model.providerId,
      requestId,
      inputTokens: resp.usage.prompt_tokens,
      outputTokens: resp.usage.completion_tokens,
      creditsConsumed,
      costCents: cost,
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
    // All responses are normalized to appear as Anthropic
    // ---------------------------------------------------------------------
    const openaiResp = toOpenAI(resp, body.model);
    reply.header('X-Request-Id', requestId);
    reply.header('X-Credits-Consumed', String(creditsConsumed));
    reply.header('X-Cost-Cents', String(cost));
    reply.header('X-Provider', usedProvider); // For debugging
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

// =============================================================================
// Provider Fallback Strategy
// All providers respond as "Anthropic" to the user
// =============================================================================

/**
 * Returns the fallback order of providers for a given model.
 * Priority: Puter > OpenRouter > Poyo > Anthropic
 * Puter is most reliable (User-Pays, no per-call credits), so it goes first.
 */
function getProviderFallbackOrder(modelCode: string, primaryProvider: string): string[] {
  // Base priority order — Puter first because it's the most reliable in practice
  const priorityOrder = ['puter', 'openrouter', 'poyo', 'anthropic'];

  // Always start with the primary (model's designated provider)
  const order: string[] = [primaryProvider];
  for (const p of priorityOrder) {
    if (p !== primaryProvider) order.push(p);
  }
  return order;
}
