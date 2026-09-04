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
 * OpenRouterAdapter — calls OpenRouter's OpenAI-compatible `/v1/chat/completions`
 * endpoint.
 *
 * OpenRouter acts as a proxy/gateway: it routes requests to upstream providers
 * (including direct Anthropic) and adds ~5% markup. The API is fully OpenAI-compatible.
 *
 * Key differences from direct Anthropic:
 * - Model IDs use the OpenRouter format: `anthropic/claude-sonnet-5`
 * - Authentication: `Authorization: Bearer <OPENROUTER_API_KEY>`
 * - We map our internal model codes → OpenRouter model IDs
 *
 * Wire format:
 *   POST https://openrouter.ai/api/v1/chat/completions
 *   Authorization: Bearer <key>
 *   Content-Type: application/json
 *   HTTP-Referer: https://consecom.com.br
 *   X-Title: Consecom Routing
 *
 *   { model: "anthropic/claude-sonnet-5", messages: [...], ... }
 *
 * Response: OpenAI-compatible ChatCompletion response.
 */
export class OpenRouterAdapter implements ProviderAdapter {
  readonly id = 'openrouter' as const;
  readonly displayName = 'OpenRouter';

  private models: ModelDescriptor[];

  constructor(private readonly apiBaseUrl: string) {
    if (!apiBaseUrl) throw new Error('OpenRouterAdapter requires apiBaseUrl');
    this.models = OPENROUTER_DEFAULT_MODELS;
  }

  async chat(req: ChatRequest, ctx: AdapterContext): Promise<ChatResponse> {
    // Map internal model code → OpenRouter model ID
    const upstreamModelId = this.mapToUpstreamModel(req.model);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120_000);
    ctx.signal?.addEventListener('abort', () => controller.abort());

    let resp: Response;
    try {
      resp = await fetch(`${this.apiBaseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ctx.apiKey}`,
          'HTTP-Referer': 'https://consecom.com.br',
          'X-Title': 'Consecom Routing',
          ...(ctx.requestId ? { 'X-Request-ID': ctx.requestId } : {}),
        },
        body: JSON.stringify({
          model: upstreamModelId,
          messages: req.messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          ...(req.temperature !== undefined ? { temperature: req.temperature } : {}),
          ...(req.topP !== undefined ? { top_p: req.topP } : {}),
          ...(req.maxTokens !== undefined ? { max_tokens: req.maxTokens } : {}),
          ...(req.stop !== undefined ? { stop: req.stop } : {}),
          stream: false,
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new Error(`openrouter upstream ${resp.status}: ${text.slice(0, 300)}`);
    }

    const raw = (await resp.json()) as OpenRouterChatResponse;

    if (raw.error) {
      throw new Error(
        `openrouter error: ${raw.error.message ?? JSON.stringify(raw.error).slice(0, 200)}`,
      );
    }

    const choice = raw.choices[0];
    const content = choice?.message?.content ?? '';

    return {
      id: raw.id ?? `or_${randomUUID()}`,
      model: req.model, // Keep our internal code in the response
      content,
      finishReason: mapFinishReason(choice?.finish_reason),
      usage: {
        prompt_tokens: raw.usage?.prompt_tokens ?? 0,
        completion_tokens: raw.usage?.completion_tokens ?? 0,
        total_tokens: raw.usage?.total_tokens ?? 0,
      },
    };
  }

  estimateCost(req: ChatRequest, resp: ChatResponse): CostBreakdown {
    const pricing = this.models.find((m) => m.code === req.model)?.pricing ?? {
      inputPer1kCents: 300,
      outputPer1kCents: 1500,
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

  /**
   * Map our internal model code (e.g. `claude-sonnet-5-openrouter`)
   * to the OpenRouter model ID (e.g. `anthropic/claude-sonnet-5`).
   */
  private mapToUpstreamModel(internalCode: string): string {
    // Strip -openrouter suffix if present
    const base = internalCode.replace(/-openrouter$/, '');
    // Prepend anthropic/ prefix for OpenRouter
    return `anthropic/${base}`;
  }
}

function mapFinishReason(
  reason: string | null | undefined,
): ChatResponse['finishReason'] {
  switch (reason) {
    case 'stop':
      return 'stop';
    case 'length':
      return 'length';
    case 'content_filter':
      return 'content_filter';
    case 'tool_calls':
      return 'tool_calls';
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Wire types
// ---------------------------------------------------------------------------

interface OpenRouterChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string | null;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  error?: {
    message: string;
    type: string;
    code?: string;
  };
}

// ---------------------------------------------------------------------------
// Supported models with OpenRouter pricing (verified against openrouter.ai API)
// ---------------------------------------------------------------------------

const OPENROUTER_DEFAULT_MODELS: ModelDescriptor[] = [
  // Claude Sonnet 5
  {
    code: 'claude-sonnet-5-openrouter',
    displayName: 'Claude Sonnet 5 (via OpenRouter)',
    capabilities: {
      maxContextTokens: 1_000_000,
      supportsVision: true,
      supportsTools: true,
      supportsStreaming: true,
    },
    pricing: { inputPer1kCents: 200, outputPer1kCents: 1000 }, // $2/$10 per 1M
  },
  // Claude Sonnet 5 (batch)
  {
    code: 'claude-sonnet-5-openrouter-batch',
    displayName: 'Claude Sonnet 5 (batch via OpenRouter)',
    capabilities: {
      maxContextTokens: 1_000_000,
      supportsVision: true,
      supportsTools: true,
      supportsStreaming: false, // Batch mode may not support streaming
    },
    pricing: { inputPer1kCents: 100, outputPer1kCents: 500 }, // $1/$5 per 1M (50% off)
  },
  // Claude Opus 5
  {
    code: 'claude-opus-5-openrouter',
    displayName: 'Claude Opus 5 (via OpenRouter)',
    capabilities: {
      maxContextTokens: 1_000_000,
      supportsVision: true,
      supportsTools: true,
      supportsStreaming: true,
    },
    pricing: { inputPer1kCents: 500, outputPer1kCents: 2500 }, // $5/$25 per 1M
  },
  // Claude Opus 5 (batch)
  {
    code: 'claude-opus-5-openrouter-batch',
    displayName: 'Claude Opus 5 (batch via OpenRouter)',
    capabilities: {
      maxContextTokens: 1_000_000,
      supportsVision: true,
      supportsTools: true,
      supportsStreaming: false,
    },
    pricing: { inputPer1kCents: 250, outputPer1kCents: 1250 }, // $2.50/$12.50 per 1M
  },
  // Claude Haiku 4.5
  {
    code: 'claude-haiku-4-5-openrouter',
    displayName: 'Claude Haiku 4.5 (via OpenRouter)',
    capabilities: {
      maxContextTokens: 200_000,
      supportsVision: true,
      supportsTools: true,
      supportsStreaming: true,
    },
    pricing: { inputPer1kCents: 100, outputPer1kCents: 500 }, // $1/$5 per 1M
  },
  // Claude Fable 5.1
  {
    code: 'claude-fable-5-1-openrouter',
    displayName: 'Claude Fable 5.1 (via OpenRouter)',
    capabilities: {
      maxContextTokens: 1_000_000,
      supportsVision: true,
      supportsTools: true,
      supportsStreaming: true,
    },
    pricing: { inputPer1kCents: 1000, outputPer1kCents: 5000 }, // $10/$50 per 1M
  },
  // Claude Opus 4.8
  {
    code: 'claude-opus-4-8-openrouter',
    displayName: 'Claude Opus 4.8 (via OpenRouter)',
    capabilities: {
      maxContextTokens: 1_000_000,
      supportsVision: true,
      supportsTools: true,
      supportsStreaming: true,
    },
    pricing: { inputPer1kCents: 500, outputPer1kCents: 2500 }, // $5/$25 per 1M
  },
  // Sonnet 4.6 (legacy)
  {
    code: 'claude-sonnet-4-6-openrouter',
    displayName: 'Claude Sonnet 4.6 (via OpenRouter)',
    capabilities: {
      maxContextTokens: 1_000_000,
      supportsVision: true,
      supportsTools: true,
      supportsStreaming: true,
    },
    pricing: { inputPer1kCents: 300, outputPer1kCents: 1500 }, // $3/$15 per 1M
  },
];

export { estimateMaxCostCents };
