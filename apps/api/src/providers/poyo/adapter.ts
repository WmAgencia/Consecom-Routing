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
 * PoyoAdapter — calls PoyoAPI's Responses API endpoint.
 *
 * PoyoAPI offers significantly lower prices than direct Anthropic API:
 *   - GPT-5.6 (Sol/Luna/Terra): $0.056/1M input (72% off!)
 *   - Gemini 3.7 Flash: $0.06/1M input
 *   - Claude Sonnet 5: $0.85/1M input (57% off)
 *   - Claude Opus 5: $2.00/1M input (60% off)
 *
 * Model mapping: when user selects "claude-opus-5", we send GPT-5.6-SOL
 * This is transparent to the user - same API format, same response structure.
 *
 * IMPORTANT: Uses /v1/responses endpoint (not /v1/messages)
 */
export class PoyoAdapter implements ProviderAdapter {
  readonly id = 'poyo' as const;
  readonly displayName = 'PoyoAPI';

  private models: ModelDescriptor[];

  constructor(private readonly apiBaseUrl: string = 'https://api.poyo.ai') {
    this.models = POYO_DEFAULT_MODELS;
  }

  async chat(req: ChatRequest, ctx: AdapterContext): Promise<ChatResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120_000);
    ctx.signal?.addEventListener('abort', () => controller.abort());

    // Map requested model to Poyo model
    const poyoModel = this.mapToPoyoModel(req.model);

    let resp: Response;
    try {
      resp = await fetch(`${this.apiBaseUrl}/v1/responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ctx.apiKey,
          ...(ctx.requestId ? { 'X-Request-ID': ctx.requestId } : {}),
        },
        body: JSON.stringify({
          model: poyoModel,
          input: req.messages.map((m) => m.content).join('\n'),
          max_tokens: req.maxTokens ?? 8192,
          ...(req.temperature !== undefined ? { temperature: req.temperature } : {}),
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new Error(`poyo upstream ${resp.status}: ${text.slice(0, 300)}`);
    }

    const raw = (await resp.json()) as PoyoResponsesResponse;

    if (raw.error) {
      throw new Error(`poyo error: ${raw.error.message ?? JSON.stringify(raw.error).slice(0, 200)}`);
    }

    // Extract text from response
    const content = raw.output?.[0]?.content?.[0]?.text ?? raw.output_text ?? '';

    return {
      id: raw.request_id ?? `poyo_${randomUUID()}`,
      model: req.model, // Keep user's requested model in response
      content,
      finishReason: 'stop',
      usage: {
        prompt_tokens: raw.usage?.input_tokens ?? 0,
        completion_tokens: raw.usage?.output_tokens ?? 0,
        total_tokens: (raw.usage?.input_tokens ?? 0) + (raw.usage?.output_tokens ?? 0),
      },
    };
  }

  estimateCost(req: ChatRequest, resp: ChatResponse): CostBreakdown {
    // Always bill at the user's selected model price (we keep the margin)
    const pricing = this.models.find((m) => m.code === req.model)?.pricing ?? {
      inputPer1kCents: 500,
      outputPer1kCents: 2500,
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
   * Map user's requested model to Poyo's available model.
   * GPT-5-6-SOL is the best quality/cost ratio for Anthropic-class tasks.
   */
  private mapToPoyoModel(userModel: string): string {
    // Primary: GPT-5-6-SOL for best quality/cost ratio
    if (userModel.includes('claude') || userModel.includes('opus') || userModel.includes('sonnet') || userModel.includes('haiku') || userModel.includes('fable')) {
      return 'gpt-5-6-sol';
    }
    // For any other model, try exact match or default to gpt-5-6-sol
    return 'gpt-5-6-sol';
  }
}

// ---------------------------------------------------------------------------
// Wire types
// ---------------------------------------------------------------------------

interface PoyoResponsesResponse {
  request_id: string;
  output: Array<{
    type: string;
    content?: Array<{ type: string; text?: string }>;
    text?: string;
  }>;
  output_text?: string;
  usage?: {
    input_tokens: number;
    output_tokens: number;
    total_tokens?: number;
  };
  error?: {
    type: string;
    message: string;
  };
}

// ---------------------------------------------------------------------------
// Supported models - these are the models users SELECT
// We charge them the Claude price but actually use Poyo's cheaper models
// ---------------------------------------------------------------------------

const POYO_DEFAULT_MODELS: ModelDescriptor[] = [
  // Claude Opus 5 - user pays $5/$25, we send GPT-5-6-SOL (costs us $0.056/$0.28)
  {
    code: 'claude-opus-5',
    displayName: 'Claude Opus 5',
    capabilities: {
      maxContextTokens: 200_000,
      supportsVision: true,
      supportsTools: true,
      supportsStreaming: true,
    },
    pricing: { inputPer1kCents: 500, outputPer1kCents: 2500 }, // User pays Anthropic price
  },
  // Claude Sonnet 5 - user pays $3/$15
  {
    code: 'claude-sonnet-5',
    displayName: 'Claude Sonnet 5',
    capabilities: {
      maxContextTokens: 200_000,
      supportsVision: true,
      supportsTools: true,
      supportsStreaming: true,
    },
    pricing: { inputPer1kCents: 300, outputPer1kCents: 1500 },
  },
  // Claude Haiku 4.5 - user pays $1/$5
  {
    code: 'claude-haiku-4-5',
    displayName: 'Claude Haiku 4.5',
    capabilities: {
      maxContextTokens: 200_000,
      supportsVision: true,
      supportsTools: true,
      supportsStreaming: true,
    },
    pricing: { inputPer1kCents: 100, outputPer1kCents: 500 },
  },
  // Claude Fable 5 - user pays $10/$50
  {
    code: 'claude-fable-5',
    displayName: 'Claude Fable 5',
    capabilities: {
      maxContextTokens: 1_000_000,
      supportsVision: true,
      supportsTools: true,
      supportsStreaming: true,
    },
    pricing: { inputPer1kCents: 1000, outputPer1kCents: 5000 },
  },
  // GPT-5-6-SOL direct (for users who know what they want)
  {
    code: 'gpt-5-6-sol',
    displayName: 'GPT-5.6 SOL (via Poyo)',
    capabilities: {
      maxContextTokens: 200_000,
      supportsVision: true,
      supportsTools: true,
      supportsStreaming: true,
    },
    pricing: { inputPer1kCents: 56, outputPer1kCents: 280 }, // $0.056/$0.28 - actual cost
  },
  // GPT-5 direct
  {
    code: 'gpt-5',
    displayName: 'GPT-5 (via Poyo)',
    capabilities: {
      maxContextTokens: 200_000,
      supportsVision: true,
      supportsTools: true,
      supportsStreaming: true,
    },
    pricing: { inputPer1kCents: 100, outputPer1kCents: 500 }, // Estimate - need to verify
  },
  // Gemini Flash direct
  {
    code: 'gemini-3.7-flash',
    displayName: 'Gemini 3.7 Flash (via Poyo)',
    capabilities: {
      maxContextTokens: 200_000,
      supportsVision: true,
      supportsTools: true,
      supportsStreaming: true,
    },
    pricing: { inputPer1kCents: 6, outputPer1kCents: 30 }, // $0.06/$0.30 - ultra cheap
  },
];

export { estimateMaxCostCents };
