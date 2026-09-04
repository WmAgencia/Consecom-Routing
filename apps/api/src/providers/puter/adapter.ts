import { randomUUID } from 'node:crypto';
import {
  estimateMaxCostCents,
  type AdapterContext,
  type ChatRequest,
  type ChatResponse,
  type CostBreakdown,
  type ModelDescriptor,
  type ProviderAdapter,
} from '@consecom/shared';

/**
 * PuterAdapter — calls Puter AI's `drivers/call` endpoint using a Puter
 * user session token (User-Pays model).
 *
 * Wire format (verified against the puter.js source at
 * https://github.com/HeyPuter/puter.js — see src/lib/networkUtils.js
 * `driverCall` and `callBody`):
 *
 *   POST {apiBaseUrl}/drivers/call
 *   Content-Type: text/plain;actually=json
 *   Authorization: Bearer <puter auth token>
 *
 *   {
 *     "interface": "puter-chat-completion",
 *     "driver": "ai-chat",
 *     "method": "complete",
 *     "test_mode": false,
 *     "args": { "messages": [...], "model": "...", "stream": false, ... },
 *     "auth_token": "<puter auth token>"
 *   }
 *
 * Response shape:
 *   {
 *     success: true,
 *     result: {
 *       message: { content: [{type:'text', text:'...'}], model, usage, ... },
 *       usage:   { input_tokens, output_tokens, usd_cents, ... },
 *       via_ai_chat_service: true
 *     },
 *     metadata: { service_used, providerUsed }
 *   }
 *
 * Cost: Puter returns `result.usage.usd_cents` directly, so we trust the
 * provider instead of our static pricing table when present.
 */
export class PuterAdapter implements ProviderAdapter {
  readonly id = 'puter' as const;
  readonly displayName = 'Puter';

  private models: ModelDescriptor[];

  constructor(private readonly apiBaseUrl: string) {
    if (!apiBaseUrl) throw new Error('PuterAdapter requires apiBaseUrl');
    this.models = PUTER_DEFAULT_MODELS;
  }
  async chat(req: ChatRequest, ctx: AdapterContext): Promise<ChatResponse> {
    const puterBody = {
      interface: 'puter-chat-completion',
      driver: 'ai-chat',
      method: 'complete',
      test_mode: false,
      args: {
        messages: req.messages,
        // Puter upstream expects its own model id (e.g. `claude-haiku-4-5`),
        // not our suffixed `claude-haiku-4-5-puter`. Strip the suffix.
        model: req.model.replace(/-puter$/, ''),
        ...(req.temperature !== undefined ? { temperature: req.temperature } : {}),
        ...(req.maxTokens !== undefined ? { max_tokens: req.maxTokens } : {}),
        ...(req.topP !== undefined ? { top_p: req.topP } : {}),
        ...(req.stop !== undefined ? { stop: req.stop } : {}),
        stream: false,
      },
      auth_token: ctx.apiKey,
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60_000);
    // Forward caller signal so a disconnected client cancels the upstream.
    ctx.signal?.addEventListener('abort', () => controller.abort());

    let resp: Response;
    try {
      resp = await fetch(`${this.apiBaseUrl}/drivers/call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;actually=json',
          Authorization: `Bearer ${ctx.apiKey}`,
          ...(ctx.requestId ? { 'x-request-id': ctx.requestId } : {}),
        },
        body: JSON.stringify(puterBody),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new Error(`puter upstream ${resp.status}: ${text.slice(0, 200)}`);
    }

    const raw = (await resp.json()) as PuterResponse;

    if (!raw.success) {
      throw new Error(
        `puter error: ${raw.error?.message ?? JSON.stringify(raw).slice(0, 200)}`,
      );
    }

    const content = (raw.result.message.content ?? [])
      .map((b) => (b.type === 'text' ? b.text : ''))
      .join('');

    // Stash the upstream-reported cost (USD cents) on the response so
    // `estimateCost` can use the real number instead of the static table.
    const usdCents = raw.result.usage?.usd_cents;
    const chat: ChatResponse = {
      id: raw.result.message.id ?? `puter_${randomUUID()}`,
      // Puter normalizes the model id with a date suffix (e.g.
      // `claude-haiku-4-5-20251001`); we keep what the upstream reported so
      // the cost estimate + logs line up with the actual call.
      model: raw.result.message.model ?? req.model,
      content,
      finishReason: mapFinishReason(raw.result.message.stop_reason, raw.result.finish_reason),
      usage: {
        prompt_tokens: raw.result.usage?.input_tokens ?? raw.result.message.usage?.input_tokens ?? 0,
        completion_tokens:
          raw.result.usage?.output_tokens ?? raw.result.message.usage?.output_tokens ?? 0,
        total_tokens:
          (raw.result.usage?.input_tokens ?? raw.result.message.usage?.input_tokens ?? 0) +
          (raw.result.usage?.output_tokens ?? raw.result.message.usage?.output_tokens ?? 0),
      },
    };
    if (typeof usdCents === 'number') {
      (chat as ChatResponse & { _puterUsdCents?: number })._puterUsdCents = usdCents;
    }
    return chat;
  }

  estimateCost(req: ChatRequest, resp: ChatResponse): CostBreakdown {
    // Prefer Puter's own cost (USD cents) when it provided one — most accurate.
    const usdCents = (resp as ChatResponse & { _puterUsdCents?: number })._puterUsdCents;
    if (typeof usdCents === 'number') {
      return {
        inputCostCents: 0, // breakdown not provided by Puter; just the total
        outputCostCents: 0,
        totalCostCents: usdCents,
        currency: 'USD',
      };
    }
    const pricing = this.models.find((m) => m.code === req.model)?.pricing ?? {
      inputPer1kCents: 100,
      outputPer1kCents: 500,
    };
    const inputCost = Math.ceil((resp.usage.prompt_tokens / 1000) * pricing.inputPer1kCents);
    const outputCost = Math.ceil(
      (resp.usage.completion_tokens / 1000) * pricing.outputPer1kCents,
    );
    return {
      inputCostCents: inputCost,
      outputCostCents: outputCost,
      totalCostCents: inputCost + outputCost,
      currency: 'USD',
    };
  }

  listModels(): ModelDescriptor[] {
    return this.models;
  }
}

function mapFinishReason(
  stop: string | null | undefined,
  finish: string | null | undefined,
): ChatResponse['finishReason'] {
  const s = stop ?? finish;
  switch (s) {
    case 'end_turn':
    case 'stop':
      return 'stop';
    case 'max_tokens':
    case 'length':
      return 'length';
    case 'tool_use':
      return 'tool_calls';
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Wire types (kept private — only the adapter reads them)
// ---------------------------------------------------------------------------

interface PuterResponse {
  success: boolean;
  result: {
    message: {
      id?: string;
      model?: string;
      content?: Array<{ type: string; text?: string }>;
      stop_reason?: string | null;
      usage?: {
        input_tokens?: number;
        output_tokens?: number;
        cache_creation_input_tokens?: number;
        cache_read_input_tokens?: number;
      };
    };
    usage?: {
      input_tokens?: number;
      output_tokens?: number;
      usd_cents?: number;
    };
    finish_reason?: string | null;
    via_ai_chat_service?: boolean;
  };
  metadata?: { service_used?: string; providerUsed?: string };
  error?: { message?: string };
}

const PUTER_DEFAULT_MODELS: ModelDescriptor[] = [
  {
    code: 'claude-haiku-4-5-puter',
    displayName: 'Claude Haiku 4.5 (via Puter)',
    capabilities: {
      maxContextTokens: 200_000,
      supportsVision: true,
      supportsTools: true,
      supportsStreaming: true,
    },
    pricing: { inputPer1kCents: 100, outputPer1kCents: 500 },
  },
  {
    code: 'claude-sonnet-4-5-puter',
    displayName: 'Claude Sonnet 4.5 (via Puter)',
    capabilities: {
      maxContextTokens: 200_000,
      supportsVision: true,
      supportsTools: true,
      supportsStreaming: true,
    },
    pricing: { inputPer1kCents: 300, outputPer1kCents: 1500 },
  },
  {
    code: 'claude-opus-4-5-puter',
    displayName: 'Claude Opus 4.5 (via Puter)',
    capabilities: {
      maxContextTokens: 200_000,
      supportsVision: true,
      supportsTools: true,
      supportsStreaming: true,
    },
    pricing: { inputPer1kCents: 1500, outputPer1kCents: 7500 },
  },
  {
    code: 'claude-opus-4-8-puter',
    displayName: 'Claude Opus 4.8 (via Puter)',
    capabilities: {
      maxContextTokens: 200_000,
      supportsVision: true,
      supportsTools: true,
      supportsStreaming: true,
    },
    pricing: { inputPer1kCents: 1500, outputPer1kCents: 7500 },
  },
  {
    code: 'claude-sonnet-5-puter',
    displayName: 'Claude Sonnet 5 (via Puter)',
    capabilities: {
      maxContextTokens: 200_000,
      supportsVision: true,
      supportsTools: true,
      supportsStreaming: true,
    },
    pricing: { inputPer1kCents: 300, outputPer1kCents: 1500 },
  },
  {
    code: 'claude-opus-5-puter',
    displayName: 'Claude Opus 5 (via Puter)',
    capabilities: {
      maxContextTokens: 200_000,
      supportsVision: true,
      supportsTools: true,
      supportsStreaming: true,
    },
    pricing: { inputPer1kCents: 1500, outputPer1kCents: 7500 },
  },
];

export { estimateMaxCostCents };
